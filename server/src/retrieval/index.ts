// Boot-time, content-hash-gated embedding index + hybrid (cosine + lexical)
// search. See plan §Retrieval: ~180 chunks total, brute-force cosine in
// memory is sub-millisecond at this scale — no vector extension needed.
import { inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { embeddings as embeddingsTable, type ChunkKind } from '../db/schema';
import { loadContent } from '../content/load';
import { chunkAll, type Chunk } from '../content/chunk';
import { embedBatch, cosine, EMBEDDING_MODEL, EMBEDDING_DIM } from './embed';
import { bigramDice, keywordCoverage, normalize } from './lexical';

interface IndexedChunk extends Chunk {
  vector: number[];
}

export interface SearchHit extends IndexedChunk {
  score: number;
}

export class RetrievalIndex {
  private chunks: IndexedChunk[] = [];
  private building = false;
  private built = false;
  private queryVectorCache = new Map<string, number[]>();

  get status() {
    return { indexed: this.chunks.length, building: this.building, built: this.built };
  }

  /**
   * Content-hash gated: only chunks whose content changed since last boot
   * re-embed. Critically: `this.chunks` is populated from the fresh content
   * pool regardless of whether embedding succeeds, so any embedding-call
   * failure degrades to lexical-only search over the FULL corpus rather
   * than leaving the pool empty — see plan §Retrieval ("must not
   * block the healthcheck... search() degrade to lexical while warming").
   */
  async build(): Promise<void> {
    this.building = true;
    try {
      const catalog = loadContent();
      const freshChunks = chunkAll(catalog, EMBEDDING_MODEL);

      const existingRows = await db.select().from(embeddingsTable);
      const existingByHash = new Map(existingRows.map((r) => [r.id, r.contentHash]));
      const existingVectorById = new Map(existingRows.map((r) => [r.id, r.vector]));

      const stale = freshChunks.filter((c) => existingByHash.get(c.id) !== c.contentHash);
      const freshIds = new Set(freshChunks.map((c) => c.id));
      const orphanIds = existingRows.filter((r) => !freshIds.has(r.id)).map((r) => r.id);

      if (orphanIds.length > 0) {
        await db.delete(embeddingsTable).where(inArray(embeddingsTable.id, orphanIds));
        console.log(`Retrieval index: removed ${orphanIds.length} orphaned chunk(s).`);
      }

      let embeddingError: unknown = null;
      if (stale.length > 0) {
        console.log(`Retrieval index: embedding ${stale.length} new/changed chunk(s) of ${freshChunks.length} total...`);
        try {
          const vectors = await embedBatch(stale.map((c) => c.content));
          for (let i = 0; i < stale.length; i++) {
            const c = stale[i];
            const row = {
              id: c.id,
              kind: c.kind,
              refId: c.refId,
              heading: c.heading ?? null,
              content: c.content,
              contentHash: c.contentHash,
              model: EMBEDDING_MODEL,
              dim: EMBEDDING_DIM,
              vector: vectors[i],
            };
            existingVectorById.set(c.id, vectors[i]);
            await db.insert(embeddingsTable).values(row).onConflictDoUpdate({ target: embeddingsTable.id, set: row });
          }
        } catch (err) {
          embeddingError = err;
        }
      } else {
        console.log('Retrieval index: content unchanged, no re-embedding needed.');
      }

      // Populate from the fresh content pool (not solely from what made it
      // into the DB) so lexical fallback always has the full corpus to
      // search, even when embedding failed entirely on a first-ever boot.
      this.chunks = freshChunks.map((c) => ({ ...c, vector: existingVectorById.get(c.id) ?? [] }));

      if (embeddingError) {
        throw embeddingError;
      }
      this.built = true;
      console.log(`Retrieval index ready: ${this.chunks.length} chunks in memory.`);
    } finally {
      this.building = false;
    }
  }

  private async embedQuery(query: string): Promise<number[]> {
    const cached = this.queryVectorCache.get(query);
    if (cached) return cached;
    const [v] = await embedBatch([query]);
    // Small cache, cleared opportunistically — a single conversation often
    // repeats similar queries within a turn's tool-call loop.
    if (this.queryVectorCache.size > 200) this.queryVectorCache.clear();
    this.queryVectorCache.set(query, v);
    return v;
  }

  /**
   * Hybrid score: 0.6 cosine + 0.15 bigramDice(refId+heading) + 0.25
   * keywordCoverage over heading AND content.
   *
   * The keyword term was added because the first two alone are both blind
   * to chunk content in the way that matters here: bigramDice only ever saw
   * `refId + heading`, and for knowledge chunks refId is the constant string
   * 'knowledge', so a distinctive word appearing only in the body — a client
   * name, a tool, a certification — could not influence the ranking at all.
   * Cosine does read content, but every chunk in this corpus is
   * semantically "about Nasif" and scores land within ~0.02 of each other,
   * which is noise, not ranking. See keywordCoverage's doc comment for the
   * measured failure this fixes.
   *
   * While the index is still warming (embeddings not yet built for this
   * boot), degrades to lexical-only search rather than blocking — see plan
   * §Retrieval ("must not block the healthcheck").
   */
  async search(query: string, opts: { kinds?: ChunkKind[]; k?: number } = {}): Promise<SearchHit[]> {
    const { kinds, k = 4 } = opts;
    const pool = kinds ? this.chunks.filter((c) => kinds.includes(c.kind)) : this.chunks;
    if (pool.length === 0) return [];

    if (!this.built) {
      return pool
        .map((c) => ({
          ...c,
          score:
            0.4 * bigramDice(normalize(query), normalize(`${c.refId} ${c.heading ?? ''} ${c.content}`)) +
            0.6 * keywordCoverage(query, `${c.heading ?? ''} ${c.content}`),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
    }

    const queryVec = await this.embedQuery(query);
    return pool
      .map((c) => {
        const cosineScore = cosine(queryVec, c.vector);
        const headingScore = bigramDice(normalize(query), normalize(`${c.refId} ${c.heading ?? ''}`));
        const keywordScore = keywordCoverage(query, `${c.heading ?? ''} ${c.content}`);
        return { ...c, score: 0.6 * cosineScore + 0.15 * headingScore + 0.25 * keywordScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

export const retrievalIndex = new RetrievalIndex();

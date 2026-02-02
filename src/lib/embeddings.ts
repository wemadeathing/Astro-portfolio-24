const EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

interface EmbeddingResponse {
  embedding: {
    values: number[];
  };
}

export async function getEmbedding(
  text: string,
  apiKey: string
): Promise<number[]> {
  const response = await fetch(`${EMBEDDING_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: {
        parts: [{ text }],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.embedding.values;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

export function findTopMatches<T>(
  query: number[],
  items: Array<{ embedding: number[]; data: T }>,
  topK: number
): T[] {
  const scored = items.map((item) => ({
    data: item.data,
    score: cosineSimilarity(query, item.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((item) => item.data);
}

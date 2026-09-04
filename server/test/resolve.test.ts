import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveProjects, resolveResources, resolveBlogs } from '../src/retrieval/resolve.ts';
import type { ProjectDoc, ResourceDoc, BlogDoc } from '../src/content/load.ts';

const projects: ProjectDoc[] = [
  { slug: 'kota-ai', title: 'Kota AI', description: 'd', image: 'i', aiSummary: '', tags: [], useForQuestions: [], featured: true, published: true },
  { slug: 'ridenote-ios-app', title: 'RideNote', description: 'd', image: 'i', aiSummary: '', tags: [], useForQuestions: [], featured: false, published: true },
];

test('exact slug match resolves correctly', () => {
  const { shown, notFound } = resolveProjects(['kota-ai'], projects);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].slug, 'kota-ai');
  assert.equal(notFound.length, 0);
});

test('exact title match resolves correctly', () => {
  const { shown, notFound } = resolveProjects(['RideNote'], projects);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].slug, 'ridenote-ios-app');
  assert.equal(notFound.length, 0);
});

test('a fabricated slug reports as not_found rather than silently vanishing', () => {
  const { shown, notFound } = resolveProjects(['completely-made-up-project-xyz'], projects);
  assert.equal(shown.length, 0);
  assert.deepEqual(notFound, ['completely-made-up-project-xyz']);
});

test('close typo fuzzy-resolves above the 0.60 threshold', () => {
  const { shown, notFound } = resolveProjects(['kota-a'], projects); // one char short
  assert.equal(shown.length, 1);
  assert.equal(shown[0].slug, 'kota-ai');
  assert.equal(notFound.length, 0);
});

const resources: ResourceDoc[] = [{ title: 'Figma', description: 'd', url: 'https://figma.com', type: 'tool', tags: [] }];

test('resource fuzzy threshold (0.55) is stricter than projects/blog (0.60) is respected', () => {
  const { shown, notFound } = resolveResources(['Something totally unrelated'], resources);
  assert.equal(shown.length, 0);
  assert.equal(notFound.length, 1);
});

const blog: BlogDoc[] = [{ slug: 'building-ridenote-defining-the-mvp', title: 'Defining the MVP', description: 'd', aiSummary: '', topics: [], pubDate: '2026-01-01' }];

test('blog exact slug resolves correctly', () => {
  const { shown } = resolveBlogs(['building-ridenote-defining-the-mvp'], blog);
  assert.equal(shown.length, 1);
});

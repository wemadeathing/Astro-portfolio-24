import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partitionLockedFields } from '../../shared/intake.ts';

test('partitionLockedFields applies fields with no locked keys', () => {
  const { applied, skipped } = partitionLockedFields({ headline: 'Hello' }, []);
  assert.deepEqual(applied, { headline: 'Hello' });
  assert.deepEqual(skipped, []);
});

test('partitionLockedFields skips a field the user edited directly', () => {
  const { applied, skipped } = partitionLockedFields(
    { project_name: 'Stale echo', headline: 'New headline' },
    ['project_name']
  );
  assert.deepEqual(applied, { headline: 'New headline' });
  assert.deepEqual(skipped, ['project_name']);
});

test('partitionLockedFields skips all fields when everything is locked', () => {
  const { applied, skipped } = partitionLockedFields({ name: 'Alex' }, ['name', 'email']);
  assert.deepEqual(applied, {});
  assert.deepEqual(skipped, ['name']);
});

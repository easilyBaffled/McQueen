# Test Plan: mcq-tj0.3 -- Create storageService with schema versioning

## Summary

- **Bead:** `mcq-tj0.3`
- **Feature:** Typed storageService module with schema-versioned localStorage read/write, data validation, corruption recovery, and migration support
- **Total Test Cases:** 18
- **Test Types:** Functional, Integration

---

## TC-001: storageService module exists with typed read/write/remove exports

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/services/storageService.ts` exists and exports typed `read`, `write`, and `remove` functions, satisfying AC-1.

### Preconditions

- Project has been built or type-checked without errors

### Steps

1. Open `src/services/storageService.ts`
   **Expected:** File exists and is a TypeScript module

2. Inspect the exported members of the module
   **Expected:** `read<T>(key: string, defaultValue: T): T`, `write<T>(key: string, value: T): void`, and `remove(key: string): void` are exported with generic type parameters

3. Run `npx tsc --noEmit`
   **Expected:** No type errors in storageService.ts or its consumers

### Test Data

- N/A (static analysis)

### Edge Cases

- Verify the module compiles under `strict` TypeScript settings without `any` leaks in the public API

---

## TC-002: write() wraps data with a schema version number

**Priority:** P0
**Type:** Functional

### Objective

Verify that every value written via `write()` is stored as a `{ version, data }` envelope, satisfying AC-2.

### Preconditions

- localStorage is available and empty

### Steps

1. Call `write('test-key', { cash: 10000 })`
   **Expected:** `localStorage.getItem('test-key')` returns a JSON string

2. Parse the raw JSON string from localStorage
   **Expected:** Parsed object has shape `{ version: <number>, data: { cash: 10000 } }`

3. Check the `version` field value
   **Expected:** `version` equals `CURRENT_VERSION` (currently `1`, sourced from `STORAGE_VERSION` in constants.ts)

### Test Data

- Key: `'test-key'`
- Value: `{ cash: 10000 }`

### Edge Cases

- Write a primitive value (e.g., `42`) — version envelope should still be present
- Write an array (e.g., `['a', 'b']`) — version envelope wraps the array
- Write a string value (e.g., `'midweek'`) — version envelope wraps the string

---

## TC-003: Happy-path read/write round-trip for objects

**Priority:** P0
**Type:** Functional

### Objective

Verify that an object written with `write()` is returned identically by `read()` (AC-5 happy path).

### Preconditions

- localStorage is available and empty

### Steps

1. Call `write('portfolio', { MAHOMES: { shares: 5, avgCost: 120 } })`
   **Expected:** No error thrown

2. Call `read('portfolio', {})`
   **Expected:** Returns `{ MAHOMES: { shares: 5, avgCost: 120 } }`

### Test Data

- Key: `'portfolio'`
- Value: `{ MAHOMES: { shares: 5, avgCost: 120 } }`
- Default: `{}`

### Edge Cases

- Round-trip with deeply nested objects
- Round-trip with special characters in string values

---

## TC-004: Happy-path read/write round-trip for primitives

**Priority:** P0
**Type:** Functional

### Objective

Verify round-trip fidelity for primitive types (number, string, boolean).

### Preconditions

- localStorage is available and empty

### Steps

1. Call `write('cash', 10000)` then `read('cash', 0)`
   **Expected:** Returns `10000`

2. Call `write('scenario', 'midweek')` then `read('scenario', 'live')`
   **Expected:** Returns `'midweek'`

3. Call `write('flag', true)` then `read('flag', false)`
   **Expected:** Returns `true`

### Test Data

- Numeric: `10000`, String: `'midweek'`, Boolean: `true`

### Edge Cases

- Verify `write('key', 0)` followed by `read('key', 99)` returns `0`, not the default (falsy value preservation)
- Verify `write('key', false)` followed by `read('key', true)` returns `false`

---

## TC-005: Happy-path read/write round-trip for arrays

**Priority:** P1
**Type:** Functional

### Objective

Verify round-trip fidelity for array values, including the watchlist use case.

### Preconditions

- localStorage is available and empty

### Steps

1. Call `write('watchlist', ['MAHOMES', 'KELCE', 'ALLEN'])`
   **Expected:** No error thrown

2. Call `read('watchlist', [])`
   **Expected:** Returns `['MAHOMES', 'KELCE', 'ALLEN']`

### Test Data

- Key: `'watchlist'`
- Value: `['MAHOMES', 'KELCE', 'ALLEN']`

### Edge Cases

- Write and read an empty array `[]`
- Write and read an array of objects

---

## TC-006: read() returns default value for missing key

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` returns the provided default when the key does not exist in localStorage (AC-5 missing key).

### Preconditions

- localStorage is available and empty (key has never been written)

### Steps

1. Call `read('never-set-key', { cash: 10000 })`
   **Expected:** Returns `{ cash: 10000 }`

2. Call `read('never-set-key', 0)`
   **Expected:** Returns `0`

3. Call `read('never-set-key', false)`
   **Expected:** Returns `false`

4. Call `read('never-set-key', [])`
   **Expected:** Returns `[]`

### Test Data

- Key: `'never-set-key'` (not present in localStorage)

### Edge Cases

- Default value is `0` (falsy)
- Default value is `false` (falsy)
- Default value is `''` (empty string, falsy)
- Default value is `null`

---

## TC-007: read() returns default for corrupt/unparseable JSON

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` gracefully handles corrupt data in localStorage and returns the default (AC-3 corruption recovery, AC-5).

### Preconditions

- localStorage is available

### Steps

1. Manually set `localStorage.setItem('corrupt', 'not-valid-json{{{')` (invalid JSON)
   **Expected:** Key exists in localStorage with garbage content

2. Call `read('corrupt', [])`
   **Expected:** Returns `[]` (the default), no exception thrown

3. Manually set `localStorage.setItem('partial', '{"version":')` (truncated JSON)
   **Expected:** Key exists in localStorage

4. Call `read('partial', { cash: 0 })`
   **Expected:** Returns `{ cash: 0 }` (the default), no exception thrown

### Test Data

- Corrupt values: `'not-valid-json{{{'`, `'{"version":'`, `'undefined'`, `'NaN'`

### Edge Cases

- Stored value is the literal string `'undefined'`
- Stored value is the literal string `'null'`
- Stored value is empty string `''`

---

## TC-008: read() returns default when versioned data field is null or undefined

**Priority:** P1
**Type:** Functional

### Objective

Verify that a versioned entry whose `data` field is `null` or `undefined` triggers default fallback (AC-3).

### Preconditions

- localStorage is available

### Steps

1. Set `localStorage.setItem('null-data', JSON.stringify({ version: 1, data: null }))`
   **Expected:** Key is stored

2. Call `read('null-data', { cash: 0 })`
   **Expected:** Returns `{ cash: 0 }` (the default)

3. Set `localStorage.setItem('undef-data', JSON.stringify({ version: 1, data: undefined }))`
   **Expected:** Key is stored (undefined serializes to missing field)

4. Call `read('undef-data', 'fallback')`
   **Expected:** Returns `'fallback'` (the default)

### Test Data

- Versioned entries with `data: null` and `data: undefined`

### Edge Cases

- Entry with `data: 0` should return `0`, not the default (valid falsy data)
- Entry with `data: false` should return `false`, not the default
- Entry with `data: ''` should return `''`, not the default

---

## TC-009: read() handles legacy (unversioned) entries

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` correctly handles entries written before schema versioning was introduced — raw JSON without a `{ version, data }` wrapper (AC-4 backward compatibility).

### Preconditions

- localStorage contains entries written by old code (no version envelope)

### Steps

1. Set `localStorage.setItem('legacy-str', JSON.stringify('midweek'))`
   **Expected:** Key stored as `'"midweek"'`

2. Call `read('legacy-str', 'live')`
   **Expected:** Returns `'midweek'` (the legacy value, not the default)

3. Set `localStorage.setItem('legacy-obj', JSON.stringify({ shares: 3, avgCost: 100 }))`
   **Expected:** Key stored without version wrapper

4. Call `read('legacy-obj', {})`
   **Expected:** Returns `{ shares: 3, avgCost: 100 }`

### Test Data

- Legacy string: `'"midweek"'`
- Legacy object: `'{"shares":3,"avgCost":100}'`
- Legacy number: `'42'`

### Edge Cases

- Legacy value that happens to have a `version` field but no `data` field (should be treated as legacy, not versioned)
- Legacy array value

---

## TC-010: read() rejects entries with version higher than CURRENT_VERSION

**Priority:** P0
**Type:** Functional

### Objective

Verify that data written by a future version of the app is treated as unrecognized and the default is returned (AC-4 forward safety).

### Preconditions

- localStorage is available
- `CURRENT_VERSION` is 1

### Steps

1. Set `localStorage.setItem('future', JSON.stringify({ version: 999, data: { future: true } }))`
   **Expected:** Key stored

2. Call `read('future', { fallback: true })`
   **Expected:** Returns `{ fallback: true }` (the default)

### Test Data

- Version `999`, `CURRENT_VERSION + 1`, `Number.MAX_SAFE_INTEGER`

### Edge Cases

- Version is `Infinity`
- Version is `NaN` (should fail the `typeof === 'number'` check or version range check)

---

## TC-011: read() rejects entries with version 0 or negative

**Priority:** P1
**Type:** Functional

### Objective

Verify that versioned entries with invalid version numbers (0, negative) are rejected and the default returned (AC-3).

### Preconditions

- localStorage is available

### Steps

1. Set `localStorage.setItem('zero-ver', JSON.stringify({ version: 0, data: { bad: true } }))`
   **Expected:** Key stored

2. Call `read('zero-ver', { fallback: true })`
   **Expected:** Returns `{ fallback: true }` (the default)

3. Set `localStorage.setItem('neg-ver', JSON.stringify({ version: -5, data: { bad: true } }))`
   **Expected:** Key stored

4. Call `read('neg-ver', { fallback: true })`
   **Expected:** Returns `{ fallback: true }` (the default)

### Test Data

- Version values: `0`, `-1`, `-5`, `-Infinity`

### Edge Cases

- Version is a float like `0.5` (should be accepted or rejected depending on validation — verify consistent behavior)

---

## TC-012: Version migration reads v1 data at current version

**Priority:** P0
**Type:** Functional

### Objective

Verify that data stored at schema version 1 is successfully read when `CURRENT_VERSION` is 1 (and would be migrated in future when version increments) (AC-4).

### Preconditions

- `CURRENT_VERSION` is `1`
- localStorage has an entry with `version: 1`

### Steps

1. Set `localStorage.setItem('v1-data', JSON.stringify({ version: 1, data: { oldField: 'value' } }))`
   **Expected:** Key stored

2. Call `read('v1-data', {})`
   **Expected:** Returns `{ oldField: 'value' }` — the stored data is accessible

### Test Data

- Versioned entry: `{ version: 1, data: { oldField: 'value' } }`

### Edge Cases

- When `CURRENT_VERSION` is later bumped to 2, verify that a migration path exists for v1 → v2 (future test; out of scope for v1 but architecture should support it)

---

## TC-013: write() fails silently on quota exceeded

**Priority:** P1
**Type:** Functional

### Objective

Verify that `write()` does not throw when `localStorage.setItem` throws a `QuotaExceededError` (AC-3 robustness).

### Preconditions

- `localStorage.setItem` is mocked to throw `DOMException('QuotaExceededError')`

### Steps

1. Mock `Storage.prototype.setItem` to throw `DOMException`
   **Expected:** Mock is active

2. Call `write('fail-key', { data: 'test' })`
   **Expected:** No exception is thrown; call returns `undefined` silently

3. Restore mock
   **Expected:** Subsequent writes work normally

### Test Data

- Any key/value pair

### Edge Cases

- `SecurityError` thrown by setItem (e.g., cookies disabled in browser)
- Generic `Error` thrown by setItem

---

## TC-014: read() and write() handle localStorage being unavailable

**Priority:** P1
**Type:** Functional

### Objective

Verify graceful degradation when `localStorage` is `undefined` or throws on access (SSR, privacy mode, iframe sandboxing).

### Preconditions

- `globalThis.localStorage` is overridden to `undefined` or to throw on access

### Steps

1. Override `globalThis.localStorage` to `undefined`
   **Expected:** Override applied

2. Call `write('key', 'value')`
   **Expected:** No exception thrown

3. Call `read('key', 'default')`
   **Expected:** Returns `'default'`, no exception thrown

4. Call `remove('key')`
   **Expected:** No exception thrown

5. Restore `globalThis.localStorage`
   **Expected:** Normal functionality restored

### Test Data

- N/A

### Edge Cases

- `localStorage` getter throws `SecurityError` (Safari private browsing legacy behavior)
- `localStorage` is `null` rather than `undefined`

---

## TC-015: remove() deletes a stored key

**Priority:** P1
**Type:** Functional

### Objective

Verify that `remove()` deletes a key from localStorage and subsequent `read()` returns the default.

### Preconditions

- localStorage is available
- A key has been written via `write()`

### Steps

1. Call `write('rm-key', 'data')`
   **Expected:** Key is stored

2. Call `remove('rm-key')`
   **Expected:** `localStorage.getItem('rm-key')` returns `null`

3. Call `read('rm-key', 'default')`
   **Expected:** Returns `'default'`

### Test Data

- Key: `'rm-key'`

### Edge Cases

- `remove()` called on a key that was never set — should not throw
- `remove()` called when localStorage is unavailable — should not throw

---

## TC-016: CURRENT_VERSION is sourced from constants.ts STORAGE_VERSION

**Priority:** P1
**Type:** Functional

### Objective

Verify that the storageService's `CURRENT_VERSION` export matches the `STORAGE_VERSION` constant, ensuring a single source of truth for the schema version (AC-2).

### Preconditions

- Both files exist and are importable

### Steps

1. Import `CURRENT_VERSION` from `storageService.ts`
   **Expected:** Value is a positive integer

2. Import `STORAGE_VERSION` from `constants.ts`
   **Expected:** Value is a positive integer

3. Assert `CURRENT_VERSION === STORAGE_VERSION`
   **Expected:** Values are identical

### Test Data

- N/A

### Edge Cases

- If a developer changes one without the other, the test should fail

---

## TC-017: GameContext uses storageService exclusively — no direct localStorage calls

**Priority:** P0
**Type:** Integration

### Objective

Verify that `GameContext.jsx` (and any successor context files) contain zero direct `localStorage` calls and instead import and use `read`/`write` from storageService (AC-6).

### Preconditions

- Codebase is available for static analysis / grep

### Steps

1. Search `src/context/GameContext.jsx` for any occurrence of `localStorage.getItem`, `localStorage.setItem`, or `localStorage.removeItem`
   **Expected:** Zero matches found

2. Verify that `GameContext.jsx` imports `read` and/or `write` from `../services/storageService`
   **Expected:** Import statement is present

3. Verify that all state initializers using storage (scenario, portfolio, watchlist, cash) call `read(STORAGE_KEYS.*, defaultValue)`
   **Expected:** Each persisted state uses `read()` with the corresponding `STORAGE_KEYS` constant

4. Verify that all persistence effects call `write(STORAGE_KEYS.*, value)`
   **Expected:** Each `useEffect` for persisting state uses `write()` with the corresponding `STORAGE_KEYS` constant

### Test Data

- STORAGE_KEYS: `scenario`, `portfolio`, `watchlist`, `cash`

### Edge Cases

- Search entire `src/context/` directory for stray `localStorage` references in any file
- Search `src/components/` for direct `localStorage` calls that should also go through storageService

---

## TC-018: isVersionedEntry type guard correctly discriminates shapes

**Priority:** P2
**Type:** Functional

### Objective

Verify the internal `isVersionedEntry` guard correctly identifies valid versioned envelopes and rejects malformed ones, ensuring read() dispatches correctly between versioned and legacy paths.

### Preconditions

- Ability to test the guard's behavior indirectly through `read()`

### Steps

1. Store `JSON.stringify({ version: 1, data: 'hello' })` and call `read()`
   **Expected:** Returns `'hello'` (recognized as versioned entry)

2. Store `JSON.stringify({ version: 'one', data: 'hello' })` (non-numeric version) and call `read()`
   **Expected:** Treated as legacy entry (version field is not a number), returns the whole parsed object or the default — behavior should be consistent

3. Store `JSON.stringify({ data: 'hello' })` (missing version field) and call `read()`
   **Expected:** Treated as legacy entry, returns `{ data: 'hello' }` as the raw parsed value

4. Store `JSON.stringify(null)` and call `read()`
   **Expected:** Returns the default (null is not an object with version/data)

5. Store `JSON.stringify(42)` and call `read()`
   **Expected:** Treated as legacy entry, returns `42`

### Test Data

- Various malformed envelopes as described above

### Edge Cases

- Object with `version` and `data` but also extra fields — should still be recognized as versioned
- `{ version: 1 }` without `data` field — should not pass guard, treated as legacy
- `{ data: 'x' }` without `version` field — should not pass guard, treated as legacy

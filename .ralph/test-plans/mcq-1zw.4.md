# Test Plan: mcq-1zw.4 -- Add storage version migration support

## Summary

- **Bead:** `mcq-1zw.4`
- **Feature:** Migration registry and runtime validator for storageService so version bumps migrate user data instead of silently dropping it
- **Total Test Cases:** 20
- **Test Types:** Functional, Integration, Regression

---

## TC-001: registerMigration exports and registers a migrator

**Priority:** P0
**Type:** Functional

### Objective

Verify that `registerMigration` is exported from storageService and can register a migration function for a given source version.

### Preconditions

- storageService module is importable

### Steps

1. Import `registerMigration` from `storageService`.
   **Expected:** The import resolves and `typeof registerMigration` is `'function'`.

2. Call `registerMigration(1, (data) => ({ ...data, newField: true }))`.
   **Expected:** No error is thrown; the migrator is stored internally for version 1.

### Test Data

- Migrator: `(data: unknown) => ({ ...(data as object), newField: true })`

### Edge Cases

- Registering a migrator for the same version twice should overwrite (or error — verify chosen behavior).
- Registering with a non-positive `fromVersion` (0 or negative) should be rejected or ignored.

---

## TC-002: Single-step migration (v1 → v2)

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` applies a single registered migration when stored data is one version behind CURRENT_VERSION.

### Preconditions

- `CURRENT_VERSION` is 2 (or mock accordingly).
- A migrator is registered for version 1: `registerMigration(1, (data) => ({ ...(data as object), migrated: true }))`.
- localStorage contains: `{"version": 1, "data": {"cash": 5000}}` under key `"portfolio"`.

### Steps

1. Call `read('portfolio', {})`.
   **Expected:** Returns `{ cash: 5000, migrated: true }` — the v1→v2 migrator was applied.

2. Inspect the return value type.
   **Expected:** The result is the migrated object, not the raw v1 shape and not the defaultValue.

### Test Data

- Stored entry: `{ version: 1, data: { cash: 5000 } }`
- Migrator(1): adds `migrated: true`

### Edge Cases

- Data that is a primitive (e.g., `{ version: 1, data: 42 }`) should also pass through the migrator correctly.

---

## TC-003: Multi-step migration chain (v1 → v3)

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` walks the full migration chain sequentially when stored data is multiple versions behind CURRENT_VERSION.

### Preconditions

- `CURRENT_VERSION` is 3 (or mock accordingly).
- Migrators registered:
  - `registerMigration(1, (d) => ({ ...(d as object), v2Field: 'added' }))` (v1→v2)
  - `registerMigration(2, (d) => ({ ...(d as object), v3Field: 'added' }))` (v2→v3)
- localStorage contains: `{"version": 1, "data": {"original": true}}` under key `"test"`.

### Steps

1. Call `read('test', {})`.
   **Expected:** Returns `{ original: true, v2Field: 'added', v3Field: 'added' }` — both migrators applied in order.

2. Verify migrator(1) runs before migrator(2).
   **Expected:** The v2→v3 migrator receives output of v1→v2 migrator, not the raw v1 data.

### Test Data

- Stored entry: `{ version: 1, data: { original: true } }`
- Migrator chain: v1→v2 adds `v2Field`, v2→v3 adds `v3Field`

### Edge Cases

- A longer chain (v1→v4 with three migrators) also works sequentially.
- Each migrator receives the output of the previous one, not the original data.

---

## TC-004: Missing migration in chain falls back to defaultValue

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the migration chain has a gap (a required intermediate migrator is not registered), `read()` returns defaultValue instead of partially-migrated data.

### Preconditions

- `CURRENT_VERSION` is 3 (or mock accordingly).
- Only migrator for version 1 is registered (v1→v2). No migrator for version 2 (v2→v3).
- localStorage contains: `{"version": 1, "data": {"cash": 5000}}` under key `"portfolio"`.

### Steps

1. Call `read('portfolio', { cash: 10000 })`.
   **Expected:** Returns `{ cash: 10000 }` (the defaultValue), because migrator for version 2 is missing.

### Test Data

- Stored entry: `{ version: 1, data: { cash: 5000 } }`
- Default: `{ cash: 10000 }`
- Registered: migrator(1) only; migrator(2) missing

### Edge Cases

- Gap at the beginning of the chain (v1 migrator missing, v2 present) also returns defaultValue.
- Gap in a longer chain (v1 present, v2 missing, v3 present) returns defaultValue.

---

## TC-005: Missing migration logs a warning

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a migration gap causes a fallback to defaultValue, a warning is logged to help developers diagnose the issue.

### Preconditions

- `CURRENT_VERSION` is 3.
- Only migrator for version 1 is registered. Migrator for version 2 is missing.
- `console.warn` is spied on.
- localStorage contains: `{"version": 1, "data": {"cash": 5000}}` under key `"key"`.

### Steps

1. Call `read('key', {})`.
   **Expected:** `console.warn` is called at least once with a message indicating the missing migration (e.g., contains "migration" and the missing version number "2").

### Test Data

- Stored entry: `{ version: 1, data: { cash: 5000 } }`
- Spy: `vi.spyOn(console, 'warn')`

### Edge Cases

- When all migrations are present and succeed, no warning is logged.

---

## TC-006: Data at CURRENT_VERSION requires no migration

**Priority:** P0
**Type:** Functional

### Objective

Verify that data already at CURRENT_VERSION is returned directly without invoking any migrators (backward compatibility with existing behavior).

### Preconditions

- Migrators are registered for earlier versions.
- localStorage contains data at `CURRENT_VERSION`.

### Steps

1. Write data via `write('key', { cash: 9000 })` (stamps CURRENT_VERSION).
   **Expected:** Data is stored with `version: CURRENT_VERSION`.

2. Call `read('key', {})`.
   **Expected:** Returns `{ cash: 9000 }` without any migrator being invoked.

3. Wrap migrators with `vi.fn()` and verify they were not called.
   **Expected:** All migrator spies have `toHaveBeenCalledTimes(0)`.

### Test Data

- Stored entry at CURRENT_VERSION via `write()`

### Edge Cases

- None; this is the happy-path no-migration scenario.

---

## TC-007: Validator passes — returns migrated data

**Priority:** P0
**Type:** Functional

### Objective

Verify that when an optional validator is provided and returns true, `read()` returns the (migrated) data.

### Preconditions

- localStorage contains data at CURRENT_VERSION: `{"version": CURRENT_VERSION, "data": {"cash": 5000}}`.
- Validator: `(v: unknown): v is { cash: number } => typeof (v as any).cash === 'number'`.

### Steps

1. Call `read('key', { cash: 0 }, validator)`.
   **Expected:** Returns `{ cash: 5000 }` — validator passes, data is returned.

### Test Data

- Stored: `{ version: CURRENT_VERSION, data: { cash: 5000 } }`
- Validator checks `cash` is a number.

### Edge Cases

- Validator that checks multiple fields (all present) still passes.

---

## TC-008: Validator fails — returns defaultValue

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the validator returns false (data shape doesn't match expectations), `read()` returns defaultValue instead of corrupt data.

### Preconditions

- localStorage contains: `{"version": CURRENT_VERSION, "data": {"cash": "not-a-number"}}`.
- Validator: `(v: unknown): v is { cash: number } => typeof (v as any).cash === 'number'`.

### Steps

1. Call `read('key', { cash: 0 }, validator)`.
   **Expected:** Returns `{ cash: 0 }` (defaultValue) — validator rejects the data.

### Test Data

- Stored: `{ version: CURRENT_VERSION, data: { cash: "not-a-number" } }`
- Default: `{ cash: 0 }`

### Edge Cases

- Data is completely wrong type (string instead of object) — validator fails, default returned.
- Data is null after migration — validator receives null, fails, default returned.

---

## TC-009: No validator provided — backward compatible behavior

**Priority:** P0
**Type:** Functional

### Objective

Verify that omitting the validator parameter preserves existing read() behavior: data is returned without runtime shape checking (backward compatibility).

### Preconditions

- localStorage contains valid versioned data at CURRENT_VERSION.

### Steps

1. Call `read('key', defaultValue)` (two-argument form, no validator).
   **Expected:** Returns stored data as before — no validation error, no behavioral change from pre-migration code.

### Test Data

- Various types: object, primitive, array — same as existing TC-003/004/005 round-trip tests.

### Edge Cases

- Passing `undefined` explicitly as third argument should behave identically to omitting it.

---

## TC-010: Validator applied after migration

**Priority:** P0
**Type:** Functional

### Objective

Verify that when both migration and validator are active, the validator runs on the **post-migration** data, not the raw stored data.

### Preconditions

- `CURRENT_VERSION` is 2.
- Migrator(1): `(d) => ({ ...(d as object), newField: 42 })`.
- Validator: `(v): v is { newField: number } => typeof (v as any).newField === 'number'`.
- localStorage contains: `{"version": 1, "data": {"oldField": "x"}}`.

### Steps

1. Call `read('key', {}, validator)`.
   **Expected:** Migrator runs first (adds `newField: 42`), then validator checks post-migration shape and passes. Returns `{ oldField: "x", newField: 42 }`.

### Test Data

- Stored: `{ version: 1, data: { oldField: "x" } }`
- Migrator adds `newField: 42`
- Validator checks `newField` is a number

### Edge Cases

- If the migrator produces data that fails validation, defaultValue is returned (migration succeeded but output shape is wrong).

---

## TC-011: Validator fails on post-migration data — returns defaultValue

**Priority:** P1
**Type:** Functional

### Objective

Verify that if migration succeeds but the migrated data still fails validation, defaultValue is returned.

### Preconditions

- `CURRENT_VERSION` is 2.
- Migrator(1): `(d) => ({ ...(d as object), newField: "not-a-number" })` (produces bad shape).
- Validator: `(v): v is { newField: number } => typeof (v as any).newField === 'number'`.
- localStorage contains: `{"version": 1, "data": {"oldField": "x"}}`.

### Steps

1. Call `read('key', { newField: 0 }, validator)`.
   **Expected:** Returns `{ newField: 0 }` (defaultValue) — migrator ran but produced invalid shape.

### Test Data

- Stored: `{ version: 1, data: { oldField: "x" } }`
- Migrator adds `newField: "not-a-number"` (string instead of number)
- Validator expects `newField` to be a number

### Edge Cases

- None beyond the primary scenario.

---

## TC-012: Migration function throws — returns defaultValue

**Priority:** P0
**Type:** Functional

### Objective

Verify that if a migrator throws an error during execution, `read()` catches it and returns defaultValue rather than propagating the exception.

### Preconditions

- `CURRENT_VERSION` is 2.
- Migrator(1): `() => { throw new Error('migration bug') }`.
- localStorage contains: `{"version": 1, "data": {"cash": 5000}}`.

### Steps

1. Call `read('portfolio', { cash: 0 })`.
   **Expected:** Returns `{ cash: 0 }` (defaultValue). No unhandled exception.

2. Verify no exception propagates to the caller.
   **Expected:** `expect(() => read(...)).not.toThrow()`.

### Test Data

- Stored: `{ version: 1, data: { cash: 5000 } }`
- Migrator: throws `Error`

### Edge Cases

- Migrator throws a non-Error value (e.g., throws a string) — still caught, returns default.
- Second migrator in a chain throws after first succeeds — returns default, no partial migration leaks.

---

## TC-013: Migration returns null or undefined

**Priority:** P1
**Type:** Functional

### Objective

Verify that if a migrator returns null or undefined, the system handles it gracefully (returns defaultValue or treats it as invalid).

### Preconditions

- `CURRENT_VERSION` is 2.
- Migrator(1): `() => null` or `() => undefined`.
- localStorage contains: `{"version": 1, "data": {"cash": 5000}}`.

### Steps

1. Register migrator that returns `null`. Call `read('key', { cash: 0 })`.
   **Expected:** Returns `{ cash: 0 }` (defaultValue) — null post-migration data is treated as invalid.

2. Register migrator that returns `undefined`. Call `read('key', { cash: 0 })`.
   **Expected:** Returns `{ cash: 0 }` (defaultValue) — undefined post-migration data is treated as invalid.

### Test Data

- Stored: `{ version: 1, data: { cash: 5000 } }`
- Migrators returning null / undefined

### Edge Cases

- Migrator returns `0` or `false` (falsy but valid) — should be returned, not treated as invalid.

---

## TC-014: Corrupt/unparseable data still returns defaultValue (regression)

**Priority:** P0
**Type:** Regression

### Objective

Verify that the addition of migration logic does not break the existing behavior of returning defaultValue for corrupt JSON in localStorage.

### Preconditions

- Migrators may or may not be registered.
- localStorage contains invalid JSON strings.

### Steps

1. Set `localStorage.setItem('corrupt', 'not-valid-json{{{')`. Call `read('corrupt', [])`.
   **Expected:** Returns `[]` (defaultValue).

2. Set `localStorage.setItem('partial', '{"version":')`. Call `read('partial', { cash: 0 })`.
   **Expected:** Returns `{ cash: 0 }` (defaultValue).

3. Set `localStorage.setItem('empty', '')`. Call `read('empty', 'fallback')`.
   **Expected:** Returns `'fallback'` (defaultValue).

### Test Data

- Various corrupt strings: truncated JSON, invalid JSON, empty string, `"undefined"`, `"NaN"`

### Edge Cases

- All cases from existing TC-007 must continue to pass.

---

## TC-015: Legacy (unversioned) entries still returned as-is (regression)

**Priority:** P0
**Type:** Regression

### Objective

Verify that legacy entries (stored without a version envelope) are still returned directly without attempting migration.

### Preconditions

- localStorage contains unversioned data: `JSON.stringify({ shares: 3, avgCost: 100 })`.

### Steps

1. Call `read('legacy-obj', {})`.
   **Expected:** Returns `{ shares: 3, avgCost: 100 }` — no migration attempted on legacy entries.

2. Call `read('legacy-str', 'default')` where localStorage has `JSON.stringify('hello')`.
   **Expected:** Returns `'hello'`.

### Test Data

- Legacy object, string, number, array — same as existing TC-009 entries.

### Edge Cases

- Legacy entry that coincidentally has a `version` field but no `data` field is still treated as legacy (existing TC-018 behavior preserved).

---

## TC-016: Future version entries still rejected (regression)

**Priority:** P0
**Type:** Regression

### Objective

Verify that entries with a version higher than CURRENT_VERSION are still rejected and return defaultValue, even after migration support is added.

### Preconditions

- localStorage contains: `{"version": 999, "data": {"future": true}}`.

### Steps

1. Call `read('future', { fallback: true })`.
   **Expected:** Returns `{ fallback: true }` (defaultValue) — no downgrade migration attempted.

2. Call `read('future2', 'default')` where stored version is `CURRENT_VERSION + 1`.
   **Expected:** Returns `'default'`.

### Test Data

- Version 999, CURRENT_VERSION + 1

### Edge Cases

- No "downgrade" migration should ever be attempted for future versions.

---

## TC-017: Version 0 and negative versions still rejected (regression)

**Priority:** P1
**Type:** Regression

### Objective

Verify that invalid version numbers (0, negative) still return defaultValue and are not fed into the migration chain.

### Preconditions

- localStorage contains entries with version 0 and version -1.

### Steps

1. Call `read('zero-ver', { fallback: true })` where stored version is 0.
   **Expected:** Returns `{ fallback: true }` (defaultValue).

2. Call `read('neg1', { fallback: true })` where stored version is -1.
   **Expected:** Returns `{ fallback: true }` (defaultValue).

### Test Data

- `{ version: 0, data: { bad: true } }`
- `{ version: -1, data: { bad: true } }`

### Edge Cases

- None beyond existing TC-011 cases.

---

## TC-018: Existing 73 storageService tests still pass (gate)

**Priority:** P0
**Type:** Regression

### Objective

Verify that the full existing test suite passes without modification after adding migration and validator support.

### Preconditions

- All production code changes are complete.
- No existing test has been modified.

### Steps

1. Run `npm run test:run -- src/services/__tests__/storageService.test.ts`.
   **Expected:** All 73 existing tests pass (0 failures).

### Test Data

- N/A (existing suite)

### Edge Cases

- None; this is a binary gate.

---

## TC-019: storageService coverage holds (gate)

**Priority:** P0
**Type:** Regression

### Objective

Verify that code coverage for storageService does not regress after the changes, and new code paths (migration chain, validator) are covered by new tests.

### Preconditions

- All new tests are written and passing.

### Steps

1. Run `npm run test:coverage`.
   **Expected:** storageService.ts coverage is at or above the pre-change baseline (lines, branches, functions, statements).

### Test Data

- N/A (coverage report)

### Edge Cases

- Ensure branches for: missing migrator, migrator throws, validator pass, validator fail, null/undefined post-migration are all hit.

---

## TC-020: read() signature backward compatibility

**Priority:** P0
**Type:** Integration

### Objective

Verify that the new optional `validator` parameter on `read()` does not break any existing call sites that use the two-argument signature `read(key, defaultValue)`.

### Preconditions

- Context providers (ScenarioContext, TradingContext, SocialContext) call `read()` with two arguments.

### Steps

1. Run the full test suite including context integration tests (existing TC-017 in test file).
   **Expected:** All context-level static analysis tests pass — no TypeScript compile errors, no runtime errors from the updated `read()` signature.

2. Verify TypeScript compiles with `npx tsc --noEmit`.
   **Expected:** Zero type errors related to `read()` call sites.

### Test Data

- N/A (existing call sites)

### Edge Cases

- If any call site passes an explicit `undefined` as third argument, it should behave identically to omitting it.

# Test Plan: mcq-vlu.1 -- Create ScenarioContext

## Summary

- **Bead:** `mcq-vlu.1`
- **Feature:** ScenarioContext providing scenario selection, dynamic data loading, player base data, scenarioVersion counter, and persistence via storageService
- **Total Test Cases:** 17
- **Test Types:** Functional, Integration

---

## TC-001: ScenarioProvider renders and useScenario returns correct shape

**Priority:** P0
**Type:** Functional

### Objective

Verify that `ScenarioProvider` renders without error and the `useScenario` hook returns an object with all documented properties: `scenario`, `currentData`, `players`, `setScenario`, `scenarioLoading`, and `scenarioVersion`.

### Preconditions

- `ScenarioProvider` wraps a test consumer component
- `localStorage` is cleared

### Steps

1. Render a component inside `<ScenarioProvider>` that calls `useScenario()`
   **Expected:** Hook returns an object with keys `scenario`, `currentData`, `players`, `setScenario`, `scenarioLoading`, `scenarioVersion`

2. Check types of each returned value
   **Expected:** `scenario` is a string, `currentData` is null or object, `players` is an array, `setScenario` is a function, `scenarioLoading` is a boolean, `scenarioVersion` is a number

### Test Data

- No specific test data required

### Edge Cases

- Children of `ScenarioProvider` render normally (no blocking, no thrown errors)

---

## TC-002: useScenario throws when used outside ScenarioProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `useScenario` outside of a `ScenarioProvider` throws a descriptive error, preventing silent null context bugs.

### Preconditions

- No `ScenarioProvider` in the component tree

### Steps

1. Render a component that calls `useScenario()` without any `ScenarioProvider` ancestor
   **Expected:** Throws an error with message `"useScenario must be used within a ScenarioProvider"`

### Test Data

- No specific test data required

### Edge Cases

- Nesting `useScenario` inside an unrelated provider (e.g., `SocialProvider` without `ScenarioProvider`) should still throw

---

## TC-003: Default scenario initializes to 'midweek' with no stored value

**Priority:** P0
**Type:** Functional

### Objective

Verify that when localStorage has no stored scenario, the context initializes `scenario` to `'midweek'` and begins loading that scenario's data.

### Preconditions

- `localStorage` is cleared (no `mcqueen-scenario` key)

### Steps

1. Render `ScenarioProvider` and read `scenario` immediately
   **Expected:** Value is `'midweek'`

2. Read `scenarioLoading` immediately
   **Expected:** Value is `true`

3. Read `scenarioVersion`
   **Expected:** Value is `0`

4. Read `currentData`
   **Expected:** Value is `null` (data not yet loaded)

5. Read `players`
   **Expected:** Value is `[]` (empty array, derived from null currentData)

### Test Data

- Default scenario ID: `'midweek'`

### Edge Cases

- N/A (covered by TC-013 for corrupt/missing storage)

---

## TC-004: Initial scenario data loads via dynamic import

**Priority:** P0
**Type:** Functional

### Objective

Verify that the default scenario's JSON data is loaded asynchronously via dynamic `import()` and that `currentData` and `players` are populated once loading completes.

### Preconditions

- `ScenarioProvider` is rendered
- `localStorage` is cleared (defaults to `'midweek'`)

### Steps

1. Mount `ScenarioProvider` and wait for `scenarioLoading` to become `false`
   **Expected:** `scenarioLoading` transitions from `true` to `false`

2. Read `currentData` after loading
   **Expected:** Non-null object containing scenario data (including a `players` array)

3. Read `players` after loading
   **Expected:** Non-empty array of player objects

### Test Data

- Default scenario: `'midweek'` (loads `midweek.json`)

### Edge Cases

- Verify that `midweek.json` is not statically imported at module load time (i.e., the import only fires when the effect runs)

---

## TC-005: Switching scenario loads new data via dynamic import

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `setScenario` with a valid scenario ID triggers a dynamic import of the corresponding JSON file and updates `currentData` and `players`.

### Preconditions

- `ScenarioProvider` is rendered and initial `'midweek'` data has loaded

### Steps

1. Call `setScenario('live')`
   **Expected:** `scenario` changes to `'live'`

2. Observe `scenarioLoading` immediately after the call
   **Expected:** `scenarioLoading` is `true`

3. Wait for loading to complete
   **Expected:** `scenarioLoading` becomes `false`; `currentData` contains live scenario data; `players` is a non-empty array from the live data

4. Call `setScenario('playoffs')`
   **Expected:** Same loading cycle; `currentData` reflects playoffs data

5. Call `setScenario('superbowl')`
   **Expected:** Same loading cycle; `currentData` reflects superbowl data

### Test Data

- Scenario IDs: `'live'`, `'playoffs'`, `'superbowl'`

### Edge Cases

- Switching back to a previously loaded scenario (e.g., `'midweek'` again) should still trigger a fresh dynamic import and loading cycle

---

## TC-006: espn-live scenario transforms imported data correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `'espn-live'` scenario loader transforms the raw `espnPlayers.json` import into the expected shape (`{ scenario: 'espn-live', players: [...] }`) rather than using the raw module default directly.

### Preconditions

- `ScenarioProvider` is rendered and initial load is complete

### Steps

1. Call `setScenario('espn-live')` and wait for loading to complete
   **Expected:** `currentData` has shape `{ scenario: 'espn-live', players: [...] }`

2. Read `players`
   **Expected:** Non-empty array matching the `players` property from `espnPlayers.json`

3. Verify `currentData.scenario` is the string `'espn-live'`
   **Expected:** Equals `'espn-live'`

### Test Data

- Scenario ID: `'espn-live'`
- Source file: `espnPlayers.json`

### Edge Cases

- If `espnPlayers.json` has an empty `players` array, `players` should be `[]`

---

## TC-007: Unknown scenario ID does not crash and stops loading

**Priority:** P0
**Type:** Functional

### Objective

Verify that setting the scenario to an ID that has no registered loader does not throw, does not leave `scenarioLoading` stuck at `true`, and does not corrupt `currentData`.

### Preconditions

- `ScenarioProvider` is rendered and initial load is complete
- `currentData` has valid data from previous scenario

### Steps

1. Call `setScenario('nonexistent')`
   **Expected:** No exception thrown

2. Wait for loading state to settle
   **Expected:** `scenarioLoading` becomes `false`

3. Read `scenario`
   **Expected:** Value is `'nonexistent'`

### Test Data

- Invalid scenario IDs: `'nonexistent'`, `''`, `null`, `undefined`

### Edge Cases

- Setting scenario to `null` or `undefined`: should not throw; loading should complete
- Setting scenario to an empty string `''`: same graceful handling

---

## TC-008: scenarioVersion increments on each setScenario call

**Priority:** P0
**Type:** Functional

### Objective

Verify that `scenarioVersion` increments by 1 on every call to `setScenario`, enabling downstream contexts to detect scenario changes and reset their own state.

### Preconditions

- `ScenarioProvider` is rendered and initial load is complete
- `scenarioVersion` starts at `0`

### Steps

1. Record initial `scenarioVersion`
   **Expected:** Value is `0`

2. Call `setScenario('live')`
   **Expected:** `scenarioVersion` is `1`

3. Call `setScenario('playoffs')`
   **Expected:** `scenarioVersion` is `2`

4. Call `setScenario('midweek')`
   **Expected:** `scenarioVersion` is `3`

### Test Data

- N/A

### Edge Cases

- Version should never decrease or skip a value

---

## TC-009: scenarioVersion increments when switching to the same scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `setScenario` with the currently active scenario ID still increments `scenarioVersion`. This is important because downstream contexts use the version change as a reset signal, and "re-selecting" the same scenario should still trigger a full reset.

### Preconditions

- `ScenarioProvider` is rendered
- Current scenario is `'playoffs'`

### Steps

1. Record `scenarioVersion` (e.g., `v1`)
   **Expected:** Known numeric value

2. Call `setScenario('playoffs')` (same as current)
   **Expected:** `scenarioVersion` is `v1 + 1`

3. Call `setScenario('playoffs')` again
   **Expected:** `scenarioVersion` is `v1 + 2`

### Test Data

- Scenario: `'playoffs'`

### Edge Cases

- N/A

---

## TC-010: scenarioLoading is true during initial load and false after

**Priority:** P0
**Type:** Functional

### Objective

Verify that `scenarioLoading` accurately reflects the async loading state: `true` while the dynamic import is in flight, `false` once data is available.

### Preconditions

- `ScenarioProvider` is rendered
- `localStorage` is cleared

### Steps

1. Read `scenarioLoading` immediately after mount
   **Expected:** `true`

2. Wait for the dynamic import to resolve
   **Expected:** `scenarioLoading` transitions to `false`

3. Verify `currentData` is non-null and `players` is non-empty
   **Expected:** Data is fully loaded

### Test Data

- Default scenario: `'midweek'`

### Edge Cases

- If the dynamic import rejects (e.g., file not found), `scenarioLoading` should still become `false` (not stuck forever)

---

## TC-011: scenarioLoading resets to true during scenario switch

**Priority:** P0
**Type:** Functional

### Objective

Verify that when switching from one scenario to another, `scenarioLoading` resets to `true` while the new data loads, then returns to `false` once complete.

### Preconditions

- `ScenarioProvider` is rendered and initial load is complete (`scenarioLoading` is `false`)

### Steps

1. Call `setScenario('live')`
   **Expected:** `scenarioLoading` immediately becomes `true`

2. Wait for loading to complete
   **Expected:** `scenarioLoading` becomes `false`; `currentData` reflects live scenario data

### Test Data

- Switch from `'midweek'` to `'live'`

### Edge Cases

- Rapid switches: `scenarioLoading` should reflect the loading state of the most recent scenario request

---

## TC-012: Dynamic import error is handled gracefully

**Priority:** P1
**Type:** Functional

### Objective

Verify that if a dynamic import rejects (e.g., network error, corrupt module), the error is caught, logged to console, and the provider does not crash. `scenarioLoading` should become `false`.

### Preconditions

- `ScenarioProvider` is rendered
- The dynamic import for a scenario is mocked to reject with an error

### Steps

1. Mock the loader for `'live'` to reject with `new Error('Network error')`
   **Expected:** Mock is in place

2. Call `setScenario('live')`
   **Expected:** No unhandled exception; error is logged via `console.error` with message containing `'Failed to load scenario:'`

3. Wait for loading to settle
   **Expected:** `scenarioLoading` becomes `false`

### Test Data

- Mocked import failure for `'live'` scenario

### Edge Cases

- After a failed load, switching to a valid scenario should still work normally (the context is not in a broken state)

---

## TC-013: Scenario selection persisted to localStorage on change

**Priority:** P0
**Type:** Functional

### Objective

Verify that every time the scenario changes, the new value is written to localStorage via `storageService.write` using the key `STORAGE_KEYS.scenario` (`'mcqueen-scenario'`).

### Preconditions

- `localStorage` is cleared
- `ScenarioProvider` is rendered

### Steps

1. Wait for initial load to complete (default scenario `'midweek'`)
   **Expected:** `localStorage` contains key `'mcqueen-scenario'` with versioned entry wrapping the value `'midweek'`

2. Call `setScenario('playoffs')`
   **Expected:** `localStorage` key `'mcqueen-scenario'` is updated to wrap the value `'playoffs'`

3. Call `setScenario('superbowl')`
   **Expected:** `localStorage` key `'mcqueen-scenario'` is updated to wrap the value `'superbowl'`

### Test Data

- Storage key: `'mcqueen-scenario'` (from `STORAGE_KEYS.scenario`)
- Storage format: `{ version: 1, data: "<scenario-id>" }`

### Edge Cases

- If `localStorage` is unavailable (e.g., in a sandboxed environment), the write should fail silently without crashing the provider

---

## TC-014: Scenario selection restored from localStorage on mount

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `ScenarioProvider` mounts, it reads the persisted scenario from `storageService` and initializes to that value rather than the hardcoded default.

### Preconditions

- `localStorage` contains a valid persisted scenario value (e.g., `'playoffs'`)

### Steps

1. Pre-populate `localStorage` key `'mcqueen-scenario'` with a versioned entry for `'playoffs'`
   **Expected:** Storage is set

2. Render `ScenarioProvider`
   **Expected:** `scenario` initializes as `'playoffs'` (not `'midweek'`)

3. Wait for loading to complete
   **Expected:** `currentData` contains playoffs scenario data

### Test Data

- Pre-stored value: `{ version: 1, data: "playoffs" }`

### Edge Cases

- Corrupt storage value (e.g., `{ version: 1, data: 42 }` — a number instead of string): should fall back to `'midweek'` default
- Missing storage key: should fall back to `'midweek'`
- Legacy unversioned storage value (e.g., raw JSON string `"live"`): `storageService.read` handles this and returns the parsed value

---

## TC-015: Rapid scenario switching settles on the last scenario

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `setScenario` is called multiple times in quick succession, the cleanup function in the loading effect cancels stale in-flight imports and only the last scenario's data is applied.

### Preconditions

- `ScenarioProvider` is rendered and initial load is complete

### Steps

1. Call `setScenario('live')`, then immediately `setScenario('playoffs')`, then immediately `setScenario('superbowl')`
   **Expected:** `scenario` settles on `'superbowl'`

2. Wait for all loading to complete
   **Expected:** `scenarioLoading` becomes `false`; `currentData` contains superbowl data (not live or playoffs)

3. Read `scenarioVersion`
   **Expected:** Incremented by 3 from the starting value (one per `setScenario` call)

### Test Data

- Scenario sequence: `'live'` → `'playoffs'` → `'superbowl'`

### Edge Cases

- Intermediate scenario data should never briefly appear in `currentData` (stale callbacks are cancelled)

---

## TC-016: Stale load is cancelled on unmount

**Priority:** P1
**Type:** Functional

### Objective

Verify that if `ScenarioProvider` unmounts while a dynamic import is still in flight, the stale callback does not attempt to set state on an unmounted component (no React warning, no crash).

### Preconditions

- `ScenarioProvider` is rendered

### Steps

1. Call `setScenario('live')` to trigger a dynamic import
   **Expected:** Loading begins

2. Immediately unmount the `ScenarioProvider` before the import resolves
   **Expected:** No React "setState on unmounted component" warning; no error in console

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-017: players is derived as empty array when currentData is null or has no players

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `players` value exposed by the context is always a safe array — defaulting to `[]` when `currentData` is null or when `currentData.players` is undefined.

### Preconditions

- `ScenarioProvider` is rendered

### Steps

1. Read `players` before initial load completes (while `currentData` is `null`)
   **Expected:** `players` is `[]` (empty array), not `null` or `undefined`

2. Set scenario to an unknown ID so `currentData` is not updated with new data
   **Expected:** `players` reflects the derivation from whatever `currentData` holds (empty array if currentData has no `.players`)

3. Load a valid scenario and confirm `players` reflects `currentData.players`
   **Expected:** `players` is the same array as `currentData.players`

### Test Data

- N/A

### Edge Cases

- If `currentData` is an object without a `players` key (e.g., malformed JSON), `players` should be `[]`
- `players` should always be an array (never null, undefined, or a non-array type)

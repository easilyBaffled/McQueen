# Test Plan: mcq-1zw.6 -- Fix race conditions and unbounded memory growth

## Summary

- **Bead:** `mcq-1zw.6`
- **Feature:** ESPN fetch abort on unmount, processedArticleIds cap, espnService cache eviction, and ScenarioContext import-failure recovery
- **Total Test Cases:** 24
- **Test Types:** Functional, Integration, Regression

---

## TC-001: ESPN fetch is aborted when leaving ESPN-live mode mid-flight

**Priority:** P0
**Type:** Functional

### Objective

Verify that an in-flight ESPN news fetch is cancelled via AbortController when the user switches away from ESPN-live mode before the fetch resolves, preventing setState on an unmounted/stale provider.

### Preconditions

- SimulationProvider is mounted in ESPN-live mode
- `fetchNFLNews` is mocked to return a delayed promise (e.g., 500 ms)

### Steps

1. Render SimulationProvider with scenario = `espn-live`.
   **Expected:** An ESPN fetch is initiated; the AbortController's signal is not aborted.

2. While the fetch is still pending, change the scenario to `midweek` (triggering cleanup of the ESPN effect).
   **Expected:** The AbortController's `abort()` is called; the fetch promise rejects with an `AbortError`.

3. Allow the component to settle; inspect `espnNews` and `espnError` state.
   **Expected:** No stale ESPN data is written to state. No React "setState on unmounted component" warning appears.

### Test Data

- Mocked `fetchNFLNews` that returns a promise resolvable after a configurable delay.

### Edge Cases

- Fetch completes in the same microtask as the abort — verify no partial state update leaks through.
- Multiple rapid scenario switches during a pending fetch — only one abort per controller, no double-abort errors.

---

## TC-002: ESPN refresh interval is cleared on mode exit

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `setInterval` for ESPN auto-refresh is cleared when the ESPN-live effect cleans up, so no phantom refreshes fire after leaving the mode.

### Preconditions

- SimulationProvider rendered in ESPN-live mode with `ESPN_REFRESH_MS` set to a short value (or faked timers).

### Steps

1. Mount SimulationProvider with scenario = `espn-live`.
   **Expected:** `setInterval` is registered for periodic ESPN refresh.

2. Switch scenario to `midweek`.
   **Expected:** `clearInterval` is called for the ESPN refresh interval.

3. Advance fake timers past several refresh intervals.
   **Expected:** `fetchNFLNews` is NOT called again after the mode change.

### Test Data

- Use `vi.useFakeTimers()` to control interval firing.

### Edge Cases

- Unmount the entire SimulationProvider while in ESPN-live mode — interval must still be cleared.

---

## TC-003: AbortSignal is forwarded through espnService fetch calls

**Priority:** P0
**Type:** Functional

### Objective

Verify that the AbortSignal created in the SimulationContext ESPN effect is passed to `fetchNFLNews` and through to the underlying `fetch()` call so the browser can actually cancel the network request.

### Preconditions

- `global.fetch` is mocked to capture the `RequestInit` argument.

### Steps

1. Call `fetchNFLNews(20, { signal })` where `signal` is an AbortController's signal.
   **Expected:** The underlying `fetch()` call receives `{ signal }` in its options.

2. Abort the controller before `fetch` resolves.
   **Expected:** The `fetch` promise rejects with `AbortError`; `fetchNFLNews` propagates the rejection (does not swallow it silently in the catch block).

### Test Data

- AbortController with manually triggered `abort()`.

### Edge Cases

- Signal is already aborted before `fetchNFLNews` is called — fetch should reject immediately.
- Signal is undefined/not provided — fetch proceeds normally without a signal (backward compatibility).

---

## TC-004: Aborted ESPN fetch does not set error state

**Priority:** P1
**Type:** Functional

### Objective

Verify that when an ESPN fetch is aborted (AbortError), the SimulationContext does not set `espnError` to a user-visible error string — abort is an expected cancellation, not a failure.

### Preconditions

- SimulationProvider mounted in ESPN-live mode.
- `fetchNFLNews` mocked to reject with an `AbortError`.

### Steps

1. Trigger an ESPN fetch by mounting in ESPN-live mode.
   **Expected:** Fetch begins.

2. Abort the fetch (simulating mode switch).
   **Expected:** `espnError` remains `null`. `espnLoading` returns to `false`.

### Test Data

- `new DOMException('The operation was aborted', 'AbortError')`.

### Edge Cases

- Non-abort network error during the same session — `espnError` should still be set for genuine failures.

---

## TC-005: processedArticleIds stays within MAX_PROCESSED_ARTICLES cap

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `processedArticleIds` Set is capped at `MAX_PROCESSED_ARTICLES` (5000) and performs eviction when the limit is exceeded.

### Preconditions

- SimulationProvider in ESPN-live mode.
- `processedArticleIds` pre-populated with exactly `MAX_PROCESSED_ARTICLES` entries.
- A new ESPN fetch returns one article with a previously-unseen ID.

### Steps

1. Process the new article through `fetchAndProcessEspnNews`.
   **Expected:** The new article ID is added to the Set.

2. Inspect `processedArticleIds.size`.
   **Expected:** Size is ≤ `MAX_PROCESSED_ARTICLES`. It should have been trimmed (e.g., to `MAX_PROCESSED_ARTICLES / 2 + 1` after eviction of the oldest half).

### Test Data

- 5000 synthetic article IDs pre-seeded into `processedArticleIds`.
- 1 new article returned from mocked `fetchNFLNews`.

### Edge Cases

- Exactly at the limit (5000 entries, no new articles) — no eviction should occur.
- Batch of 100 new articles in a single fetch when already at 4950 — eviction triggers, all new articles are retained.

---

## TC-006: processedArticleIds eviction preserves newest entries

**Priority:** P1
**Type:** Functional

### Objective

Verify that when eviction fires, the oldest entries are removed and the newest entries (including recently processed articles) are retained.

### Preconditions

- `processedArticleIds` at capacity with entries inserted in a known order.

### Steps

1. Exceed the cap by adding new article IDs.
   **Expected:** The Set is trimmed.

2. Check that the most recently added IDs are present in the post-eviction Set.
   **Expected:** All IDs from the newest half are retained.

3. Check that the oldest IDs are absent.
   **Expected:** IDs from the oldest half have been evicted.

### Test Data

- IDs named sequentially: `article-0001` through `article-5001`.

### Edge Cases

- All IDs are identical (duplicate articles) — Set size never exceeds 1; no eviction needed.

---

## TC-007: processedArticleIds prevents duplicate article processing

**Priority:** P1
**Type:** Regression

### Objective

Verify that articles whose IDs are already in `processedArticleIds` are skipped — no duplicate price impacts or history entries.

### Preconditions

- SimulationProvider in ESPN-live mode.
- First fetch returns articles A and B. Second fetch returns the same articles A and B.

### Steps

1. Run the first ESPN fetch cycle.
   **Expected:** Articles A and B are processed; price overrides and history entries are created.

2. Run a second ESPN fetch cycle with identical articles.
   **Expected:** Articles A and B are skipped. No new price overrides or history entries are added.

### Test Data

- Two mock articles with fixed IDs.

### Edge Cases

- Article with same ID but different headline/description on second fetch — still skipped (keyed by ID only).

---

## TC-008: espnService cache does not exceed MAX_CACHE_SIZE

**Priority:** P0
**Type:** Functional

### Objective

Verify that the espnService module-level cache Map enforces a `MAX_CACHE_SIZE` (100) limit and evicts the oldest entries when the limit is reached.

### Preconditions

- espnService cache is empty.
- `global.fetch` is mocked to return unique successful responses.

### Steps

1. Make 100 unique API calls to populate the cache to its limit.
   **Expected:** `getCacheStats().size` returns 100.

2. Make one additional unique API call (101st).
   **Expected:** `getCacheStats().size` remains ≤ 100. The oldest cache entry (from call #1) has been evicted.

3. Re-request the evicted endpoint.
   **Expected:** A new network `fetch()` is triggered (cache miss).

### Test Data

- 101 distinct endpoint strings (e.g., `/news?limit=1` through `/news?limit=101`).

### Edge Cases

- Rapid concurrent requests for 200 unique endpoints — cache never exceeds MAX_CACHE_SIZE after all settle.
- Re-requesting a cached (non-evicted) endpoint should still be served from cache without a network call.

---

## TC-009: espnService cache evicts in insertion order (FIFO)

**Priority:** P1
**Type:** Functional

### Objective

Verify that cache eviction removes entries in the order they were inserted (Map insertion order), so the stalest data is dropped first.

### Preconditions

- Cache populated with entries A, B, C in that order, cache at capacity.

### Steps

1. Insert a new entry D.
   **Expected:** Entry A (oldest) is evicted; B, C, D remain.

2. Insert another entry E.
   **Expected:** Entry B is evicted; C, D, E remain.

### Test Data

- Controlled endpoint strings to verify eviction order.

### Edge Cases

- Accessing (reading) an existing cache entry does not change its insertion order — it should still be evicted based on original insert time.

---

## TC-010: espnService does not cache error responses

**Priority:** P0
**Type:** Functional

### Objective

Verify that when an ESPN API request fails (non-200 status or network error), the error response is NOT stored in the cache.

### Preconditions

- `global.fetch` mocked to return a 500 status for a given endpoint.

### Steps

1. Call `fetchNFLNews()` while mock returns 500 for both proxy and direct URLs.
   **Expected:** The call rejects or returns an empty array (current behavior).

2. Inspect cache via `getCacheStats()`.
   **Expected:** No cache entry exists for the failed endpoint.

3. Mock the endpoint to succeed, then retry.
   **Expected:** A new fetch is made (no stale error cached), and the successful response is now cached.

### Test Data

- Mock returning `{ ok: false, status: 500 }`.

### Edge Cases

- Proxy returns 500 but direct succeeds — only the successful direct response should be cached.
- Timeout / network error (fetch throws) — nothing cached.

---

## TC-011: espnService error responses get short TTL if cached

**Priority:** P1
**Type:** Functional

### Objective

If the implementation chooses to cache errors with a shorter TTL (`ERROR_TTL_MS = 30000`) rather than not caching them at all, verify that error entries expire and are evicted after 30 seconds.

### Preconditions

- Fake timers enabled.
- An error response has been cached for a given endpoint.

### Steps

1. Verify the error entry exists in the cache immediately after the failed request.
   **Expected:** Cache contains the entry (if error caching is used).

2. Advance time by 29 seconds.
   **Expected:** Cache entry still present (within ERROR_TTL).

3. Advance time to 31 seconds total.
   **Expected:** Cache entry has expired; next fetch triggers a real network request.

### Test Data

- `vi.advanceTimersByTime(31_000)`.

### Edge Cases

- Successful response cached at the same time as an error for a different key — successful entry should still respect the longer `CACHE_TTL` (5 min), not the shorter error TTL.

---

## TC-012: espnService successful cache entries respect standard TTL

**Priority:** P1
**Type:** Regression

### Objective

Verify that successful cache entries still expire after the standard `CACHE_TTL` (5 minutes) and are not affected by the new eviction logic.

### Preconditions

- Fake timers enabled.
- A successful response is cached.

### Steps

1. Call an endpoint; verify the response is cached.
   **Expected:** Second call to the same endpoint returns cached data, no network fetch.

2. Advance time by 4 minutes 59 seconds.
   **Expected:** Cache entry still valid.

3. Advance time to 5 minutes 1 second total.
   **Expected:** Cache entry expired; next call triggers a new network fetch.

### Test Data

- `vi.advanceTimersByTime(301_000)`.

### Edge Cases

- None beyond the standard TTL boundary.

---

## TC-013: ScenarioContext import failure sets scenarioError

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a dynamic `import()` for a scenario data file fails, the ScenarioContext sets a `scenarioError` state with a meaningful message and stops the loading spinner.

### Preconditions

- ScenarioProvider mounted.
- The dynamic import for `midweek.json` is mocked to reject with `new Error('Network error')`.

### Steps

1. Set scenario to `midweek` (triggering the failing import).
   **Expected:** `scenarioLoading` transitions to `true` while loading.

2. Wait for the promise to reject.
   **Expected:** `scenarioLoading` is `false`. `scenarioError` is set to a string containing `'Network error'` (or a user-friendly message).

### Test Data

- `vi.mock('../data/midweek.json', () => { throw new Error('Network error'); })`.

### Edge Cases

- Import rejects with a non-Error value (e.g., a string) — `scenarioError` should still be set to a meaningful string.
- Import rejects with `undefined` — `scenarioError` should have a fallback message like "Failed to load scenario".

---

## TC-014: ScenarioContext import failure does not leave UI in permanent loading state

**Priority:** P0
**Type:** Functional

### Objective

Verify that after an import failure, `scenarioLoading` is definitively set to `false` so the UI can render an error state instead of an infinite spinner.

### Preconditions

- Dynamic import for the selected scenario is mocked to reject.

### Steps

1. Switch to a scenario whose import fails.
   **Expected:** `scenarioLoading` becomes `true`.

2. Wait for rejection to propagate.
   **Expected:** `scenarioLoading` becomes `false`. The UI is not stuck in a loading state.

### Test Data

- Any scenario with a failing import mock.

### Edge Cases

- Error thrown synchronously inside the `.then()` handler of the import (e.g., `m.default` is undefined and destructuring fails) — loading should still resolve to `false`.

---

## TC-015: ScenarioContext exposes retryScenarioLoad callback

**Priority:** P0
**Type:** Functional

### Objective

Verify that after an import failure, the context exposes a `retryScenarioLoad` function that consumers can call to re-attempt the dynamic import.

### Preconditions

- ScenarioProvider mounted.
- Initial import for `midweek` fails.

### Steps

1. Verify `scenarioError` is set after the failure.
   **Expected:** `scenarioError` contains an error message.

2. Mock the import to succeed on the next attempt, then call `retryScenarioLoad()`.
   **Expected:** `scenarioLoading` transitions to `true`, then `false`. `scenarioError` is cleared to `null`. `currentData` is populated with the scenario data.

### Test Data

- First call to dynamic import rejects; second call resolves with valid scenario JSON.

### Edge Cases

- Calling `retryScenarioLoad` while a load is already in progress — should not trigger a duplicate import; or if it does, only the latest result is used.
- Retry also fails — `scenarioError` should be updated with the new error.

---

## TC-016: ScenarioContext retry clears previous error

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `retryScenarioLoad` clears `scenarioError` before starting the new load attempt, so stale error messages don't persist during a retry.

### Preconditions

- `scenarioError` is set from a previous failure.

### Steps

1. Call `retryScenarioLoad()`.
   **Expected:** `scenarioError` is immediately set to `null`. `scenarioLoading` is `true`.

2. Allow the retry to complete (success or failure).
   **Expected:** If success: `scenarioError` remains `null`, data is loaded. If failure: `scenarioError` is set to the new error message.

### Test Data

- Controlled mock switching between failure and success.

### Edge Cases

- None beyond the above.

---

## TC-017: ScenarioContext stale import resolution is ignored after retry

**Priority:** P1
**Type:** Functional

### Objective

Verify that if a first import attempt fails slowly and a retry succeeds quickly, the late-arriving failure from the first attempt does not overwrite the successful state from the retry.

### Preconditions

- First import is delayed (e.g., 500 ms) then rejects.
- Retry import resolves immediately with valid data.

### Steps

1. Trigger the initial (failing) import.
   **Expected:** Loading begins.

2. Before the first import rejects, trigger a retry that succeeds immediately.
   **Expected:** `currentData` is populated. `scenarioError` is `null`.

3. Allow the first import's rejection to propagate.
   **Expected:** State remains unchanged — the stale rejection is ignored due to the `cancelled` flag.

### Test Data

- Delayed rejection promise for first attempt; immediate resolution for retry.

### Edge Cases

- Two rapid retries in succession — only the last one's result should be applied.

---

## TC-018: Full integration — ESPN-live mode start-to-abort lifecycle

**Priority:** P0
**Type:** Integration

### Objective

Verify the complete lifecycle: enter ESPN-live mode, receive news, process articles, then switch modes — confirming fetch abort, interval cleanup, and state reset all work together.

### Preconditions

- Full SimulationProvider + ScenarioProvider rendered.
- Mocked ESPN API returning articles that match at least one player.

### Steps

1. Set scenario to `espn-live`.
   **Expected:** ESPN fetch fires; articles are processed; price overrides and history entries are created; `espnNews` is populated.

2. While the next interval fetch is pending, switch scenario to `midweek`.
   **Expected:** AbortController aborts the pending fetch. Interval is cleared. State is reset: `espnNews` = [], `espnError` = null, `processedArticleIds` = empty Set.

3. Verify no further ESPN fetches occur.
   **Expected:** After several timer ticks, `fetchNFLNews` call count has not increased beyond the calls made before the mode switch.

### Test Data

- Mock articles relevant to player `Patrick Mahomes`.

### Edge Cases

- Switch back to ESPN-live immediately after switching away — new AbortController should be created for the new session.

---

## TC-019: processedArticleIds is reset on scenario change

**Priority:** P1
**Type:** Regression

### Objective

Verify that switching scenarios resets `processedArticleIds` to an empty Set, preventing stale IDs from a previous ESPN session from blocking article processing in a new session.

### Preconditions

- SimulationProvider has been in ESPN-live mode and has processed articles (non-empty `processedArticleIds`).

### Steps

1. Switch scenario to `midweek`.
   **Expected:** `processedArticleIds` is reset to an empty Set.

2. Switch back to `espn-live`.
   **Expected:** `processedArticleIds` starts empty; previously processed articles are re-processable.

### Test Data

- Pre-populated `processedArticleIds` from a prior ESPN session.

### Edge Cases

- Switching between two non-ESPN scenarios — `processedArticleIds` should still be reset (no stale data).

---

## TC-020: espnService clearCache removes all entries

**Priority:** P2
**Type:** Regression

### Objective

Verify that `clearCache()` empties the module-level cache entirely, including any entries with shortened error TTLs.

### Preconditions

- Cache contains both successful and error entries.

### Steps

1. Call `clearCache()`.
   **Expected:** `getCacheStats().size` is 0. `getCacheStats().keys` is empty.

### Test Data

- Pre-populate cache with 5 successful and 2 error entries.

### Edge Cases

- Calling `clearCache()` on an already-empty cache — no error thrown.

---

## TC-021: espnService cache eviction under concurrent requests

**Priority:** P1
**Type:** Functional

### Objective

Verify that when multiple concurrent requests complete near-simultaneously and all try to insert into a full cache, eviction behaves correctly and the cache size never exceeds `MAX_CACHE_SIZE`.

### Preconditions

- Cache is at `MAX_CACHE_SIZE - 1`.
- 5 concurrent, unique endpoint requests are in-flight.

### Steps

1. Resolve all 5 requests.
   **Expected:** Cache size ≤ `MAX_CACHE_SIZE` at all times. No lost entries for the concurrent requests (all 5 are cached after eviction of the oldest entries).

### Test Data

- 5 unique endpoint strings; 5 delayed fetch mocks resolved together.

### Edge Cases

- Two concurrent requests for the same endpoint — only one cache entry should exist.

---

## TC-022: AbortSignal forwarded to fallback (direct ESPN) fetch

**Priority:** P1
**Type:** Functional

### Objective

Verify that when the proxy fetch fails and `fetchWithFallback` retries against the direct ESPN API, the AbortSignal is also forwarded to the fallback fetch call.

### Preconditions

- Proxy endpoint returns 500.
- `global.fetch` is mocked to capture options for both calls.

### Steps

1. Call `fetchWithFallback` with a signal, where the proxy returns 500.
   **Expected:** The first `fetch()` call includes the signal. The fallback `fetch()` call to `ESPN_DIRECT_BASE` also includes the same signal.

2. Abort the controller before the fallback completes.
   **Expected:** The fallback fetch rejects with `AbortError`.

### Test Data

- AbortController with signal.

### Edge Cases

- Proxy succeeds — fallback is never called, but signal should still be present on the proxy fetch.

---

## TC-023: processedArticleIds cap boundary — exactly at limit

**Priority:** P2
**Type:** Functional

### Objective

Verify behavior when `processedArticleIds.size` is exactly equal to `MAX_PROCESSED_ARTICLES` and no new articles arrive.

### Preconditions

- `processedArticleIds` has exactly 5000 entries.
- ESPN fetch returns only articles whose IDs are already in the Set.

### Steps

1. Run `fetchAndProcessEspnNews`.
   **Expected:** No eviction occurs. Set size remains 5000. No articles are re-processed.

### Test Data

- 5000 pre-seeded IDs; mock fetch returns a subset of those same IDs.

### Edge Cases

- None beyond the boundary condition itself.

---

## TC-024: ScenarioContext handles unknown scenario key gracefully

**Priority:** P2
**Type:** Regression

### Objective

Verify that setting a scenario key not present in `scenarioLoaders` does not crash and properly resolves the loading state (potentially setting an error).

### Preconditions

- ScenarioProvider mounted.

### Steps

1. Call `setScenario('nonexistent-scenario')`.
   **Expected:** `scenarioLoading` becomes `false`. No crash or unhandled promise rejection. Either `scenarioError` is set with a message like "Unknown scenario", or the context falls through gracefully (current behavior: `setScenarioLoading(false)` with no data change).

### Test Data

- Scenario key: `'nonexistent-scenario'`.

### Edge Cases

- Empty string scenario key — same graceful handling.
- `null` or `undefined` scenario key (if TypeScript allows it at runtime) — no crash.

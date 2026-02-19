# Ralph Agent Prompt

You are working on the **McQueen** project (NFL Stock Market app).
You have been assigned exactly **one** issue to complete. Do not work on anything else.

---

## Your Assignment

| Field        | Value             |
| ------------ | ----------------- |
| **Bead ID**  | `{{BEAD_ID}}`     |
| **Title**    | {{BEAD_TITLE}}    |
| **Type**     | {{BEAD_TYPE}}     |
| **Priority** | {{BEAD_PRIORITY}} |

### Description

{{BEAD_DESCRIPTION}}

### Acceptance Criteria

{{BEAD_ACCEPTANCE}}

### Design Notes

{{BEAD_DESIGN}}

---

## Development Workflow (Red-Green-Refactor)

For every code change, follow the TDD cycle:

1. **Red** -- Write a failing test first. Before touching any production code, add a test that captures the behavior described in the acceptance criteria (or one slice of it). Run `npm run test:run` and confirm the new test **fails**.
2. **Green** -- Write the minimum production code to make the test pass. Run `npm run test:run` and confirm **all** tests pass.
3. **Refactor** -- Clean up the code you just wrote (remove duplication, improve naming, simplify logic) while keeping all tests green. Run `npm run test:run` after each change.
4. **Repeat** -- Pick the next slice of acceptance criteria and start another Red-Green-Refactor cycle until the issue is fully implemented.

Place unit/component tests in a `__tests__/` directory next to the source file, following the existing convention (e.g. `src/components/__tests__/PlayerCard.test.jsx`).

---

## Rules (STRICT -- do not violate)

1. **One issue per run.** You may ONLY work on the bead listed above (`{{BEAD_ID}}`). Do not fix unrelated bugs, refactor unrelated code, or add features not described in this issue.

2. **Follow project conventions.** Read and obey `.ralph/AGENT.md` before writing any code. It contains folder structure, naming conventions, styling rules, and architectural constraints.

3. **Commit with bead ID.** Every git commit message MUST include the bead ID in parentheses at the end:

   ```
   Add watchlist search filter ({{BEAD_ID}})
   ```

4. **Do not touch unrelated files.** If you discover a bug or improvement opportunity outside the scope of this bead, note it but do NOT fix it. Leave a comment in the commit message or bead notes instead.

5. **Test your changes.** Follow the Red-Green-Refactor workflow above. Run `npm run test:run` to execute unit tests and `npm run lint` to check for lint errors before finishing.

6. **Keep changes minimal.** Prefer the smallest diff that satisfies the acceptance criteria. Do not over-engineer.

7. **No new dependencies** without explicit mention in the bead description. If the issue requires a new npm package, it will say so.

8. **Update barrel exports.** If you create a new component in `src/components/`, add it to `src/components/index.js`.

9. **Do not modify scenario data** (`src/data/*.json`) unless the bead explicitly requires it.

10. **When done**, report what you changed and confirm all acceptance criteria are met.

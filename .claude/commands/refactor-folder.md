---
description: Step-by-step folder refactor review — dead code, JSDoc, correctness — with confirm-before-edit gating
argument-hint: <folder-path> (e.g. src/common/guards)
---

You are running a **step-by-step folder refactor review** on: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask the user which folder to review before doing anything else.

## Governing rule (do not break this)

Work **one step at a time**. For every change you intend to make, **report it and get the
user's confirmation first** — never edit, delete, or move files on your own. Present findings,
propose fixes, wait for "yes", then act. Match the existing code style and the project's
conventions (CLAUDE.md), don't "fix" intentional typos in identifiers/messages.

## Step 0 — Discover

- Glob every file in the target folder.
- Read all of them before forming any opinion.

## Step 1 — Dead code check

- For each exported symbol (function / class / const / type), Grep across the **whole project**
  (not just `src` — include `tests/` and `scripts/`), excluding the symbol's own definition file.
- Classify each as: **fully unused** / **partially unused** (e.g. a key + interface are consumed
  but the decorator/function itself is never applied) / **in use**.
- Report results as a table. Do NOT delete anything — propose deletions and wait for approval.

## Step 2 — Documentation (JSDoc) check

- Judge each file against the project's JSDoc law: one-line summary, `@param`, `@returns`,
  `@throws` (one per error raised — the most important part), `@example` when usage isn't obvious.
- List gaps precisely (file with no JSDoc, incomplete `@example`, missing `@throws`).
- Propose the fixes, then apply only after confirmation.

## Step 3 — Correctness check

- Also read the **dependencies** (utils, types, guards, services the folder imports) so you judge
  real behavior, not assumptions.
- Look for runtime bugs and edge cases: empty input, null/undefined, missing headers, etc.
- Check **type correctness** too (e.g. misused generics). When unsure of a library's signature,
  read its real `.d.ts` under `node_modules/.../*.d.ts` instead of guessing.
- Report findings; apply fixes only after confirmation.

## Final — Validate

- Run `eslint` on the folder, and `tsc --noEmit` if the change could affect types.
- **Separate** pre-existing/unrelated errors from any caused by your edits, and say so clearly.
- Give a final summary and suggest the next folder to refactor.

## Optional axes (offer, don't assume)

Before or after the core steps, ask whether the user also wants: **tests**, **DRY/duplication**,
**barrel/index export**, or **naming consistency**. Skip any the user declines.

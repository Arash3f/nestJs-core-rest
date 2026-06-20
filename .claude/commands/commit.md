---
description: Inspect staged git changes and suggest a cz-customizable (gitmoji) commit message for this project
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

You are generating a commit message for THIS repository, which uses **cz-customizable**
(`.cz-config.js`) validated by **commitlint-config-gitmoji**. Follow its rules exactly.

## 1. Inspect the staged changes

Run these and read the output:

- `git status --short` — see what is staged (lines starting with a change letter in the **first** column) vs. only modified in the working tree.
- `git diff --cached --stat` — staged files overview.
- `git diff --cached` — the actual staged diff. Base your message on THIS, not on unstaged work.
- `git log --oneline -10` — match the style of recent messages.

If **nothing is staged**, stop and tell the user to `git add` first (do not suggest a message from unstaged changes). List what's unstaged so they can choose.

## 2. Commit message format

Produce a **subject line** plus a **longer description (body)** in this exact shape
(matches `.cz-config.js`), with one blank line between them:

```
<:emoji: type>(global): <subject>

<body>
```

### Subject line
- **Scope is always `global`** — custom scopes are disabled in the config.
- **≤ 100 characters**, imperative mood, lower-case start, no trailing period.
- Pick the type whose meaning best fits the staged diff:

| value (use verbatim)   | when to use                                            |
| ---------------------- | ------------------------------------------------------ |
| `:sparkles: feat`      | adding a new feature                                   |
| `:wrench: fix`         | fixing a bug                                           |
| `:memo: docs`          | add or update documentation (incl. JSDoc, CLAUDE.md)   |
| `:hammer: ref`         | refactoring code (no behavior change)                  |
| `:fire: perf`          | improves performance                                   |
| `:package: pack`       | add/update compiled files or packages (deps)           |
| `:construction: wip`   | work in progress                                       |
| `:poop: Bcode`         | intentionally bad code to improve later                |
| `:bookmark: version`   | new release or version                                 |
| `:rocket: deploy`      | ready to deploy                                        |

Example subject (from this repo's history): `:sparkles: feat(global): add links module`

### Body (longer description)
- Separated from the subject by exactly **one blank line**.
- Explain **what** changed and **why** — not how. Wrap lines at ~72 characters.
- Use `-` bullet points when several distinct changes are staged; one short paragraph
  is fine for a single focused change.
- Reference the affected area(s) (module, file group) so the history is searchable.
- Keep it truthful to the diff — do not invent motivation or changes that aren't staged.
- Skip the body only for genuinely trivial commits (e.g. a typo fix); otherwise always include it.

Full example:

```
:hammer: ref(global): align error status codes with HTTP semantics

- map every *NotFound descriptor to 404 and duplicate/conflict to 409
- auth errors now return 401 (unauthenticated) / 403 (forbidden)
- keep 400 only for genuine bad input (invalid sort field, contract type)

feature-permissions module left unchanged, pending its own pass.
```

## 3. Output

1. Show the full suggested commit message (subject **and** body) in one fenced code block.
2. Give a one-line rationale (which type and why, based on the diff).
3. If the staged diff spans clearly different concerns (e.g. a feature **and** unrelated docs),
   say so and offer 2–3 alternative messages or suggest splitting the commit.
4. Then ask whether to commit. Only run `git commit` if the user confirms — and when you do,
   pass the subject and body as **separate `-m` flags**: `git commit -m "<subject>" -m "<body>"`
   (repeat `-m` per body paragraph/bullet block) so the blank-line separation is preserved.

Do NOT stage files, amend, push, or commit without explicit confirmation.

---
name: git-commit
description: |
  Generate well-structured git commit messages following the Angular Commit Message Convention. Use this skill whenever the user asks to write a commit message, format a git commit, describe code changes as a commit, or wants help with version control messages. Trigger on phrases like "幫我寫 commit", "git commit message", "commit 訊息", "寫提交紀錄", "commit 這些變更", or any request involving summarizing code changes into a commit. Also trigger when the user shares a diff, list of changed files, or describes what they've done and wants a commit message for it.
---

# Git Commit Skill (Angular Style)

Generate clear, consistent git commit messages following the [Angular Commit Message Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#-commit-message-format).

---

## Commit Message Format

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Rules
- **Header line**: max 72 characters
- **Type**: lowercase, from the allowed list below
- **Scope**: optional, lowercase, noun describing the section of the codebase (e.g. `auth`, `api`, `ui`, `parser`)
- **Summary**: imperative mood, present tense, no capital first letter, no period at end
- **Body**: explain *what* and *why*, not *how*; wrap at 100 chars; separated from header by a blank line
- **Footer**: reference issues or breaking changes; separated from body by a blank line

---

## Allowed Types

| Type       | When to use |
|------------|-------------|
| `feat`     | A new feature |
| `fix`      | A bug fix |
| `docs`     | Documentation only changes |
| `style`    | Formatting, missing semi-colons, etc (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Code change that improves performance |
| `test`     | Adding or correcting tests |
| `build`    | Changes to build system or external dependencies (e.g. npm, webpack) |
| `ci`       | Changes to CI configuration files and scripts |
| `chore`    | Other changes that don't modify src or test files |
| `revert`   | Reverts a previous commit |

---

## Breaking Changes

If the commit introduces a breaking change:
1. Add `!` after type/scope in the header: `feat(api)!: remove deprecated endpoint`
2. Add a footer: `BREAKING CHANGE: <description of what changed and migration path>`

---

## Invocation Modes

Three ways to invoke this skill. **Always generate a commit immediately — never ask about language or preference.**

Language is determined solely by the presence of `@zh`. No asking, no confirming, no suggesting alternatives.

### 1. `/git-commit`
Run the following steps automatically in order:
1. Execute `git status` to check for any modified or untracked files
2. Execute `git add .` to stage all changes
3. Execute `git diff --staged` to read the full staged diff
4. Analyze the diff to determine type, scope, and summary
5. Execute `git commit -m "<message>"` directly
6. Confirm to the user with the committed message and resulting commit hash

If `git status` shows a clean working tree (nothing to commit), inform the user and stop.

### 2. `git-commit {content}`
User provides a description or additional context. Run `git add .` first, then generate an English commit message based on both the staged diff and the provided content, then execute `git commit -m "<message>"` immediately.

### 3. `git-commit :zh`
Same as mode 2 but output in Traditional Chinese. `@zh` applies session-wide — all subsequent commits in this conversation will also be in Chinese without needing to repeat the flag.

### 4. `git-commit :en`
Switch back to English mode for this and all subsequent commits in the session, overriding any previously set `@zh` flag.

### 5. `git-commit :ask`
Run `git add .` and `git diff --staged` first, then ask the user up to 3 clarifying questions about what is genuinely unclear — skip anything already inferable from the diff. After gathering answers, execute `git commit -m "<message>"` without further prompting.

---

## Decision Process

After receiving input, determine the following internally — **never ask the user to confirm any of these:**

### 1. Determine the type
- New capability → `feat`
- Something broken now works → `fix`
- Only comments or docs changed → `docs`
- Formatting or whitespace only → `style`
- Restructured without behavior change → `refactor`
- Tests added or fixed → `test`
- Build or CI config changed → `build` / `ci`
- Anything else → `chore`

### 2. Determine the scope
Derive from the affected module, directory, or component name. Keep it short and lowercase. Omit if it cannot be determined.

### 3. Write the summary
- English: imperative mood, lowercase first letter, no period, max 72 characters
- Chinese (`@zh`): start with a verb, no period, max 30 Chinese characters

### 4. Decide whether to include a body
Include a body if: the change is non-obvious, there is important context about *why* the change was made, or multiple areas were affected.

### 5. Decide whether to include a footer
- Issue reference → `Closes #N` / `Fixes #N`
- Breaking change → `BREAKING CHANGE: <explanation>`

---

## Output Format

Always present the commit message in a code block. If there are multiple reasonable interpretations of the change, offer 2-3 variants with a brief explanation of when each is appropriate.

### English examples

#### Simple fix
```
fix(button): correct disabled state not applying on re-render
```

#### Feature with body and issue reference
```
feat(upload): support drag-and-drop file upload

Allow users to drag files directly onto the upload area
instead of using the file picker dialog. Supports multiple
files and validates file types client-side before upload.

Closes #88
```

#### Breaking change
```
feat(api)!: remove v1 authentication endpoints

The legacy /api/v1/auth/* endpoints have been removed.
Clients must migrate to /api/v2/auth/* which uses JWT
instead of session cookies.

BREAKING CHANGE: /api/v1/auth/login and /api/v1/auth/logout
are no longer available. See MIGRATION.md for upgrade steps.
```

#### Refactor with scope
```
refactor(parser): extract token validation into separate module

Improves testability and makes the validation logic reusable
across different parser contexts.
```

#### Chore
```
chore(deps): bump axios from 1.4.0 to 1.6.0
```

---

### Chinese examples (used when `@zh` flag is set)

The `type` and `scope` always remain in English. Only the summary, body, and footer are written in Chinese.

#### Simple fix
```
fix(login): 修正提交按鈕點擊無反應的問題
```

#### Feature with body and issue reference
```
feat(upload): 新增拖曳上傳檔案功能

使用者可直接將檔案拖曳至上傳區域，
不再需要透過檔案選擇器操作。
支援多檔案同時上傳，並在送出前進行格式驗證。

Closes #88
```

#### Breaking change
```
feat(api)!: 移除 v1 身份驗證端點

舊版 /api/v1/auth/* 端點已全數移除。
請改用 /api/v2/auth/*，改採 JWT 取代 Session Cookie。

BREAKING CHANGE: /api/v1/auth/login 與 /api/v1/auth/logout
已不再可用，升級步驟請參閱 MIGRATION.md。
```

---
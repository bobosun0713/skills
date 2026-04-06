---
name: vscode-extension-dev
description: >
  Expert guidance for developing VS Code Extensions using TypeScript. Use this skill whenever
  the user wants to build, debug, or improve a VS Code extension — including creating commands,
  tree views, WebViews, language providers, or any vscode.* API usage. Trigger on phrases like
  "VS Code extension", "vscode plugin", "extension.ts", "contributes in package.json",
  "WebView panel", "vscode.window", "activation events", or any reference to the VS Code
  Extension API. Also trigger when the user shows code importing from 'vscode' or asks about
  extension publishing, testing with @vscode/test-electron, or debugging launch.json for
  extensions. Don't wait for the user to ask explicitly — if the context suggests VS Code
  extension work, use this skill proactively.
---

# VS Code Extension Development Skill

## Quick Reference

| Topic                                       | Reference File                   |
| ------------------------------------------- | -------------------------------- |
| TypeScript best practices & project setup   | `references/typescript-setup.md` |
| VS Code API namespaces cheatsheet           | `references/vscode-api.md`       |
| WebView security & messaging                | `references/webview-security.md` |
| Unit testing (commands, providers, WebView) | `references/unit-testing.md`     |

**Always read the relevant reference file(s) before writing extension code.**

---

## Core Workflow

### 1. Understand the Goal

Before writing any code, confirm:

- What VS Code namespace(s) are involved? (`window`, `workspace`, `commands`, `languages`, etc.)
- Does this feature need a WebView, or can it use the built-in UI? (Prefer built-in UI when possible.)
- What is the activation event? (Lazy activation = better performance.)

### 2. Project Structure (Canonical Layout)

```
my-extension/
├── src/
│   ├── extension.ts          # activate() / deactivate() entry point
│   ├── commands/             # One file per command group
│   ├── providers/            # TreeDataProvider, CodeLensProvider, etc.
│   ├── webview/
│   │   ├── panel.ts          # WebviewPanel lifecycle manager
│   │   └── media/            # HTML / CSS / JS for the WebView
│   └── utils/
├── package.json              # Extension manifest (contributes, activationEvents)
├── tsconfig.json
└── .vscode/
    └── launch.json           # Extension Host debug config
```

### 3. Activation Events — Always Minimize Scope

```json
// package.json
"activationEvents": [
  "onCommand:myExt.doThing",     // ✅ Lazy
  "onLanguage:python",           // ✅ Lazy
  "onView:myTreeView"            // ✅ Lazy
  // ❌ Avoid: "*" (activates on every startup)
]
```

### 4. Disposable Management — The Golden Rule

Every subscription/listener **must** be pushed to `context.subscriptions`:

```typescript
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("myExt.hello", () => {
    vscode.window.showInformationMessage("Hello!");
  });
  context.subscriptions.push(disposable); // ✅ Auto-cleaned on deactivate
}
```

### 5. Error Handling Pattern

```typescript
async function myCommand(): Promise<void> {
  try {
    await doAsyncWork();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`MyExt: ${msg}`);
    // Log to output channel for diagnostics:
    outputChannel.appendLine(`[ERROR] ${msg}`);
  }
}
```

---

## Decision Tree: Which API to Use?

```
Need UI?
├── Simple text input      → vscode.window.showInputBox()
├── Pick from list         → vscode.window.showQuickPick()
├── File picker            → vscode.window.showOpenDialog()
├── Progress indicator     → vscode.window.withProgress()
├── Structured tree data   → TreeDataProvider + registerTreeDataProvider()
├── Rich HTML content      → WebviewPanel (⚠ read webview-security.md first)
└── Status bar text        → vscode.window.createStatusBarItem()
```

---

## WebView — MANDATORY Security Checklist

Before writing any WebView code, read `references/webview-security.md`.

The non-negotiable rules (summary):

1. **Always set `localResourceRoots`** — never leave it as default `undefined`.
2. **Default `retainContextWhenHidden: false`** — only set to `true` when state persistence is explicitly required.
3. **Generate a fresh nonce per render** — apply it to every `<script>` and `<style>` tag.
4. **Set strict CSP** on every HTML response.
5. **Validate every message** from the WebView in the extension host — never trust the renderer.
6. **Never pass raw user data** into `webview.html` — always sanitize/escape first.

---

## TypeScript Strictness Requirements

Read `references/typescript-setup.md` for the full tsconfig. Non-negotiable settings:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true
}
```

Never use `any` — use `unknown` and narrow with type guards.

---

## Common Pitfalls

| Pitfall                                              | Correct Pattern                                  |
| ---------------------------------------------------- | ------------------------------------------------ |
| `vscode.workspace.rootPath` (deprecated)             | `vscode.workspace.workspaceFolders?.[0].uri`     |
| Hardcoded file paths with `path.join` in WebView src | `webview.asWebviewUri(vscode.Uri.joinPath(...))` |
| Forgetting to dispose event listeners                | Push all to `context.subscriptions`              |
| `postMessage` without origin/nonce validation        | Always validate in both directions               |
| Blocking the extension host with sync I/O            | Use `async/await` + `vscode.workspace.fs`        |
| Direct `fs` module in WebView scripts                | WebView has no Node.js — use message passing     |

---

## Testing

```bash
# Unit tests (Vitest — preferred)
npm run test:unit

# Integration tests (requires VS Code window)
npm run test:integration
```

Test file pattern: `src/test/unit/**/*.test.ts`

---

## Publishing Checklist

- [ ] `publisher` field set in `package.json`
- [ ] `engines.vscode` specifies minimum version
- [ ] `README.md` describes all features
- [ ] `CHANGELOG.md` exists
- [ ] `icon.png` 128×128px
- [ ] Run `vsce package` and inspect the `.vsix` before publishing
- [ ] `vsce publish` (requires PAT from marketplace.visualstudio.com)

# VS Code Extension Unit Testing Guide

## Framework Strategy

| Framework               | When to use                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **Vitest** (preferred)  | Pure logic, pure functions, providers, message handlers — fast, no VS Code runtime needed      |
| `@vscode/test-electron` | Integration tests that must call real `vscode.*` APIs (command execution, document open, etc.) |

**Rule of thumb**: if the logic can be isolated → **Vitest**; if it genuinely requires a live VS Code window → `@vscode/test-electron`.
The goal is to have the vast majority of tests running under Vitest, with integration tests covering only essential boundaries.

---

## Environment Setup

### Vitest (preferred — unit tests)

```bash
npm install --save-dev vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true, // no need to import describe/it/expect manually
    environment: "node",
    include: ["src/test/unit/**/*.test.ts"],
    alias: {
      vscode: path.resolve(__dirname, "src/test/__mocks__/vscode.ts"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/test/**", "src/extension.ts"],
    },
  },
});
```

```json
// package.json — add these scripts
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "node ./out/test/runTest.js"
  }
}
```

### @vscode/test-electron (integration tests — use only when necessary)

```bash
npm install --save-dev @vscode/test-electron @types/mocha mocha
```

```typescript
// src/test/runTest.ts
import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  const extensionTestsPath = path.resolve(__dirname, "./suite/index");
  await runTests({ extensionDevelopmentPath, extensionTestsPath });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## Mocking the vscode Module (for Vitest)

Vitest runs in a plain Node.js environment with no VS Code runtime. Provide a mock so that
`import * as vscode from 'vscode'` resolves correctly.

```typescript
// src/test/__mocks__/vscode.ts
import { vi } from "vitest";

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showInputBox: vi.fn(),
  showQuickPick: vi.fn(),
  createOutputChannel: vi.fn(() => ({
    appendLine: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
  })),
  createStatusBarItem: vi.fn(() => ({
    text: "",
    show: vi.fn(),
    dispose: vi.fn(),
  })),
  activeTextEditor: undefined,
};

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn(),
    update: vi.fn(),
  })),
  workspaceFolders: undefined,
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    delete: vi.fn(),
  },
  onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
};

export const commands = {
  registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
  executeCommand: vi.fn(),
  getCommands: vi.fn(async () => [] as string[]),
};

export const Uri = {
  file: vi.fn((p: string) => ({ fsPath: p, toString: () => p })),
  joinPath: vi.fn((...args: unknown[]) => ({ fsPath: String(args.join("/")) })),
  parse: vi.fn((s: string) => ({ toString: () => s })),
};

export const EventEmitter = vi.fn(() => ({
  event: vi.fn(),
  fire: vi.fn(),
  dispose: vi.fn(),
}));

export const TreeItem = vi.fn();
export const TreeItemCollapsibleState = { None: 0, Collapsed: 1, Expanded: 2 };
export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3,
};
export const Range = vi.fn(
  (sl: number, sc: number, el: number, ec: number) => ({ sl, sc, el, ec }),
);
export const Position = vi.fn((line: number, char: number) => ({
  line,
  character: char,
}));
export const Diagnostic = vi.fn();

export const languages = {
  createDiagnosticCollection: vi.fn(() => ({
    set: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
  })),
};
```

The `alias` field in `vitest.config.ts` (shown in the setup section above) wires this mock to every `import ... from 'vscode'` in your test files.

---

## Test Template: Command

```typescript
// src/test/unit/commands/helloWorld.test.ts
import { window } from "vscode";
import { helloWorldHandler } from "../../../commands/helloWorld";

describe("helloWorldHandler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call showInformationMessage with the correct text", async () => {
    await helloWorldHandler();

    expect(window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("Hello"),
    );
  });

  it("should show an error message when the handler throws", async () => {
    vi.spyOn(window, "showErrorMessage");

    // In a real command the catch block calls showErrorMessage;
    // this demonstrates the spy pattern
    const badHandler = async () => {
      throw new Error("something went wrong");
    };
    try {
      await badHandler();
    } catch {
      /* ignored */
    }

    expect(window.showErrorMessage).not.toHaveBeenCalled();
  });
});
```

---

## Test Template: TreeDataProvider

```typescript
// src/test/unit/providers/myTreeProvider.test.ts
import { TreeItemCollapsibleState } from "vscode";
import { MyTreeProvider } from "../../../providers/myTreeProvider";

describe("MyTreeProvider", () => {
  let provider: MyTreeProvider;

  beforeEach(() => {
    provider = new MyTreeProvider();
    vi.clearAllMocks();
  });

  it("should return all top-level nodes at the root", () => {
    const children = provider.getChildren(undefined);

    expect(children.length).toBeGreaterThan(0);
  });

  it("should return None collapsible state for leaf nodes", () => {
    const leafNode = { label: "Child", children: undefined };

    const item = provider.getTreeItem(leafNode);

    expect(item.collapsibleState).toBe(TreeItemCollapsibleState.None);
  });

  it("should return Collapsed state for nodes with children", () => {
    const parentNode = { label: "Parent", children: [{ label: "Child" }] };

    const item = provider.getTreeItem(parentNode);

    expect(item.collapsibleState).toBe(TreeItemCollapsibleState.Collapsed);
  });

  it("should fire onDidChangeTreeData when refresh is called", () => {
    const listener = vi.fn();
    provider.onDidChangeTreeData(listener);

    provider.refresh();

    expect(listener).toHaveBeenCalledWith(undefined);
  });
});
```

---

## Test Template: WebView Message Handler

```typescript
// src/test/unit/webview/messageHandler.test.ts
import { handleWebviewMessage } from "../../../webview/messageHandler";

// Extract message-handling logic from WebviewPanel into a pure function to enable testing.
// e.g. export function handleWebviewMessage(raw: unknown, callbacks: Callbacks): void

describe("handleWebviewMessage", () => {
  let onData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onData = vi.fn();
    vi.clearAllMocks();
  });

  it("should handle a valid requestData message", () => {
    const msg = { type: "requestData", id: "abc-123" };

    handleWebviewMessage(msg, { onData });

    expect(onData).toHaveBeenCalledWith("abc-123");
  });

  it("should silently ignore messages with an unknown type", () => {
    const msg = { type: "unknown", data: "???" };

    expect(() => handleWebviewMessage(msg, { onData })).not.toThrow();
    expect(onData).not.toHaveBeenCalled();
  });

  it("should reject non-object inputs (null, string, number)", () => {
    handleWebviewMessage(null, { onData });
    handleWebviewMessage("hack", { onData });
    handleWebviewMessage(42, { onData });

    expect(onData).not.toHaveBeenCalled();
  });

  it("should reject objects missing required fields", () => {
    handleWebviewMessage({ type: "requestData" /* missing id */ }, { onData });

    expect(onData).not.toHaveBeenCalled();
  });
});
```

---

## Test Template: Configuration Access

```typescript
// src/test/unit/utils/config.test.ts
import { workspace } from "vscode";
import { getConfig } from "../../../utils/config";

describe("getConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workspace.getConfiguration).mockReturnValue({
      get: vi.fn((key: string) => (key === "enable" ? true : undefined)),
      update: vi.fn(),
      has: vi.fn(),
      inspect: vi.fn(),
    } as any);
  });

  it("should return the configured value", () => {
    const result = getConfig<boolean>("enable", false);
    expect(result).toBe(true);
  });

  it("should return the fallback when the setting does not exist", () => {
    const result = getConfig<string>("nonExistent", "fallback");
    expect(result).toBe("fallback");
  });
});
```

---

## Test Template: Async File Operations

```typescript
// src/test/unit/utils/fileUtils.test.ts
import { workspace } from "vscode";
import { readExtensionFile } from "../../../utils/fileUtils";

describe("readExtensionFile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return the file content decoded as UTF-8", async () => {
    const content = "Hello, World!";
    vi.mocked(workspace.fs.readFile).mockResolvedValue(
      Buffer.from(content, "utf-8") as unknown as Uint8Array,
    );

    const result = await readExtensionFile({ fsPath: "/fake/path.txt" } as any);

    expect(result).toBe(content);
  });

  it("should throw when the read fails", async () => {
    vi.mocked(workspace.fs.readFile).mockRejectedValue(
      new Error("File not found"),
    );

    await expect(
      readExtensionFile({ fsPath: "/no/file" } as any),
    ).rejects.toThrow("File not found");
  });
});
```

---

## Designing for Testability

Decoupling business logic from VS Code API calls is the key to making Vitest tests easy to write:

```typescript
// ❌ Hard to test: logic is tightly coupled to vscode.window
export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("myExt.process", async () => {
      const input = await vscode.window.showInputBox({ prompt: "Enter data" });
      if (!input) {
        return;
      }
      const result = input.trim().toUpperCase(); // business logic buried in the UI handler
      vscode.window.showInformationMessage(result);
    }),
  );
}

// ✅ Easy to test: extract business logic into a pure function
export function processInput(raw: string): string {
  return raw.trim().toUpperCase();
}

// Vitest only needs to test the pure function — no mock required:
it("should trim whitespace and convert to uppercase", () => {
  expect(processInput("  hello  ")).toBe("HELLO");
  expect(processInput("world")).toBe("WORLD");
});
```

---

## Common Pitfalls

| Problem                         | Cause                                      | Fix                                                                         |
| ------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| `Cannot find module 'vscode'`   | No VS Code runtime in Vitest               | Add `alias: { vscode: '.../__mocks__/vscode.ts' }` to `vitest.config.ts`    |
| Tests polluting each other      | Mock state leaks between tests             | Call `vi.clearAllMocks()` in every `beforeEach`                             |
| `vi.mocked(...)` type error     | `globals: true` not set, or missing import | Add `globals: true` to `vitest.config.ts`, or `import { vi } from 'vitest'` |
| Cannot test WebView internal JS | Renderer is isolated from Node.js          | Extract WebView JS logic into pure functions and test those with Vitest     |
| `activate()` is too fat to test | All logic crammed into the entry point     | Extract command handlers into standalone functions and import them          |
| Integration tests won't run     | Missing VS Code window environment         | Ensure integration tests run via `@vscode/test-electron`, not Vitest        |

---

## Scripts

```bash
# Unit tests (Vitest — use this daily)
npm run test:unit

# Watch mode (run continuously while developing)
npm run test:unit:watch

# With coverage report
npm run test:unit:coverage

# Integration tests (requires a VS Code window — run before releasing)
npm run test:integration
```

### Coverage Targets

| Layer                                | Tool                  | Target                 |
| ------------------------------------ | --------------------- | ---------------------- |
| Pure business logic (utils, helpers) | Vitest                | ≥ 90%                  |
| WebView message handlers             | Vitest                | ≥ 80%                  |
| Providers (Tree, CodeLens)           | Vitest                | ≥ 70%                  |
| Command handlers                     | Vitest                | ≥ 80%                  |
| activate / deactivate boundaries     | @vscode/test-electron | Integration tests only |

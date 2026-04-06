# TypeScript Setup & Best Practices for VS Code Extensions

## Canonical tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./out",
    "rootDir": "./src",
    "sourceMap": true,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", ".vscode-test"]
}
```

## Canonical package.json (Extension Manifest)

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "0.0.1",
  "publisher": "your-publisher-id",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "myExt.helloWorld",
        "title": "Hello World",
        "category": "MyExt"
      }
    ],
    "configuration": {
      "title": "My Extension",
      "properties": {
        "myExt.enable": {
          "type": "boolean",
          "default": true,
          "description": "Enable My Extension"
        }
      }
    }
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "node ./out/test/runTest.js",
    "package": "vsce package",
    "publish": "vsce publish"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.x",
    "@typescript-eslint/eslint-plugin": "^6.x",
    "@typescript-eslint/parser": "^6.x",
    "@vscode/test-electron": "^2.x",
    "@vitest/coverage-v8": "^1.x",
    "vitest": "^1.x",
    "typescript": "^5.x",
    "eslint": "^8.x",
    "@vscode/vsce": "^2.x"
  }
}
```

## Canonical extension.ts Entry Point

```typescript
import * as vscode from "vscode";

// OutputChannel is a singleton — create once, reuse everywhere
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("MyExt");
  context.subscriptions.push(outputChannel);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("myExt.helloWorld", () => {
      vscode.window.showInformationMessage("Hello from MyExt!");
    }),
  );

  outputChannel.appendLine("MyExt activated.");
}

export function deactivate(): void {
  // Cleanup runs automatically via context.subscriptions.
  // Only add explicit logic here for non-disposable resources.
}
```

## Type-Safe Configuration Access

```typescript
function getConfig<T>(key: string, fallback: T): T {
  const config = vscode.workspace.getConfiguration("myExt");
  return config.get<T>(key) ?? fallback;
}

// Usage:
const isEnabled = getConfig<boolean>("enable", true);
```

## Type Guards — Never Use `any`

```typescript
// ❌ Bad
function handleMessage(msg: any) { ... }

// ✅ Good: define a discriminated union
interface ReadyMessage  { type: 'ready' }
interface DataMessage   { type: 'data'; payload: string }
type WebviewMessage = ReadyMessage | DataMessage;

function isWebviewMessage(value: unknown): value is WebviewMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as Record<string, unknown>).type !== undefined
  );
}
```

## Async Patterns

```typescript
// Use vscode.workspace.fs instead of the raw fs module
async function readFile(uri: vscode.Uri): Promise<string> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return Buffer.from(bytes).toString("utf-8");
}

async function writeFile(uri: vscode.Uri, content: string): Promise<void> {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf-8"));
}
```

## .vscode/launch.json (Extension Development Host)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
      ],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

## ESLint Configuration (.eslintrc.json)

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "no-console": "warn"
  }
}
```

## Test File Pattern (Vitest)

```typescript
// src/test/unit/extension.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { window } from "vscode";
import { helloWorldHandler } from "../../commands/helloWorld";

describe("helloWorldHandler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call showInformationMessage with correct text", async () => {
    await helloWorldHandler();
    expect(window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining("Hello"),
    );
  });
});
```

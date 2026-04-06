# VS Code API Namespaces Cheatsheet

## `vscode.window` — UI Interactions

```typescript
// Messages
vscode.window.showInformationMessage('msg', 'Option A', 'Option B');
vscode.window.showWarningMessage('warn');
vscode.window.showErrorMessage('err');

// Text input
const value = await vscode.window.showInputBox({
  prompt: 'Enter a value',
  placeHolder: 'e.g. foo',
  validateInput: (v) => v.length < 3 ? 'Too short' : undefined,
});

// Quick pick
const pick = await vscode.window.showQuickPick(['A', 'B', 'C'], {
  placeHolder: 'Choose one',
  canPickMany: false,
});

// File picker
const uris = await vscode.window.showOpenDialog({
  canSelectMany: false,
  filters: { TypeScript: ['ts'] },
});

// Progress indicator
await vscode.window.withProgress(
  { location: vscode.ProgressLocation.Notification, title: 'Loading...', cancellable: true },
  async (progress, token) => {
    progress.report({ increment: 50, message: 'Halfway there' });
    // token.isCancellationRequested to check for cancellation
  }
);

// Output channel (singleton pattern)
const ch = vscode.window.createOutputChannel('MyExt');
ch.appendLine('log message');
ch.show(true);  // true = preserve focus

// Status bar item
const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
item.text = '$(check) Ready';  // $(icon-name) for codicons
item.tooltip = 'MyExt status';
item.command = 'myExt.doThing';
item.show();

// Active text editor
const editor = vscode.window.activeTextEditor;
if (editor) {
  const selection = editor.selection;
  const text = editor.document.getText(selection);
}

// Tree view
vscode.window.createTreeView('myViewId', {
  treeDataProvider: new MyTreeProvider(),
  showCollapseAll: true,
});

// WebView panel — see webview-security.md for the full pattern
const panel = vscode.window.createWebviewPanel(
  'myView', 'My View',
  vscode.ViewColumn.One,
  { enableScripts: true, localResourceRoots: [...] }
);
```

---

## `vscode.workspace` — File System & Settings

```typescript
// Workspace folders (replaces deprecated rootPath)
const folders = vscode.workspace.workspaceFolders;
const root = folders?.[0].uri;

// Read/write files (prefer over raw fs module)
const bytes = await vscode.workspace.fs.readFile(uri);
await vscode.workspace.fs.writeFile(
  uri,
  Uint8Array.from(Buffer.from("content")),
);
await vscode.workspace.fs.delete(uri, { recursive: true });

// Find files (glob)
const files = await vscode.workspace.findFiles("**/*.ts", "**/node_modules/**");

// Configuration
const cfg = vscode.workspace.getConfiguration("myExt");
const val = cfg.get<string>("setting", "default");
await cfg.update("setting", "newVal", vscode.ConfigurationTarget.Global);

// Watch files
const watcher = vscode.workspace.createFileSystemWatcher("**/*.json");
watcher.onDidChange((uri) => console.log("changed", uri.fsPath));
context.subscriptions.push(watcher);

// Open text document
const doc = await vscode.workspace.openTextDocument(uri);
const text = doc.getText();

// Apply edits
const edit = new vscode.WorkspaceEdit();
edit.insert(uri, new vscode.Position(0, 0), "// header\n");
await vscode.workspace.applyEdit(edit);

// Events
context.subscriptions.push(
  vscode.workspace.onDidSaveTextDocument((doc) => {
    /* ... */
  }),
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("myExt.setting")) {
      /* reload */
    }
  }),
);
```

---

## `vscode.commands` — Command Registry

```typescript
// Register
context.subscriptions.push(
  vscode.commands.registerCommand("myExt.cmd", async (uri?: vscode.Uri) => {
    // uri is passed when invoked from the explorer context menu
  }),
);

// Text editor command (receives TextEditor)
context.subscriptions.push(
  vscode.commands.registerTextEditorCommand("myExt.format", (editor, edit) => {
    edit.insert(editor.selection.start, "/* inserted */");
  }),
);

// Execute a built-in or another extension's command
await vscode.commands.executeCommand("editor.action.formatDocument");
await vscode.commands.executeCommand("vscode.open", uri);

// List all commands (for debugging)
const all = await vscode.commands.getCommands(true);
```

---

## `vscode.languages` — Language Features

```typescript
// Diagnostics (lint errors/warnings)
const collection = vscode.languages.createDiagnosticCollection("myExt");
context.subscriptions.push(collection);

const diagnostics: vscode.Diagnostic[] = [
  new vscode.Diagnostic(
    new vscode.Range(0, 0, 0, 5),
    "Something is wrong here",
    vscode.DiagnosticSeverity.Error,
  ),
];
collection.set(document.uri, diagnostics);

// Hover provider
context.subscriptions.push(
  vscode.languages.registerHoverProvider("typescript", {
    provideHover(doc, position) {
      const range = doc.getWordRangeAtPosition(position);
      const word = doc.getText(range);
      return new vscode.Hover(`**${word}** — my docs here`);
    },
  }),
);

// Code lens provider
context.subscriptions.push(
  vscode.languages.registerCodeLensProvider("typescript", {
    provideCodeLenses(doc): vscode.CodeLens[] {
      const range = new vscode.Range(0, 0, 0, 0);
      return [
        new vscode.CodeLens(range, {
          title: "Run Tests",
          command: "myExt.runTests",
          arguments: [doc.uri],
        }),
      ];
    },
  }),
);

// Completion provider
context.subscriptions.push(
  vscode.languages.registerCompletionItemProvider(
    "typescript",
    {
      provideCompletionItems(doc, position) {
        const item = new vscode.CompletionItem(
          "mySnippet",
          vscode.CompletionItemKind.Snippet,
        );
        item.insertText = new vscode.SnippetString(
          "const ${1:name} = ${2:value};",
        );
        return [item];
      },
    },
    ".",
    ":", // trigger characters
  ),
);
```

---

## `vscode.env` — Environment

```typescript
vscode.env.clipboard.writeText("copied!");
const text = await vscode.env.clipboard.readText();

// Open URL in browser
await vscode.env.openExternal(vscode.Uri.parse("https://example.com"));

// Machine/session identifiers (no PII)
console.log(vscode.env.machineId); // stable per machine
console.log(vscode.env.sessionId); // changes per session
console.log(vscode.env.uiKind); // Desktop vs Web
```

---

## `vscode.ExtensionContext` — Persistent Storage

```typescript
// Secrets (encrypted, async)
await context.secrets.store("apiKey", "secret-value");
const key = await context.secrets.get("apiKey");
await context.secrets.delete("apiKey");

// Global state (JSON-serializable, shared across workspaces)
await context.globalState.update("lastRun", Date.now());
const last = context.globalState.get<number>("lastRun", 0);

// Workspace state (per-workspace)
await context.workspaceState.update("setting", "value");

// Storage URIs (write files here, not to arbitrary paths)
const logUri = vscode.Uri.joinPath(context.globalStorageUri, "log.txt");
```

---

## TreeDataProvider Pattern (Full Example)

```typescript
interface TreeNode {
  label: string;
  children?: TreeNode[];
}

class MyTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeNode | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private data: TreeNode[] = [
    { label: "Parent", children: [{ label: "Child A" }, { label: "Child B" }] },
  ];

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.children
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );
    item.contextValue = element.children ? "parent" : "leaf";
    return item;
  }

  getChildren(element?: TreeNode): TreeNode[] {
    return element ? (element.children ?? []) : this.data;
  }
}
```

---

## Commonly Used Enums

```typescript
vscode.StatusBarAlignment.Left / .Right
vscode.ProgressLocation.Notification / .Window / .SourceControl
vscode.DiagnosticSeverity.Error / .Warning / .Information / .Hint
vscode.CompletionItemKind.Text / .Method / .Function / .Class / .Snippet / ...
vscode.TreeItemCollapsibleState.None / .Collapsed / .Expanded
vscode.ViewColumn.One / .Two / .Active / .Beside
vscode.ConfigurationTarget.Global / .Workspace / .WorkspaceFolder
vscode.FileType.File / .Directory / .SymbolicLink
vscode.EndOfLine.LF / .CRLF
```

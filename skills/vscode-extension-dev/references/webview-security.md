# WebView Security & Messaging

WebViews are iframes running in an isolated renderer process. They are the most powerful — and
most dangerous — VS Code API surface. Follow every rule in this file without exception.

---

## The 5 Security Rules (Non-Negotiable)

### Rule 1: Always Set `localResourceRoots`

```typescript
// ❌ NEVER — grants access to the entire workspace directory by default
vscode.window.createWebviewPanel("id", "Title", col, {
  enableScripts: true,
  // no localResourceRoots — defaults to workspace root!
});

// ✅ ALWAYS — restrict to your own media folder only
const mediaUri = vscode.Uri.joinPath(context.extensionUri, "media");
vscode.window.createWebviewPanel("id", "Title", col, {
  enableScripts: true,
  localResourceRoots: [mediaUri],
});
```

### Rule 2: Generate a Fresh Nonce Per Render

```typescript
function getNonce(): string {
  let text = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
```

### Rule 3: Set a Strict Content Security Policy

```typescript
function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.js"),
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "style.css"),
  );

  // ✅ Strict CSP: nonce required on every script and style
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src ${webview.cspSource} 'nonce-${nonce}';
             script-src 'nonce-${nonce}';
             img-src ${webview.cspSource} https: data:;
             font-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" nonce="${nonce}" href="${styleUri}">
  <title>My View</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
```

### Rule 4: Validate Every Message from the WebView

```typescript
// Define a strict message union
interface RequestDataMsg {
  type: "requestData";
  id: string;
}
interface UpdateMsg {
  type: "update";
  value: unknown;
}
type IncomingMsg = RequestDataMsg | UpdateMsg;

function isIncomingMsg(v: unknown): v is IncomingMsg {
  if (typeof v !== "object" || v === null) {
    return false;
  }
  const obj = v as Record<string, unknown>;
  return obj.type === "requestData" || obj.type === "update";
}

panel.webview.onDidReceiveMessage(
  (raw: unknown) => {
    if (!isIncomingMsg(raw)) {
      console.warn("MyExt: received unknown message shape", raw);
      return;
    }
    switch (raw.type) {
      case "requestData":
        handleRequestData(raw.id);
        break;
      case "update":
        handleUpdate(raw.value);
        break;
    }
  },
  undefined,
  context.subscriptions,
);
```

### Rule 5: Sanitize All User Data Before Injecting into HTML

```typescript
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ❌ NEVER inject raw user data into an HTML string
panel.webview.html = `<p>${userInput}</p>`;

// ✅ Always use postMessage after the HTML is loaded
panel.webview.postMessage({ type: "setContent", text: userInput });
// Then in WebView JS: document.getElementById('out').textContent = msg.text;
```

---

## Full WebView Panel Lifecycle Pattern

```typescript
// src/webview/panel.ts

import * as vscode from "vscode";

export class MyWebviewPanel {
  public static current: MyWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(private readonly context: vscode.ExtensionContext) {
    const col =
      vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    const mediaUri = vscode.Uri.joinPath(context.extensionUri, "media");

    this.panel = vscode.window.createWebviewPanel("myView", "My View", col, {
      enableScripts: true,
      localResourceRoots: [mediaUri],
      retainContextWhenHidden: false, // ⚠️ only set true when you have a strong reason
    });

    this.panel.webview.html = getHtml(this.panel.webview, context.extensionUri);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (raw: unknown) => this.handleMessage(raw),
      null,
      this.disposables,
    );
  }

  public static createOrShow(context: vscode.ExtensionContext): void {
    if (MyWebviewPanel.current) {
      MyWebviewPanel.current.panel.reveal();
      return;
    }
    MyWebviewPanel.current = new MyWebviewPanel(context);
  }

  public sendData(data: Record<string, unknown>): void {
    this.panel.webview.postMessage({ type: "data", payload: data });
  }

  private handleMessage(raw: unknown): void {
    if (!isIncomingMsg(raw)) {
      return;
    }
    // ... handle validated message
  }

  public dispose(): void {
    MyWebviewPanel.current = undefined;
    this.panel.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
  }
}
```

---

## Message Passing Contract

Define a shared contract between the extension host and the WebView renderer:

```typescript
// src/webview/contract.ts (imported by panel.ts and compiled into media/main.js)

// Extension → WebView
export type ToWebview =
  | { type: "init"; theme: "light" | "dark" }
  | { type: "data"; payload: Record<string, unknown> }
  | { type: "error"; message: string };

// WebView → Extension
export type FromWebview =
  | { type: "ready" }
  | { type: "requestData"; id: string }
  | { type: "action"; name: string; args: unknown[] };
```

```typescript
// media/main.js (runs in the WebView — no Node.js, no vscode module)
const vscode = acquireVsCodeApi(); // call ONCE at top level

window.addEventListener("message", (event) => {
  const msg = event.data; // Already parsed JSON
  if (msg.type === "data") {
    renderData(msg.payload);
  }
});

// Send back to the extension host
function requestData(id) {
  vscode.postMessage({ type: "requestData", id });
}

// Persist state across panel hides (when retainContextWhenHidden: false)
function saveState(state) {
  vscode.setState(state);
}
function loadState() {
  return vscode.getState() ?? {};
}
```

---

## WebView Security Anti-Patterns

```typescript
// ❌ Inline script without nonce
`<script>alert('xss')</script>`;

// ❌ eval() anywhere in WebView JS
eval(userInput);

// ❌ Setting innerHTML with external data
element.innerHTML = messageFromExtension.text;

// ❌ Loading external scripts
`<script src="https://cdn.example.com/lib.js"></script>`;
// Instead: bundle the library into media/ and load via webview.asWebviewUri()

// ❌ Making security decisions in the WebView
panel.webview.onDidReceiveMessage((msg) => {
  if (msg.isAdmin) {
    doAdminThing();
  } // The WebView can lie!
});
// Instead: check permissions in the extension host, never in the renderer
```

---

## WebView vs. TreeView Decision Guide

**Prefer TreeView when:**

- Data is list- or tree-structured
- No rich interactivity is needed
- Accessibility matters (TreeView is accessible by default)

**Use WebView when:**

- Custom layout or rendering is required
- Charts, rich-text editing, or canvas is needed
- Built-in VS Code components genuinely cannot express the UI

**WebView cost**: Higher security surface, harder to test, more maintenance overhead.
Only reach for WebView when built-in UI is truly insufficient.

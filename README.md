# Bobosun's Agent Skills 🚀

這是一套為現代 AI 程式碼助手（如 Claude Code、Cursor 和 Antigravity）設計的高品質 **Agent Skills** 指令集。

---

## 📦 安裝

若要將此儲存庫中的所有技能安裝到專案的 `.agents/skills/` 目錄中：

```bash
pnpx skills add bobosun0713/skills
```

若要為特定 Agent（例如 Claude Code）全域安裝特定技能（例如 `vue-best-practices`）：

```bash
pnpx skills add bobosun0713/skills --skill vue-best-practices -g -a claude-code
```

更多關於 CLI 的安裝方式請參考 [vercel-labs/skills](https://github.com/vercel-labs/skills)。

---

## 🛠️ 技能目錄

### Custom Skills

這些是由 **bobosun0713** 開發或深度客製化，針對特定開發流程設計的技能。

| 技能                                                      | 說明                                                                        |
| :-------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **[code-review](./skills/code-review)**                   | 為 Vue、React、Nuxt 和 TypeScript 提供結構化、多層次的開發端程式碼審查。    |
| **[git-commit](./skills/git-commit)**                     | 根據 Angular 規範生成結構化的 Git Commit 訊息。                             |
| **[vscode-extension-dev](./skills/vscode-extension-dev)** | VS Code 擴充功能開發與 API 使用的專業指導。                                 |
| **[vue-unit-testing](./skills/vue-unit-testing)**         | 深入探討 Vitest/Jest 的單元測試工作流（包含強制性的 `test-case.md` 規範）。 |

### Vendor Skills

這些技能導入自高品質的開源社群，提供業界標準的最佳實踐。

| 技能                                                                          | 來源                                                                    | 說明                                                         |
| :---------------------------------------------------------------------------- | :---------------------------------------------------------------------- | :----------------------------------------------------------- |
| **[create-adaptable-composable](./skills/create-adaptable-composable)**       | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | 關於建立程式庫等級、具備響應式能力的 Vue Composable 指南。   |
| **[vue-best-practices](./skills/vue-best-practices)**                         | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | 專注於 Composition API 與 TypeScript 的現代 Vue 3 開發標準。 |
| **[vue-debug-guides](./skills/vue-debug-guides)**                             | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | 針對 Vue 執行期（Runtime）與 SSR 議題的系統化除錯技巧。      |
| **[vue-jsx-best-practices](./skills/vue-jsx-best-practices)**                 | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | 在 Vue 3 中使用 JSX 語法的最佳模式與實踐。                   |
| **[vue-options-api-best-practices](./skills/vue-options-api-best-practices)** | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | Vue Options API 的最佳實踐與 TypeScript 整合方案。           |
| **[vue-pinia-best-practices](./skills/vue-pinia-best-practices)**             | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | Pinia Store 設置、狀態管理模式與響應式處理。                 |
| **[vue-router-best-practices](./skills/vue-router-best-practices)**           | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | 高效的路由策略、導航守衛與元件生命週期互動。                 |
| **[vue-testing-best-practices](./skills/vue-testing-best-practices)**         | [vuejs-ai/skills](https://github.com/vuejs-ai/skills)                   | 涵蓋 Vitest、VTU 和 Playwright 的全面測試策略。              |
| **[web-design-guidelines](./skills/web-design-guidelines)**                   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | UI/UX、無障礙設計（Accessibility）與現代網頁介面規範審核。   |

---

## 💡 運作原理

每個技能都定義在 `skills/` 目錄下對應資料夾中的 `SKILL.md` 檔案中。這些檔案包含：

1. **YAML Frontmatter**： 包含 `name` 和 `description` 等元資料，供 `npx skills` 工具和 AI Agent 用於識別。
2. **指令集（Instruction Set）**： 經過深度研究的最佳實踐、程式碼片段與系統化工作流，在開發過程中引導 AI Agent。

當技能載入到 Agent 的上下文中時，它能讓 Agent 分辨不同的開發場景，並針對特定領域提供更準確、一致且高品質的解決方案。

## 🤝 參與貢獻

歡迎任何形式的貢獻！如果您有想要分享的技能：

1. Fork 本儲存庫。
2. 在 `skills/` 下建立新資料夾。
3. 仿照現有結構新增 `SKILL.md` 檔案。
4. 提交 Pull Request。

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [bobosun0713](https://github.com/bobosun0713)

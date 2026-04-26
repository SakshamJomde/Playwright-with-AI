<div align="center">

# 🎭 qa-ai-ideas

**AI-powered test authoring and self-healing test infrastructure**

*Playwright · TypeScript · Claude · playwright-cli*

[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Claude](https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)

</div>

---

## 💡 The Problem

Modern QA teams face two expensive, recurring problems:

| Problem | Cost |
|---|---|
| ✍️ **Writing tests** | Requires knowing DOM structure, selectors, and Playwright APIs |
| 🔧 **Maintaining tests** | Selectors break silently when UI changes — someone has to fix them |

> This project explores using AI to solve **both** — without sacrificing precision.

---

## 🏗️ Architecture

The system is split into two phases that cover the full test lifecycle.

### Phase 1 — AI-Assisted Test Authoring

[`playwright-cli`](https://github.com/microsoft/playwright-cli) drives a real browser and returns **structured YAML snapshots** — not screenshots. Each element gets a short `ref` (e.g. `e43`). Claude reads the snapshot, picks the right ref by intent, and calls `generate-locator` to produce a precise Playwright locator.

> 💬 **Token cost:** ~400–600 tokens per test. No vision models. No image tokens.

```
YOU                          test-writer.ts                 playwright-cli              Claude
 │                                │                               │                       │
 │  npm run write                 │                               │                       │
 │  "Book Now navigates           │                               │                       │
 │   to detail page"              │                               │                       │
 │──────────────────────────────>│                               │                       │
 │                                │                               │                       │
 │                                │── planSteps(description) ───────────────────────────>│
 │                                │<─ [{goto URL}, {snapshot},                            │
 │                                │    {click BookNow}, {assert URL}] ───────────────────│
 │                                │                               │                       │
 │                                │── goto URL ─────────────────>│                       │
 │                                │                               │  opens browser        │
 │                                │<─ ok ────────────────────────│                       │
 │                                │                               │                       │
 │                                │── snapshot ─────────────────>│                       │
 │                                │<─ YAML (e40="Book Now",       │                       │
 │                                │   e45="Avengers"...) ────────│                       │
 │                                │                               │                       │
 │                                │── "which ref is Book Now?" ─────────────────────────>│
 │                                │<─ "e40" ────────────────────────────────────────────│
 │                                │                               │                       │
 │                                │── generate-locator e40 ─────>│                       │
 │                                │<─ "getByRole('link',          │                       │
 │                                │   {name:'Book Now'})" ───────│                       │
 │                                │                               │                       │
 │                                │── click e40 ────────────────>│                       │
 │                                │<─ ok (URL changed) ──────────│                       │
 │                                │                               │                       │
 │                                │── generateTestCode() ──────────────────────────────>│
 │                                │<─ full .spec.ts with                                  │
 │                                │   real locators ────────────────────────────────────│
 │                                │                               │                       │
 │<── tests/book-now.spec.ts ─────│                               │                       │
 │    written ✓                   │                               │                       │
```

---

### Phase 2 — Self-Healing Tests

When a selector breaks in CI, `SelfHealingReporter` (a custom Playwright reporter) intercepts the failure, navigates to the live page, takes a fresh snapshot, asks Claude which element matches the original intent, generates a new locator, and **patches the test file automatically**.

> 🩺 **No human intervention. The DOM is the source of truth.**

```
─────────────────── weeks later, UI changes ───────────────────

CI                        self-healer.ts                playwright-cli              Claude
 │                               │                              │                       │
 │  npx playwright test          │                              │                       │
 │  → "Book Now" broke           │                              │                       │
 │──────────────────────────────>│                              │                       │
 │                                │                              │                       │
 │                                │── goto URL ────────────────>│                       │
 │                                │── snapshot ────────────────>│                       │
 │                                │<─ YAML (UI changed,         │                       │
 │                                │   now e61="Book Ticket") ───│                       │
 │                                │                              │                       │
 │                                │── "broken: 'Book Now',       │                       │
 │                                │   what ref matches?" ──────────────────────────────>│
 │                                │<─ "e61" ───────────────────────────────────────────│
 │                                │                              │                       │
 │                                │── generate-locator e61 ────>│                       │
 │                                │<─ "getByRole('link',         │                       │
 │                                │   {name:'Book Ticket'})" ───│                       │
 │                                │                              │                       │
 │                                │── patch .spec.ts ───────────────────────────────────│
 │                                │   "Book Now" → "Book Ticket" │                       │
 │                                │                              │                       │
 │<── Test auto-fixed ✓ ──────────│                              │                       │
```

---

<div align="center">

### 🔁 The Complete Lifecycle

```
  describe in plain English
          ↓
   AI writes the test
          ↓
   tests run in CI
          ↓
   UI changes → selector breaks
          ↓
   AI heals the test
          ↓
   tests run in CI  ✓
```

**AI writes your tests. AI maintains your tests.**

</div>

---

## 📁 Project Structure

```
qa-ai-ideas/
│
├── src/
│   ├── fixtures/
│   │   └── *.ts              ← Page action objects + Playwright fixtures
│   └── healer/
│       └── self-healer.ts    ← Custom reporter: detects & patches broken selectors
│
├── tests/
│   └── *.spec.ts             ← Spec files (import fixtures from src/)
│
└── .github/
    └── workflows/            ← CI pipelines
```

---

## 🧩 Key Design Decisions

<details>
<summary><b>🗂️ snapshot over screenshot</b></summary>
<br>
<code>playwright-cli snapshot</code> returns structured YAML with element refs — not images. This keeps token usage at ~400 tokens per interaction instead of thousands for vision models.

```yaml
- link "Book Now" [ref=e43] [cursor=pointer]:
    /url: /movies/f1themovie
```
</details>

<details>
<summary><b>🎯 generate-locator as the output</b></summary>
<br>
Instead of asking Claude to write a locator from scratch (error-prone), we ask it to pick a <code>ref</code> from the snapshot and let <code>playwright-cli</code> generate the locator. The AI handles <b>intent-matching</b>; the tool handles <b>selector syntax</b>.
</details>

<details>
<summary><b>🔄 Stateless self-healing</b></summary>
<br>
The reporter reads the live page state to determine what changed. No external state files, no databases — the DOM is the source of truth. Every run is independent.
</details>

<details>
<summary><b>🧩 Fixtures over Page Object Model</b></summary>
<br>
Fixtures (<code>test.extend()</code>) are Playwright's native pattern. Unlike POM, they handle navigation, waiting, and teardown automatically. All locators live in one place — when the self-healer patches a selector, every test using that fixture is fixed in a single edit.
</details>

<details>
<summary><b>🌐 Real Chrome for bot-protected sites</b></summary>
<br>
<code>channel: 'chrome'</code> uses the installed Google Chrome binary with <code>headless: false</code> + <code>xvfb</code> in CI, bypassing Akamai and similar bot detection layers that block headless Chromium.
</details>

---

## ⚙️ CI Pipeline

```
on: push / pull_request → main
        ↓
  matrix: chromium × mobile (Pixel 5)
  runs in parallel, fail-fast: false
        ↓
  retries: 2 in CI, 0 locally
        ↓
  artifacts on failure:
    playwright-report/   ← HTML report
    test-results/        ← screenshots · videos · traces
```

---

## 🚀 Stack

| Layer | Tool |
|---|---|
| Browser automation | [Playwright](https://playwright.dev) |
| Test runner | `@playwright/test` |
| Browser agent | [`@playwright/cli`](https://github.com/microsoft/playwright-cli) |
| AI | [Claude](https://anthropic.com) via Anthropic SDK |
| Language | TypeScript (NodeNext ESM) |
| CI | GitHub Actions |

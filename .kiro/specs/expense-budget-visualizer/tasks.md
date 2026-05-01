# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a zero-dependency, client-side SPA delivered as three static files (`index.html`, `css/style.css`, `js/app.js`). Implementation proceeds in layers: HTML skeleton → CSS styling → JS storage → JS validation → JS rendering → JS chart → event wiring → edge-case handling.

## Tasks

- [x] 1. Create `index.html` — full page markup
  - Add `<!DOCTYPE html>` boilerplate, `<meta charset>`, `<meta name="viewport">`, and `<title>Expense & Budget Visualizer</title>`
  - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - Add Chart.js CDN `<script>` tag before closing `</body>`: `https://cdn.jsdelivr.net/npm/chart.js`
  - Add `<script src="js/app.js"></script>` after the Chart.js CDN tag
  - Build `<header>` containing `<h1>` and `<div id="balance-container">` with `<span id="balance">$0.00</span>`
  - Build `<section id="form-section">` containing `<form id="transaction-form">` with:
    - `<input id="input-name" type="text" placeholder="Item name">`
    - `<span id="error-name" class="error"></span>`
    - `<input id="input-amount" type="number" placeholder="Amount" min="0.01" step="0.01">`
    - `<span id="error-amount" class="error"></span>`
    - `<select id="input-category">` with options: empty default, Food, Transport, Fun
    - `<span id="error-category" class="error"></span>`
    - `<button type="submit">Add Transaction</button>`
  - Build `<section id="list-section">` containing `<h2>Transactions</h2>` and `<ul id="transaction-list"></ul>`
  - Build `<section id="chart-section">` containing `<h2>Spending by Category</h2>`, `<canvas id="spending-chart"></canvas>`, and `<p id="chart-empty-state" hidden>No transactions yet.</p>`
  - Add `<div id="storage-warning" hidden>Could not load saved data. Starting fresh.</div>` before `</body>`
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 5.5, 5.6, 6.4, 7.3_

- [x] 2. Create `css/style.css` — all visual styling
  - [x] 2.1 Global reset and base typography
    - Apply `box-sizing: border-box` universally; set a clean sans-serif font stack on `body`; remove default margin/padding
    - _Requirements: 8.2_

  - [x] 2.2 Header and balance styles
    - Style `header` with a distinct background; make `#balance` visually prominent (larger font, bold)
    - _Requirements: 4.1, 8.2_

  - [x] 2.3 Form layout and inline error styles
    - Lay out form fields vertically with consistent spacing; style `.error` spans in red, hidden by default (empty content collapses them)
    - Style the submit button with clear affordance (background colour, hover state)
    - _Requirements: 1.1, 1.4, 8.2_

  - [x] 2.4 Transaction list styles
    - Style `#transaction-list` as a scrollable container (`overflow-y: auto`, fixed `max-height`)
    - Style each `<li>` to display name, amount, category, and delete button in a single row
    - Style the delete button (small, visually distinct, hover state)
    - _Requirements: 2.1, 2.2, 3.1, 8.2_

  - [x] 2.5 Chart section styles
    - Constrain `#spending-chart` canvas to a readable size; centre it within its section
    - Style `#chart-empty-state` placeholder text (muted colour, centred)
    - _Requirements: 5.5, 8.2_

  - [x] 2.6 Storage warning banner styles
    - Style `#storage-warning` as a non-blocking banner (e.g. top-of-page strip, amber background)
    - _Requirements: 6.4_

  - [x] 2.7 Responsive layout
    - Use a single-column layout by default; ensure no horizontal scroll at 320 px
    - At wider viewports (≥ 768 px) optionally place form and list side-by-side using flexbox or grid
    - Verify chart and list remain usable at 320 px, 768 px, 1280 px, and 1920 px
    - _Requirements: 8.3_

- [x] 3. Implement storage functions in `js/app.js`
  - [x] 3.1 Scaffold `app.js` — state variable and constants
    - Declare `let transactions = [];` as the single in-memory state array at the top of the file
    - Define `STORAGE_KEY = "transactions"` and `CATEGORIES = ["Food", "Transport", "Fun"]` as constants
    - Add comment block headers for each function group: `// --- storage ---`, `// --- validation ---`, `// --- rendering ---`, `// --- chart ---`, `// --- events ---`
    - _Requirements: 7.1, 7.3_

  - [x] 3.2 Implement `storage_load()`
    - Read `localStorage.getItem(STORAGE_KEY)` inside a `try/catch`
    - Parse JSON; if result is not an array, treat as malformed
    - Return the parsed array on success; return `[]` and set a module-level `storageWarning = true` flag on any failure (missing key, malformed JSON, non-array)
    - _Requirements: 6.3, 6.4_

  - [x] 3.3 Implement `storage_save(transactions)`
    - Serialise `transactions` with `JSON.stringify` and write to `localStorage.getItem(STORAGE_KEY)` inside a `try/catch`
    - On failure, log a console warning; do not throw (in-memory state remains valid)
    - _Requirements: 6.1, 6.2_

- [x] 4. Implement validation functions in `js/app.js`
  - [x] 4.1 Implement `validation_validate(name, amount, category)`
    - Return `{ valid: boolean, errors: { name?, amount?, category? } }`
    - `name`: reject if `name.trim()` is empty string
    - `amount`: reject if `parseFloat(amount)` is not finite or is ≤ 0
    - `category`: reject if value is not in `CATEGORIES`
    - Return `valid: true` only when all three fields pass
    - _Requirements: 1.3, 1.4_

- [x] 5. Implement rendering functions in `js/app.js`
  - [x] 5.1 Implement `rendering_renderBalance(transactions)`
    - Sum all `transaction.amount` values; default to `0` for empty list
    - Format result as `$X.XX` (two decimal places, `$` prefix) using `toFixed(2)`
    - Set `document.getElementById("balance").textContent` to the formatted string
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Implement `rendering_renderList(transactions)`
    - Clear `#transaction-list` innerHTML
    - If `transactions` is empty, insert `<p>No transactions added yet.</p>` and return
    - For each transaction, create an `<li>` with:
      - A `<span>` for the name
      - A `<span>` for the amount formatted as `$X.XX`
      - A `<span>` for the category
      - A `<button class="delete-btn" data-id="${transaction.id}">Delete</button>`
    - Append each `<li>` to `#transaction-list`
    - _Requirements: 2.1, 2.3, 2.4, 3.1_

  - [x] 5.3 Implement `rendering_showFormErrors(errors)` and `rendering_clearFormErrors()`
    - `rendering_clearFormErrors`: set `textContent = ""` on `#error-name`, `#error-amount`, `#error-category`
    - `rendering_showFormErrors(errors)`: for each key in `errors`, set the corresponding `#error-{field}` span's `textContent` to the error message
    - _Requirements: 1.4_

  - [x] 5.4 Implement `rendering_renderAll()`
    - Call `rendering_renderList(transactions)`, `rendering_renderBalance(transactions)`, `chart_render(chartInstance, transactions)` in sequence
    - _Requirements: 1.2, 3.2, 4.2, 4.3, 5.2, 5.3_

- [x] 6. Implement chart functions in `js/app.js`
  - [x] 6.1 Implement `chart_init(canvas)`
    - Guard: if `window.Chart` is undefined, hide `#chart-section` and show a fallback message; return `null`
    - Create and return a `new Chart(canvas, { type: "pie", data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] }, options: { plugins: { legend: { display: true } } } })`
    - _Requirements: 5.1, 5.6_

  - [x] 6.2 Implement `chart_render(chartInstance, transactions)`
    - If `chartInstance` is `null`, return early
    - Aggregate `amount` totals per category using `CATEGORIES` as the canonical order
    - Build `labels` and `data` arrays containing only categories with a total > 0
    - Map each included category to its fixed colour: Food → `#FF6384`, Transport → `#36A2EB`, Fun → `#FFCE56`
    - If all totals are zero: hide `<canvas id="spending-chart">`, show `#chart-empty-state`; return
    - Otherwise: show canvas, hide `#chart-empty-state`; update `chartInstance.data.labels`, `chartInstance.data.datasets[0].data`, `chartInstance.data.datasets[0].backgroundColor`; call `chartInstance.update()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Wire events and initialise app in `js/app.js`
  - [x] 7.1 Implement form submit handler
    - Listen for `submit` on `#transaction-form`; call `event.preventDefault()`
    - Read values from `#input-name`, `#input-amount`, `#input-category`
    - Call `rendering_clearFormErrors()`; call `validation_validate(name, amount, category)`
    - If invalid: call `rendering_showFormErrors(errors)`; return
    - If valid: generate `id` via `crypto.randomUUID()` with fallback to `Date.now().toString() + Math.random()`; push `{ id, name: name.trim(), amount: parseFloat(amount), category }` onto `transactions`; call `storage_save(transactions)`; call `rendering_renderAll()`; reset the form
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 7.2 Implement delete handler (event delegation)
    - Listen for `click` on `#transaction-list`
    - If `event.target` has class `delete-btn`, read `data-id`; find index in `transactions`; splice it out
    - Call `storage_save(transactions)`; call `rendering_renderAll()`
    - _Requirements: 3.2, 3.3_

  - [x] 7.3 Implement `DOMContentLoaded` initialisation
    - Call `storage_load()`; assign result to `transactions`
    - If `storageWarning` is `true`, remove `hidden` attribute from `#storage-warning`
    - Call `chart_init(document.getElementById("spending-chart"))`; assign result to module-level `chartInstance`
    - Call `rendering_renderAll()`
    - _Requirements: 2.3, 4.4, 5.5, 6.3, 6.4_

- [x] 8. Final checkpoint — verify end-to-end behaviour
  - Open `index.html` directly in a browser (no server needed)
  - Confirm empty state: placeholder in list, `$0.00` balance, chart empty-state message visible
  - Add transactions across all three categories; confirm list updates, balance recalculates, pie chart renders with correct segments and legend
  - Delete a transaction; confirm list, balance, and chart all update without page reload
  - Reload the page; confirm all transactions are restored from `localStorage`
  - Submit the form with each invalid combination (empty name, zero amount, no category); confirm inline errors appear and no transaction is added
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 1.1–1.5, 2.1–2.4, 3.1–3.3, 4.1–4.4, 5.1–5.6, 6.1–6.4, 7.1–7.4, 8.1–8.3_

## Notes

- No test files are created — this project has no test runner configured
- All logic lives in `js/app.js` as a plain script; no ES modules, no imports
- `chartInstance` is a module-level variable so `rendering_renderAll` can reach it without passing it as a parameter every time
- The delete handler uses event delegation on `#transaction-list` so re-renders don't require re-attaching listeners
- `storage_save` failures are silent (console warning only) — in-memory state stays valid and the user can keep working

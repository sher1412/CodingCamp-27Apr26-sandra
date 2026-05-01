// Expense & Budget Visualizer — app.js
// All application logic. Plain script, no ES modules.

// --- module-level state ---

let transactions = [];
let storageWarning = false;
let chartInstance = null;
let currentSort = "default";

const STORAGE_KEY = "transactions";
const THEME_KEY = "theme";
const CATEGORIES_KEY = "customCategories";

const DEFAULT_CATEGORIES = ["Food", "Transport", "Fun"];
let categories = [...DEFAULT_CATEGORIES];

// --- storage ---

function storage_load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Missing key returns null — treat as empty, no warning
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Non-array JSON value — malformed
      storageWarning = true;
      return [];
    }
    return parsed;
  } catch (e) {
    // Malformed JSON or localStorage unavailable
    storageWarning = true;
    return [];
  }
}

function storage_save(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.warn("storage_save: could not write to localStorage.", e);
  }
}

function storage_loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (e) {
    return [];
  }
}

function storage_saveCategories(cats) {
  try {
    // Persist only the custom (non-default) entries
    const custom = cats.filter(function (name) {
      return !DEFAULT_CATEGORIES.includes(name);
    });
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(custom));
  } catch (e) {
    console.warn("storage_saveCategories: could not write to localStorage.", e);
  }
}

// --- validation ---

/**
 * Validates the three transaction form fields.
 * @param {string} name     - Raw value from #input-name
 * @param {string} amount   - Raw value from #input-amount
 * @param {string} category - Raw value from #input-category
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validation_validate(name, amount, category) {
  const errors = {};

  // name: must be non-empty after trimming whitespace
  if (typeof name !== "string" || name.trim() === "") {
    errors.name = "Item name is required.";
  }

  // amount: must parse to a finite number greater than zero
  const parsedAmount = parseFloat(amount);
  if (!isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  // category: must be one of the allowed values
  if (!categories.includes(category)) {
    errors.category = "Please select a valid category.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// --- rendering ---

function rendering_renderBalance(transactions) {
  const total = transactions.reduce(function (sum, t) {
    return sum + t.amount;
  }, 0);
  document.getElementById("balance").textContent = "$" + total.toFixed(2);
}

function rendering_renderList(transactions) {
  const list = document.getElementById("transaction-list");
  list.innerHTML = "";

  if (transactions.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No transactions added yet.";
    list.appendChild(empty);
    return;
  }

  transactions.forEach(function (transaction) {
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.className = "tx-name";
    nameSpan.textContent = transaction.name;

    const amountSpan = document.createElement("span");
    amountSpan.className = "tx-amount";
    amountSpan.textContent = "$" + transaction.amount.toFixed(2);

    const categorySpan = document.createElement("span");
    categorySpan.className = "tx-category";
    categorySpan.textContent = transaction.category;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = transaction.id;
    deleteBtn.textContent = "Delete";

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

function rendering_clearFormErrors() {
  document.getElementById("error-name").textContent = "";
  document.getElementById("error-amount").textContent = "";
  document.getElementById("error-category").textContent = "";
}

function rendering_showFormErrors(errors) {
  Object.keys(errors).forEach(function (field) {
    const el = document.getElementById("error-" + field);
    if (el) {
      el.textContent = errors[field];
    }
  });
}

function rendering_renderAll() {
  const sorted = sorting_sort(transactions, currentSort);
  rendering_renderList(sorted);
  rendering_renderBalance(transactions);
  chart_render(chartInstance, transactions);
}

// --- sorting ---

/**
 * Returns a new sorted array based on the given sort key.
 * Never mutates the source transactions array.
 * @param {Array} transactions - Source transaction array
 * @param {string} sortKey - One of "default", "amount-asc", "amount-desc", "category-asc"
 * @returns {Array}
 */
function sorting_sort(transactions, sortKey) {
  switch (sortKey) {
    case "amount-asc":
      return [...transactions].sort(function (a, b) {
        return a.amount - b.amount;
      });
    case "amount-desc":
      return [...transactions].sort(function (a, b) {
        return b.amount - a.amount;
      });
    case "category-asc":
      return [...transactions].sort(function (a, b) {
        return a.category.localeCompare(b.category);
      });
    case "default":
    default:
      return [...transactions];
  }
}

// --- categories ---

/**
 * Adds a new custom category.
 * @param {string} name
 * @returns {{ success: boolean, error?: string }}
 */
function categories_add(name) {
  var trimmed = (typeof name === "string") ? name.trim() : "";
  if (trimmed === "") {
    return { success: false, error: "Category name cannot be empty." };
  }
  var lowerTrimmed = trimmed.toLowerCase();
  var duplicate = categories.some(function (cat) {
    return cat.toLowerCase() === lowerTrimmed;
  });
  if (duplicate) {
    return { success: false, error: "Category already exists." };
  }
  categories.push(trimmed);
  storage_saveCategories(categories);
  rendering_renderCategoryDropdown();
  rendering_renderCategoryList();
  return { success: true };
}

/**
 * Deletes a custom category. Default categories are protected.
 * Existing transactions that used this category are not modified.
 * @param {string} name
 */
function categories_delete(name) {
  if (DEFAULT_CATEGORIES.includes(name)) {
    return; // default categories are undeletable
  }
  var index = categories.indexOf(name);
  if (index === -1) {
    return;
  }
  categories.splice(index, 1);
  storage_saveCategories(categories);
  rendering_renderCategoryDropdown();
  rendering_renderCategoryList();
}

/**
 * Rebuilds the #input-category dropdown from the live categories array.
 */
function rendering_renderCategoryDropdown() {
  var select = document.getElementById("input-category");
  if (!select) return;
  // Keep only the empty default option (first child)
  while (select.options.length > 1) {
    select.remove(1);
  }
  categories.forEach(function (name) {
    var option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

/**
 * Rebuilds the #category-list from the live categories array.
 * Default categories are shown without a delete button.
 * Custom categories get a delete button.
 */
function rendering_renderCategoryList() {
  var list = document.getElementById("category-list");
  if (!list) return;
  list.innerHTML = "";
  categories.forEach(function (name) {
    var li = document.createElement("li");
    var nameSpan = document.createElement("span");
    nameSpan.className = "cat-name";
    nameSpan.textContent = name;
    li.appendChild(nameSpan);
    if (!DEFAULT_CATEGORIES.includes(name)) {
      var deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-cat-btn";
      deleteBtn.dataset.cat = name;
      deleteBtn.textContent = "✕";
      deleteBtn.setAttribute("aria-label", "Delete category " + name);
      li.appendChild(deleteBtn);
    } else {
      li.classList.add("cat-default");
    }
    list.appendChild(li);
  });
}

// --- chart ---

const CATEGORY_COLOURS = {
  Food: "#FF6384",
  Transport: "#36A2EB",
  Fun: "#FFCE56",
};

// Palette for custom categories (cycles if more than 4 custom cats)
const CUSTOM_CATEGORY_PALETTE = ["#4BC0C0", "#9966FF", "#FF9F40", "#C9CBCF"];

/**
 * Returns the colour for a given category name.
 * Default categories use fixed colours; custom categories cycle through a palette.
 * @param {string} name
 * @returns {string}
 */
function chart_colourForCategory(name) {
  if (CATEGORY_COLOURS[name]) {
    return CATEGORY_COLOURS[name];
  }
  // Custom category — use palette index based on position in custom list
  var customIndex = categories
    .filter(function (c) { return !DEFAULT_CATEGORIES.includes(c); })
    .indexOf(name);
  return CUSTOM_CATEGORY_PALETTE[customIndex % CUSTOM_CATEGORY_PALETTE.length] || "#C9CBCF";
}

/**
 * Initialises the Chart.js pie chart on the given canvas element.
 * If Chart.js is not available (CDN failed to load), hides the chart section
 * and shows a fallback message instead.
 * @param {HTMLCanvasElement} canvas
 * @returns {Chart|null}
 */
function chart_init(canvas) {
  if (typeof window.Chart === "undefined") {
    const section = document.getElementById("chart-section");
    if (section) {
      section.hidden = true;
    }
    const emptyState = document.getElementById("chart-empty-state");
    if (emptyState) {
      emptyState.textContent = "Chart unavailable — could not load Chart.js.";
      emptyState.hidden = false;
    }
    return null;
  }

  return new Chart(canvas, {
    type: "pie",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          display: true,
        },
      },
    },
  });
}

/**
 * Updates the pie chart to reflect current transaction totals per category.
 * Shows an empty-state message when there are no transactions.
 * @param {Chart|null} chartInstance
 * @param {Array} transactions
 */
function chart_render(chartInstance, transactions) {
  if (chartInstance === null) {
    return;
  }

  const canvas = document.getElementById("spending-chart");
  const emptyState = document.getElementById("chart-empty-state");

  // Aggregate totals per category
  const totals = {};
  categories.forEach(function (cat) {
    totals[cat] = 0;
  });
  transactions.forEach(function (t) {
    if (totals.hasOwnProperty(t.category)) {
      totals[t.category] += t.amount;
    } else {
      // Transaction uses a deleted custom category — still tally it
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
  });

  // Build arrays for only categories with a non-zero total
  const labels = [];
  const data = [];
  const backgroundColors = [];
  var allCats = [...categories];
  transactions.forEach(function (t) {
    if (!allCats.includes(t.category)) {
      allCats.push(t.category);
    }
  });
  allCats.forEach(function (cat) {
    if (totals[cat] > 0) {
      labels.push(cat);
      data.push(totals[cat]);
      backgroundColors.push(chart_colourForCategory(cat));
    }
  });

  if (labels.length === 0) {
    // No data — clear chart data explicitly so it renders blank, show empty state
    chartInstance.data.labels = [];
    chartInstance.data.datasets[0].data = [];
    chartInstance.data.datasets[0].backgroundColor = [];
    chartInstance.update();
    if (canvas) canvas.hidden = true;
    if (emptyState) emptyState.hidden = false;
    return;
  }

  // Data present — show canvas, hide empty state
  if (canvas) canvas.hidden = false;
  if (emptyState) emptyState.hidden = true;

  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = data;
  chartInstance.data.datasets[0].backgroundColor = backgroundColors;
  chartInstance.update();
}

// --- theme ---

/**
 * Reads the saved theme preference from localStorage.
 * @returns {"dark"|"light"}
 */
function theme_load() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch (e) {
    // localStorage unavailable — fall through to default
  }
  return "light";
}

/**
 * Applies the given theme to the document and updates the toggle button.
 * @param {"dark"|"light"} theme
 */
function theme_apply(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  if (theme === "dark") {
    btn.setAttribute("aria-label", "Switch to light mode");
    btn.textContent = "☀️";
  } else {
    btn.setAttribute("aria-label", "Switch to dark mode");
    btn.textContent = "🌙";
  }
}

/**
 * Flips the active theme between dark and light, persists the choice.
 */
function theme_toggle() {
  var current = document.documentElement.getAttribute("data-theme");
  var next = current === "dark" ? "light" : "dark";
  theme_apply(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    console.warn("theme_toggle: could not write to localStorage.", e);
  }
}

// --- events ---

function events_bindFormSubmit() {
  var form = document.getElementById("transaction-form");
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = document.getElementById("input-name").value;
    var amount = document.getElementById("input-amount").value;
    var category = document.getElementById("input-category").value;

    rendering_clearFormErrors();

    var result = validation_validate(name, amount, category);
    if (!result.valid) {
      rendering_showFormErrors(result.errors);
      return;
    }

    // Generate a unique id — prefer crypto.randomUUID, fall back to timestamp+random
    var id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString();

    transactions.push({
      id: id,
      name: name.trim(),
      amount: parseFloat(amount),
      category: category,
    });

    storage_save(transactions);
    rendering_renderAll();
    form.reset();
  });
}

// delete handler (event delegation)
function events_bindDeleteList() {
  var list = document.getElementById("transaction-list");
  list.addEventListener("click", function (event) {
    if (!event.target.classList.contains("delete-btn")) {
      return;
    }

    var id = event.target.dataset.id;
    var index = transactions.findIndex(function (t) {
      return t.id === id;
    });

    if (index === -1) {
      return;
    }

    transactions.splice(index, 1);
    storage_save(transactions);
    rendering_renderAll();
  });
}

// sort handler
function events_bindSortSelect() {
  var sortSelect = document.getElementById("sort-select");
  sortSelect.addEventListener("change", function (e) {
    currentSort = e.target.value;
    rendering_renderAll();
  });
}

// theme toggle handler
function events_bindThemeToggle() {
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      theme_toggle();
    });
  }
}

// category add and delete handlers
function events_bindCategoryManager() {
  var btnAdd = document.getElementById("btn-add-category");
  if (btnAdd) {
    btnAdd.addEventListener("click", function () {
      var input = document.getElementById("input-new-category");
      var errorSpan = document.getElementById("error-new-category");
      var result = categories_add(input.value);
      if (!result.success) {
        errorSpan.textContent = result.error;
      } else {
        errorSpan.textContent = "";
        input.value = "";
      }
    });
  }

  var catList = document.getElementById("category-list");
  if (catList) {
    catList.addEventListener("click", function (event) {
      if (!event.target.classList.contains("delete-cat-btn")) {
        return;
      }
      var name = event.target.dataset.cat;
      categories_delete(name);
    });
  }
}

// DOMContentLoaded initialisation
document.addEventListener("DOMContentLoaded", function () {
  // 1. Apply theme first — prevents flash of unstyled content
  theme_apply(theme_load());

  // 2. Load transactions
  transactions = storage_load();

  if (storageWarning) {
    var warning = document.getElementById("storage-warning");
    if (warning) {
      warning.removeAttribute("hidden");
    }
  }

  // 3. Load custom categories and merge with defaults
  var customCats = storage_loadCategories();
  categories = [...DEFAULT_CATEGORIES, ...customCats];
  rendering_renderCategoryDropdown();
  rendering_renderCategoryList();

  // 4. Initialise chart
  chartInstance = chart_init(document.getElementById("spending-chart"));

  // 5. Bind all events
  events_bindFormSubmit();
  events_bindDeleteList();
  events_bindSortSelect();
  events_bindThemeToggle();
  events_bindCategoryManager();

  // 6. Render everything
  rendering_renderAll();
});

// Expense & Budget Visualizer — app.js
// All application logic. Plain script, no ES modules.

// --- module-level state ---

let transactions = [];
let storageWarning = false;
let chartInstance = null;

const STORAGE_KEY = "transactions";
const CATEGORIES = ["Food", "Transport", "Fun"];

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
  if (!CATEGORIES.includes(category)) {
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
  rendering_renderList(transactions);
  rendering_renderBalance(transactions);
  chart_render(chartInstance, transactions);
}

// --- chart ---

const CATEGORY_COLOURS = {
  Food: "#FF6384",
  Transport: "#36A2EB",
  Fun: "#FFCE56",
};

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

  // Aggregate totals per category in canonical CATEGORIES order
  const totals = {};
  CATEGORIES.forEach(function (cat) {
    totals[cat] = 0;
  });
  transactions.forEach(function (t) {
    if (totals.hasOwnProperty(t.category)) {
      totals[t.category] += t.amount;
    }
  });

  // Build arrays for only categories with a non-zero total
  const labels = [];
  const data = [];
  const backgroundColors = [];
  CATEGORIES.forEach(function (cat) {
    if (totals[cat] > 0) {
      labels.push(cat);
      data.push(totals[cat]);
      backgroundColors.push(CATEGORY_COLOURS[cat]);
    }
  });

  const canvas = document.getElementById("spending-chart");
  const emptyState = document.getElementById("chart-empty-state");

  if (labels.length === 0) {
    // No data — show empty state, hide canvas
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

// DOMContentLoaded initialisation
document.addEventListener("DOMContentLoaded", function () {
  transactions = storage_load();

  if (storageWarning) {
    var warning = document.getElementById("storage-warning");
    if (warning) {
      warning.removeAttribute("hidden");
    }
  }

  chartInstance = chart_init(document.getElementById("spending-chart"));

  events_bindFormSubmit();
  events_bindDeleteList();

  rendering_renderAll();
});

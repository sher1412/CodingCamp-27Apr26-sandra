# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses, categorize spending, and visualize their budget distribution through an interactive pie chart. The application runs entirely in the browser with no backend server, persisting all data via the browser's Local Storage API. It is delivered as a single-page web app composed of one HTML file, one CSS file, and one JavaScript file, and is compatible with all modern browsers.

---

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Transaction_List**: The scrollable UI component that displays all stored transactions.
- **Input_Form**: The HTML form through which the user enters a new transaction.
- **Category**: A classification label for a transaction. Default values are: `Food`, `Transport`, and `Fun`. Users may add custom categories.
- **Custom_Category**: A user-defined category name added beyond the three defaults, persisted in Local_Storage.
- **Balance**: The running total of all transaction amounts currently stored.
- **Chart**: The pie chart component that visualises spending distribution by category.
- **Local_Storage**: The browser's `localStorage` API used for client-side data persistence.
- **Validator**: The client-side logic responsible for checking that all required form fields contain valid values before a transaction is accepted.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter expense details through a form, so that I can record new transactions quickly.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name, a numeric field for the amount, and a dropdown selector for the category (`Food`, `Transport`, `Fun`).
2. WHEN the user submits the Input_Form with all fields filled and a positive numeric amount, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
3. WHEN the user submits the Input_Form, THE Validator SHALL verify that the item name field is not empty, the amount field contains a positive number greater than zero, and a category has been selected.
4. IF the Validator detects that any required field is empty or the amount is not a positive number, THEN THE Input_Form SHALL display an inline error message identifying the invalid field and SHALL NOT add the transaction.
5. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my recorded transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored transactions in the order they were added, showing the item name, amount (formatted to two decimal places with a currency symbol), and category for each entry.
2. WHILE at least one transaction is stored, THE Transaction_List SHALL be scrollable when the number of entries exceeds the visible area.
3. WHEN the App loads in the browser, THE Transaction_List SHALL render all transactions previously persisted in Local_Storage.
4. WHEN no transactions are stored, THE Transaction_List SHALL display a placeholder message indicating that no transactions have been added yet.

---

### Requirement 3: Transaction Deletion

**User Story:** As a user, I want to delete individual transactions, so that I can correct mistakes or remove outdated entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL render a delete control for each transaction entry.
2. WHEN the user activates the delete control for a transaction, THE App SHALL remove that transaction from the Transaction_List, delete it from Local_Storage, and update the Balance and Chart without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL NOT modify any other transaction entries.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total expenditure at a glance, so that I can monitor how much I have spent overall.

#### Acceptance Criteria

1. THE App SHALL display the Balance prominently at the top of the page, formatted to two decimal places with a currency symbol.
2. WHEN a transaction is added, THE App SHALL recalculate and update the Balance to reflect the new total.
3. WHEN a transaction is deleted, THE App SHALL recalculate and update the Balance to reflect the revised total.
4. WHEN no transactions are stored, THE App SHALL display a Balance of zero.

---

### Requirement 5: Spending Distribution Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart that divides spending proportionally across the categories `Food`, `Transport`, and `Fun` based on the sum of transaction amounts in each category.
2. WHEN a transaction is added, THE Chart SHALL update automatically to reflect the new category totals without requiring a page reload.
3. WHEN a transaction is deleted, THE Chart SHALL update automatically to reflect the revised category totals without requiring a page reload.
4. WHEN only one or two categories contain transactions, THE Chart SHALL render correctly using only the categories that have a non-zero total.
5. WHEN no transactions are stored, THE Chart SHALL display a neutral empty state (e.g., a placeholder message or a greyed-out chart area).
6. THE Chart SHALL include a legend that maps each colour segment to its corresponding category label.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL serialise the full transaction list and write it to Local_Storage.
2. WHEN a transaction is deleted, THE App SHALL serialise the updated transaction list and write it to Local_Storage.
3. WHEN the App initialises, THE App SHALL read the transaction list from Local_Storage and restore all previously saved transactions before rendering the Transaction_List, Balance, and Chart.
4. IF Local_Storage is unavailable or returns malformed data, THEN THE App SHALL initialise with an empty transaction list and SHALL display a non-blocking warning message to the user.

---

### Requirement 7: Technology and Structural Constraints

**User Story:** As a developer, I want the application to use only HTML, CSS, and Vanilla JavaScript with no build tools or backend, so that it can be deployed and used as a standalone file or browser extension without any setup.

#### Acceptance Criteria

1. THE App SHALL be implemented using HTML for structure, CSS for styling, and Vanilla JavaScript for behaviour, with no JavaScript frameworks or libraries other than a charting library (e.g., Chart.js loaded via CDN).
2. THE App SHALL require no backend server and SHALL function entirely client-side.
3. THE App SHALL be structured with exactly one HTML file, one CSS file located in a `css/` directory, and one JavaScript file located in a `js/` directory.
4. THE App SHALL be compatible with current stable releases of Chrome, Firefox, Edge, and Safari.

---

### Requirement 8: Performance and Usability

**User Story:** As a user, I want the application to respond immediately to my interactions, so that using it feels fast and natural.

#### Acceptance Criteria

1. WHEN the user adds or deletes a transaction, THE App SHALL update the Transaction_List, Balance, and Chart within 100 milliseconds on a modern desktop browser.
2. THE App SHALL present a clean, minimal interface with clear visual hierarchy and readable typography that requires no onboarding or documentation to use.
3. THE App SHALL be responsive and usable on viewport widths from 320px to 1920px without horizontal scrolling or overlapping elements.

---

### Requirement 9: Sort Transactions

**User Story:** As a user, I want to sort the transaction list by amount or category, so that I can quickly find and review entries in a meaningful order.

#### Acceptance Criteria

1. THE App SHALL display sort controls above the Transaction_List that allow the user to sort by amount ascending, amount descending, or category name A-Z.
2. WHEN the user selects a sort option, THE App SHALL re-render the Transaction_List in the chosen order without modifying the stored order of transactions in Local_Storage.
3. WHEN a new transaction is added or an existing transaction is deleted, THE App SHALL re-render the Transaction_List applying the currently active sort option.
4. WHEN no sort option has been selected, THE App SHALL display transactions in the order they were added.

---

### Requirement 10: Custom Categories

**User Story:** As a user, I want to add my own expense categories, so that I can track spending in ways that match my personal habits beyond the default set.

#### Acceptance Criteria

1. THE App SHALL provide a UI control that allows the user to type and submit a new category name.
2. WHEN the user submits a new category name that is non-empty after trimming and does not already exist (case-insensitive), THE App SHALL add it to the active category list, persist the updated list to Local_Storage, and make it immediately available in the Input_Form category dropdown.
3. WHEN the user submits a category name that is empty or consists only of whitespace, THE App SHALL display an inline error and SHALL NOT add the category.
4. WHEN the user submits a category name that already exists (case-insensitive match), THE App SHALL display an inline error and SHALL NOT add a duplicate.
5. THE App SHALL display all current categories (default and custom) in a manageable list, with a delete control for each custom category.
6. WHEN the user deletes a custom category, THE App SHALL remove it from the category list, persist the updated list to Local_Storage, and remove it from the Input_Form dropdown; existing transactions that used that category SHALL retain their category value unchanged.
7. THE default categories (`Food`, `Transport`, `Fun`) SHALL NOT be deletable.
8. WHEN the App initialises, THE App SHALL read the custom category list from Local_Storage and restore it before rendering the Input_Form dropdown.
9. THE Chart SHALL render segments for all categories — default and custom — that have a non-zero transaction total.

---

### Requirement 11: Dark/Light Mode Toggle

**User Story:** As a user, I want to toggle between dark and light colour themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL display a theme toggle control in the header that allows the user to switch between dark and light colour modes.
2. WHEN the user activates the theme toggle, THE App SHALL switch the active colour theme between dark and light and SHALL persist the selected preference to Local_Storage.
3. WHEN the App initialises, THE App SHALL read the theme preference from Local_Storage and apply it to the document before the first render to prevent a flash of unstyled content.
4. IF no theme preference is found in Local_Storage, THEN THE App SHALL apply the light theme as the default.

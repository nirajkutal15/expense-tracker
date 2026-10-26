# Business Requirements Document (BRD)
## Expense Tracker with AI Receipt Scanning

| | |
|---|---|
| **Version** | 1.0 |
| **Prepared by** | Niraj Kutal |
| **Document type** | Sample BRD (written for a project I built) |
| **Status** | Implemented |

---

## 1. Purpose

This document describes the business need, scope and requirements for a web application that helps individuals record expenses with less manual effort and compare their spending against a monthly budget.

## 2. Business Problem

Tracking expenses by hand is slow and easy to skip. Users have to read each receipt and type the amount, category, description and date. Because of this, records are often incomplete or entered late, and users cannot tell whether they are staying within budget until the month is over.

## 3. Business Objectives

| ID | Objective |
|---|---|
| BO-1 | Reduce the manual effort of entering an expense |
| BO-2 | Give users a clear view of spending against a monthly budget |
| BO-3 | Let users understand where their money goes, by category |
| BO-4 | Let users export their data for use outside the app |

## 4. Scope

**In scope**
- Add, edit, view and delete expenses
- Upload a receipt image and extract expense details using AI
- Set monthly budgets across six categories
- Budget versus actual comparison
- Spending summaries
- CSV export

**Out of scope**
- Bank account or payment app integration
- Multi-currency support
- Shared or family accounts
- Mobile native apps

## 5. Stakeholders

| Stakeholder | Interest |
|---|---|
| End user | Wants to log expenses quickly and stay within budget |
| Product owner | Wants a working, simple product that meets the objectives above |
| Developer | Needs clear, testable requirements |

## 6. Functional Requirements

### User Stories

**FR-1: Manage expenses**
As a user, I want to add, edit and delete expenses so that my records stay accurate.

Acceptance criteria
- The user can create an expense with amount, category, description and date.
- The user can edit or delete any saved expense.
- Invalid input (empty amount, non-numeric amount, missing date) is rejected with a clear message.

**FR-2: Scan a receipt**
As a user, I want to upload a receipt so that the expense details are filled in for me.

Acceptance criteria
- The user can upload a receipt image.
- The system extracts amount, category, description and date using the AI service.
- Extracted values are shown to the user for review before saving.
- If extraction fails or a field is missing, the user can enter or correct it manually.

**FR-3: Track budget against actual spending**
As a user, I want to set a monthly budget per category and see it next to what I actually spent so that I can adjust before the month ends.

Acceptance criteria
- The user can set a budget amount for each of the six categories.
- For the selected month, the system shows budget, actual spend and the difference for each category.
- Categories that exceed their budget are clearly marked.

### Supporting Requirements

| ID | Requirement |
|---|---|
| FR-4 | The system shows total spending and spending by category for a selected period, and updates when expenses change |
| FR-5 | The user can export expenses (amount, category, description, date) to a CSV file |

## 7. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | Usability: a first-time user can add an expense without instructions |
| NFR-2 | Accuracy: monetary values are stored and calculated without rounding errors |
| NFR-3 | Reliability: a failure in receipt scanning must not block manual entry |
| NFR-4 | Security: API keys for the AI service are kept on the server, not in the browser |
| NFR-5 | Maintainability: the frontend and backend communicate only through REST APIs |

## 8. Process Flow: Adding an Expense with a Receipt

1. User opens the app and chooses to add an expense.
2. User uploads a receipt image.
3. System sends the image to the AI service.
4. AI service returns amount, category, description and date.
5. System shows the extracted values to the user.
6. User confirms or corrects the values.
7. System saves the expense and updates the summaries and budget comparison.

**Alternate flow:** at step 4, if extraction fails, the system tells the user and opens the manual entry form.

## 9. Assumptions and Constraints

- Users have receipts that are legible when photographed or scanned.
- Extraction results depend on the AI service and may be wrong, so user review is required.
- The app is used by one user per account.
- Amounts are in a single currency.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| AI reads a receipt incorrectly | Wrong data saved | Show extracted values for review before saving |
| AI service is unavailable | Users cannot scan | Manual entry always available |
| Poor image quality | Fields missing | Allow manual correction |

## 11. Success Measures

- Time to record an expense with a receipt is shorter than manual entry.
- Users can see budget versus actual for every category in one view.
- CSV export opens correctly in Excel.

## 12. Requirements Traceability

| Business Objective | Requirements |
|---|---|
| BO-1 | FR-1, FR-2 |
| BO-2 | FR-3 |
| BO-3 | FR-3, FR-4 |
| BO-4 | FR-5 |

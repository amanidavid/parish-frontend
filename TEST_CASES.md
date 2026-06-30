# Finance-Driven Contracts — Test Cases

## 1. UnitModal — Rent Fields

| # | Step | Expected Result |
|---|------|-----------------|
| 1.1 | Open property detail → Units tab → click "Add Unit" | Modal opens with new fields: Monthly Rent Amount, Currency |
| 1.2 | Leave Monthly Rent Amount empty, save | Unit saves successfully; amount sent as `null` |
| 1.3 | Enter `150000` for Monthly Rent Amount, `TZS` for Currency, save | Unit saves; payload includes `monthly_rent_amount: 150000`, `rent_currency: "TZS"` |
| 1.4 | Edit an existing unit that has rent set | Form pre-fills with existing `monthly_rent_amount` and `rent_currency` |
| 1.5 | Update the rent amount to `200000`, save | API PATCH sends updated values; UI reflects change after save |

---

## 2. ContractModal — Create Flow (Finance-Driven)

| # | Step | Expected Result |
|---|------|-----------------|
| 2.1 | Open Contracts tab → click "New Contract" | Modal opens; no "Amount" or "End Date" fields |
| 2.2 | Select a unit that **has** `monthly_rent_amount` set | Unit price bar shows: Monthly Price × Months = Expected Total |
| 2.3 | Select a unit that **has no** rent amount | Unit price bar shows "—" for price; expected total stays "—"; form still allows saving |
| 2.4 | Enter `start_date`, `contract_months = 6`, leave initial payment empty, save | Contract creates successfully; no `initial_amount_paid` in payload |
| 2.5 | Create with `initial_amount_paid = 50000` and `payment_date` filled | Payload includes both fields; payment recorded on server |
| 2.6 | Change unit selection after picking one | Price bar updates to new unit's monthly rent; contract number auto-regenerates |

---

## 3. ContractModal — Edit Flow

| # | Step | Expected Result |
|---|------|-----------------|
| 3.1 | Open edit on a contract **with no payments** | All fields editable: unit, start_date, contract_months, status |
| 3.2 | Open edit on a contract **with payments** | `unit`, `start_date`, `contract_months` are **disabled** with "Locked — payments exist" hint |
| 3.3 | Change status to "expired", save | Updates successfully with no extra fields required |
| 3.4 | Change status to "terminated" | Extra fields appear: Termination Date, Termination Reason (both required) |
| 3.5 | Save terminated status without filling reason | Validation error from server / required field message |
| 3.6 | Fill termination date + reason, save | PATCH sends `status: "terminated"`, `termination_date`, `termination_reason` |

---

## 4. PaymentModal — Record Additional Payment

| # | Step | Expected Result |
|---|------|-----------------|
| 4.1 | On a contract row with `outstanding_balance > 0`, click action menu → "Add Payment" | PaymentModal opens showing contract number and outstanding balance |
| 4.2 | Enter `additional_amount_paid = 30000`, select `payment_date`, save | `POST /contracts/{uuid}/payments` called; success toast; list refreshes |
| 4.3 | Enter amount exceeding outstanding balance | Server returns validation error displayed in modal |
| 4.4 | Click Cancel | Modal closes, no API call, no data change |
| 4.5 | "Add Payment" action is **hidden** when contract status is "terminated" | Menu does not show the option |
| 4.6 | "Add Payment" action is **hidden** when `outstanding_balance = 0` | Menu does not show the option |

---

## 5. TerminateModal — Contract Termination

| # | Step | Expected Result |
|---|------|-----------------|
| 5.1 | On an "active" contract, click action menu → "Terminate" | TerminateModal opens showing contract number and end date |
| 5.2 | Fill `termination_date` and `termination_reason`, click "Terminate Contract" | `PATCH /contracts/{uuid}` called with `status: "terminated"`; success toast; row updates |
| 5.3 | Leave reason empty, submit | Validation error shown in modal |
| 5.4 | "Terminate" action is **hidden** when contract status is not "active" | Menu does not show the option |
| 5.5 | After termination, open contract view modal | Termination date and reason visible in details; finance summary shows used/unused months |

---

## 6. ContractsTab — View Modal & Table

| # | Step | Expected Result |
|---|------|-----------------|
| 6.1 | Click "View" on any contract | ContractViewModal opens with finance summary and transactions |
| 6.2 | Verify header badges | Both `ContractStatusBadge` (e.g. Active) and `PaymentStatusBadge` (e.g. Partial) visible |
| 6.3 | Verify finance summary section | Shows: Expected Total, Paid Total, Refunded Total, Net Collected, Outstanding Balance |
| 6.4 | Contract with transactions | Transaction list shows Payment/Refund badges with amounts and dates |
| 6.5 | Table column header | Shows "Expected Total" instead of "Amount" |
| 6.6 | Row with outstanding balance | Shows due amount in amber text below expected total |
| 6.7 | Row with `contract_months` | Shows "X mo" badge in Period column |

---

## 7. ReportsTab — Summary Cards & Chart

| # | Step | Expected Result |
|---|------|-----------------|
| 7.1 | Open Reports tab | 5 summary cards display: Total Contracts, Revenue Collected, Total Expenses, Remaining, Remaining Debts |
| 7.2 | Change range to "3 Months" | Cards reload; API call includes `range=3_months` |
| 7.3 | Select "Custom" range, pick start/end dates | Cards reload; API call includes `start_date` and `end_date` |
| 7.4 | Chart loads | `GET /reports/contracts/chart?period=month&metric=revenue_collected` called |
| 7.5 | Chart data mapping | Bars correspond to `revenue_collected` per month from API |
| 7.6 | Chart on mobile | Horizontal scroll available; all month labels visible (angled at -45°) |
| 7.7 | Switch to another tab, then back to Reports | Silent background refresh occurs; no loading spinner blink; data updates if changed |

---

## 8. Integration — End-to-End Flow

| # | Step | Expected Result |
|---|------|-----------------|
| 8.1 | Create a unit with monthly rent `100000` TZS | Unit appears in list with rent displayed |
| 8.2 | Create a contract for that unit, `contract_months = 12`, initial payment `200000` | Contract creates; expected total = `1,200,000` TZS; payment status = Partial |
| 8.3 | Record additional payment of `300000` | Outstanding balance decreases; payment status may change to Partial or Paid |
| 8.4 | Check Reports tab | Revenue Collected card reflects the `500000` total; chart may include the month |
| 8.5 | Terminate the contract | Contract status changes to Terminated; view modal shows termination info and used/unused months |

---

## Edge Cases

| # | Scenario | Expected Behavior |
|---|----------|-------------------|
| E.1 | Create contract with unit that has `monthly_rent_amount = null` | Computed total shows "—"; server computes expected total or leaves it for later |
| E.2 | Edit a terminated contract | Can change status back? Depends on backend; frontend allows status changes but termination fields only appear for "terminated" |
| E.3 | Rapid tab switching on Reports | No duplicate requests; silent refresh only triggers after first visit |
| E.4 | Backend returns `payment_status` values outside `unpaid/partial/paid` | Badge falls back to "Unpaid" styling with gray background |

---

## API Endpoints to Monitor

| Endpoint | Method | Used By |
|----------|--------|---------|
| `/app/v1/units` | POST/PATCH | UnitModal (rent fields) |
| `/app/v1/customer-contracts` | POST | ContractModal (create) |
| `/app/v1/customer-contracts/{uuid}` | PATCH | ContractModal (edit), TerminateModal |
| `/app/v1/customer-contracts/{uuid}/payments` | POST | PaymentModal |
| `/app/v1/reports/contracts/summary-cards` | GET | ReportsTab (cards) |
| `/app/v1/reports/contracts/chart` | GET | ReportsTab (chart) |

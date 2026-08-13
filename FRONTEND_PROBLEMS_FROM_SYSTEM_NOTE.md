# Frontend Problems from `system-note.docx`

This file includes only open frontend/UI/UX issues extracted from the note. Backend automation, business-rule logic, and accounting posting logic are intentionally excluded.

## Global UI

1. Filter behavior is inconsistent across screens.
2. Some screens are missing important filters such as `Created by`, creation date, payment date, and contracts without assigned workers.
3. Filter UX should be standardized to match the existing `Musaed` pattern used as the benchmark.
4. Excel export formatting is poor and needs a cleaner, more structured presentation.

## Customer Creation

1. The nationality dropdown contains incorrect or irrelevant options for the expected customer data set.
2. The date of birth field should support Hijri dates instead of relying on Gregorian input only.
3. The city field is auto-converted to English unexpectedly.
4. The add-customer form does not clearly prevent duplicates with a visible validation error when the customer already exists.

## Mediation Contracts

1. The contract creation form shows unnecessary fields such as `Musaned contract number`, `documentation number`, and `contract classification`.
2. The selected worker photo does not appear in the contract details after creation; only the worker name and passport number are shown.

## Operating Contracts

1. Contract duration options are displayed as raw numeric values like `1`, `2`, and `3` instead of user-friendly labels such as `Monthly`, `Quarterly`, `Semi-annual`, and `Annual`.
2. The operating contract flow is missing a client handover/receipt form that can be printed and signed.

## Accounting UI

1. The journal entry screen design does not match the expected `Musaed` layout.
2. Accounting search and filter controls are not aligned with the expected `Musaed` filtering experience.
3. Journal entry listings should visibly show related contract numbers and clearer serial ordering.
4. Partial payment status is not clearly represented in the UI; users need a visible `Partially Paid` state and remaining-balance indicator.
5. Journal entries should support clearer ordering and display by date and serial number.
6. Ledger navigation is weak; opening an entry should show its details directly instead of forcing the user back through the journal entries list.
7. Account statement entries do not clearly show which customer the entry belongs to; they currently expose only the generic customer account label.
8. Manual entry UI does not clearly expose customer context and customer selection.

## Follow-up Screen

1. Follow-up settings changes are not reflected immediately in the UI; newly added steps are not visible without a workaround.
2. The follow-up screen is missing UI for adding an authorization and selecting the bank for that authorization.

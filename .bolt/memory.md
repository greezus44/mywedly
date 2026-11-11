# Project memory

## Product intent & audience

- Event/guest management app with a **Guests** tab for tracking RSVPs across events.
- Guests have first/last names, status, +1 counts, and belong to groups.
- Status categories: **attending, declined, pending, not invited**, plus **+1** indicator.
- Bilingual support: guest names exist in **two languages**, both searchable.

## Brand personality & voice

- Clear, practical, plain-language UI copy (e.g., "Search guests by name", "No guests match your search").
- No marketing tone; utility-focused.

## Visual design & UX direction

- **Responsive**: works on phone and desktop; search field at top of Guests tab for both.
- Guests tab includes an **activity panel** with a **status key** below it.
- Status key lists five items with icons: Attending, Declined, Pending, Not invited, Plus-one.
- Two list modes: **grouped view** and **sorted view**.
- Status tabs and an event selector coexist with search.
- Search is live (filter-as-you-type) with a clear/reset control.
- Counts update to reflect currently shown guests.
- Empty state shown when no guests match.
- Existing interactions (select, export, edit) remain functional during active search.
- **Phone**: status key must fit on **one line** (tighter spacing, slightly smaller text); desktop layout unchanged.

## Decisions, constraints & rationale

- **Name-only search**: matches first, last, and full names in both supported languages; does **not** search email or phone.
- **Hide non-matching**: guests and groups with no matches are hidden entirely (not greyed/dimmed).
- Matching is **case-insensitive** and tolerates extra whitespace.
- Search composes with status tabs and event selector (all filters apply together).
- Clearing search restores the full list unchanged.
- Phone status key: single-line layout prioritized over ideal spacing.

## Open questions & assumptions

- Which two languages are supported? (not yet specified)
- What defines a "group" — household, table, or custom? (assumed household/social grouping)
- If five key items don't fit on very narrow phones: shorten labels or allow horizontal scroll? (unresolved)
- Should the key be collapsible on phones? (unresolved)
- Should single-line key style apply to tablet/desktop too, or phones only? (assumed phones only)
- Is "pending" the same as the earlier "no reply" status, or a distinct category?
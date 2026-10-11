# Development updates

One concise entry per completed development update, newest first. Dates use Asia/Shanghai. Earlier entries cover work confirmed in this chat, not a complete historical record.

## 2026-10-08

- Seeded six fictional demo venues and 18 courts (one under maintenance), with daily hours and evening prices; added a repeatable, insert-only seed command. Checks: repeat run created no duplicates; discovery filters, all venue availability and peak prices passed; six cards rendered on desktop with no mobile horizontal overflow; 30 tests passed. No accounts, bookings, or payments created; community pages retain static samples.
- Added this update log, linked it from the README, and added instructions to maintain it after future changes. Check: documentation links and formatting reviewed.

## 2026-10-06

- Cleaned public and admin spacing, card styles, typography, and responsive navigation; added active admin route states. Checks: TypeScript passed; 30 tests passed; desktop and mobile layouts reviewed.
- Added static Open Play, Events, Clubs, and Manage pages with connected desktop and mobile navigation. Checks: TypeScript passed; rendered layouts reviewed. Session, event, club, and dashboard data are samples.
- Replaced white pickleball spots with transparent cutouts in both SVGs and all PNG exports. Check: generated assets visually reviewed.
- Recreated the main logo; added SVGs, favicon, Apple touch icon, app icons, social artwork, and manifest; updated player and admin branding. Checks: export dimensions verified; TypeScript passed. Production build did not complete.

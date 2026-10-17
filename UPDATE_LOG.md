# Development updates

One concise entry per completed development update, newest first. Dates use Asia/Shanghai. Earlier entries cover work confirmed in this chat, not a complete historical record.

## 2026-10-17

- Standardized spacing across discovery, community, My Activity, and administrator screens; tightened oversized hero/section gaps and empty states, increased mobile bottom clearance, and moved the demo controls away from page headings. Checks: rendered desktop/mobile visual review, TypeScript, 30 unit tests, production build, and all ten desktop/mobile browser workflows passed; the existing metadataBase warning remains.

## 2026-10-16

- Replaced the static Events screen with a public demo event board: guests can filter and inspect events, signed-in players can register/cancel, players can host an event at an active venue, and registrations appear in My Activity. Checks: TypeScript, 30 unit tests, production build, and all ten desktop/mobile browser workflows passed; events and fees remain browser-local simulations without production APIs or payment collection.
- Upgraded the player Bookings area into a responsive My Activity dashboard that combines court rentals, payment/status summaries, joined Open Play sessions, and direct find/leave actions. Checks: TypeScript, 30 unit tests, production build, and all eight desktop/mobile browser workflows passed; activity data remains browser-local in demo mode and the existing metadataBase build warning remains.
- Replaced the static Clubs page with a public demo directory: guests can filter and inspect club details, signed-in players can join/leave, and players can create a public club using an active home venue, schedule, and description. Checks: eight desktop/mobile browser workflows passed; club membership remains browser-local without production moderation, invitations, or messaging.
- Added a persistent Guest demo perspective: public visitors can browse Open Play but receive sign-in prompts when joining or creating; the create form now selects from active venues and explains public visibility, and dialogs render above demo controls on mobile. Checks: TypeScript and six desktop/mobile browser workflows passed; guest identity and session visibility remain browser-local demo behavior.
- Made Open Play testable with resettable demo sessions, Today/Tomorrow/This Week and skill-level filters, join/leave queue actions, live player/spot counts, and player-created sessions that persist in browser storage. Checks: TypeScript and six desktop/mobile browser workflows passed; Open Play remains demo-only without a production API or notifications.
- Repaired Bookings → Find a court and the mobile Discover search: players can now search temporary venues by name/city/province, clear results, and open any venue directly into date/time selection. Check: desktop/mobile player journey covers booking history through searching and opening another court; all four browser workflows passed.
- Removed the operator Manage entry from the desktop player navigation while retaining it for Facility Operator and Platform Admin demo roles, matching the existing mobile role boundary. Check: desktop/mobile player and administrator browser workflows passed.
- Added an opt-in UI demo mode with resettable browser data and Player/Facility Operator/Platform Admin role switching; the player journey now covers court selection, review, pay-at-venue or simulated GCash/Card payment, receipt, booking history and cancellation, while operator/admin flows support facility changes and booking check-in/cancellation. Checks: TypeScript, 30 unit tests, production build, and four desktop/mobile browser workflows passed. Demo changes persist only in browser storage; payments are simulations and Supabase/email remain untested.

## 2026-10-08

- Seeded six fictional demo venues and 18 courts (one under maintenance), with daily hours and evening prices; added a repeatable, insert-only seed command. Checks: repeat run created no duplicates; discovery filters, all venue availability and peak prices passed; six cards rendered on desktop with no mobile horizontal overflow; 30 tests passed. No accounts, bookings, or payments created; community pages retain static samples.
- Added this update log, linked it from the README, and added instructions to maintain it after future changes. Check: documentation links and formatting reviewed.

## 2026-10-06

- Cleaned public and admin spacing, card styles, typography, and responsive navigation; added active admin route states. Checks: TypeScript passed; 30 tests passed; desktop and mobile layouts reviewed.
- Added static Open Play, Events, Clubs, and Manage pages with connected desktop and mobile navigation. Checks: TypeScript passed; rendered layouts reviewed. Session, event, club, and dashboard data are samples.
- Replaced white pickleball spots with transparent cutouts in both SVGs and all PNG exports. Check: generated assets visually reviewed.
- Recreated the main logo; added SVGs, favicon, Apple touch icon, app icons, social artwork, and manifest; updated player and admin branding. Checks: export dimensions verified; TypeScript passed. Production build did not complete.

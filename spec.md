# Expense-G

## Current State
Expense-G is a personal expense tracking PWA with Internet Identity login. The app has a Header with desktop nav, DashboardPage with KPI cards and charts, TransactionsPage, BudgetsPage, and a Footer. It uses React + Tailwind + TypeScript. The layout is mostly desktop-first with some responsive classes.

## Requested Changes (Diff)

### Add
- PWA manifest (manifest.json) with app name, icons, theme color, display standalone
- Service worker registration for offline support
- Apple-specific PWA meta tags (apple-mobile-web-app-capable, apple-touch-icon, etc.)
- Bottom navigation bar for mobile (replaces header nav on small screens)
- Mobile-optimized layout: larger touch targets, stacked cards on mobile

### Modify
- index.html: add PWA meta tags, manifest link, theme-color
- Header: hide nav links on mobile (use bottom nav instead), keep logo and user actions
- App.tsx: add bottom mobile nav bar component
- DashboardPage: ensure all cards and tables are mobile-friendly (horizontal scroll for table, stacked analytics cards)
- Footer: simplify on mobile

### Remove
- Nothing removed

## Implementation Plan
1. Create public/manifest.json with PWA config
2. Create a simple service worker (public/sw.js)
3. Update index.html with PWA meta tags, manifest link, apple tags
4. Add MobileNav component with bottom tab bar (Dashboard, Transactions, Budgets icons)
5. Update Header to hide nav on mobile
6. Update App.tsx to include MobileNav and add pb-16 on mobile for bottom nav clearance
7. Ensure DashboardPage table has overflow-x-auto wrapper for mobile
8. Generate a 192x192 and 512x512 app icon

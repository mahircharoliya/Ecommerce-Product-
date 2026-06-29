# Product Explorer

A client-side product browsing app built with React 18 and Vite.
Fetches 100 products once from dummyjson.com, then handles all
search, filtering, sorting, and pagination entirely in the browser.

## Features
- Debounced search (custom useDebounce hook, 300ms)
- Filter by category, min price, and max price
- Sort by price or rating (asc/desc) via clickable column headers
- Paginated results (10 per page) with smart page number list
- Loading, error (with Retry), and empty state handling
- Fetch logic in a reusable useFetch hook with abort-on-unmount guard

## Tech Stack
React 18 · Vite · CSS Modules · No external state/data-fetching libraries

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── App.jsx                  # Root component
├── hooks/
│   ├── useFetch.js          # Data fetching with abort & retry
│   └── useDebounce.js       # Debounce hook (300ms)
└── components/
    ├── SearchBar.jsx
    ├── FilterBar.jsx
    ├── SortableTable.jsx
    ├── Pagination.jsx
    ├── LoadingSpinner.jsx
    ├── ErrorState.jsx
    └── EmptyState.jsx
```

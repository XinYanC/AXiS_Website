# Swapify

## AXiS Marketplace Project: Swapify

Frontend Vite: [swapify](swapify).
Backend Python: [AXiS](https://github.com/XinYanC/AXiS)

## Running the App

### Frontend (Vite)

From the repo root:

```bash
cd swapify
npm install
npm run dev
```

Then open the local URL printed in the terminal (usually http://localhost:5173).

Vite requires Node 20.19+. You can upgrade your Node and run using:

```
nvm install 22
nvm use 22
rm -rf node_modules package-lock.json && npm install
npm run dev
```

### Backend (AXiS)

The backend lives in the separate [AXiS repo](https://github.com/XinYanC/AXiS). Follow that README to install dependencies, configure environment variables, and start the API server. Once running, make sure the frontend points to the backend base URL as described in the AXiS docs.

## Project Structure

The repository has two parts: the frontend app in [swapify](swapify) and the backend in the [AXiS repo](https://github.com/XinYanC/AXiS).

Here is how [Swapify](swapify) is structured:

- [swapify/src/app](swapify/src/app): App shell and root layout (e.g., `App.jsx`).
- [swapify/src/pages](swapify/src/pages): Page-level components routed by URL (e.g., Home, Login, Item Details).
- [swapify/src/components](swapify/src/components): Shared UI components used across pages.
- [swapify/src/api](swapify/src/api): API client helpers and endpoint wrappers.
- [swapify/src/api/tests](swapify/src/api/__tests__): Placeholder tests for API wrappers.
- [swapify/src/styles](swapify/src/styles): Global styles.
- [swapify/public](swapify/public): Static assets served by Vite.

```
swapify/
|_ public/
|_ src/
  |_ app/
  |_ pages/
  |_ components/
  |_ api/
    |_ __tests__/
  |_ styles/
  |_ assets/
```

## User Requirements for Swapify

### General

- **Inspiration**: NYU Swap Store
- Homepage displaying available items listed by students within proximity or school affiliation
- Location-aware browsing and search
- Supports transactions like buying, selling, pickup, and drop-off

### Users

- **Target audience**: students
- Users can create accounts to post items, browse items, and filter by school affiliation and/or location
- Users can edit and delete their own accounts and posts
- User authentication is required for transactions of an item (posting, buying, etc.)
  - Passwords are stored using secure hashing
- Each user provides:
  - school affiliation and a verified school email address
    - School email is validated using a [world university domain database](https://github.com/Hipo/university-domains-list)
  - a default location or dorm

### Item Post

- Each item post includes:
  - a title
  - description
  - one or more images
  - transaction type (buy, sell, pickup, or drop-off)
  - a geographic location (ZIP code or latitude/longitude)
- Each item is associated with the user who posted it
- Users can create, edit, and delete their own item listings
- Items are stored in a shared, global database

### Transactions

- Each item clearly indicates its transaction method
- Transaction methods include:
  - buy
  - sell
  - donation
  - pickup
  - drop-off
- **Stretch goal**: users receive notifications or confirmations when a transaction is completed

### Stretch Goals

- Map or globe-based visualization
- Items can be searched and filtered by distance radius (e.g., within 1 mile)
- Items can be searched by ZIP code or geographic coordinates
- Items can be filtered by school affiliation or dorm
- Recommend items based on proximity to the user
- Automatically derive item location from photo metadata when available
- Transaction notifications

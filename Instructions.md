# App Organization and Running Instructions

## AXiS Marketplace Project: Swapify

Frontend Vite: [swapify](swapify).
Backend Python: [AXiS](https://github.com/XinYanC/AXiS)

## Running the App

### Frontend (Vite)

From the repo root:

```bash
cd swapify
npm install
```

### Run with local backend (http://127.0.0.1:8000)

```bash
nvm use 22
source ./local.sh
```

`local.sh` sets the environment variables and starts the Vite dev server.

### Run with cloud backend (https://xinyanc.pythonanywhere.com)

```bash
nvm use 22
source ./cloud.sh
```

`cloud.sh` sets the environment variables and starts the Vite dev server.

Then open the local URL printed in the terminal, usually http://localhost:5173.

Vite requires Node 20.19+. You can upgrade your Node and run using:

```bash
nvm install 22
nvm use 22
rm -rf node_modules package-lock.json && npm install
npm run dev
```

## Run Tests

Requires Node 22, same as dev:

```bash
nvm use 22
cd swapify
npm test
```

To run a specific subset of tests, for example only pages or only API:

```bash
npm test -- src/pages
npm test -- src/api
```

To run in watch mode during development:

```bash
npm run test:watch
```

## Production Build

```bash
npm run build
```

### Backend (AXiS)

The backend lives in the separate [AXiS repo](https://github.com/XinYanC/AXiS). Follow that README to install dependencies, configure environment variables, and start the API server. Once running, make sure the frontend points to the backend base URL as described in the AXiS docs.

## Project Structure

The repository has two parts: the frontend app in [swapify](swapify) and the backend in the [AXiS repo](https://github.com/XinYanC/AXiS).

Here is how [Swapify](swapify) is structured:

- [swapify/src/app](swapify/src/app): App shell and root layout (for example, `App.jsx`).
- [swapify/src/pages](swapify/src/pages): Page-level components routed by URL (for example, Home, Login, Item Details).
- [swapify/src/components](swapify/src/components): Shared UI components used across pages.
- [swapify/src/api](swapify/src/api): API client helpers and endpoint wrappers.
- [swapify/src/api/**tests**](swapify/src/api/__tests__): Tests for API wrappers.
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

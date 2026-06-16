# Trinexus Developer Companion — Chrome Companion 1.4

**Internal developer tool — BEOCIA Kft. / Trinexus Aqua**
**Not for public distribution. UNLICENSED.**

---

## Overview

Trinexus Developer Companion is an internal productivity and development tool for BEOCIA Kft. developers working on:

- **UNAS webshop API integrations** (trinexus.hu / trinexus.at) — XML-based API client in Python
- **Chrome Extension development** — Smart Tab Manager (Manifest V3)
- **Local API bridge** — lightweight Flask server connecting the Chrome extension to the Python UNAS client

This is a beta tool. Real API calls require a valid UNAS API key. Missing credentials will produce clear errors — no fake responses are ever returned.

---

## Project Structure


trinexus-developer-companion/
├── README.md
├── .env.example
├── requirements.txt
├── main.py                        # CLI entrypoint
├── index.html                     # Developer dashboard (browser)
├── style.css
├── script.js
├── vite.config.js
├── package.json
│
├── unas_client/
│   ├── __init__.py
│   ├── config.py                  # Env var loader, secret masking
│   ├── client.py                  # UnasClient class
│   ├── xml_utils.py               # XML build/parse helpers
│   ├── models.py                  # Dataclasses for API objects
│   └── exceptions.py              # Custom exceptions
│
├── tests/
│   ├── test_xml_utils.py
│   └── test_unas_client_mock.py
│
├── scripts/
│   └── generate_icons.py          # Generates PNG icons via Pillow
│
└── chrome_extension/
    ├── manifest.json              # Manifest V3
    ├── background.js              # Service worker
    ├── popup.html
    ├── popup.css
    ├── popup.js
    └── icons/
        ├── icon-16.png
        ├── icon-32.png
        ├── icon-48.png
        └── icon-128.png

---

## Quick Start

### 1. Clone / unpack the project


cd trinexus-developer-companion

### 2. Create Python virtual environment


python3 -m venv .venv
source .venv/bin/activate        # Linux / macOS
# .venv\Scripts\activate         # Windows

### 3. Install Python dependencies


pip install -r requirements.txt

### 4. Configure environment


cp .env.example .env
# Open .env and paste your real UNAS API key into UNAS_API_KEY

**Never commit `.env` to version control.**

### 5. Generate Chrome Extension icons


python scripts/generate_icons.py

This creates `chrome_extension/icons/icon-{16,32,48,128}.png` using Pillow.
Requires `Pillow` (included in `requirements.txt`).

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `UNAS_API_BASE_URL` | Yes | `https://api.unas.eu/shop/` | UNAS API base URL |
| `UNAS_API_KEY` | Yes | — | Your UNAS API key (never hardcode) |
| `UNAS_SHOP_DOMAIN` | Yes | `trinexus.hu` | Primary shop domain |
| `UNAS_SECONDARY_SHOP_DOMAIN` | No | `trinexus.at` | Secondary shop domain |
| `UNAS_DEFAULT_LANG` | No | `base` | Default language for requests |
| `UNAS_READ_ONLY` | No | `true` | If `true`, blocks all `set*` methods |
| `BRIDGE_HOST` | No | `0.0.0.0` | Local API bridge bind host |
| `BRIDGE_PORT` | No | `8000` | Local API bridge port |

**Read-only mode is the default.** All `set*` methods (setOrder, setProduct, setStock, etc.) are blocked unless `UNAS_READ_ONLY=false` is explicitly set.

---

## Python CLI — Main Commands

All commands require an activated virtual environment and a valid `.env` file.


# Health check — verifies Python environment and config loading
python main.py healthcheck

# Verify live UNAS API connectivity (requires real API key)
python main.py unas-healthcheck

# Fetch order statuses
python main.py get-order-statuses

# Fetch recent orders (default limit: 10)
python main.py get-orders --limit 10

# Fetch active products (default limit: 5)
python main.py get-products --limit 5

# Fetch current stock
python main.py get-stock

# Fetch shipping/payment methods
python main.py get-methods

# Fetch warehouse list
python main.py get-warehouses

### Read-Only Mode Warning

If you attempt a write operation with `UNAS_READ_ONLY=true`:


[SAFETY] Write operation blocked: setOrder
         UNAS_READ_ONLY=true — set UNAS_READ_ONLY=false to enable writes.

---

## Local API Bridge (Optional)

The Flask-based bridge allows the browser dashboard and Chrome extension to query UNAS data without exposing secrets.

**Secrets are never forwarded to the browser.**

### Start the bridge


python main.py serve
# Default: http://localhost:8000

### Available endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Python bridge health check |
| `GET` | `/unas/healthcheck` | UNAS API connectivity check |
| `GET` | `/unas/orders?limit=10` | Fetch recent orders |
| `GET` | `/unas/products?limit=5` | Fetch products |
| `GET` | `/unas/order-statuses` | Fetch order statuses |
| `GET` | `/unas/stock` | Fetch stock data |
| `GET` | `/unas/methods` | Fetch shipping/payment methods |
| `GET` | `/unas/warehouses` | Fetch warehouses |

### Browser Dashboard

After starting the bridge, open the developer dashboard:


npm run dev
# Open http://localhost:3000

The dashboard connects to `http://localhost:8000` by default.
You can change this in the dashboard UI if your bridge runs on a different port.

---

## Chrome Extension — Smart Tab Manager

### Install (Developer Mode)

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `chrome_extension/` folder
5. The extension icon appears in the Chrome toolbar

### Features

| Feature | Description |
|---|---|
| Tab list | All open tabs — favicon, title, truncated URL |
| Search | Filter tabs by title or URL in real time |
| Switch tab | Click any tab entry to jump to it |
| Close tab | × button closes the tab |
| Save session | Saves current tab list to `chrome.storage.local` |
| Restore session | Re-opens all tabs from a saved session |
| Delete session | Removes a saved session |
| Badge count | Extension icon badge shows current open tab count |

### Testing Checklist


[ ] Load extension — no errors in chrome://extensions
[ ] Open popup — no CSP errors in DevTools console
[ ] Tab list renders — shows all open tabs with favicon + title
[ ] Search box filters results by title and URL
[ ] Click a tab entry — switches to that tab
[ ] Click × on a tab — tab is closed, list updates
[ ] Click "Save Session" — session saved to storage
[ ] Saved session appears in the Saved Sessions list
[ ] Click "Restore" — all tabs from session reopen
[ ] Click "Delete" — saved session is removed
[ ] Badge on extension icon shows correct tab count
[ ] Open a new tab — badge count increments
[ ] Close a tab — badge count decrements

### Permissions Used


"permissions": ["tabs", "storage", "activeTab"]

No external network access is requested by the extension.

---

## Python Tests


# Run all tests
python -m pytest tests/ -v

# Run only XML utility tests (no API key needed)
python -m pytest tests/test_xml_utils.py -v

# Run mock client tests (no API key needed)
python -m pytest tests/test_unas_client_mock.py -v

Tests use `unittest.mock` — **no real API calls are made** in the test suite.

---

## UNAS API — Technical Notes

### Authentication Flow

1. POST to `https://api.unas.eu/shop/login` with XML body containing `<ApiKey>`
2. Parse the returned token from the response XML
3. Use `Authorization: Bearer <TOKEN>` header for all subsequent requests
4. Token is cached **in memory only** — never persisted to disk
5. If a request returns an expired token error, the client automatically re-logs in once and retries

### Secret Masking

API keys and tokens are always masked in logs:


[Auth] Using API key: abcd****wxyz
[Auth] Token acquired: eyJh****xK2Q

### XML Request Format


POST https://api.unas.eu/shop/getOrder
Authorization: Bearer <TOKEN>
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<Params>
  <Limit>10</Limit>
</Params>

### Error Handling

| Error | Handling |
|---|---|
| HTTP 400 + XML error | Parsed and raised as `UnasApiError` |
| Expired token | Auto re-login once, then retry |
| Network timeout | Raised as `UnasTimeoutError` after 30s |
| Malformed XML | Raised as `UnasParseError` |
| Missing API key | Raised at startup with clear message |
| Empty response | Raised as `UnasEmptyResponseError` |

---

## Security Rules

- **Never** hardcode API keys or tokens in source files
- **Never** commit `.env` to version control (`.gitignore` includes it)
- **Never** log full API keys or tokens
- **Never** expose secrets via the local API bridge endpoints
- **Never** persist the UNAS bearer token unless explicitly configured
- Read-only mode (`UNAS_READ_ONLY=true`) is the default — always required for beta testing

---

## Requirements

### Python


requests>=2.31.0
httpx>=0.27.0
python-dotenv>=1.0.0
lxml>=5.2.0
flask>=3.0.0
pytest>=8.0.0
Pillow>=10.3.0

### Node.js (Dashboard only)


vite ^5.2.0 (devDependency only)

Node.js is required only to serve the browser dashboard (`npm run dev`).
The Python UNAS client and Chrome extension have **no Node.js dependency**.

---

## Shops Covered

| Shop | Domain | Language |
|---|---|---|
| Trinexus Aqua HU | trinexus.hu | Hungarian (base) |
| Trinexus Aqua AT | trinexus.at | German (de) |

---

## Known Limitations (Beta)

- Live UNAS API calls require a valid API key from the UNAS admin panel
- `set*` operations are intentionally disabled in default read-only mode
- Chrome extension icon badge may lag by ~1 second on rapid tab changes
- The local API bridge does not implement authentication — bind to `localhost` only
- Icon PNG files are generated locally; Pillow must be installed first

---

## Changelog

### v1.4.0 (current)
- Added local API bridge (Flask) with UNAS proxy endpoints
- Added browser developer dashboard (Vite static)
- Read-only mode enforced by default
- Secret masking in all log output
- Mock test suite for xml_utils and unas_client

### v1.3.x
- Initial Chrome Extension Smart Tab Manager
- UNAS XML client — login, getOrder, getProduct, getStock

---

## Author

**BEOCIA Kft.** — Internal Development Team
Trinexus Aqua — Marine retail / boat equipment
Budapest, Hungary | trinexus.hu | trinexus.at

*This tool is for internal use only. Do not distribute.*
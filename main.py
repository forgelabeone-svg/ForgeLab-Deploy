#!/usr/bin/env python3
"""
Trinexus Developer Companion — main.py
CLI entry point for BEOCIA Kft. / Trinexus Aqua internal developer tool.
Chrome Companion 1.4 / Trinexus Developer Companion

Usage:
    python main.py healthcheck
    python main.py get-order-statuses
    python main.py get-orders [--limit N]
    python main.py get-products [--limit N] [--all]
    python main.py get-stock
    python main.py get-methods
    python main.py get-warehouses
    python main.py serve [--port PORT]
"""

import argparse
import logging
import os
import sys

# ---------------------------------------------------------------------------
# Logging setup — mask secrets, structured output
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("trinexus.main")


def _check_env() -> bool:
    """Validate required environment variables are present before doing anything."""
    required = ["UNAS_API_KEY", "UNAS_API_BASE_URL"]
    missing = [v for v in required if not os.environ.get(v)]
    if missing:
        logger.error(
            "Missing required environment variables: %s", ", ".join(missing)
        )
        logger.error(
            "Copy .env.example to .env and fill in your UNAS API credentials."
        )
        logger.error("  cp .env.example .env && nano .env")
        return False
    return True


def _load_dotenv() -> None:
    """
    Minimal .env loader — reads KEY=VALUE pairs from .env file.
    Falls back gracefully if .env does not exist.
    Does NOT use python-dotenv to keep dependencies minimal if preferred,
    but requirements.txt does list python-dotenv for production use.
    """
    try:
        from dotenv import load_dotenv  # type: ignore
        load_dotenv()
        logger.debug(".env loaded via python-dotenv.")
    except ImportError:
        # Fallback: manual parse
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.isfile(env_path):
            with open(env_path, "r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = value
            logger.debug(".env loaded via fallback parser.")
        else:
            logger.warning(
                ".env file not found. Set environment variables manually or run: cp .env.example .env"
            )


def _get_client():
    """Import and instantiate UnasClient. Deferred import to give .env load a chance."""
    try:
        from unas_client.client import UnasClient  # type: ignore
        return UnasClient()
    except ImportError as exc:
        logger.error(
            "Cannot import UnasClient: %s. Make sure unas_client/ package is present "
            "and dependencies are installed: pip install -r requirements.txt",
            exc,
        )
        sys.exit(1)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to initialise UnasClient: %s", exc)
        sys.exit(1)


# ---------------------------------------------------------------------------
# CLI command handlers
# ---------------------------------------------------------------------------

def cmd_healthcheck(_args: argparse.Namespace) -> int:
    """Run healthcheck — login + verify token."""
    if not _check_env():
        return 2
    client = _get_client()
    try:
        result = client.healthcheck()
        if result:
            print("[OK] UNAS API healthcheck passed. Connection and authentication verified.")
        else:
            print("[FAIL] UNAS API healthcheck failed. See log output above for details.")
            return 1
    except Exception as exc:  # noqa: BLE001
        logger.error("Healthcheck error: %s", exc)
        return 1
    return 0


def cmd_get_order_statuses(_args: argparse.Namespace) -> int:
    """Fetch and display all order statuses."""
    if not _check_env():
        return 2
    client = _get_client()
    try:
        statuses = client.get_order_statuses()
        if not statuses:
            print("No order statuses returned. Check API key and shop configuration.")
            return 1
        print(f"\n{'ID':<8} {'Name':<40} {'Color'}")
        print("-" * 64)
        for s in statuses:
            status_id = s.get("id", "—")
            name = s.get("name", "—")
            color = s.get("color", "—")
            print(f"{status_id:<8} {name:<40} {color}")
        print(f"\nTotal: {len(statuses)} order status(es).")
    except Exception as exc:  # noqa: BLE001
        logger.error("get-order-statuses error: %s", exc)
        return 1
    return 0


def cmd_get_orders(args: argparse.Namespace) -> int:
    """Fetch recent orders."""
    if not _check_env():
        return 2
    client = _get_client()
    limit = max(1, min(args.limit, 100))
    try:
        orders = client.get_orders(limit=limit)
        if not orders:
            print("No orders returned. This may be normal for an empty shop or invalid filter.")
            return 0
        print(f"\n{'Order ID':<12} {'Status':<20} {'Total':<14} {'Date'}")
        print("-" * 72)
        for o in orders:
            order_id = o.get("id", "—")
            status = o.get("status", "—")
            total = o.get("total", "—")
            date = o.get("date", "—")
            print(f"{order_id:<12} {status:<20} {total:<14} {date}")
        print(f"\nShowing {len(orders)} order(s) (limit={limit}).")
    except Exception as exc:  # noqa: BLE001
        logger.error("get-orders error: %s", exc)
        return 1
    return 0


def cmd_get_products(args: argparse.Namespace) -> int:
    """Fetch products from the UNAS shop."""
    if not _check_env():
        return 2
    client = _get_client()
    limit = max(1, min(args.limit, 100))
    only_active = not args.all
    try:
        products = client.get_products(limit=limit, only_active=only_active)
        if not products:
            print("No products returned. Check filters or shop configuration.")
            return 0
        print(f"\n{'SKU':<16} {'Name':<40} {'Price':<12} {'Active'}")
        print("-" * 80)
        for p in products:
            sku = p.get("sku", "—")
            name = (p.get("name", "—") or "")[:38]
            price = p.get("price", "—")
            active = "Yes" if p.get("active") else "No"
            print(f"{sku:<16} {name:<40} {price:<12} {active}")
        filter_label = "active only" if only_active else "all"
        print(f"\nShowing {len(products)} product(s) [{filter_label}] (limit={limit}).")
    except Exception as exc:  # noqa: BLE001
        logger.error("get-products error: %s", exc)
        return 1
    return 0


def cmd_get_stock(_args: argparse.Namespace) -> int:
    """Fetch stock levels."""
    if not _check_env():
        return 2
    client = _get_client()
    try:
        stock_items = client.get_stock()
        if not stock_items:
            print("No stock data returned.")
            return 0
        print(f"\n{'SKU':<16} {'Qty':<10} {'Warehouse'}")
        print("-" * 48)
        for item in stock_items:
            sku = item.get("sku", "—")
            qty = item.get("qty", "—")
            warehouse = item.get("warehouse", "default")
            print(f"{sku:<16} {qty:<10} {warehouse}")
        print(f"\nTotal: {len(stock_items)} stock record(s).")
    except Exception as exc:  # noqa: BLE001
        logger.error("get-stock error: %s", exc)
        return 1
    return 0


def cmd_get_methods(_args: argparse.Namespace) -> int:
    """Fetch payment/shipping methods."""
    if not _check_env():
        return 2
    client = _get_client()
    try:
        methods = client.get_methods()
        if not methods:
            print("No methods returned.")
            return 0
        print(f"\n{'ID':<10} {'Type':<14} {'Name'}")
        print("-" * 60)
        for m in methods:
            method_id = m.get("id", "—")
            mtype = m.get("type", "—")
            name = m.get("name", "—")
            print(f"{method_id:<10} {mtype:<14} {name}")
        print(f"\nTotal: {len(methods)} method(s).")
    except Exception as exc:  # noqa: BLE001
        logger.error("get-methods error: %s", exc)
        return 1
    return 0


def cmd_get_warehouses(_args: argparse.Namespace) -> int:
    """Fetch warehouse list."""
    if not _check_env():
        return 2
    client = _get_client()
    try:
        warehouses = client.get_warehouses()
        if not warehouses:
            print("No warehouses returned.")
            return 0
        print(f"\n{'ID':<10} {'Name':<30} {'Active'}")
        print("-" * 52)
        for w in warehouses:
            wid = w.get("id", "—")
            name = w.get("name", "—")
            active = "Yes" if w.get("active") else "No"
            print(f"{wid:<10} {name:<30} {active}")
        print(f"\nTotal: {len(warehouses)} warehouse(s).")
    except Exception as exc:  # noqa: BLE001
        logger.error("get-warehouses error: %s", exc)
        return 1
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    """Start optional local Flask/FastAPI bridge for Chrome extension."""
    if not _check_env():
        return 2
    port = args.port
    logger.info("Starting local API bridge on http://127.0.0.1:%d", port)
    logger.info("Endpoints: /health  /unas/healthcheck  /unas/orders  /unas/products  /unas/order-statuses")
    try:
        from api_bridge import create_app  # type: ignore
        app = create_app()
        # Prefer uvicorn (FastAPI) else fall back to Flask dev server
        try:
            import uvicorn  # type: ignore
            uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
        except ImportError:
            app.run(host="127.0.0.1", port=port, debug=False)
    except ImportError:
        logger.error(
            "api_bridge module not found. Install FastAPI/Flask and create api_bridge.py."
        )
        return 1
    return 0


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="trinexus-companion",
        description=(
            "Trinexus Developer Companion — BEOCIA Kft. internal developer tool.\n"
            "Manages UNAS webshop API integrations and Chrome Extension testing.\n\n"
            "Read-only mode is ON by default (UNAS_READ_ONLY=true).\n"
            "Set UNAS_READ_ONLY=false in .env to enable write operations."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python main.py healthcheck\n"
            "  python main.py get-order-statuses\n"
            "  python main.py get-orders --limit 10\n"
            "  python main.py get-products --limit 5\n"
            "  python main.py get-products --limit 20 --all\n"
            "  python main.py get-stock\n"
            "  python main.py get-methods\n"
            "  python main.py get-warehouses\n"
            "  python main.py serve --port 8080\n"
        ),
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug-level logging output.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="Trinexus Developer Companion v1.4.0 — BEOCIA Kft.",
    )

    subparsers = parser.add_subparsers(dest="command", metavar="COMMAND")
    subparsers.required = True

    # healthcheck
    subparsers.add_parser(
        "healthcheck",
        help="Test UNAS API connection and authentication.",
    )

    # get-order-statuses
    subparsers.add_parser(
        "get-order-statuses",
        help="List all order statuses configured in the UNAS shop.",
    )

    # get-orders
    p_orders = subparsers.add_parser(
        "get-orders",
        help="Retrieve recent orders from UNAS.",
    )
    p_orders.add_argument(
        "--limit",
        type=int,
        default=10,
        metavar="N",
        help="Maximum number of orders to fetch (default: 10, max: 100).",
    )

    # get-products
    p_products = subparsers.add_parser(
        "get-products",
        help="Retrieve products from the UNAS shop.",
    )
    p_products.add_argument(
        "--limit",
        type=int,
        default=5,
        metavar="N",
        help="Maximum number of products to fetch (default: 5, max: 100).",
    )
    p_products.add_argument(
        "--all",
        action="store_true",
        help="Include inactive products (default: active only).",
    )

    # get-stock
    subparsers.add_parser(
        "get-stock",
        help="Retrieve current stock levels.",
    )

    # get-methods
    subparsers.add_parser(
        "get-methods",
        help="List payment and shipping methods.",
    )

    # get-warehouses
    subparsers.add_parser(
        "get-warehouses",
        help="List warehouses configured in UNAS.",
    )

    # serve
    p_serve = subparsers.add_parser(
        "serve",
        help="Start local API bridge for Chrome extension (optional).",
    )
    p_serve.add_argument(
        "--port",
        type=int,
        default=8080,
        metavar="PORT",
        help="Port for local API bridge server (default: 8080).",
    )

    return parser


# ---------------------------------------------------------------------------
# Command dispatch table
# ---------------------------------------------------------------------------

COMMAND_MAP = {
    "healthcheck": cmd_healthcheck,
    "get-order-statuses": cmd_get_order_statuses,
    "get-orders": cmd_get_orders,
    "get-products": cmd_get_products,
    "get-stock": cmd_get_stock,
    "get-methods": cmd_get_methods,
    "get-warehouses": cmd_get_warehouses,
    "serve": cmd_serve,
}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    _load_dotenv()

    parser = build_parser()
    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled.")

    read_only_raw = os.environ.get("UNAS_READ_ONLY", "true").strip().lower()
    read_only = read_only_raw != "false"

    if read_only:
        logger.info(
            "Safety mode: UNAS_READ_ONLY=true — write operations (set*) are DISABLED."
        )
    else:
        logger.warning(
            "Safety mode: UNAS_READ_ONLY=false — write operations are ENABLED. "
            "Be careful with destructive API calls."
        )

    handler = COMMAND_MAP.get(args.command)
    if handler is None:
        logger.error("Unknown command: %s", args.command)
        parser.print_help()
        return 1

    print(
        f"\n{'=' * 60}\n"
        f"  Trinexus Developer Companion v1.4.0\n"
        f"  BEOCIA Kft. / Trinexus Aqua — Internal Tool\n"
        f"  Command : {args.command}\n"
        f"  ReadOnly: {'YES (set* methods blocked)' if read_only else 'NO (write enabled)'}\n"
        f"{'=' * 60}\n"
    )

    exit_code = handler(args)

    if exit_code == 0:
        print(f"\n[DONE] Command '{args.command}' completed successfully.\n")
    elif exit_code == 2:
        print(f"\n[ABORT] Command '{args.command}' aborted: missing environment configuration.\n")
        print("  Run:  cp .env.example .env")
        print("  Then: edit .env and add your UNAS_API_KEY\n")
    else:
        print(f"\n[ERROR] Command '{args.command}' finished with errors. Check log output above.\n")

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
// [FL:DONE]
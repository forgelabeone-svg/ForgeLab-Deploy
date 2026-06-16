"""
unas_client/client.py

Main UnasClient class for the UNAS XML API.
Handles authentication, token caching, request dispatch, and all supported
read (and optional write) endpoints.

BEOCIA Kft. / Trinexus Aqua — internal developer tool.
Chrome Companion 1.4 / Trinexus Developer Companion

Safety: UNAS_READ_ONLY=true (default) blocks all set* methods.
Token: cached in memory only — never persisted to disk.
Secrets: masked in logs — never printed in full.
"""

import logging
import time
from typing import Any, Dict, List, Optional

try:
    import requests  # type: ignore
except ImportError:
    requests = None  # type: ignore

try:
    from unas_client.config import UnasConfig  # type: ignore
    from unas_client.xml_utils import (  # type: ignore
        build_xml,
        parse_xml,
        xml_to_dict,
        extract_text,
        extract_error,
    )
    from unas_client.exceptions import (  # type: ignore
        UnasAuthError,
        UnasReadOnlyError,
        UnasAPIError,
        UnasNetworkError,
        UnasXMLError,
    )
except ImportError:
    # Graceful fallback so the module can be imported even in minimal environments
    UnasConfig = None  # type: ignore
    build_xml = parse_xml = xml_to_dict = extract_text = extract_error = None  # type: ignore
    UnasAuthError = UnasReadOnlyError = UnasAPIError = UnasNetworkError = UnasXMLError = Exception  # type: ignore

logger = logging.getLogger(__name__)

# Default network timeout in seconds
DEFAULT_TIMEOUT = 30


def _mask(value: str, visible: int = 4) -> str:
    """Mask a secret for safe logging."""
    if not value:
        return "(empty)"
    if len(value) <= visible * 2:
        return "****"
    return f"{value[:visible]}****{value[-visible:]}"


class UnasClient:
    """
    Reusable Python client for the UNAS XML-based webshop API.

    Usage:
        cfg = UnasConfig.from_env()
        client = UnasClient(cfg)
        client.login()
        statuses = client.get_order_statuses()
    """

    def __init__(self, config: Any) -> None:
        if config is None:
            raise RuntimeError(
                "[UnasClient] Config is None. "
                "Make sure UnasConfig.from_env() ran successfully."
            )
        self.config = config
        self._token: Optional[str] = None
        self._token_acquired_at: Optional[float] = None
        # UNAS tokens typically last ~60 minutes; we refresh after 55 min
        self._token_ttl_seconds: int = 55 * 60

        if requests is None:
            raise RuntimeError(
                "[UnasClient] 'requests' package is not installed. "
                "Run: pip install requests"
            )

        logger.info(
            "[UnasClient] Initialized for shop: %s | read_only=%s",
            self.config.shop_domain,
            self.config.read_only,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _is_token_valid(self) -> bool:
        """Return True if a cached token exists and has not expired."""
        if not self._token or self._token_acquired_at is None:
            return False
        elapsed = time.time() - self._token_acquired_at
        return elapsed < self._token_ttl_seconds

    def _assert_write_allowed(self, method_name: str) -> None:
        """Raise UnasReadOnlyError if the client is in read-only mode."""
        if self.config.read_only:
            msg = (
                f"[UnasClient] WRITE OPERATION BLOCKED: '{method_name}' is a "
                f"destructive call and UNAS_READ_ONLY=true. "
                f"Set UNAS_READ_ONLY=false to enable write operations."
            )
            logger.warning(msg)
            raise UnasReadOnlyError(msg)

    def _build_auth_headers(self) -> Dict[str, str]:
        """Build Authorization header using cached Bearer token."""
        if not self._token:
            raise UnasAuthError(
                "[UnasClient] No token available. Call login() first."
            )
        return {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/xml",
            "Accept": "application/xml",
        }

    def _post_raw(
        self,
        function_name: str,
        xml_body: str,
        headers: Optional[Dict[str, str]] = None,
    ) -> str:
        """
        Low-level HTTP POST to the UNAS API.
        Returns raw response text.
        Raises UnasNetworkError on timeout/connection errors.
        Raises UnasAPIError on non-200 HTTP status.
        """
        url = f"{self.config.base_url.rstrip('/')}/{function_name}"
        logger.info("[UnasClient] POST → %s", function_name)

        if headers is None:
            headers = {
                "Content-Type": "application/xml",
                "Accept": "application/xml",
            }

        try:
            response = requests.post(
                url,
                data=xml_body.encode("utf-8"),
                headers=headers,
                timeout=DEFAULT_TIMEOUT,
            )
        except requests.exceptions.Timeout:
            raise UnasNetworkError(
                f"[UnasClient] Request to '{function_name}' timed out "
                f"after {DEFAULT_TIMEOUT}s."
            )
        except requests.exceptions.ConnectionError as exc:
            raise UnasNetworkError(
                f"[UnasClient] Connection error on '{function_name}': {exc}"
            )

        logger.info(
            "[UnasClient] Response ← %s | HTTP %d | %d bytes",
            function_name,
            response.status_code,
            len(response.content),
        )

        if not response.text.strip():
            raise UnasAPIError(
                f"[UnasClient] Empty response from '{function_name}'. "
                f"HTTP {response.status_code}."
            )

        if response.status_code >= 400:
            err_msg = self._extract_error_from_response(response.text)
            raise UnasAPIError(
                f"[UnasClient] API error on '{function_name}' "
                f"(HTTP {response.status_code}): {err_msg}"
            )

        return response.text

    def _extract_error_from_response(self, xml_text: str) -> str:
        """Try to extract a human-readable error message from an XML error response."""
        try:
            if extract_error is not None and callable(extract_error):
                return extract_error(xml_text)
        except Exception:
            pass
        # Fallback: return truncated raw text (no PII concern for error bodies)
        return xml_text[:300] if xml_text else "(no body)"

    # ------------------------------------------------------------------
    # Public API — Authentication
    # ------------------------------------------------------------------

    def login(self, webshop_info: bool = False) -> None:
        """
        Authenticate with the UNAS API using the configured API key.
        Caches the returned Bearer token in memory.

        Args:
            webshop_info: If True, request webshop metadata in login response.
        """
        logger.info(
            "[UnasClient] Logging in with API key: %s",
            _mask(self.config.api_key),
        )

        webshop_tag = "<WebshopInfo>true</WebshopInfo>" if webshop_info else ""
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>"
            f"<ApiKey>{self.config.api_key}</ApiKey>"
            f"{webshop_tag}"
            f"</Params>"
        )

        raw = self._post_raw("login", xml_body)

        try:
            if parse_xml is not None and callable(parse_xml):
                root = parse_xml(raw)
                # Token is in <Token> element
                token = None
                token_el = root.find(".//Token")
                if token_el is not None and token_el.text:
                    token = token_el.text.strip()

                if not token:
                    # Try alternative location
                    token_el = root.find("Token")
                    if token_el is not None and token_el.text:
                        token = token_el.text.strip()
            else:
                # Minimal fallback XML parse
                import xml.etree.ElementTree as ET
                root = ET.fromstring(raw)
                token_el = root.find(".//Token")
                token = token_el.text.strip() if token_el is not None and token_el.text else None

            if not token:
                raise UnasAuthError(
                    "[UnasClient] Login response did not contain a Token. "
                    f"Response: {raw[:200]}"
                )

            self._token = token
            self._token_acquired_at = time.time()
            logger.info(
                "[UnasClient] Login successful. Token: %s",
                _mask(self._token, visible=4),
            )

        except (UnasAuthError, UnasNetworkError, UnasAPIError):
            raise
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse login response: {exc}\n"
                f"Raw response (first 300 chars): {raw[:300]}"
            ) from exc

    def _ensure_logged_in(self) -> None:
        """Ensure a valid token is available, re-logging in if necessary."""
        if not self._is_token_valid():
            logger.info("[UnasClient] Token missing or expired — re-authenticating.")
            self.login()

    # ------------------------------------------------------------------
    # Public API — Generic request dispatcher
    # ------------------------------------------------------------------

    def request(self, function_name: str, xml_body: str) -> str:
        """
        Send an authenticated XML request to any UNAS API function.

        Args:
            function_name: UNAS endpoint name, e.g. 'getOrder', 'getProduct'.
            xml_body: Raw XML string payload.

        Returns:
            Raw XML response string.
        """
        self._ensure_logged_in()
        try:
            return self._post_raw(
                function_name, xml_body, headers=self._build_auth_headers()
            )
        except UnasAuthError:
            # Token may have expired server-side — retry once
            logger.warning("[UnasClient] Auth error — retrying login once.")
            self._token = None
            self._token_acquired_at = None
            self.login()
            return self._post_raw(
                function_name, xml_body, headers=self._build_auth_headers()
            )

    # ------------------------------------------------------------------
    # Public API — Read operations
    # ------------------------------------------------------------------

    def healthcheck(self) -> Dict[str, Any]:
        """
        Verify connectivity and authentication with the UNAS API.
        Attempts login and returns status information.

        Returns:
            Dict with keys: ok (bool), token_masked (str), shop (str), message (str)
        """
        logger.info("[UnasClient] Running healthcheck for shop: %s", self.config.shop_domain)
        try:
            self._ensure_logged_in()
            return {
                "ok": True,
                "token_masked": _mask(self._token or "", visible=4),
                "shop": self.config.shop_domain,
                "base_url": self.config.base_url,
                "read_only": self.config.read_only,
                "message": "UNAS API connection OK.",
            }
        except (UnasAuthError, UnasNetworkError, UnasAPIError, UnasXMLError) as exc:
            logger.error("[UnasClient] Healthcheck failed: %s", exc)
            return {
                "ok": False,
                "token_masked": None,
                "shop": self.config.shop_domain,
                "base_url": self.config.base_url,
                "read_only": self.config.read_only,
                "message": str(exc),
            }

    def get_order_statuses(self) -> List[Dict[str, str]]:
        """
        Retrieve all order statuses defined in the UNAS webshop.

        Returns:
            List of dicts: [{"id": ..., "name": ..., ...}, ...]
        """
        logger.info("[UnasClient] Fetching order statuses.")
        xml_body = "<?xml version='1.0' encoding='UTF-8'?><Params></Params>"
        raw = self.request("getOrderStatus", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            statuses = []
            for status_el in root.findall(".//Status"):
                entry: Dict[str, str] = {}
                for child in status_el:
                    entry[child.tag] = (child.text or "").strip()
                if entry:
                    statuses.append(entry)
            logger.info("[UnasClient] Retrieved %d order statuses.", len(statuses))
            return statuses
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getOrderStatus response: {exc}"
            ) from exc

    def get_orders(
        self,
        limit: int = 10,
        status_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve orders from the UNAS webshop.

        Args:
            limit:      Maximum number of orders to retrieve (default 10).
            status_id:  Filter by order status ID (optional).
            date_from:  Filter from date, format YYYY-MM-DD (optional).
            date_to:    Filter to date, format YYYY-MM-DD (optional).

        Returns:
            List of order dicts.
        """
        logger.info("[UnasClient] Fetching orders (limit=%d).", limit)

        params_inner = f"<Limit>{limit}</Limit>"
        if status_id:
            params_inner += f"<StatusId>{status_id}</StatusId>"
        if date_from:
            params_inner += f"<DateFrom>{date_from}</DateFrom>"
        if date_to:
            params_inner += f"<DateTo>{date_to}</DateTo>"

        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>{params_inner}</Params>"
        )
        raw = self.request("getOrder", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            orders = []
            for order_el in root.findall(".//Order"):
                order: Dict[str, Any] = {}
                for child in order_el:
                    # Skip sub-elements with children (nested structures)
                    if len(child) == 0:
                        order[child.tag] = (child.text or "").strip()
                    else:
                        # Serialize nested element tag as present
                        order[child.tag] = f"<{child.tag}:nested>"
                orders.append(order)
            logger.info("[UnasClient] Retrieved %d orders.", len(orders))
            return orders
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getOrder response: {exc}"
            ) from exc

    def get_products(
        self,
        limit: int = 10,
        only_active: bool = True,
        category_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve products from the UNAS webshop.

        Args:
            limit:       Maximum number of products (default 10).
            only_active: If True, return only active/enabled products.
            category_id: Filter by category ID (optional).

        Returns:
            List of product dicts.
        """
        logger.info(
            "[UnasClient] Fetching products (limit=%d, only_active=%s).",
            limit,
            only_active,
        )

        state_filter = "<State>1</State>" if only_active else ""
        cat_filter = f"<CategoryId>{category_id}</CategoryId>" if category_id else ""
        params_inner = f"<Limit>{limit}</Limit>{state_filter}{cat_filter}"

        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>{params_inner}</Params>"
        )
        raw = self.request("getProduct", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            products = []
            for prod_el in root.findall(".//Product"):
                prod: Dict[str, Any] = {}
                for child in prod_el:
                    if len(child) == 0:
                        prod[child.tag] = (child.text or "").strip()
                    else:
                        prod[child.tag] = f"<{child.tag}:nested>"
                products.append(prod)
            logger.info("[UnasClient] Retrieved %d products.", len(products))
            return products
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getProduct response: {exc}"
            ) from exc

    def get_stock(self, product_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve stock information.

        Args:
            product_id: If provided, fetch stock for a single product.

        Returns:
            List of stock dicts.
        """
        logger.info("[UnasClient] Fetching stock (product_id=%s).", product_id or "all")

        params_inner = ""
        if product_id:
            params_inner = f"<ProductId>{product_id}</ProductId>"

        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>{params_inner}</Params>"
        )
        raw = self.request("getStock", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            items = []
            for stock_el in root.findall(".//Stock"):
                item: Dict[str, Any] = {}
                for child in stock_el:
                    if len(child) == 0:
                        item[child.tag] = (child.text or "").strip()
                items.append(item)
            logger.info("[UnasClient] Retrieved %d stock entries.", len(items))
            return items
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getStock response: {exc}"
            ) from exc

    def get_methods(self) -> List[Dict[str, str]]:
        """
        Retrieve payment and shipping methods defined in the webshop.

        Returns:
            List of method dicts.
        """
        logger.info("[UnasClient] Fetching methods.")
        xml_body = "<?xml version='1.0' encoding='UTF-8'?><Params></Params>"
        raw = self.request("getMethod", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            methods = []
            for el in root.findall(".//Method"):
                entry: Dict[str, str] = {}
                for child in el:
                    if len(child) == 0:
                        entry[child.tag] = (child.text or "").strip()
                methods.append(entry)
            logger.info("[UnasClient] Retrieved %d methods.", len(methods))
            return methods
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getMethod response: {exc}"
            ) from exc

    def get_warehouses(self) -> List[Dict[str, str]]:
        """
        Retrieve warehouse definitions from the UNAS webshop.

        Returns:
            List of warehouse dicts.
        """
        logger.info("[UnasClient] Fetching warehouses.")
        xml_body = "<?xml version='1.0' encoding='UTF-8'?><Params></Params>"
        raw = self.request("getWarehouse", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            warehouses = []
            for el in root.findall(".//Warehouse"):
                entry: Dict[str, str] = {}
                for child in el:
                    if len(child) == 0:
                        entry[child.tag] = (child.text or "").strip()
                warehouses.append(entry)
            logger.info("[UnasClient] Retrieved %d warehouses.", len(warehouses))
            return warehouses
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getWarehouse response: {exc}"
            ) from exc

    # ------------------------------------------------------------------
    # Public API — Write operations (blocked in read-only mode)
    # ------------------------------------------------------------------

    def set_stock(self, product_id: str, quantity: int, warehouse_id: Optional[str] = None) -> str:
        """
        Update stock quantity for a product.
        BLOCKED when UNAS_READ_ONLY=true.

        Args:
            product_id:   UNAS product ID.
            quantity:     New stock quantity.
            warehouse_id: Optional warehouse ID.

        Returns:
            Raw XML response string.
        """
        self._assert_write_allowed("set_stock")
        logger.info(
            "[UnasClient] Setting stock: product_id=%s quantity=%d",
            product_id,
            quantity,
        )
        wh_tag = f"<WarehouseId>{warehouse_id}</WarehouseId>" if warehouse_id else ""
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>"
            f"<Stock>"
            f"<ProductId>{product_id}</ProductId>"
            f"<Quantity>{quantity}</Quantity>"
            f"{wh_tag}"
            f"</Stock>"
            f"</Params>"
        )
        return self.request("setStock", xml_body)

    def set_order_status(self, order_id: str, status_id: str, notify: bool = False) -> str:
        """
        Update the status of an order.
        BLOCKED when UNAS_READ_ONLY=true.

        Args:
            order_id:  UNAS order ID.
            status_id: Target status ID.
            notify:    If True, send customer notification.

        Returns:
            Raw XML response string.
        """
        self._assert_write_allowed("set_order_status")
        logger.info(
            "[UnasClient] Setting order status: order_id=%s status_id=%s",
            order_id,
            status_id,
        )
        notify_tag = "<Notify>true</Notify>" if notify else "<Notify>false</Notify>"
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>"
            f"<Order>"
            f"<Id>{order_id}</Id>"
            f"<StatusId>{status_id}</StatusId>"
            f"{notify_tag}"
            f"</Order>"
            f"</Params>"
        )
        return self.request("setOrder", xml_body)

    def set_product(self, xml_product_block: str) -> str:
        """
        Create or update a product.
        BLOCKED when UNAS_READ_ONLY=true.

        Args:
            xml_product_block: Full <Product>...</Product> XML block.

        Returns:
            Raw XML response string.
        """
        self._assert_write_allowed("set_product")
        logger.info("[UnasClient] Calling setProduct.")
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>{xml_product_block}</Params>"
        )
        return self.request("setProduct", xml_body)

    def set_customer(self, xml_customer_block: str) -> str:
        """
        Create or update a customer record.
        BLOCKED when UNAS_READ_ONLY=true.

        Args:
            xml_customer_block: Full <Customer>...</Customer> XML block.

        Returns:
            Raw XML response string.
        """
        self._assert_write_allowed("set_customer")
        logger.info("[UnasClient] Calling setCustomer.")
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>{xml_customer_block}</Params>"
        )
        return self.request("setCustomer", xml_body)

    # ------------------------------------------------------------------
    # Additional read helpers
    # ------------------------------------------------------------------

    def get_customers(self, limit: int = 10, email: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve customer records. Note: responses may contain PII — not logged.

        Args:
            limit: Max number of customers to return.
            email: Filter by email address.

        Returns:
            List of customer dicts (PII fields included but not logged).
        """
        logger.info("[UnasClient] Fetching customers (limit=%d). PII not logged.", limit)
        params_inner = f"<Limit>{limit}</Limit>"
        if email:
            params_inner += f"<Email>{email}</Email>"
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params>{params_inner}</Params>"
        )
        raw = self.request("getCustomer", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            customers = []
            for el in root.findall(".//Customer"):
                entry: Dict[str, Any] = {}
                for child in el:
                    if len(child) == 0:
                        entry[child.tag] = (child.text or "").strip()
                customers.append(entry)
            # Intentionally NOT logging customer count in detail — PII context
            logger.info("[UnasClient] Customer fetch complete.")
            return customers
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getCustomer response: {exc}"
            ) from exc

    def get_categories(self) -> List[Dict[str, Any]]:
        """
        Retrieve product categories.

        Returns:
            List of category dicts.
        """
        logger.info("[UnasClient] Fetching categories.")
        xml_body = "<?xml version='1.0' encoding='UTF-8'?><Params></Params>"
        raw = self.request("getCategory", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            cats = []
            for el in root.findall(".//Category"):
                entry: Dict[str, Any] = {}
                for child in el:
                    if len(child) == 0:
                        entry[child.tag] = (child.text or "").strip()
                cats.append(entry)
            logger.info("[UnasClient] Retrieved %d categories.", len(cats))
            return cats
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getCategory response: {exc}"
            ) from exc

    def get_settings(self) -> Dict[str, Any]:
        """
        Retrieve shop settings from UNAS.

        Returns:
            Dict of setting key-value pairs.
        """
        logger.info("[UnasClient] Fetching shop settings.")
        xml_body = "<?xml version='1.0' encoding='UTF-8'?><Params></Params>"
        raw = self.request("getSetting", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            settings: Dict[str, Any] = {}
            for el in root:
                if len(el) == 0:
                    settings[el.tag] = (el.text or "").strip()
                else:
                    # Nested settings group
                    group: Dict[str, str] = {}
                    for child in el:
                        if len(child) == 0:
                            group[child.tag] = (child.text or "").strip()
                    settings[el.tag] = group
            logger.info("[UnasClient] Shop settings retrieved (%d keys).", len(settings))
            return settings
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getSetting response: {exc}"
            ) from exc

    def get_product_db(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve product database entries (extended product data).

        Args:
            limit: Max number of entries.

        Returns:
            List of product DB dicts.
        """
        logger.info("[UnasClient] Fetching productDB (limit=%d).", limit)
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params><Limit>{limit}</Limit></Params>"
        )
        raw = self.request("getProductDB", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            items = []
            for el in root.findall(".//Product"):
                entry: Dict[str, Any] = {}
                for child in el:
                    if len(child) == 0:
                        entry[child.tag] = (child.text or "").strip()
                items.append(entry)
            logger.info("[UnasClient] Retrieved %d productDB entries.", len(items))
            return items
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse getProductDB response: {exc}"
            ) from exc

    def check_customer(self, email: str) -> Dict[str, Any]:
        """
        Check if a customer exists by email.

        Args:
            email: Customer email address.

        Returns:
            Dict with existence flag and any available data.
        """
        logger.info("[UnasClient] Checking customer existence. Email not logged (PII).")
        xml_body = (
            f"<?xml version='1.0' encoding='UTF-8'?>"
            f"<Params><Email>{email}</Email></Params>"
        )
        raw = self.request("checkCustomer", xml_body)

        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(raw)
            result: Dict[str, Any] = {}
            for child in root:
                if len(child) == 0:
                    result[child.tag] = (child.text or "").strip()
            return result
        except Exception as exc:
            raise UnasXMLError(
                f"[UnasClient] Failed to parse checkCustomer response: {exc}"
            ) from exc

    def __repr__(self) -> str:
        return (
            f"<UnasClient shop={self.config.shop_domain!r} "
            f"read_only={self.config.read_only} "
            f"token={'set' if self._token else 'not set'}>"
        )
// [FL:DONE]
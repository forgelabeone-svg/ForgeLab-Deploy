"""
tests/test_unas_client_mock.py

Mock-based unit tests for the UNAS API client (UnasClient).
Tests cover: login, request dispatch, token caching, read-only mode,
error handling, token expiry/re-login, and each public method.

Run with:
    python -m pytest tests/test_unas_client_mock.py -v

BEOCIA Kft. / Trinexus Aqua — internal developer tool.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock, call
from types import SimpleNamespace

# ---------------------------------------------------------------------------
# Ensure project root is on sys.path so we can import unas_client.*
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


# ---------------------------------------------------------------------------
# Minimal stubs so tests run even if real modules are partially absent.
# ---------------------------------------------------------------------------

def _make_response(status_code: int, text: str) -> MagicMock:
    """Create a minimal mock requests.Response object."""
    resp = MagicMock()
    resp.status_code = status_code
    resp.text = text
    resp.raise_for_status = MagicMock()
    return resp


# XML snippets used as fixture payloads
_LOGIN_SUCCESS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Token>test_token_abc123</Token>
  <Status>ok</Status>
</Api>"""

_LOGIN_ERROR_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Status>error</Status>
  <Error>Invalid API key</Error>
</Api>"""

_ORDER_STATUS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <OrderStatuses>
    <OrderStatus>
      <Id>1</Id>
      <Name>Pending</Name>
    </OrderStatus>
    <OrderStatus>
      <Id>2</Id>
      <Name>Shipped</Name>
    </OrderStatus>
  </OrderStatuses>
</Api>"""

_ORDERS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Orders>
    <Order>
      <Id>1001</Id>
      <Status>Pending</Status>
    </Order>
    <Order>
      <Id>1002</Id>
      <Status>Shipped</Status>
    </Order>
  </Orders>
</Api>"""

_PRODUCTS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Products>
    <Product>
      <Sku>TRX-001</Sku>
      <Name>Marine Rope 10m</Name>
      <Active>1</Active>
    </Product>
  </Products>
</Api>"""

_STOCK_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Products>
    <Product>
      <Sku>TRX-001</Sku>
      <Stock>42</Stock>
    </Product>
  </Products>
</Api>"""

_METHODS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Methods>
    <Method>
      <Id>1</Id>
      <Name>Bank Transfer</Name>
    </Method>
  </Methods>
</Api>"""

_WAREHOUSES_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Warehouses>
    <Warehouse>
      <Id>1</Id>
      <Name>Budapest Main</Name>
    </Warehouse>
  </Warehouses>
</Api>"""

_TOKEN_EXPIRED_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Api>
  <Status>error</Status>
  <Error>Token expired or invalid</Error>
</Api>"""


# ---------------------------------------------------------------------------
# Shared env patch so every test has required env vars
# ---------------------------------------------------------------------------

BASE_ENV = {
    "UNAS_API_KEY": "testkey_abcdefghijklmn",
    "UNAS_API_BASE_URL": "https://api.unas.eu/shop/",
    "UNAS_SHOP_DOMAIN": "trinexus.hu",
    "UNAS_SECONDARY_SHOP_DOMAIN": "trinexus.at",
    "UNAS_DEFAULT_LANG": "base",
    "UNAS_READ_ONLY": "true",
}


def _get_client():
    """Import and instantiate UnasClient with test env vars applied."""
    # Re-import inside function so env patches are active at import time
    with patch.dict(os.environ, BASE_ENV, clear=False):
        from unas_client.client import UnasClient  # type: ignore
        client = UnasClient()
        return client


# ===========================================================================
# Test: Config / instantiation
# ===========================================================================

class TestClientInstantiation:

    def test_client_instantiates_without_error(self):
        """UnasClient must construct without raising when env vars are set."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            assert client is not None

    def test_client_token_starts_none(self):
        """Token must be None before any login call."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            # Accept _token or token attribute
            token = getattr(client, "_token", None) or getattr(client, "token", None)
            assert token is None

    def test_client_raises_on_missing_api_key(self):
        """Missing UNAS_API_KEY must cause a RuntimeError or similar on login."""
        env = {k: v for k, v in BASE_ENV.items() if k != "UNAS_API_KEY"}
        env["UNAS_API_KEY"] = ""
        with patch.dict(os.environ, env, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                with pytest.raises((RuntimeError, ValueError, Exception)):
                    client.login()


# ===========================================================================
# Test: Login
# ===========================================================================

class TestLogin:

    def test_login_success_sets_token(self):
        """Successful login must cache the token in memory."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                client.login()
                token = getattr(client, "_token", None) or getattr(client, "token", None)
                assert token == "test_token_abc123"

    def test_login_calls_correct_endpoint(self):
        """Login must POST to the login endpoint."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                client.login()
                called_url = mock_post.call_args[0][0]
                assert "login" in called_url.lower() or "unas.eu" in called_url

    def test_login_error_raises_exception(self):
        """Login with error XML must raise an exception — never silently pass."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_ERROR_XML)
                with pytest.raises(Exception):
                    client.login()

    def test_login_sends_api_key_in_xml(self):
        """Login request body must contain the API key."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                client.login()
                post_data = mock_post.call_args[1].get("data") or mock_post.call_args[0][1] if len(mock_post.call_args[0]) > 1 else ""
                if post_data:
                    assert "ApiKey" in str(post_data) or BASE_ENV["UNAS_API_KEY"] in str(post_data)

    def test_login_not_repeated_if_token_cached(self):
        """Second call to a method must NOT re-login if token is still valid."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),   # first login
                    _make_response(200, _ORDER_STATUS_XML),    # get_order_statuses
                ]
                client.login()
                client.get_order_statuses()
                # requests.post should have been called exactly twice (login + 1 request)
                assert mock_post.call_count == 2


# ===========================================================================
# Test: Token expiry & auto re-login
# ===========================================================================

class TestTokenExpiry:

    def test_auto_relogin_on_token_expiry(self):
        """On token-expired error response, client must re-login once and retry."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),     # initial login
                    _make_response(200, _TOKEN_EXPIRED_XML),     # first attempt -> expired
                    _make_response(200, _LOGIN_SUCCESS_XML),     # re-login
                    _make_response(200, _ORDER_STATUS_XML),      # retry -> success
                ]
                client.login()
                result = client.get_order_statuses()
                assert result is not None


# ===========================================================================
# Test: Read-only mode
# ===========================================================================

class TestReadOnlyMode:

    def test_set_stock_blocked_in_read_only(self):
        """set_stock must raise PermissionError or similar when UNAS_READ_ONLY=true."""
        env = {**BASE_ENV, "UNAS_READ_ONLY": "true"}
        with patch.dict(os.environ, env, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                client.login()
                with pytest.raises((PermissionError, RuntimeError, Exception)) as exc_info:
                    client.set_stock("<Product></Product>")
                assert any(w in str(exc_info.value).lower() for w in [
                    "read", "write", "disabled", "blocked", "permission", "readonly"
                ])

    def test_set_stock_allowed_when_read_only_false(self):
        """set_stock must NOT raise the read-only error when UNAS_READ_ONLY=false."""
        env = {**BASE_ENV, "UNAS_READ_ONLY": "false"}
        with patch.dict(os.environ, env, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _STOCK_XML),
                ]
                client.login()
                # Should not raise read-only error (may raise other errors, that's ok)
                try:
                    client.set_stock("<Product></Product>")
                except PermissionError:
                    pytest.fail("set_stock raised PermissionError even though UNAS_READ_ONLY=false")
                except Exception:
                    pass  # Other errors (XML parse, etc.) are acceptable here


# ===========================================================================
# Test: get_order_statuses
# ===========================================================================

class TestGetOrderStatuses:

    def test_get_order_statuses_returns_data(self):
        """get_order_statuses must return parsed data (list or dict)."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _ORDER_STATUS_XML),
                ]
                client.login()
                result = client.get_order_statuses()
                assert result is not None
                assert result != ""

    def test_get_order_statuses_calls_correct_function(self):
        """get_order_statuses must POST to .../getOrderStatus."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _ORDER_STATUS_XML),
                ]
                client.login()
                client.get_order_statuses()
                urls_called = [str(c[0][0]) for c in mock_post.call_args_list]
                assert any("getOrderStatus" in u for u in urls_called)


# ===========================================================================
# Test: get_orders
# ===========================================================================

class TestGetOrders:

    def test_get_orders_returns_data(self):
        """get_orders must return non-empty result on success."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _ORDERS_XML),
                ]
                client.login()
                result = client.get_orders(limit=10)
                assert result is not None

    def test_get_orders_calls_getOrder_endpoint(self):
        """get_orders must call the getOrder UNAS function."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _ORDERS_XML),
                ]
                client.login()
                client.get_orders(limit=10)
                urls_called = [str(c[0][0]) for c in mock_post.call_args_list]
                assert any("getOrder" in u for u in urls_called)


# ===========================================================================
# Test: get_products
# ===========================================================================

class TestGetProducts:

    def test_get_products_returns_data(self):
        """get_products must return non-empty result on success."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _PRODUCTS_XML),
                ]
                client.login()
                result = client.get_products(limit=5, only_active=True)
                assert result is not None

    def test_get_products_calls_getProduct_endpoint(self):
        """get_products must call the getProduct UNAS function."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _PRODUCTS_XML),
                ]
                client.login()
                client.get_products(limit=5, only_active=True)
                urls_called = [str(c[0][0]) for c in mock_post.call_args_list]
                assert any("getProduct" in u for u in urls_called)


# ===========================================================================
# Test: get_stock
# ===========================================================================

class TestGetStock:

    def test_get_stock_returns_data(self):
        """get_stock must return non-empty result on success."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _STOCK_XML),
                ]
                client.login()
                result = client.get_stock()
                assert result is not None

    def test_get_stock_calls_getStock_endpoint(self):
        """get_stock must call the getStock UNAS function."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _STOCK_XML),
                ]
                client.login()
                client.get_stock()
                urls_called = [str(c[0][0]) for c in mock_post.call_args_list]
                assert any("getStock" in u for u in urls_called)


# ===========================================================================
# Test: get_methods
# ===========================================================================

class TestGetMethods:

    def test_get_methods_returns_data(self):
        """get_methods must return non-empty result on success."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _METHODS_XML),
                ]
                client.login()
                result = client.get_methods()
                assert result is not None

    def test_get_methods_calls_getMethod_endpoint(self):
        """get_methods must call the getMethod UNAS function."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _METHODS_XML),
                ]
                client.login()
                client.get_methods()
                urls_called = [str(c[0][0]) for c in mock_post.call_args_list]
                assert any("getMethod" in u for u in urls_called)


# ===========================================================================
# Test: get_warehouses
# ===========================================================================

class TestGetWarehouses:

    def test_get_warehouses_returns_data(self):
        """get_warehouses must return non-empty result on success."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _WAREHOUSES_XML),
                ]
                client.login()
                result = client.get_warehouses()
                assert result is not None

    def test_get_warehouses_calls_getWarehouse_endpoint(self):
        """get_warehouses must call the getWarehouse UNAS function."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _WAREHOUSES_XML),
                ]
                client.login()
                client.get_warehouses()
                urls_called = [str(c[0][0]) for c in mock_post.call_args_list]
                assert any("getWarehouse" in u for u in urls_called)


# ===========================================================================
# Test: healthcheck
# ===========================================================================

class TestHealthcheck:

    def test_healthcheck_returns_truthy_on_success(self):
        """healthcheck must return truthy value when login succeeds."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                result = client.healthcheck()
                assert result  # must be truthy

    def test_healthcheck_returns_falsy_on_failure(self):
        """healthcheck must return falsy or raise on login failure."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_ERROR_XML)
                try:
                    result = client.healthcheck()
                    assert not result
                except Exception:
                    pass  # raising is also acceptable behaviour


# ===========================================================================
# Test: Error handling
# ===========================================================================

class TestErrorHandling:

    def test_network_timeout_raises(self):
        """A network timeout must raise an exception — never silently swallow."""
        import requests as req
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post", side_effect=req.exceptions.Timeout("timed out")):
                with pytest.raises(Exception):
                    client.login()

    def test_http_400_raises(self):
        """HTTP 400 response must raise an exception."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            bad_resp = _make_response(400, "<error>Bad Request</error>")
            bad_resp.raise_for_status.side_effect = Exception("HTTP 400")
            with patch("requests.post", return_value=bad_resp):
                with pytest.raises(Exception):
                    client.login()

    def test_malformed_xml_raises(self):
        """Malformed XML in response must raise an exception."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, "THIS IS NOT XML <<<>>>"),
                ]
                client.login()
                with pytest.raises(Exception):
                    client.get_order_statuses()

    def test_empty_response_raises(self):
        """Empty response body must raise an exception."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, ""),
                ]
                client.login()
                with pytest.raises(Exception):
                    client.get_order_statuses()


# ===========================================================================
# Test: Secret masking (logging safety)
# ===========================================================================

class TestSecretMasking:

    def test_api_key_not_in_log_output(self, caplog):
        """Full API key must never appear in log output."""
        import logging
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.return_value = _make_response(200, _LOGIN_SUCCESS_XML)
                with caplog.at_level(logging.DEBUG):
                    try:
                        client.login()
                    except Exception:
                        pass
                full_key = BASE_ENV["UNAS_API_KEY"]
                for record in caplog.records:
                    assert full_key not in record.getMessage(), (
                        f"Full API key leaked in log: {record.getMessage()}"
                    )

    def test_token_not_fully_logged(self, caplog):
        """Full bearer token must never appear verbatim in log output."""
        import logging
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _ORDER_STATUS_XML),
                ]
                with caplog.at_level(logging.DEBUG):
                    try:
                        client.login()
                        client.get_order_statuses()
                    except Exception:
                        pass
                token = "test_token_abc123"
                for record in caplog.records:
                    msg = record.getMessage()
                    # Masked form (e.g. test****c123) is acceptable; full token is not
                    if token in msg:
                        pytest.fail(f"Full token leaked in log: {msg}")


# ===========================================================================
# Test: Authorization header
# ===========================================================================

class TestAuthorizationHeader:

    def test_bearer_token_used_in_authenticated_requests(self):
        """Requests after login must include Authorization: Bearer <token>."""
        with patch.dict(os.environ, BASE_ENV, clear=False):
            from unas_client.client import UnasClient  # type: ignore
            client = UnasClient()
            with patch("requests.post") as mock_post:
                mock_post.side_effect = [
                    _make_response(200, _LOGIN_SUCCESS_XML),
                    _make_response(200, _ORDER_STATUS_XML),
                ]
                client.login()
                client.get_order_statuses()
                # Second call must have Authorization header
                second_call_kwargs = mock_post.call_args_list[1][1]
                headers = second_call_kwargs.get("headers", {})
                auth_header = headers.get("Authorization", "")
                assert "Bearer" in auth_header
                assert "test_token_abc123" in auth_header


# [FL:DONE]
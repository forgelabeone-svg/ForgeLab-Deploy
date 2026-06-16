"""
unas_client/config.py

Configuration loader for the UNAS API client.
Reads settings from environment variables (via .env file).
Masks secrets in logs — never prints full API key or token.

BEOCIA Kft. / Trinexus Aqua — internal developer tool.
"""

import os
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


def _mask_secret(value: str, visible: int = 4) -> str:
    """
    Mask a secret string for safe logging.
    Shows first and last `visible` characters, replaces the middle with ****.
    Example: 'abcdefghwxyz' -> 'abcd****wxyz'
    """
    if not value:
        return "(empty)"
    if len(value) <= visible * 2:
        return "****"
    return f"{value[:visible]}****{value[-visible:]}"


def _require_env(name: str) -> str:
    """
    Read a required environment variable.
    Raises a clear RuntimeError if not set.
    """
    value = os.environ.get(name, "").strip()
    if not value:
        raise RuntimeError(
            f"[Config] Missing required environment variable: {name}\n"
            f"  → Copy .env.example to .env and fill in your credentials.\n"
            f"  → Never hardcode secrets in source files."
        )
    return value


def _optional_env(name: str, default: str = "") -> str:
    """Read an optional environment variable with a fallback default."""
    return os.environ.get(name, default).strip()


def _bool_env(name: str, default: bool = True) -> bool:
    """
    Read an environment variable as a boolean.
    Accepts 'true'/'false' (case-insensitive).
    Any value other than 'false' is treated as True for safety.
    """
    raw = os.environ.get(name, str(default)).strip().lower()
    return raw != "false"


@dataclass
class UnasConfig:
    """
    Immutable configuration object for the UNAS API client.

    Populated from environment variables.
    Secrets are masked when logged.
    The API key is never stored beyond what is needed for login.
    """

    api_base_url: str
    api_key: str
    shop_domain: str
    secondary_shop_domain: str
    default_lang: str
    read_only: bool
    request_timeout: int  # seconds

    # Internal: masked representations for safe logging
    _api_key_masked: str = field(init=False, repr=False)

    def __post_init__(self):
        object.__setattr__(self, "_api_key_masked", _mask_secret(self.api_key))

    def log_summary(self) -> None:
        """Print a safe config summary — no secrets exposed."""
        logger.info("=== UNAS Client Configuration ===")
        logger.info("  Base URL             : %s", self.api_base_url)
        logger.info("  API Key (masked)     : %s", self._api_key_masked)
        logger.info("  Shop domain          : %s", self.shop_domain)
        logger.info("  Secondary shop       : %s", self.secondary_shop_domain)
        logger.info("  Default language     : %s", self.default_lang)
        logger.info("  Read-only mode       : %s", self.read_only)
        logger.info("  Request timeout      : %ds", self.request_timeout)
        logger.info("=================================")

    def assert_write_allowed(self, function_name: str) -> None:
        """
        Raise an error if a write/set* operation is attempted in read-only mode.
        Call this at the start of any method that modifies data.
        """
        if self.read_only:
            raise PermissionError(
                f"[SAFETY] Write operation '{function_name}' is BLOCKED.\n"
                f"  → UNAS_READ_ONLY=true is set. This client is in read-only mode.\n"
                f"  → To enable write operations, set UNAS_READ_ONLY=false in your .env file.\n"
                f"  → WARNING: Write operations modify live webshop data. Use with caution."
            )


_config_instance: Optional[UnasConfig] = None


def load_config(force_reload: bool = False) -> UnasConfig:
    """
    Load and cache the UNAS configuration singleton.

    Reads from environment variables (set via .env loaded by python-dotenv
    in main.py, or directly in the shell environment).

    Args:
        force_reload: If True, discard the cached config and reload from env.

    Returns:
        UnasConfig instance.

    Raises:
        RuntimeError: If a required environment variable is missing.
    """
    global _config_instance

    if _config_instance is not None and not force_reload:
        return _config_instance

    # Attempt to load .env automatically if python-dotenv is available.
    # This is a convenience fallback; main.py should call load_dotenv() explicitly.
    try:
        from dotenv import load_dotenv  # type: ignore
        load_dotenv(override=False)
        logger.debug("[Config] .env file loaded via python-dotenv (if present).")
    except ImportError:
        logger.debug(
            "[Config] python-dotenv not installed. "
            "Environment variables must be set externally or via shell."
        )

    try:
        api_key = _require_env("UNAS_API_KEY")
    except RuntimeError as exc:
        logger.error(str(exc))
        raise

    config = UnasConfig(
        api_base_url=_optional_env(
            "UNAS_API_BASE_URL", "https://api.unas.eu/shop/"
        ),
        api_key=api_key,
        shop_domain=_optional_env("UNAS_SHOP_DOMAIN", "trinexus.hu"),
        secondary_shop_domain=_optional_env(
            "UNAS_SECONDARY_SHOP_DOMAIN", "trinexus.at"
        ),
        default_lang=_optional_env("UNAS_DEFAULT_LANG", "base"),
        read_only=_bool_env("UNAS_READ_ONLY", default=True),
        request_timeout=int(_optional_env("UNAS_REQUEST_TIMEOUT", "30")),
    )

    _config_instance = config
    config.log_summary()
    return config


def get_config() -> UnasConfig:
    """
    Return the cached config instance.
    Calls load_config() on first access.

    Use this in modules that need config but don't own the loading lifecycle.
    """
    return load_config()
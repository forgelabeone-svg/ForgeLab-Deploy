"""
unas_client — Python client package for UNAS webshop API integration.

BEOCIA Kft. / Trinexus Aqua internal developer tool.
Chrome Companion 1.4 / Trinexus Developer Companion

This package provides:
- UnasClient: main API client class
- XML utilities for building and parsing UNAS API XML payloads
- Data models for UNAS entities
- Custom exceptions for error handling
- Configuration loader from environment variables

Usage:
    from unas_client import UnasClient
    from unas_client.config import get_config
    from unas_client.exceptions import UnasAuthError, UnasReadOnlyError
    from unas_client.xml_utils import build_xml, parse_xml
    from unas_client.models import UnasOrder, UnasProduct, UnasStock
"""

from unas_client.client import UnasClient
from unas_client.exceptions import (
    UnasError,
    UnasAuthError,
    UnasReadOnlyError,
    UnasNetworkError,
    UnasXMLError,
    UnasConfigError,
    UnasEmptyResponseError,
)

__all__ = [
    "UnasClient",
    "UnasError",
    "UnasAuthError",
    "UnasReadOnlyError",
    "UnasNetworkError",
    "UnasXMLError",
    "UnasConfigError",
    "UnasEmptyResponseError",
]

__version__ = "1.4.0"
__author__ = "BEOCIA Kft."
__description__ = "UNAS API client for Trinexus Aqua webshop integration"
__package_name__ = "unas_client"

# [FL:DONE]
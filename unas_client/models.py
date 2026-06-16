"""
unas_client/models.py

Data models for the UNAS API client.
Represents the core domain objects returned by the UNAS XML API.
All models are plain Python dataclasses — no ORM, no external deps.

BEOCIA Kft. / Trinexus Aqua — internal developer tool.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

@dataclass
class AuthToken:
    """Cached bearer token returned by the UNAS /login endpoint."""
    token: str
    webshop_info: Optional[Dict[str, Any]] = None

    def masked_token(self) -> str:
        """Return a masked version of the token safe for logging."""
        if len(self.token) <= 8:
            return "****"
        return self.token[:4] + "****" + self.token[-4:]


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

@dataclass
class ProductPrice:
    net: Optional[str] = None
    gross: Optional[str] = None
    vat: Optional[str] = None
    currency: Optional[str] = None
    sale_net: Optional[str] = None
    sale_gross: Optional[str] = None


@dataclass
class ProductImage:
    url: Optional[str] = None
    alt: Optional[str] = None
    order: Optional[int] = None


@dataclass
class Product:
    """Represents a single UNAS product (getProduct / getProductDB)."""
    sku: Optional[str] = None
    id: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None          # active / inactive
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[ProductPrice] = None
    images: List[ProductImage] = field(default_factory=list)
    stock: Optional[int] = None
    unit: Optional[str] = None
    weight: Optional[str] = None
    ean: Optional[str] = None
    manufacturer: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None  # parsed XML dict for full data access

    def is_active(self) -> bool:
        return (self.status or "").lower() == "active"


# ---------------------------------------------------------------------------
# Stock
# ---------------------------------------------------------------------------

@dataclass
class StockItem:
    """Stock record for a single product SKU."""
    sku: Optional[str] = None
    product_id: Optional[str] = None
    stock: Optional[int] = None
    warehouse_id: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------

@dataclass
class OrderAddress:
    name: Optional[str] = None
    company: Optional[str] = None
    zip: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@dataclass
class OrderItem:
    sku: Optional[str] = None
    product_id: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[int] = None
    unit_price_net: Optional[str] = None
    unit_price_gross: Optional[str] = None
    vat: Optional[str] = None
    total_gross: Optional[str] = None


@dataclass
class Order:
    """Represents a single UNAS order (getOrder)."""
    order_id: Optional[str] = None
    order_key: Optional[str] = None
    status: Optional[str] = None
    status_id: Optional[str] = None
    date: Optional[str] = None
    currency: Optional[str] = None
    total_gross: Optional[str] = None
    total_net: Optional[str] = None
    payment_method: Optional[str] = None
    shipping_method: Optional[str] = None
    note: Optional[str] = None
    billing_address: Optional[OrderAddress] = None
    shipping_address: Optional[OrderAddress] = None
    items: List[OrderItem] = field(default_factory=list)
    raw: Optional[Dict[str, Any]] = None

    def item_count(self) -> int:
        return len(self.items)


# ---------------------------------------------------------------------------
# Order Status
# ---------------------------------------------------------------------------

@dataclass
class OrderStatus:
    """Represents a single order status entry (getOrderStatus)."""
    id: Optional[str] = None
    name: Optional[str] = None
    color: Optional[str] = None
    email_notify: Optional[bool] = None
    default: Optional[bool] = None
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------

@dataclass
class Category:
    """Represents a product category (getCategory)."""
    id: Optional[str] = None
    name: Optional[str] = None
    parent_id: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

    def is_active(self) -> bool:
        return (self.status or "").lower() == "active"


# ---------------------------------------------------------------------------
# Customer
# ---------------------------------------------------------------------------

@dataclass
class Customer:
    """Represents a UNAS customer (getCustomer)."""
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    zip: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    group_id: Optional[str] = None
    registered: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

    def masked_email(self) -> str:
        """Return a masked email safe for logging."""
        if not self.email or "@" not in self.email:
            return "****"
        local, domain = self.email.split("@", 1)
        if len(local) <= 2:
            return "**@" + domain
        return local[:2] + "****@" + domain


# ---------------------------------------------------------------------------
# Customer Group
# ---------------------------------------------------------------------------

@dataclass
class CustomerGroup:
    id: Optional[str] = None
    name: Optional[str] = None
    discount: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Payment / Shipping Methods
# ---------------------------------------------------------------------------

@dataclass
class PaymentMethod:
    id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    fee_gross: Optional[str] = None
    currency: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


@dataclass
class ShippingMethod:
    id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    fee_gross: Optional[str] = None
    currency: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Warehouse
# ---------------------------------------------------------------------------

@dataclass
class Warehouse:
    id: Optional[str] = None
    name: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Newsletter subscription
# ---------------------------------------------------------------------------

@dataclass
class NewsletterEntry:
    email: Optional[str] = None
    status: Optional[str] = None
    subscribed_at: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None

    def masked_email(self) -> str:
        if not self.email or "@" not in self.email:
            return "****"
        local, domain = self.email.split("@", 1)
        if len(local) <= 2:
            return "**@" + domain
        return local[:2] + "****@" + domain


# ---------------------------------------------------------------------------
# Shop setting
# ---------------------------------------------------------------------------

@dataclass
class ShopSetting:
    key: Optional[str] = None
    value: Optional[str] = None
    group: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# API Response wrapper
# ---------------------------------------------------------------------------

@dataclass
class UnasApiResponse:
    """
    Wrapper for a raw UNAS API XML response after parsing.

    status: 'ok' | 'error' | 'unauthorized' | 'unknown'
    message: human-readable message from XML <Error> or <Info> node
    data: list of parsed model objects or raw dicts
    raw_xml: the raw XML string (only stored for non-PII responses)
    """
    status: str = "unknown"
    message: Optional[str] = None
    data: List[Any] = field(default_factory=list)
    raw_xml: Optional[str] = None
    http_status_code: Optional[int] = None

    def is_ok(self) -> bool:
        return self.status == "ok"

    def is_error(self) -> bool:
        return self.status in ("error", "unauthorized")

    def item_count(self) -> int:
        return len(self.data)

    def __repr__(self) -> str:
        return (
            f"UnasApiResponse("
            f"status={self.status!r}, "
            f"message={self.message!r}, "
            f"items={self.item_count()}, "
            f"http={self.http_status_code})"
        )
# [FL:DONE]
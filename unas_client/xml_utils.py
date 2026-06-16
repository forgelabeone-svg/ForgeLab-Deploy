"""
xml_utils.py — XML parsing and building utilities for the UNAS API client.
BEOCIA Kft. / Trinexus Aqua internal developer tool.
"""

import logging
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class XmlParseError(Exception):
    """Raised when XML cannot be parsed or has unexpected structure."""


# ---------------------------------------------------------------------------
# Building XML
# ---------------------------------------------------------------------------

def build_xml_element(tag: str, text: Optional[str] = None,
                      children: Optional[List[ET.Element]] = None,
                      attribs: Optional[Dict[str, str]] = None) -> ET.Element:
    """
    Create a single XML element with optional text, children and attributes.

    Example:
        el = build_xml_element("ApiKey", text="my-key")
    """
    elem = ET.Element(tag, attrib=attribs or {})
    if text is not None:
        elem.text = str(text)
    for child in (children or []):
        elem.append(child)
    return elem


def dict_to_xml(tag: str, data: Dict[str, Any]) -> ET.Element:
    """
    Recursively convert a dict to an XML element tree.

    Rules:
      - dict value → child element with tag = key
      - list value → repeated child elements with tag = key
      - scalar value → text of child element

    Example:
        xml_elem = dict_to_xml("Params", {"Limit": 10, "Status": "active"})
    """
    root = ET.Element(tag)
    for key, value in data.items():
        if isinstance(value, dict):
            child = dict_to_xml(key, value)
            root.append(child)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    child = dict_to_xml(key, item)
                else:
                    child = ET.Element(key)
                    child.text = str(item)
                root.append(child)
        else:
            child = ET.Element(key)
            if value is not None:
                child.text = str(value)
            root.append(child)
    return root


def build_login_xml(api_key: str, webshop_info: bool = False) -> str:
    """
    Build the XML body for a UNAS login request.

    <Login>
      <ApiKey>...</ApiKey>
      <WebshopInfo>true</WebshopInfo>  (optional)
    </Login>
    """
    root = ET.Element("Login")
    api_key_elem = ET.SubElement(root, "ApiKey")
    api_key_elem.text = api_key
    if webshop_info:
        info_elem = ET.SubElement(root, "WebshopInfo")
        info_elem.text = "true"
    return ET.tostring(root, encoding="unicode", xml_declaration=False)


def build_request_xml(root_tag: str, params: Optional[Dict[str, Any]] = None) -> str:
    """
    Build a generic UNAS API request XML body.

    Example:
        xml = build_request_xml("Params", {"Limit": 10, "StatusFilter": "active"})
    Returns the XML string, not bytes.
    """
    if params:
        root = dict_to_xml(root_tag, params)
    else:
        root = ET.Element(root_tag)
    return ET.tostring(root, encoding="unicode", xml_declaration=False)


# ---------------------------------------------------------------------------
# Parsing XML
# ---------------------------------------------------------------------------

def parse_xml_string(xml_string: str) -> ET.Element:
    """
    Parse an XML string and return the root Element.
    Raises XmlParseError on malformed input or empty string.
    """
    if not xml_string or not xml_string.strip():
        raise XmlParseError("Received empty XML response.")
    try:
        return ET.fromstring(xml_string.strip())
    except ET.ParseError as exc:
        logger.error("Failed to parse XML: %s", str(exc))
        raise XmlParseError(f"XML parse error: {exc}") from exc


def element_to_dict(element: ET.Element) -> Union[Dict[str, Any], str]:
    """
    Recursively convert an XML Element to a Python dict.

    - Elements with no children → their text value (str or "")
    - Elements with children → dict mapping child tag → value
    - Repeated tags under the same parent are collected into a list.
    """
    children = list(element)
    if not children:
        return element.text.strip() if element.text and element.text.strip() else ""

    result: Dict[str, Any] = {}
    for child in children:
        child_value = element_to_dict(child)
        if child.tag in result:
            existing = result[child.tag]
            if isinstance(existing, list):
                existing.append(child_value)
            else:
                result[child.tag] = [existing, child_value]
        else:
            result[child.tag] = child_value
    return result


def parse_xml_response(xml_string: str) -> Dict[str, Any]:
    """
    Parse a full UNAS API XML response string into a Python dict.

    Returns a dict where the root tag is the top-level key.
    Raises XmlParseError on failure.
    """
    root = parse_xml_string(xml_string)
    return {root.tag: element_to_dict(root)}


def extract_token(xml_string: str) -> str:
    """
    Extract the Bearer token from a UNAS login response XML.

    Expected structure:
        <Login>
          <Token>...</Token>
          ...
        </Login>

    Raises XmlParseError if the token is missing or the XML is invalid.
    """
    root = parse_xml_string(xml_string)
    token_elem = root.find("Token")
    if token_elem is None or not token_elem.text:
        # Some error responses include <Error> instead of <Token>
        error_elem = root.find("Error")
        if error_elem is not None and error_elem.text:
            raise XmlParseError(f"Login failed — API error: {error_elem.text.strip()}")
        raise XmlParseError(
            "Login response did not contain a <Token> element. "
            "Check your UNAS_API_KEY and network connectivity."
        )
    token = token_elem.text.strip()
    if not token:
        raise XmlParseError("Received empty <Token> in login response.")
    return token


def extract_error_message(xml_string: str) -> Optional[str]:
    """
    Attempt to extract an error message from a UNAS error XML response.

    UNAS typically returns:
        <Error>Message text here</Error>
    or
        <Response><Error>Message</Error></Response>

    Returns the error message string, or None if not found.
    """
    try:
        root = parse_xml_string(xml_string)
    except XmlParseError:
        return None

    # Direct <Error> at root
    if root.tag == "Error":
        return root.text.strip() if root.text else "Unknown UNAS error."

    # Child <Error>
    error_elem = root.find(".//Error")
    if error_elem is not None and error_elem.text:
        return error_elem.text.strip()

    # Child <error> (lowercase variant)
    error_elem_lc = root.find(".//error")
    if error_elem_lc is not None and error_elem_lc.text:
        return error_elem_lc.text.strip()

    return None


def find_elements(xml_string: str, xpath: str) -> List[ET.Element]:
    """
    Parse XML and return all elements matching the given XPath expression.

    Example:
        elements = find_elements(response_xml, ".//Order")

    Returns empty list on parse failure (logs the error).
    """
    try:
        root = parse_xml_string(xml_string)
    except XmlParseError as exc:
        logger.error("find_elements: XML parse failed — %s", str(exc))
        return []
    return root.findall(xpath)


def get_element_text(xml_string: str, xpath: str,
                     default: str = "") -> str:
    """
    Parse XML and return the text content of the first element matching xpath.

    Returns `default` if element is not found or has no text.
    """
    try:
        root = parse_xml_string(xml_string)
    except XmlParseError:
        return default
    elem = root.find(xpath)
    if elem is not None and elem.text:
        return elem.text.strip()
    return default


# ---------------------------------------------------------------------------
# Secret masking (used in logging)
# ---------------------------------------------------------------------------

def mask_secret(secret: str, visible: int = 4) -> str:
    """
    Mask a secret string for safe logging.

    Shows the first and last `visible` characters, replaces the middle with ****.

    Example:
        mask_secret("abcdefghijklmnopwxyz", 4) → "abcd****wxyz"
        mask_secret("short", 4)                → "****"
    """
    if not secret:
        return "****"
    length = len(secret)
    if length <= visible * 2:
        return "****"
    return f"{secret[:visible]}****{secret[-visible:]}"


def sanitize_xml_for_logging(xml_string: str,
                              sensitive_tags: Optional[List[str]] = None) -> str:
    """
    Replace the text content of sensitive XML tags before logging.

    Default sensitive tags: Email, Phone, Address, Name, Token, ApiKey,
    CustomerEmail, BillingEmail, ShippingEmail.

    Example:
        safe_xml = sanitize_xml_for_logging(response_xml)
        logger.debug("Response: %s", safe_xml)
    """
    DEFAULT_SENSITIVE = [
        "Email", "Phone", "Address", "Name", "Token", "ApiKey",
        "CustomerEmail", "BillingEmail", "ShippingEmail",
        "FirstName", "LastName", "ZipCode", "City", "Street",
        "TaxNumber", "BankAccount",
    ]
    tags = sensitive_tags if sensitive_tags is not None else DEFAULT_SENSITIVE

    try:
        root = parse_xml_string(xml_string)
    except XmlParseError:
        # Cannot parse — return a safe placeholder
        return "[UNPARSEABLE XML — NOT LOGGED]"

    for tag in tags:
        for elem in root.iter(tag):
            if elem.text:
                elem.text = "****"

    return ET.tostring(root, encoding="unicode", xml_declaration=False)


# ---------------------------------------------------------------------------
# Utility: pretty-print for debug output
# ---------------------------------------------------------------------------

def pretty_print_xml(xml_string: str) -> str:
    """
    Return a human-readable indented version of an XML string.
    Used for debug CLI output only — never log sensitive data through this.

    Returns the original string unchanged if parsing fails.
    """
    try:
        root = parse_xml_string(xml_string)
        ET.indent(root, space="  ")
        return ET.tostring(root, encoding="unicode", xml_declaration=False)
    except (XmlParseError, AttributeError):
        # ET.indent was added in Python 3.9 — graceful fallback
        return xml_string

# [FL:DONE]
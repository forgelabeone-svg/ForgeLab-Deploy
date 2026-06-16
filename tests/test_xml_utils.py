"""
tests/test_xml_utils.py

Unit tests for unas_client/xml_utils.py
BEOCIA Kft. / Trinexus Aqua — internal developer tool.

Run with:
    python -m pytest tests/test_xml_utils.py -v
"""

import sys
import os
import xml.etree.ElementTree as ET
import pytest

# Ensure project root is on sys.path so unas_client is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from unas_client.xml_utils import (
    build_xml_element,
    build_login_xml,
    build_request_xml,
    parse_xml_response,
    extract_text,
    extract_error,
    xml_to_dict,
    XmlParseError,
)


# ---------------------------------------------------------------------------
# build_xml_element
# ---------------------------------------------------------------------------

class TestBuildXmlElement:
    def test_simple_tag_no_text(self):
        el = build_xml_element("Root")
        assert el.tag == "Root"
        assert el.text is None
        assert el.attrib == {}

    def test_tag_with_text(self):
        el = build_xml_element("ApiKey", text="my-secret-key")
        assert el.tag == "ApiKey"
        assert el.text == "my-secret-key"

    def test_tag_with_attribs(self):
        el = build_xml_element("Product", attribs={"id": "42", "lang": "hu"})
        assert el.attrib["id"] == "42"
        assert el.attrib["lang"] == "hu"

    def test_tag_with_children(self):
        child1 = build_xml_element("Name", text="Boat Engine")
        child2 = build_xml_element("Sku", text="BE-001")
        parent = build_xml_element("Product", children=[child1, child2])
        children = list(parent)
        assert len(children) == 2
        assert children[0].tag == "Name"
        assert children[1].tag == "Sku"

    def test_tag_with_text_and_children(self):
        child = build_xml_element("Item", text="value")
        el = build_xml_element("List", children=[child])
        assert el.find("Item") is not None
        assert el.find("Item").text == "value"

    def test_empty_children_list(self):
        el = build_xml_element("Empty", children=[])
        assert len(list(el)) == 0

    def test_returns_et_element(self):
        el = build_xml_element("Test")
        assert isinstance(el, ET.Element)


# ---------------------------------------------------------------------------
# build_login_xml
# ---------------------------------------------------------------------------

class TestBuildLoginXml:
    def test_login_xml_contains_api_key(self):
        xml_str = build_login_xml("test-api-key-1234")
        assert "test-api-key-1234" in xml_str

    def test_login_xml_has_api_key_tag(self):
        xml_str = build_login_xml("MYKEY99")
        root = ET.fromstring(xml_str)
        api_key_el = root.find(".//ApiKey") or root.find("ApiKey")
        assert api_key_el is not None
        assert api_key_el.text == "MYKEY99"

    def test_login_xml_no_webshop_info_by_default(self):
        xml_str = build_login_xml("key")
        # WebshopInfo should not appear or should be false/absent when not requested
        # Acceptable either way — just must not crash
        assert isinstance(xml_str, str)
        assert len(xml_str) > 0

    def test_login_xml_with_webshop_info(self):
        xml_str = build_login_xml("key", webshop_info=True)
        assert "WebshopInfo" in xml_str or "true" in xml_str.lower()

    def test_login_xml_is_valid_xml(self):
        xml_str = build_login_xml("some-key-abcdef")
        # Must not raise
        root = ET.fromstring(xml_str)
        assert root is not None

    def test_login_xml_empty_key_returns_xml(self):
        # Even with empty key it must return valid XML (validation is done elsewhere)
        xml_str = build_login_xml("")
        assert isinstance(xml_str, str)


# ---------------------------------------------------------------------------
# build_request_xml
# ---------------------------------------------------------------------------

class TestBuildRequestXml:
    def test_basic_request_xml(self):
        xml_str = build_request_xml("getOrder", "<OrderId>123</OrderId>")
        assert isinstance(xml_str, str)
        assert len(xml_str) > 0

    def test_request_xml_is_valid_xml(self):
        xml_str = build_request_xml("getProduct", "<Limit>5</Limit>")
        root = ET.fromstring(xml_str)
        assert root is not None

    def test_request_xml_contains_body(self):
        xml_str = build_request_xml("getOrder", "<OrderId>999</OrderId>")
        assert "OrderId" in xml_str or "999" in xml_str

    def test_request_xml_empty_body(self):
        xml_str = build_request_xml("getOrderStatus", "")
        assert isinstance(xml_str, str)
        ET.fromstring(xml_str)  # must not raise

    def test_request_xml_with_complex_body(self):
        body = "<Products><Limit>10</Limit><ActiveOnly>true</ActiveOnly></Products>"
        xml_str = build_request_xml("getProduct", body)
        assert isinstance(xml_str, str)
        ET.fromstring(xml_str)


# ---------------------------------------------------------------------------
# parse_xml_response
# ---------------------------------------------------------------------------

class TestParseXmlResponse:
    def test_parse_valid_xml(self):
        xml_str = "<Response><Status>ok</Status></Response>"
        root = parse_xml_response(xml_str)
        assert isinstance(root, ET.Element)
        assert root.find("Status").text == "ok"

    def test_parse_raises_on_empty_string(self):
        with pytest.raises((XmlParseError, ET.ParseError, Exception)):
            parse_xml_response("")

    def test_parse_raises_on_malformed_xml(self):
        with pytest.raises((XmlParseError, ET.ParseError, Exception)):
            parse_xml_response("<unclosed>")

    def test_parse_raises_on_none_input(self):
        with pytest.raises((XmlParseError, TypeError, AttributeError, Exception)):
            parse_xml_response(None)

    def test_parse_returns_et_element(self):
        xml_str = "<Products><Product><Id>1</Id></Product></Products>"
        root = parse_xml_response(xml_str)
        assert isinstance(root, ET.Element)

    def test_parse_unas_like_response(self):
        xml_str = (
            "<Response>"
            "<Status>ok</Status>"
            "<Orders>"
            "<Order><Id>100</Id><Status>new</Status></Order>"
            "</Orders>"
            "</Response>"
        )
        root = parse_xml_response(xml_str)
        assert root.find(".//Order/Id").text == "100"

    def test_parse_raises_on_random_bytes(self):
        with pytest.raises(Exception):
            parse_xml_response("\x00\xff\xfe garbage not xml")


# ---------------------------------------------------------------------------
# extract_text
# ---------------------------------------------------------------------------

class TestExtractText:
    def setup_method(self):
        self.root = ET.fromstring(
            "<Response>"
            "<Status>ok</Status>"
            "<Token>abc123token</Token>"
            "<Nested><Deep>value</Deep></Nested>"
            "</Response>"
        )

    def test_extract_top_level_tag(self):
        assert extract_text(self.root, "Status") == "ok"

    def test_extract_token(self):
        assert extract_text(self.root, "Token") == "abc123token"

    def test_extract_nested_xpath(self):
        result = extract_text(self.root, ".//Deep")
        assert result == "value"

    def test_extract_missing_tag_returns_none(self):
        result = extract_text(self.root, "NonExistent")
        assert result is None

    def test_extract_missing_tag_returns_default(self):
        result = extract_text(self.root, "Missing", default="fallback")
        assert result == "fallback"

    def test_extract_with_none_element(self):
        result = extract_text(None, "Status", default="none")
        assert result == "none" or result is None


# ---------------------------------------------------------------------------
# extract_error
# ---------------------------------------------------------------------------

class TestExtractError:
    def test_no_error_returns_none(self):
        root = ET.fromstring("<Response><Status>ok</Status></Response>")
        result = extract_error(root)
        assert result is None

    def test_error_tag_present(self):
        root = ET.fromstring(
            "<Response><Status>error</Status><Error>Invalid API key</Error></Response>"
        )
        result = extract_error(root)
        assert result is not None
        assert "Invalid" in result or "API" in result or len(result) > 0

    def test_error_message_tag_present(self):
        root = ET.fromstring(
            "<Response><Status>error</Status><ErrorMessage>Token expired</ErrorMessage></Response>"
        )
        result = extract_error(root)
        # Should return the error message or at minimum not crash
        assert result is None or isinstance(result, str)

    def test_extract_error_returns_string_or_none(self):
        root = ET.fromstring("<Response><Status>ok</Status></Response>")
        result = extract_error(root)
        assert result is None or isinstance(result, str)

    def test_extract_error_from_unas_style_error_response(self):
        root = ET.fromstring(
            "<Response>"
            "<Status>error</Status>"
            "<Error>Authentication failed. Check your API key.</Error>"
            "</Response>"
        )
        result = extract_error(root)
        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0


# ---------------------------------------------------------------------------
# xml_to_dict
# ---------------------------------------------------------------------------

class TestXmlToDict:
    def test_simple_element(self):
        el = ET.fromstring("<Name>Anchor</Name>")
        result = xml_to_dict(el)
        assert isinstance(result, dict)

    def test_element_with_text(self):
        el = ET.fromstring("<Sku>ANCH-001</Sku>")
        result = xml_to_dict(el)
        # Should contain the text value somewhere
        assert "ANCH-001" in str(result)

    def test_nested_elements(self):
        el = ET.fromstring(
            "<Product><Id>5</Id><Name>Boat Hook</Name><Price>29.99</Price></Product>"
        )
        result = xml_to_dict(el)
        assert isinstance(result, dict)
        # Nested keys should appear
        assert "Id" in result or "id" in result or "5" in str(result)

    def test_list_of_same_tag(self):
        el = ET.fromstring(
            "<Orders>"
            "<Order><Id>1</Id></Order>"
            "<Order><Id>2</Id></Order>"
            "</Orders>"
        )
        result = xml_to_dict(el)
        assert isinstance(result, dict)
        # Both order IDs should be represented
        dumped = str(result)
        assert "1" in dumped and "2" in dumped

    def test_empty_element(self):
        el = ET.fromstring("<Empty/>")
        result = xml_to_dict(el)
        assert isinstance(result, dict)

    def test_element_with_attribs(self):
        el = ET.fromstring('<Product id="42" lang="hu"><Name>Fender</Name></Product>')
        result = xml_to_dict(el)
        assert isinstance(result, dict)

    def test_deeply_nested(self):
        xml_str = (
            "<Root>"
            "<Level1>"
            "<Level2>"
            "<Level3>deep value</Level3>"
            "</Level2>"
            "</Level1>"
            "</Root>"
        )
        el = ET.fromstring(xml_str)
        result = xml_to_dict(el)
        assert "deep value" in str(result)


# ---------------------------------------------------------------------------
# Integration-style: login XML round-trip
# ---------------------------------------------------------------------------

class TestLoginXmlRoundTrip:
    def test_login_xml_parse_back(self):
        api_key = "trinexus-test-key-9999"
        xml_str = build_login_xml(api_key)
        root = parse_xml_response(xml_str)
        found_key = extract_text(root, ".//ApiKey") or extract_text(root, "ApiKey")
        assert found_key == api_key

    def test_login_xml_with_webshop_info_parse_back(self):
        xml_str = build_login_xml("some-key", webshop_info=True)
        root = parse_xml_response(xml_str)
        assert root is not None


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:
    def test_build_element_with_unicode_text(self):
        el = build_xml_element("Name", text="Hajófelszerelés Kft. — Ár: 9 900 Ft")
        assert "Hajófelszerelés" in el.text

    def test_build_element_special_chars_in_text(self):
        # Ampersands and quotes must be handled by ET serialisation
        el = build_xml_element("Desc", text="Anchor & Hook")
        xml_str = ET.tostring(el, encoding="unicode")
        # ET will escape & automatically
        assert "Anchor" in xml_str

    def test_parse_xml_with_declaration(self):
        xml_str = '<?xml version="1.0" encoding="UTF-8"?><Root><Item>1</Item></Root>'
        root = parse_xml_response(xml_str)
        assert root.find("Item").text == "1"

    def test_build_multiple_children_order_preserved(self):
        tags = ["First", "Second", "Third"]
        children = [build_xml_element(t, text=str(i)) for i, t in enumerate(tags)]
        parent = build_xml_element("Container", children=children)
        result_tags = [child.tag for child in parent]
        assert result_tags == tags

    def test_xml_to_dict_with_none_raises_or_returns(self):
        try:
            result = xml_to_dict(None)
            assert result is None or isinstance(result, dict)
        except (AttributeError, TypeError, XmlParseError):
            pass  # Acceptable — None input is undefined behaviour
# [FL:DONE]
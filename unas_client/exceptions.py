"""
unas_client/exceptions.py

Custom exceptions for the UNAS API client.
BEOCIA Kft. / Trinexus Aqua — internal developer tool.
"""


class UnasClientError(Exception):
    """Base exception for all UNAS client errors."""

    def __init__(self, message: str = "An unexpected UNAS client error occurred."):
        super().__init__(message)
        self.message = message

    def __str__(self):
        return f"[UnasClientError] {self.message}"


class UnasAuthError(UnasClientError):
    """Raised when authentication fails or the API key is invalid/missing."""

    def __init__(self, message: str = "UNAS authentication failed. Check your API key."):
        super().__init__(message)

    def __str__(self):
        return f"[UnasAuthError] {self.message}"


class UnasMissingApiKeyError(UnasAuthError):
    """Raised when the UNAS API key environment variable is not set."""

    def __init__(self):
        super().__init__(
            "UNAS_API_KEY is not set. "
            "Copy .env.example to .env and provide a valid API key."
        )

    def __str__(self):
        return f"[UnasMissingApiKeyError] {self.message}"


class UnasTokenExpiredError(UnasAuthError):
    """Raised when the cached Bearer token has expired and re-login is required."""

    def __init__(self, message: str = "UNAS Bearer token has expired. Re-login required."):
        super().__init__(message)

    def __str__(self):
        return f"[UnasTokenExpiredError] {self.message}"


class UnasRequestError(UnasClientError):
    """Raised when an API request returns an error response (HTTP 4xx/5xx or XML error)."""

    def __init__(
        self,
        message: str = "UNAS API request returned an error.",
        status_code: int = None,
        xml_error_code: str = None,
        xml_error_message: str = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.xml_error_code = xml_error_code
        self.xml_error_message = xml_error_message

    def __str__(self):
        parts = [f"[UnasRequestError] {self.message}"]
        if self.status_code is not None:
            parts.append(f"HTTP Status: {self.status_code}")
        if self.xml_error_code:
            parts.append(f"XML Error Code: {self.xml_error_code}")
        if self.xml_error_message:
            parts.append(f"XML Error Message: {self.xml_error_message}")
        return " | ".join(parts)


class UnasXmlError(UnasClientError):
    """Raised when an XML response cannot be parsed or is malformed."""

    def __init__(self, message: str = "Failed to parse UNAS XML response."):
        super().__init__(message)

    def __str__(self):
        return f"[UnasXmlError] {self.message}"


class UnasEmptyResponseError(UnasClientError):
    """Raised when the UNAS API returns an empty or blank response body."""

    def __init__(self, message: str = "UNAS API returned an empty response."):
        super().__init__(message)

    def __str__(self):
        return f"[UnasEmptyResponseError] {self.message}"


class UnasNetworkError(UnasClientError):
    """Raised on network-level failures such as timeout or connection error."""

    def __init__(self, message: str = "Network error while connecting to the UNAS API."):
        super().__init__(message)

    def __str__(self):
        return f"[UnasNetworkError] {self.message}"


class UnasTimeoutError(UnasNetworkError):
    """Raised specifically when a request to the UNAS API times out."""

    def __init__(self, timeout_seconds: float = None):
        if timeout_seconds is not None:
            msg = f"UNAS API request timed out after {timeout_seconds}s."
        else:
            msg = "UNAS API request timed out."
        super().__init__(msg)
        self.timeout_seconds = timeout_seconds

    def __str__(self):
        return f"[UnasTimeoutError] {self.message}"


class UnasReadOnlyError(UnasClientError):
    """
    Raised when a write/set* operation is attempted while
    UNAS_READ_ONLY=true is active. Protects against accidental
    destructive API calls during development and testing.
    """

    def __init__(self, function_name: str = None):
        if function_name:
            msg = (
                f"Write operation '{function_name}' is blocked because "
                "UNAS_READ_ONLY=true. Set UNAS_READ_ONLY=false to enable writes."
            )
        else:
            msg = (
                "Write operations are blocked because UNAS_READ_ONLY=true. "
                "Set UNAS_READ_ONLY=false to enable writes."
            )
        super().__init__(msg)
        self.function_name = function_name

    def __str__(self):
        return f"[UnasReadOnlyError] {self.message}"


class UnasRateLimitError(UnasRequestError):
    """Raised when the UNAS API returns a rate-limiting or quota-exceeded error."""

    def __init__(self, message: str = "UNAS API rate limit exceeded. Try again later."):
        super().__init__(message, status_code=429)

    def __str__(self):
        return f"[UnasRateLimitError] {self.message}"


__all__ = [
    "UnasClientError",
    "UnasAuthError",
    "UnasMissingApiKeyError",
    "UnasTokenExpiredError",
    "UnasRequestError",
    "UnasXmlError",
    "UnasEmptyResponseError",
    "UnasNetworkError",
    "UnasTimeoutError",
    "UnasReadOnlyError",
    "UnasRateLimitError",
]
# [FL:DONE]
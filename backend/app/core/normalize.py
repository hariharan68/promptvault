import unicodedata


def normalize_email(email: str) -> str:
    """Canonical form for storing and comparing email addresses.

    NFC-normalize (so visually identical Unicode compares equal), strip
    surrounding whitespace, and lowercase. This is the single function called by
    registration, login, and the OAuth path, so all three agree with the
    ``lower(email)`` unique index that backstops them in the database.
    """
    return unicodedata.normalize("NFC", email).strip().lower()

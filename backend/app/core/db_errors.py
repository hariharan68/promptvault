from sqlalchemy.exc import IntegrityError


def is_unique_violation(exc: IntegrityError) -> bool:
    """True if the IntegrityError is a Postgres unique-constraint violation.

    Keyed on SQLSTATE 23505 (unique_violation) rather than a constraint name:
    the SQLSTATE is stable, while which of several overlapping unique
    constraints Postgres reports is not. Callers that need a uniform,
    field-agnostic response (registration, OAuth creation) don't care *which*
    column collided — only that it was a uniqueness race and not, say, a NOT
    NULL or foreign-key failure that should surface as a 500.
    """
    return getattr(getattr(exc, "orig", None), "pgcode", None) == "23505"

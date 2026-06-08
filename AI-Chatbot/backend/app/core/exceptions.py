"""Custom exceptions"""

from fastapi import HTTPException, status


class NotFoundException(HTTPException):
    """Resource not found exception"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestException(HTTPException):
    """Bad request exception"""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class UnauthorizedException(HTTPException):
    """Unauthorized exception"""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(HTTPException):
    """Forbidden exception"""
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictException(HTTPException):
    """Conflict exception"""
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class ValidationException(HTTPException):
    """Validation exception"""
    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class SeatNotAvailableException(ConflictException):
    """Seat not available exception"""
    def __init__(self, detail: str = "Seat is not available"):
        super().__init__(detail=detail)


class ReservationExpiredException(BadRequestException):
    """Reservation expired exception"""
    def __init__(self, detail: str = "Reservation has expired"):
        super().__init__(detail=detail)


class InvalidQRCodeException(BadRequestException):
    """Invalid QR code exception"""
    def __init__(self, detail: str = "Invalid or expired QR code"):
        super().__init__(detail=detail)


class PassExpiredException(BadRequestException):
    """Pass expired exception"""
    def __init__(self, detail: str = "Bus pass has expired"):
        super().__init__(detail=detail)

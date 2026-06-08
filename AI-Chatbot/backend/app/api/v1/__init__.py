"""API v1 router"""

from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, bookings, chatbot, ckan, passes, qr_codes, routes, users, debug

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(routes.router, prefix="/routes", tags=["Routes"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])
api_router.include_router(passes.router, prefix="/passes", tags=["Bus Passes"])
api_router.include_router(qr_codes.router, prefix="/qr", tags=["QR Codes"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Dashboard"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["AI Chatbot"])
api_router.include_router(chatbot.ai_router, prefix="/ai", tags=["AI Chatbot"])
api_router.include_router(ckan.router, prefix="/ckan", tags=["CKAN Data"])
api_router.include_router(debug.router, prefix="/debug", tags=["Debug"])

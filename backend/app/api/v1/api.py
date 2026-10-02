from fastapi import APIRouter
from app.api.v1.endpoints import users, backups, logs, lesson_interactions, courses, students, integrations, support, quiz, api_tokens, media_uploads

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(users.invites_router)
api_router.include_router(backups.router, include_in_schema=False)
api_router.include_router(logs.router, include_in_schema=False)
api_router.include_router(lesson_interactions.router)
api_router.include_router(courses.router)
api_router.include_router(media_uploads.router)
api_router.include_router(students.router)
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
api_router.include_router(quiz.router)
api_router.include_router(api_tokens.router, prefix="/api-tokens", tags=["api-tokens"])




from fastapi import APIRouter
from app.api.v1.endpoints import users, backups, logs, lesson_interactions, courses, students, integrations

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(backups.router)
api_router.include_router(logs.router)
api_router.include_router(lesson_interactions.router)
api_router.include_router(courses.router)
api_router.include_router(students.router)
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])




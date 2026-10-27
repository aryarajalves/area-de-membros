from fastapi import APIRouter
from app.api.v1.endpoints import (
    users, backups, logs, lesson_interactions, courses, students,
    integrations, support, quiz, api_tokens, media_uploads, chat,
    profile, testimonials, gamification, lesson_transcriptions, platform_links,
    favorites, student_tags, chat_broadcast, funnels, agentflow, tutorials,
    whitelabel, introductions, public_register, chat_members, course_sales,
    infrastructure, course_upsell, events
)

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(public_register.router)
api_router.include_router(users.invites_router)
api_router.include_router(profile.router)
api_router.include_router(backups.router, include_in_schema=False)
api_router.include_router(logs.router, include_in_schema=False)
api_router.include_router(lesson_interactions.router)
api_router.include_router(courses.router)
api_router.include_router(course_sales.router)
api_router.include_router(lesson_transcriptions.router)
api_router.include_router(media_uploads.router)
api_router.include_router(students.router)
api_router.include_router(student_tags.router)
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(support.router, prefix="/support", tags=["support"])
api_router.include_router(quiz.router)
api_router.include_router(api_tokens.router, prefix="/api-tokens", tags=["api-tokens"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(chat_members.router, prefix="/chat", tags=["chat"])
api_router.include_router(chat_broadcast.router)
api_router.include_router(funnels.router)
api_router.include_router(testimonials.router, prefix="/testimonials", tags=["testimonials"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["gamification"])
api_router.include_router(platform_links.router, prefix="/platform-links", tags=["platform-links"])
api_router.include_router(favorites.router)
api_router.include_router(agentflow.router)
api_router.include_router(tutorials.router, prefix="/tutorials", tags=["tutorials"])
api_router.include_router(whitelabel.router, prefix="/whitelabel", tags=["whitelabel"])
api_router.include_router(introductions.router, prefix="/introductions", tags=["introductions"])
api_router.include_router(infrastructure.router)
api_router.include_router(course_upsell.router)
api_router.include_router(events.router, prefix="/events", tags=["events"])

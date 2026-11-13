import pytest
from app.models.user import User
from app.models.chat import ChatMessage, ChatMessageReaction
from app.services.chat_dm_service import (
    get_dm_messages_history,
    mark_dm_as_read,
    mark_dm_as_unread,
    toggle_message_reaction,
    build_reactions_summary,
)
from tests.conftest import TestingSessionLocal


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_build_reactions_summary():
    class FakeReaction:
        def __init__(self, emoji, user_id, user_name):
            self.emoji = emoji
            self.user_id = user_id
            self.user = type("FakeUser", (), {"name": user_name})

    reactions = [
        FakeReaction("❤️", 1, "Alice"),
        FakeReaction("❤️", 2, "Bob"),
        FakeReaction("👍", 1, "Alice"),
    ]
    summary = build_reactions_summary(reactions, current_user_id=1)
    assert len(summary) == 2

    heart = next(s for s in summary if s.emoji == "❤️")
    assert heart.count == 2
    assert heart.reacted_by_me is True
    assert "Alice" in heart.users
    assert "Bob" in heart.users

    thumb = next(s for s in summary if s.emoji == "👍")
    assert thumb.count == 1
    assert thumb.reacted_by_me is True


def test_dm_not_marked_as_read_on_history_fetch(db):
    u1 = User(name="User 1", email="u1@test.com", hashed_password="hash", role="aluno")
    u2 = User(name="User 2", email="u2@test.com", hashed_password="hash", role="aluno")
    db.add_all([u1, u2])
    db.commit()

    msg = ChatMessage(
        channel_type="dm",
        user_id=u2.id,
        recipient_id=u1.id,
        message="Olá User 1!",
        is_read=False,
    )
    db.add(msg)
    db.commit()

    # Ao buscar histórico de mensagens, NÃO deve marcar como lida
    history = get_dm_messages_history(db, current_user=u1, contact_id=u2.id)
    assert len(history) == 1
    assert history[0].is_read is False

    db.refresh(msg)
    assert msg.is_read is False


def test_dm_mark_as_read_and_unread(db):
    u1 = User(name="User A", email="ua@test.com", hashed_password="hash", role="aluno")
    u2 = User(name="User B", email="ub@test.com", hashed_password="hash", role="aluno")
    db.add_all([u1, u2])
    db.commit()

    msg = ChatMessage(
        channel_type="dm",
        user_id=u2.id,
        recipient_id=u1.id,
        message="Oi A",
        is_read=False,
    )
    db.add(msg)
    db.commit()

    # Marcar como lida
    count = mark_dm_as_read(db, current_user=u1, contact_id=u2.id)
    assert count == 1
    db.refresh(msg)
    assert msg.is_read is True

    # Marcar como não lida
    count_unread = mark_dm_as_unread(db, current_user=u1, contact_id=u2.id)
    assert count_unread == 1
    db.refresh(msg)
    assert msg.is_read is False


def test_toggle_message_reaction_and_marks_dm_read(db):
    u1 = User(name="User X", email="ux@test.com", hashed_password="hash", role="aluno")
    u2 = User(name="User Y", email="uy@test.com", hashed_password="hash", role="aluno")
    db.add_all([u1, u2])
    db.commit()

    msg = ChatMessage(
        channel_type="dm",
        user_id=u2.id,
        recipient_id=u1.id,
        message="Mensagem legal",
        is_read=False,
    )
    db.add(msg)
    db.commit()

    # 1. User 1 reage com ❤️
    res1 = toggle_message_reaction(db, current_user=u1, message_id=msg.id, emoji="❤️")
    assert res1["action"] == "added"
    assert len(res1["reactions"]) == 1
    assert res1["reactions"][0].emoji == "❤️"
    assert res1["reactions"][0].reacted_by_me is True

    # Como User 1 reagiu, a mensagem de User 2 deve ter sido marcada como lida!
    db.refresh(msg)
    assert msg.is_read is True

    # 2. User 1 troca para 👍
    res2 = toggle_message_reaction(db, current_user=u1, message_id=msg.id, emoji="👍")
    assert res2["action"] == "switched"
    assert len(res2["reactions"]) == 1
    assert res2["reactions"][0].emoji == "👍"

    # 3. User 1 clica novamente em 👍 (toggle off)
    res3 = toggle_message_reaction(db, current_user=u1, message_id=msg.id, emoji="👍")
    assert res3["action"] == "removed"
    assert len(res3["reactions"]) == 0

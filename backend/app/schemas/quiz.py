from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


# --- Opções do Quiz (Quiz Options) ---
class QuizOptionBase(BaseModel):
    option_text: str
    is_correct: bool = False
    order_index: Optional[int] = 0


class QuizOptionCreate(QuizOptionBase):
    id: Optional[int] = None


class QuizOptionResponse(BaseModel):
    id: int
    question_id: int
    option_text: str
    is_correct: Optional[bool] = None  # Omitido para alunos antes de submeter
    order_index: int

    model_config = ConfigDict(from_attributes=True)


# --- Perguntas do Quiz (Quiz Questions) ---
class QuizQuestionBase(BaseModel):
    question: str
    points: Optional[int] = 1  # Pontos/peso desta pergunta
    order_index: Optional[int] = 0
    explanation: Optional[str] = None


class QuizQuestionCreate(QuizQuestionBase):
    id: Optional[int] = None
    options: List[QuizOptionCreate] = []


class QuizQuestionResponse(QuizQuestionBase):
    id: int
    lesson_id: int
    points: int = 1
    created_at: datetime
    options: List[QuizOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Salvar Conjunto de Perguntas (Admin) ---
class QuizBulkUpdate(BaseModel):
    passing_score_pct: Optional[int] = 70  # Porcentagem mínima de acertos para aprovação
    questions: List[QuizQuestionCreate]


# --- Submissão do Quiz pelo Aluno ---
class QuizSubmissionCreate(BaseModel):
    answers: Dict[int, int]  # question_id -> option_id


class QuizSubmissionResponse(BaseModel):
    id: int
    lesson_id: int
    user_id: int
    score: int  # Porcentagem de acerto (0 a 100)
    total_questions: int
    correct_answers: int
    total_points: Optional[int] = 0
    earned_points: Optional[int] = 0
    passing_score_pct: Optional[int] = 70
    passed: bool
    answers_json: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Estrutura Completa do Quiz para o Aluno/Admin ---
class LessonQuizDetails(BaseModel):
    lesson_id: int
    passing_score_pct: Optional[int] = 70
    questions: List[QuizQuestionResponse]
    last_submission: Optional[QuizSubmissionResponse] = None

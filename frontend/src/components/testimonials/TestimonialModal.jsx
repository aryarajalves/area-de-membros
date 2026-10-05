import React, { useState, useEffect } from 'react';
import { Star, X, Check, BookOpen } from 'lucide-react';

const EMPTY_SET = new Set();

export default function TestimonialModal({
  isOpen,
  onClose,
  onSubmit,
  editingTestimonial = null,
  availableCourses = [],
  userReviewedCourseIds = EMPTY_SET,
  saving = false
}) {
  const [courseId, setCourseId] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const reviewedSet = userReviewedCourseIds instanceof Set
    ? userReviewedCourseIds
    : new Set(userReviewedCourseIds || []);

  const unreviewedCourses = availableCourses.filter((c) => !reviewedSet.has(c.id));
  const hasNoCoursesLeft = !editingTestimonial && availableCourses.length > 0 && unreviewedCourses.length === 0;

  useEffect(() => {
    if (!isOpen) return;

    if (editingTestimonial) {
      setCourseId(editingTestimonial.course_id || '');
      setRating(editingTestimonial.rating || 5);
      setTitle(editingTestimonial.title || '');
      setContent(editingTestimonial.content || '');
    } else {
      const firstAvailable = availableCourses.find((c) => !reviewedSet.has(c.id));
      setCourseId(firstAvailable ? firstAvailable.id : '');
      setRating(5);
      setTitle('');
      setContent('');
    }
  }, [editingTestimonial, isOpen]);



  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseId) return;
    if (!editingTestimonial && reviewedSet.has(Number(courseId))) {
      return;
    }
    if (!content.trim()) return;

    onSubmit({
      course_id: Number(courseId),
      rating,
      title: title.trim(),
      content: content.trim()
    });
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
      data-testid="testimonial-modal-overlay"
    >
      <div
        className="modal-container"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#0d1527',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="testimonial-form-modal"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              {editingTestimonial ? 'Editar Depoimento' : 'Deixar Depoimento'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              {editingTestimonial
                ? 'Atualize sua avaliação para este curso.'
                : 'Compartilhe sua experiência (limite de 1 depoimento por curso).'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
            data-testid="close-testimonial-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {hasNoCoursesLeft ? (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '12px',
              padding: '24px 20px',
              textAlign: 'center',
              margin: '16px 0'
            }}
            data-testid="all-courses-reviewed-alert"
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⭐</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#facc15', fontWeight: 700 }}>
              Você já avaliou todos os seus cursos!
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              Para garantir autenticidade e evitar duplicidades, a plataforma permite <strong>apenas 1 depoimento por curso por pessoa</strong>.
              <br /><br />
              Caso queira alterar sua nota, título ou texto da avaliação, basta localizar seu depoimento na listagem e clicar no botão <strong>"Editar"</strong>.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
              data-testid="understood-all-reviewed-btn"
            >
              Entendido / Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Seleção do Curso */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Selecione o Curso *
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={Boolean(editingTestimonial)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                  data-testid="testimonial-course-select"
                  required
                >
                  {editingTestimonial ? (
                    availableCourses
                      .filter((c) => c.id === editingTestimonial.course_id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))
                  ) : (
                    availableCourses.map((c) => {
                      const isReviewed = reviewedSet.has(c.id);
                      return (
                        <option key={c.id} value={c.id} disabled={isReviewed}>
                          {c.title} {isReviewed ? ' (Já avaliado - Edite no card)' : ''}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                ℹ️ Regra da plataforma: É permitido apenas 1 depoimento por curso por pessoa.
              </span>
            </div>


          {/* Avaliação em Estrelas */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Sua Avaliação (1 a 5 estrelas) *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} data-testid="testimonial-rating-stars">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      transition: 'transform 0.15s'
                    }}
                    data-testid={`star-btn-${star}`}
                  >
                    <Star
                      size={28}
                      fill={filled ? '#eab308' : 'none'}
                      color={filled ? '#eab308' : '#64748b'}
                      style={{ transition: 'all 0.15s' }}
                    />
                  </button>
                );
              })}
              <span style={{ fontSize: '0.9rem', color: '#eab308', fontWeight: 700, marginLeft: '6px' }}>
                {rating} de 5 estrelas
              </span>
            </div>
          </div>

          {/* Título do Depoimento */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Título do Depoimento (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Treinamento prático e direto ao ponto!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              data-testid="testimonial-title-input"
            />
          </div>

          {/* Texto do Depoimento */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Seu Depoimento / Opinião *
            </label>
            <textarea
              placeholder="Conte como foi sua experiência, o que mais gostou nas aulas e os resultados que obteve com o curso..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
              minLength={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '120px'
              }}
              data-testid="testimonial-content-textarea"
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              {content.length} caracteres
            </div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#93c5fd' }}>
            ℹ️ Seu depoimento passará pela moderação da equipe antes de ficar visível na vitrine pública.
          </div>

          {/* Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontWeight: 600
              }}
              data-testid="cancel-testimonial-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim() || !courseId}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: '#3b82f6',
                border: 'none',
                color: '#ffffff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                opacity: saving || !content.trim() || !courseId ? 0.6 : 1
              }}
              data-testid="submit-testimonial-btn"
            >
              <Check size={16} />
              <span>{saving ? 'Enviando...' : (editingTestimonial ? 'Salvar Alterações' : 'Enviar Depoimento')}</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

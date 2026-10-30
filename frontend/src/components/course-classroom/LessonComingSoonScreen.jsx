import React from 'react';
import { Clock, Sparkles, Video } from 'lucide-react';

export default function LessonComingSoonScreen({
  lesson,
  currentTitle,
  isManager,
  onEditLesson
}) {
  return (
    <div
      data-testid="lesson-coming-soon-screen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: lesson?.thumbnail_url
          ? `linear-gradient(rgba(5, 8, 15, 0.82), rgba(5, 8, 15, 0.94)), url(${lesson.thumbnail_url})`
          : 'radial-gradient(circle at 50% 40%, rgba(234, 179, 8, 0.14), #05080f 85%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        textAlign: 'center',
        padding: '32px 24px',
        color: '#f8fafc'
      }}
    >
      <div
        style={{
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          backgroundColor: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '14px',
          boxShadow: '0 0 24px rgba(234, 179, 8, 0.25)'
        }}
      >
        <Clock size={30} color="#eab308" />
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(234, 179, 8, 0.18)',
          border: '1px solid rgba(234, 179, 8, 0.45)',
          color: '#facc15',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '10px'
        }}
        data-testid="coming-soon-tag"
      >
        <Sparkles size={12} />
        <span>Em Breve • Aula em Produção</span>
      </div>

      <h3
        style={{
          fontSize: '20px',
          fontWeight: 800,
          color: '#ffffff',
          margin: '0 0 8px 0',
          maxWidth: '580px'
        }}
      >
        {currentTitle}
      </h3>

      <p
        style={{
          fontSize: '13.5px',
          color: '#94a3b8',
          maxWidth: '480px',
          margin: '0 0 16px 0',
          lineHeight: 1.6
        }}
      >
        Esta aula já foi criada na estrutura do curso e em breve estará funcionando e liberada para você assistir!
      </p>

      {isManager && onEditLesson && (
        <button
          type="button"
          className="primary-btn"
          onClick={() => onEditLesson(lesson)}
          data-testid="coming-soon-edit-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '12.5px'
          }}
        >
          <Video size={14} />
          <span>Editar Aula / Subir Vídeo</span>
        </button>
      )}
    </div>
  );
}

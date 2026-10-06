import React from 'react';
import { Users, BookOpen, Tag, BookX, Clock } from 'lucide-react';

export default function ChatBroadcastAudienceSelector({
  filterType,
  setFilterType,
  courses,
  tags,
  selectedCourseId,
  setSelectedCourseId,
  selectedTagId,
  setSelectedTagId,
  filterDays,
  setFilterDays,
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
        Destinatários (Segmentação do Público):
      </label>

      {/* Botões de Segmentação */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '12px' }}>
        {[
          { id: 'all', label: 'Todos', icon: Users },
          { id: 'course', label: 'Por Curso', icon: BookOpen },
          { id: 'no_course', label: 'Sem Cursos', icon: BookX },
          { id: 'tag', label: 'Por Etiqueta', icon: Tag },
          { id: 'recent_days', label: 'Por Recência', icon: Clock },
        ].map((f) => {
          const isSelected = filterType === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterType(f.id);
                if (f.id === 'recent_days' && !filterDays) {
                  setFilterDays(30);
                }
              }}
              style={{
                padding: '9px 8px',
                borderRadius: '8px',
                backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#c4b5fd' : '#94a3b8',
                fontSize: '0.81rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              data-testid={`filter-type-${f.id}-btn`}
            >
              <f.icon size={15} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Subseletor para Recência (7, 14 ou 30 dias) */}
      {filterType === 'recent_days' && (
        <div style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>
            Selecione o período de entrada dos alunos:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { days: 7, label: 'Últimos 7 dias' },
              { days: 14, label: 'Últimos 14 dias' },
              { days: 30, label: 'Últimos 30 dias' },
            ].map((p) => {
              const isPSelected = Number(filterDays) === p.days;
              return (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => setFilterDays(p.days)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: isPSelected ? '#8b5cf6' : '#1e293b',
                    color: isPSelected ? '#ffffff' : '#cbd5e1',
                    border: isPSelected ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  data-testid={`filter-days-${p.days}-btn`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subseletor para Curso */}
      {filterType === 'course' && (
        <div style={{ marginTop: '8px' }}>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.86rem',
              outline: 'none',
            }}
            data-testid="select-broadcast-course"
          >
            <option value="">Selecione o curso...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subseletor para Etiqueta */}
      {filterType === 'tag' && (
        <div style={{ marginTop: '8px' }}>
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '0.86rem',
              outline: 'none',
            }}
            data-testid="select-broadcast-tag"
          >
            <option value="">Selecione a etiqueta...</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.student_count || 0} alunos)
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}


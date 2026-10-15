import React, { useState, useMemo } from 'react';
import { Package, Search, GraduationCap, Wrench, Check } from 'lucide-react';

export default function CourseBundleSelector({
  availableCourses = [],
  currentCourseId = null,
  selectedCourseIds = [],
  onChangeSelectedCourseIds,
  isLightBg = false
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra cursos removendo o próprio curso atual
  const filteredList = useMemo(() => {
    return availableCourses.filter((c) => {
      if (currentCourseId && c.id === currentCourseId) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (c.title && c.title.toLowerCase().includes(term)) ||
        (c.item_type && c.item_type.toLowerCase().includes(term))
      );
    });
  }, [availableCourses, currentCourseId, searchTerm]);

  const toggleCourse = (id) => {
    if (selectedCourseIds.includes(id)) {
      onChangeSelectedCourseIds(selectedCourseIds.filter((cid) => cid !== id));
    } else {
      onChangeSelectedCourseIds([...selectedCourseIds, id]);
    }
  };

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const boxBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const boxBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.12)';

  // Se não houver outros cursos para vincular
  const otherCoursesCount = availableCourses.filter((c) => !currentCourseId || c.id !== currentCourseId).length;

  return (
    <div className="form-group" style={{ marginBottom: '18px' }} data-testid="course-bundle-selector">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: textColor, margin: 0 }}>
          <Package size={16} style={{ color: '#10b981' }} />
          <span>Produtos e Ferramentas Inclusos neste Pacote (Combo)</span>
        </label>
        {selectedCourseIds.length > 0 && (
          <span
            data-testid="bundle-selected-count-badge"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            {selectedCourseIds.length} incluído(s)
          </span>
        )}
      </div>

      <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 10px 0', lineHeight: '1.4' }}>
        Ao comprar ou receber acesso a este produto, o aluno receberá <strong>automaticamente</strong> acesso a todos os cursos ou ferramentas selecionados abaixo.
      </p>

      {otherCoursesCount === 0 ? (
        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: boxBg, border: boxBorder, fontSize: '12px', color: subTextColor, textAlign: 'center' }}>
          Não há outros cursos ou ferramentas cadastrados para adicionar a este combo.
        </div>
      ) : (
        <div
          style={{
            borderRadius: '10px',
            backgroundColor: boxBg,
            border: boxBorder,
            padding: '10px',
            maxHeight: '220px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {otherCoursesCount > 4 && (
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
              <input
                type="text"
                placeholder="Filtrar cursos ou ferramentas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                  border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          )}

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }} data-testid="bundle-items-list">
            {filteredList.map((c) => {
              const isSelected = selectedCourseIds.includes(c.id);
              const isTool = c.item_type === 'tool';

              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourse(c.id)}
                  data-testid={`bundle-item-${c.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: isSelected
                      ? (isLightBg ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.12)')
                      : (isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)'),
                    border: isSelected
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)')
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? '#10b981' : 'transparent',
                        border: isSelected ? '1px solid #10b981' : (isLightBg ? '1px solid #94a3b8' : '1px solid rgba(255, 255, 255, 0.3)'),
                        color: '#ffffff',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.title}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor: isTool ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isTool ? '#c4b5fd' : '#93c5fd',
                      border: isTool ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                      flexShrink: 0
                    }}
                  >
                    {isTool ? <Wrench size={10} /> : <GraduationCap size={10} />}
                    <span>{isTool ? 'Ferramenta' : 'Curso'}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

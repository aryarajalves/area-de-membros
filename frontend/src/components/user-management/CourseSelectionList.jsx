import React from 'react';
import { Layers, Clock } from 'lucide-react';

export const COURSE_ACCESS_DURATION_OPTIONS = [
  { value: 'lifetime', label: 'Vitalício' },
  { value: '1_hour', label: '1 hora' },
  { value: '2_hours', label: '2 horas' },
  { value: '4_hours', label: '4 horas' },
  { value: '6_hours', label: '6 horas' },
  { value: '12_hours', label: '12 horas' },
  { value: '1_day', label: '1 dia' },
  { value: '2_days', label: '2 dias' },
  { value: '3_days', label: '3 dias' },
  { value: '4_days', label: '4 dias' },
  { value: '5_days', label: '5 dias' },
  { value: '6_days', label: '6 dias' },
  { value: '7_days', label: '7 dias' },
  { value: '1_month', label: '1 mês' },
  { value: '3_months', label: '3 meses' },
  { value: '6_months', label: '6 meses' },
  { value: '1_year', label: '1 ano' },
  { value: '2_years', label: '2 anos' },
  { value: '3_years', label: '3 anos' },
  { value: 'custom', label: 'Personalizado (Dias e Horas)...' },
];

export function parseCustomDuration(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') {
    return { days: 0, hours: 0 };
  }
  const match = durationStr.match(/^custom:(?:(\d+)d)?(?:_)?(?:(\d+)h)?$/);
  if (match) {
    const d = match[1] ? parseInt(match[1], 10) : 0;
    const h = match[2] ? parseInt(match[2], 10) : 0;
    return { days: isNaN(d) ? 0 : d, hours: isNaN(h) ? 0 : h };
  }
  return { days: 0, hours: 0 };
}

export function formatCustomDuration(days, hours) {
  const d = Math.max(0, parseInt(days || 0, 10));
  const h = Math.max(0, parseInt(hours || 0, 10));
  return `custom:${d}d_${h}h`;
}

export function CourseSelectionList({
  prefix,
  courses,
  selectedCourseIds,
  courseAccessMap,
  setCourseAccessMap,
  toggleCourse,
  emptyText,
}) {
  if (courses.length === 0) {
    return (
      <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12.5px', color: '#64748b' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className="course-selection-list" data-testid={`${prefix}-courses-list`}>
      {courses.map((course) => {
        const isSelected = selectedCourseIds.includes(course.id);
        const currentDuration = courseAccessMap[course.id] || 'lifetime';
        const isCustom = typeof currentDuration === 'string' && (currentDuration === 'custom' || currentDuration.startsWith('custom:'));
        const parsedCustom = parseCustomDuration(currentDuration);

        return (
          <div
            key={course.id}
            className={`course-selection-item ${isSelected ? 'selected' : ''}`}
            onClick={() => toggleCourse(course.id, !isSelected)}
            data-testid={`${prefix}-course-item-${course.id}`}
          >
            <div className="course-selection-info" style={{ flex: 1, minWidth: 0 }}>
              {course.thumbnail_url ? (
                <img src={course.thumbnail_url} alt={course.title} className="course-selection-thumb" />
              ) : (
                <div className="course-selection-icon-placeholder">
                  <Layers size={16} />
                </div>
              )}
              <span className="course-selection-title">{course.title}</span>
            </div>

            {isSelected && (
              <div
                className="course-duration-selector"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginRight: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  <select
                    value={isCustom ? 'custom' : currentDuration}
                    onChange={(e) => {
                      e.stopPropagation();
                      const val = e.target.value;
                      if (val === 'custom') {
                        const { days, hours } = parseCustomDuration(currentDuration);
                        const initialDays = days > 0 || hours > 0 ? days : 1;
                        const initialHours = days > 0 || hours > 0 ? hours : 0;
                        setCourseAccessMap((prev) => ({
                          ...prev,
                          [course.id]: formatCustomDuration(initialDays, initialHours),
                        }));
                      } else {
                        setCourseAccessMap((prev) => ({ ...prev, [course.id]: val }));
                      }
                    }}
                    className="course-duration-select"
                    data-testid={`${prefix}-course-duration-${course.id}`}
                    title="Tempo de acesso para este produto"
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      background: 'rgba(245, 158, 11, 0.14)',
                      color: '#d97706',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {COURSE_ACCESS_DURATION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isCustom && (
                  <div
                    className="course-custom-duration-fields"
                    data-testid={`${prefix}-custom-duration-fields-${course.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px dashed rgba(245, 158, 11, 0.45)',
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <input
                        type="number"
                        min="0"
                        max="3650"
                        value={parsedCustom.days}
                        onChange={(e) => {
                          e.stopPropagation();
                          const d = Math.max(0, parseInt(e.target.value || '0', 10));
                          setCourseAccessMap((prev) => ({
                            ...prev,
                            [course.id]: formatCustomDuration(d, parsedCustom.hours),
                          }));
                        }}
                        data-testid={`${prefix}-custom-days-input-${course.id}`}
                        title="Quantidade de Dias"
                        style={{
                          width: '44px',
                          padding: '2px 4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          background: '#ffffff',
                          color: '#1e293b',
                          textAlign: 'center',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>dias</span>
                    </div>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={parsedCustom.hours}
                        onChange={(e) => {
                          e.stopPropagation();
                          const h = Math.min(23, Math.max(0, parseInt(e.target.value || '0', 10)));
                          setCourseAccessMap((prev) => ({
                            ...prev,
                            [course.id]: formatCustomDuration(parsedCustom.days, h),
                          }));
                        }}
                        data-testid={`${prefix}-custom-hours-input-${course.id}`}
                        title="Quantidade de Horas (0 a 23)"
                        style={{
                          width: '40px',
                          padding: '2px 4px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          background: '#ffffff',
                          color: '#1e293b',
                          textAlign: 'center',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>h</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              type="checkbox"
              className="course-selection-checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleCourse(course.id, e.target.checked);
              }}
              data-testid={`${prefix}-course-check-${course.id}`}
            />
          </div>
        );
      })}
    </div>
  );
}

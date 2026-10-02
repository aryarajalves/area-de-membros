import React from 'react';
import { X, ShieldCheck, Check, Copy, KeyRound, BookOpen, Layers, Clock } from 'lucide-react';
import { formatBrasiliaDateTime } from '../student-management/studentDateUtils';

export const COURSE_ACCESS_DURATION_OPTIONS = [
  { value: 'lifetime', label: 'Vitalício' },
  { value: '1_month', label: '1 mês' },
  { value: '3_months', label: '3 meses' },
  { value: '6_months', label: '6 meses' },
  { value: '1_year', label: '1 ano' },
  { value: '2_years', label: '2 anos' },
  { value: '3_years', label: '3 anos' },
];

function CourseSelectionList({
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
                style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '8px' }}
              >
                <Clock size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <select
                  value={currentDuration}
                  onChange={(e) => {
                    e.stopPropagation();
                    setCourseAccessMap((prev) => ({ ...prev, [course.id]: e.target.value }));
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

export function CreateInviteModal({
  isOpen,
  onClose,
  onSubmit,
  error,
  inviteRole,
  setInviteRole,
  expireHours,
  setExpireHours,
  courses = [],
  selectedCourseIds = [],
  setSelectedCourseIds = () => {},
  courseAccessMap = {},
  setCourseAccessMap = () => {},
  generatedInvite,
  copied,
  onCopy,
  onFinish,
  onRedirect,
}) {
  if (!isOpen) return null;

  const toggleCourse = (courseId, checked) => {
    if (checked) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
      if (!courseAccessMap[courseId]) {
        setCourseAccessMap((prev) => ({ ...prev, [courseId]: 'lifetime' }));
      }
    } else {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Gerar Link de Convite</h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {!generatedInvite ? (
          <form onSubmit={onSubmit} className="modal-form">
            {error && <div className="auth-error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="invite-role">Tipo de Usuário</label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                data-testid="invite-role-select"
              >
                <option value="aluno">Aluno</option>
                <option value="admin">Administrador (Admin)</option>
              </select>
              <small className="help-text">
                * O perfil Super Admin não pode ser criado via convite.
              </small>
            </div>

            {inviteRole === 'aluno' && (
              <div className="form-group" data-testid="invite-courses-section">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} color="#2563eb" />
                  <span>Produtos / Cursos Liberados e Tempo de Acesso</span>
                </label>
                <small className="help-text" style={{ display: 'block', marginBottom: '6px' }}>
                  Marque os produtos que o aluno terá acesso e escolha o tempo de duração de cada um:
                </small>
                <CourseSelectionList
                  prefix="invite"
                  courses={courses}
                  selectedCourseIds={selectedCourseIds}
                  courseAccessMap={courseAccessMap}
                  setCourseAccessMap={setCourseAccessMap}
                  toggleCourse={toggleCourse}
                  emptyText="Nenhum curso cadastrado ainda. Você poderá liberá-los após o aluno criar a conta."
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="expire-hours">Tempo para expirar o link do convite</label>
              <select
                id="expire-hours"
                value={expireHours}
                onChange={(e) => setExpireHours(e.target.value)}
                data-testid="expire-hours-select"
              >
                <option value="0">Indefinido (não expira)</option>
                <option value="1">1 hora</option>
                <option value="6">6 horas</option>
                <option value="12">12 horas</option>
                <option value="24">24 horas (1 dia)</option>
                <option value="48">48 horas (2 dias)</option>
                <option value="168">7 dias</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancelar
              </button>
              <button type="submit" className="primary-btn" data-testid="generate-invite-submit-btn">
                Gerar Convite
              </button>
            </div>
          </form>
        ) : (
          <div className="generated-invite-view">
            <div className="invite-success-badge">
              <ShieldCheck size={28} />
              <h4>Link de convite criado com sucesso!</h4>
              <p>
                Perfil: <strong>{generatedInvite.role === 'admin' ? 'Admin' : 'Aluno'}</strong> | 
                {expireHours === '0' || expireHours === 0 ? (
                  <span> Validade: <strong>Indefinido (não expira)</strong></span>
                ) : (
                  <span> Expira em <strong>{expireHours} hora(s)</strong></span>
                )}
              </p>
              {generatedInvite.created_at && (
                <p style={{ marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                  Criado em: <strong style={{ color: '#0284c7' }}>{formatBrasiliaDateTime(generatedInvite.created_at)}</strong> (Horário de Brasília)
                </p>
              )}
            </div>

            <div className="invite-link-box">
              <input
                type="text"
                readOnly
                value={generatedInvite.fullUrl}
                data-testid="generated-link-input"
              />
              <button
                type="button"
                onClick={onCopy}
                className="copy-btn"
                data-testid="copy-invite-btn"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <div className="modal-actions">
              <a
                href={generatedInvite.fullUrl}
                className="primary-btn redirect-link-btn"
                data-testid="open-invite-page-link"
                onClick={onRedirect}
              >
                Acessar Tela de Cadastro
              </a>
              <button
                type="button"
                onClick={onFinish}
                className="cancel-btn"
                data-testid="close-invite-modal-btn"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EditUserRoleModal({
  isOpen,
  onClose,
  editingUser,
  selectedRole,
  setSelectedRole,
  courses = [],
  selectedCourseIds = [],
  setSelectedCourseIds = () => {},
  courseAccessMap = {},
  setCourseAccessMap = () => {},
  onSave,
}) {
  if (!isOpen || !editingUser) return null;

  const toggleCourse = (courseId, checked) => {
    if (checked) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
      if (!courseAccessMap[courseId]) {
        setCourseAccessMap((prev) => ({ ...prev, [courseId]: 'lifetime' }));
      }
    } else {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Alterar Perfil de Acesso</h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-edit-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSave} className="modal-form">
          <div className="user-details-summary">
            <p><strong>Nome:</strong> {editingUser.name}</p>
            <p><strong>E-mail:</strong> {editingUser.email}</p>
            {editingUser.phone && (
              <p><strong>WhatsApp:</strong> <span style={{ color: '#22c55e', fontWeight: 600 }}>{editingUser.phone}</span></p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="user-role-select">Tipo de Usuário</label>
            <select
              id="user-role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              data-testid="edit-role-select"
            >
              <option value="aluno">Aluno</option>
              <option value="admin">Administrador (Admin)</option>
            </select>
            <small className="help-text">
              * O perfil Super Admin não pode ser atribuído a outros usuários.
            </small>
          </div>

          {selectedRole === 'aluno' && (
            <div className="form-group" data-testid="edit-user-courses-section">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={15} color="#2563eb" />
                <span>Produtos / Cursos Liberados e Tempo de Acesso</span>
              </label>
              <small className="help-text" style={{ display: 'block', marginBottom: '6px' }}>
                Marque os produtos que este aluno tem acesso e defina o período de acesso para cada um:
              </small>
              <CourseSelectionList
                prefix="edit"
                courses={courses}
                selectedCourseIds={selectedCourseIds}
                courseAccessMap={courseAccessMap}
                setCourseAccessMap={setCourseAccessMap}
                toggleCourse={toggleCourse}
                emptyText='Nenhum curso cadastrado no momento. Cadastre cursos na aba "Cursos".'
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="primary-btn" data-testid="save-role-btn">
              Salvar Alteração
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  resetData,
  resetCopied,
  onCopyResetLink,
  onRedirect,
}) {
  if (!isOpen || !resetData) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Link de Redefinição de Senha</h3>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-reset-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="generated-invite-view">
          <div className="invite-success-badge">
            <KeyRound size={28} />
            <h4>Link de redefinição gerado com sucesso!</h4>
            <p>
              Usuário: <strong>{resetData.user_name}</strong> ({resetData.user_email})
            </p>
            <small>Este link é seguro e expira em 24 horas.</small>
          </div>

          <div className="invite-link-box">
            <input
              type="text"
              readOnly
              value={resetData.fullUrl}
              data-testid="generated-reset-link-input"
            />
            <button
              type="button"
              onClick={onCopyResetLink}
              className="copy-btn"
              data-testid="copy-reset-link-btn"
            >
              {resetCopied ? <Check size={18} /> : <Copy size={18} />}
              <span>{resetCopied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          <div className="modal-actions">
            <a
              href={resetData.fullUrl}
              className="primary-btn redirect-link-btn"
              data-testid="open-reset-page-link"
              onClick={onRedirect}
            >
              Acessar Tela de Redefinição
            </a>
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Eye, EyeOff, BookOpen } from 'lucide-react';
import PhoneInputWithCountry from '../register/PhoneInputWithCountry';
import { DEFAULT_COUNTRY, formatPhoneNumber } from '../register/countryData';
import { CourseSelectionList } from './UserModals';
import { createUserManualApi } from './userManagementApi';
import PasswordRequirements from '../register/PasswordRequirements';

export default function CreateUserManualModal({
  isOpen,
  onClose,
  onSuccess,
  courses = [],
  addToast = () => {},
  token,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('aluno');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [courseAccessMap, setCourseAccessMap] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Garante que todas as informações venham estritamente em branco ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setSelectedCountry(DEFAULT_COUNTRY);
      setPassword('');
      setShowPassword(false);
      setRole('aluno');
      setSelectedCourseIds([]);
      setCourseAccessMap({});
      setError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value, selectedCountry.ddi);
    setPhone(formatted);
  };

  const handleCountryChange = (newCountry) => {
    setSelectedCountry(newCountry);
    const formatted = formatPhoneNumber(phone, newCountry.ddi);
    setPhone(formatted);
  };

  const toggleCourse = (courseId, checked) => {
    if (checked) {
      setSelectedCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
      if (!courseAccessMap[courseId]) {
        setCourseAccessMap((prev) => ({ ...prev, [courseId]: 'lifetime' }));
      }
    } else {
      setSelectedCourseIds((prev) => prev.filter((id) => id !== courseId));
    }
  };

  const passwordRules = [
    { label: 'No mínimo 12 caracteres', valid: password.length >= 12 },
    { label: 'Pelo menos 1 letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Pelo menos 1 letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Pelo menos 1 número', valid: /\d/.test(password) },
    { label: 'Pelo menos 1 caractere especial (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe o nome completo.');
      return;
    }
    if (!email.trim()) {
      setError('Por favor, informe o e-mail de acesso.');
      return;
    }
    if (!password.trim()) {
      setError('Por favor, informe a senha de acesso.');
      return;
    }
    if (password.length < 12) {
      setError('A senha deve ter no mínimo 12 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('A senha deve conter ao menos 1 letra maiúscula.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('A senha deve conter ao menos 1 letra minúscula.');
      return;
    }
    if (!/\d/.test(password)) {
      setError('A senha deve conter ao menos 1 número.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password)) {
      setError('A senha deve conter ao menos 1 caractere especial.');
      return;
    }

    setSubmitting(true);
    try {
      const activeToken = token || localStorage.getItem('auth_token') || localStorage.getItem('token');
      const formattedPhoneWithDdi = phone.trim() ? `${selectedCountry.ddi} ${phone.trim()}` : null;

      const courseAccessList = role === 'aluno'
        ? selectedCourseIds.map((cid) => ({
            course_id: cid,
            access_duration: courseAccessMap[cid] || 'lifetime',
          }))
        : [];

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhoneWithDdi,
        password: password.trim(),
        role,
        course_ids: role === 'aluno' ? selectedCourseIds : [],
        course_access: courseAccessList,
      };

      const newUser = await createUserManualApi(payload, activeToken);
      addToast('Usuário criado com sucesso!', 'success');
      if (onSuccess) onSuccess(newUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao criar usuário.');
      addToast(err.message || 'Erro ao criar usuário.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay custom-modal-overlay"
      role="dialog"
      aria-modal="true"
      data-testid="create-user-manual-modal"
      style={{
        overflowY: 'auto',
        padding: '32px 16px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-content custom-scrollbar"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Cabeçalho Fixo do Modal */}
        <div
          className="modal-header"
          style={{
            padding: '18px 24px',
            margin: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Criar Novo Usuário</h3>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-create-user-modal-btn"
            aria-label="Fechar modal"
            style={{ padding: '6px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário com Scroll Interno Limpo */}
        <form
          onSubmit={handleSubmit}
          className="modal-form custom-scrollbar"
          data-testid="create-user-form"
          autoComplete="off"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            margin: 0,
          }}
        >
          {/* Honeypots para impedir preenchimento automático pelo navegador */}
          <input
            type="text"
            name="prevent_browser_autofill_user"
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
            readOnly
          />
          <input
            type="password"
            name="prevent_browser_autofill_pwd"
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="new-password"
            readOnly
          />

          {error && (
            <div
              className="auth-error-banner"
              data-testid="create-user-error-banner"
              style={{ marginBottom: '8px' }}
            >
              {error}
            </div>
          )}

          {/* Nome Completo */}
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="create-user-name">Nome Completo *</label>
            <input
              id="create-user-name"
              name="novo_usuario_nome_completo"
              type="text"
              placeholder="Ex: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
              data-testid="create-user-name-input"
            />
          </div>

          {/* E-mail */}
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="create-user-email">E-mail de Acesso *</label>
            <input
              id="create-user-email"
              name="novo_usuario_email_acesso"
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              data-testid="create-user-email-input"
            />
            <small className="help-text">
              * O sistema verifica automaticamente se já existe conta com este e-mail.
            </small>
          </div>

          {/* WhatsApp / Telefone com Seletor DDI */}
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="create-user-phone">WhatsApp / Telefone</label>
            <PhoneInputWithCountry
              phone={phone}
              onPhoneChange={handlePhoneChange}
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryChange}
              dataTestId="create-user-phone-input"
            />
          </div>

          {/* Senha com visualização */}
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="create-user-password">Senha de Acesso *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="create-user-password"
                name="novo_usuario_senha_secreta"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 12 caracteres seguros"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                data-testid="create-user-password-input"
                style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                data-testid="create-user-toggle-password-btn"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordRequirements rules={passwordRules} />
          </div>

          {/* Tipo de Usuário / Perfil */}
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="create-user-role">Tipo de Usuário *</label>
            <select
              id="create-user-role"
              name="novo_usuario_tipo_perfil"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              data-testid="create-user-role-select"
            >
              <option value="aluno">Aluno</option>
              <option value="admin">Administrador (Admin)</option>
            </select>
            <small className="help-text">
              * O perfil Super Admin não pode ser criado manualmente.
            </small>
          </div>

          {/* Cursos Liberados (quando Aluno) */}
          {role === 'aluno' && (
            <div className="form-group" data-testid="create-user-courses-section" style={{ margin: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={15} color="#2563eb" />
                <span>Produtos / Cursos Liberados e Tempo de Acesso</span>
              </label>
              <small className="help-text" style={{ display: 'block', marginBottom: '8px' }}>
                Marque os produtos que o aluno terá acesso e escolha o tempo de duração de cada um:
              </small>
              <CourseSelectionList
                prefix="create-user"
                courses={courses}
                selectedCourseIds={selectedCourseIds}
                courseAccessMap={courseAccessMap}
                setCourseAccessMap={setCourseAccessMap}
                toggleCourse={toggleCourse}
                emptyText="Nenhum curso cadastrado ainda. Você poderá liberá-los após criar o usuário."
              />
            </div>
          )}

          {/* Rodapé de Ações dentro do Form */}
          <div
            className="modal-actions"
            style={{
              marginTop: '8px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
              disabled={submitting}
              data-testid="cancel-create-user-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
              data-testid="submit-create-user-btn"
            >
              {submitting ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

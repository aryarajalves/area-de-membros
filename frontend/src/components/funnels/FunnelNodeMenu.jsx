import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Image,
  Mic,
  Hourglass,
  Search,
  X,
  Zap,
  LogIn,
  Target,
  Tag,
  Award,
  UserX,
  Globe,
  Gift,
  Swords,
  Bell,
  GitFork,
  GraduationCap,
  Octagon,
  MessageSquareText,
  Users,
  Trophy,
  CalendarCheck,
  Bot,
  GripVertical,
  Filter,
  ChevronDown,
} from 'lucide-react';

const NODE_CATALOG = [
  {
    category: 'GATILHOS',
    items: [
      { type: 'trigger', label: 'Aluno Criado', icon: Zap, color: '#eab308', defaultData: { trigger_event: 'student_created' } },
      { type: 'trigger_first_login', label: 'Primeiro Login (1º Acesso)', icon: LogIn, color: '#06b6d4', defaultData: { trigger_event: 'first_login' } },
      { type: 'trigger_course_interest', label: 'Interesse em Curso', icon: Target, color: '#f59e0b', defaultData: { trigger_event: 'course_interest' } },
      { type: 'trigger_progress_milestone', label: 'Marco de Progresso', icon: Award, color: '#a855f7', defaultData: { trigger_event: 'progress_milestone', milestone: '100', milestones: ['100'] } },
      { type: 'trigger_lesson_module_activity', label: 'Aula ou Módulo Concluído', icon: GraduationCap, color: '#38bdf8', defaultData: { trigger_event: 'lesson_module_activity', course_id: null, lesson_id: null, active_options: ['lesson', 'module'] } },
      { type: 'trigger_tutor_ia_lifecycle', label: 'Ciclo do Tutor IA', icon: Bot, color: '#a855f7', defaultData: { trigger_event: 'tutor_ia_lifecycle', active_events: ['first_chat', 'quota_exhausted'], expiring_days: 3 } },
      { type: 'trigger_renewal_warning', label: 'Aviso de Expiração', icon: Hourglass, color: '#f43f5e', defaultData: { trigger_event: 'renewal_warning', days_before: 7 } },
      { type: 'trigger_student_inactivity', label: 'Alerta de Inatividade', icon: UserX, color: '#ec4899', defaultData: { trigger_event: 'student_inactivity', inactive_days: 7 } },
      { type: 'trigger_first_testimonial', label: 'Primeiro Depoimento', icon: MessageSquareText, color: '#38bdf8', defaultData: { trigger_event: 'first_testimonial', course_id: null, course_title: 'Todos os Cursos' } },
      { type: 'trigger_first_presentation', label: 'Primeira Apresentação', icon: Users, color: '#10b981', defaultData: { trigger_event: 'first_presentation' } },
      { type: 'trigger_level_up', label: 'Subida de Nível (Level Up)', icon: Trophy, color: '#c084fc', defaultData: { trigger_event: 'level_up', target_level: 'any' } },
      { type: 'trigger_event_attendance', label: 'Presença em Evento', icon: CalendarCheck, color: '#f472b6', defaultData: { trigger_event: 'event_attendance', event_id: 'any', event_title: 'Qualquer Evento' } },
    ],
  },
  {
    category: 'CONTEÚDO',
    items: [
      { type: 'message', label: 'Texto', icon: MessageSquare, color: '#38bdf8' },
      { type: 'media', label: 'Mídia', icon: Image, color: '#ec4899' },
      { type: 'audio', label: 'Áudio', icon: Mic, color: '#10b981' },
    ],
  },
  {
    category: 'AÇÕES & CONTATOS',
    items: [
      { type: 'tag', label: 'Etiquetas / Tags', icon: Tag, color: '#a855f7' },
      { type: 'action_webhook', label: 'Webhook Externo', icon: Globe, color: '#06b6d4', defaultData: { method: 'POST', url: '' } },
      { type: 'action_enrollment', label: 'Matrícula Automática', icon: Gift, color: '#10b981', defaultData: { course_id: null, access_duration: 'lifetime' } },
      { type: 'action_gamification_xp', label: 'Recompensa XP', icon: Swords, color: '#f59e0b', defaultData: { xp_amount: 50, reason: 'Recompensa do Funil' } },
      { type: 'action_internal_notify', label: 'Notificação Interna', icon: Bell, color: '#f43f5e', defaultData: { notify_target: 'admins', message: '🔔 Alerta: O aluno {aluno} ({email}) atingiu esta etapa!' } },
    ],
  },
  {
    category: 'FLUXO E TEMPO',
    items: [
      { type: 'delay', label: 'Delay', icon: Hourglass, color: '#f59e0b' },
      { type: 'ab_split', label: 'Teste A/B (Split)', icon: GitFork, color: '#ec4899', defaultData: { split_a_pct: 50 } },
      { type: 'condition_course', label: 'Possui Curso?', icon: GraduationCap, color: '#06b6d4', defaultData: { course_id: 'any', course_title: 'Qualquer Curso Ativo' } },
      { type: 'stop', label: 'Encerrar Funil', icon: Octagon, color: '#ef4444', defaultData: { cancel_other_funnels: false } },
    ],
  },
];

const totalNodesCount = NODE_CATALOG.reduce((acc, cat) => acc + cat.items.length, 0);

const CATEGORY_OPTIONS = [
  { id: 'ALL', label: `Todas as Categorias (${totalNodesCount})` },
  ...NODE_CATALOG.map((cat) => ({
    id: cat.category,
    label: `${cat.category} (${cat.items.length})`,
  })),
];

export default function FunnelNodeMenu({ position = { x: 300, y: 150 }, onSelectNode, onClose }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dragPos, setDragPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef(null);
  const menuRef = useRef(null);
  const dragStartRef = useRef({ startX: 0, startY: 0, initialLeft: 0, initialTop: 0 });

  const handleMenuWheel = (e) => {
    e.stopPropagation();
  };

  const handleMouseDownHeader = (e) => {
    if (e.button !== 0) return; // Apenas botão principal (esquerdo)
    if (e.target.closest('button')) return; // Não arrasta se clicou no botão X
    e.preventDefault();
    e.stopPropagation();

    const menuEl = menuRef.current;
    if (!menuEl) return;

    const rect = menuEl.getBoundingClientRect();
    const parentEl = menuEl.parentElement;
    const parentRect = parentEl
      ? parentEl.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    const initialLeft = rect.left - parentRect.left;
    const initialTop = rect.top - parentRect.top;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft,
      initialTop,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      menuWidth: rect.width,
      menuHeight: rect.height,
    };

    setIsDragging(true);
    setDragPos({ x: initialLeft, y: initialTop });

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;

      let newX = dragStartRef.current.initialLeft + dx;
      let newY = dragStartRef.current.initialTop + dy;

      const maxX = Math.max(10, (dragStartRef.current.parentWidth || window.innerWidth) - dragStartRef.current.menuWidth - 10);
      const maxY = Math.max(10, (dragStartRef.current.parentHeight || window.innerHeight) - 60);

      newX = Math.max(10, Math.min(newX, maxX));
      newY = Math.max(10, Math.min(newY, maxY));

      setDragPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const filterItems = (items) => {
    if (!search.trim()) return items;
    return items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase().trim()));
  };

  const isFromBottom = !!position?.fromBottom;
  const initialStyle = isFromBottom
    ? {
        position: 'absolute',
        bottom: position.bottom || '80px',
        left: position.left || '50%',
        transform: position.transform || 'translateX(-50%)',
      }
    : {
        position: 'absolute',
        left: `${position?.x ?? 300}px`,
        top: `${position?.y ?? 150}px`,
      };

  const menuStyle = dragPos
    ? {
        position: 'absolute',
        left: `${dragPos.x}px`,
        top: `${dragPos.y}px`,
      }
    : initialStyle;

  const visibleCategories = NODE_CATALOG.filter((cat) => {
    if (selectedCategory !== 'ALL' && cat.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={handleMenuWheel}
      style={{
        ...menuStyle,
        width: '275px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '12px',
        boxShadow: isDragging
          ? '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 20px rgba(139, 92, 246, 0.3)'
          : '0 20px 45px rgba(0, 0, 0, 0.85)',
        zIndex: 50,
        overflow: 'hidden',
        color: '#f8fafc',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
      data-testid="funnel-node-menu"
    >
      {/* Header com alça de arraste */}
      <div
        onMouseDown={handleMouseDownHeader}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#1e293b',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        data-testid="funnel-node-menu-header"
        title="Segure com o botão esquerdo para mover"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GripVertical size={14} style={{ color: '#94a3b8', opacity: 0.8 }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.05em' }}>
            ADICIONAR NÓ
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
          aria-label="Fechar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Busca */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#020617', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Search size={13} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar nó..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.78rem',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Filtro de Categoria via Dropdown */}
      <div
        style={{
          padding: '6px 10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(2, 6, 23, 0.4)',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#020617',
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Filter size={12} style={{ color: '#a855f7', marginRight: '6px', flexShrink: 0 }} />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            data-testid="funnel-node-category-select"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.74rem',
              fontWeight: 500,
              paddingRight: '18px',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option
                key={opt.id}
                value={opt.id}
                style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            style={{
              position: 'absolute',
              right: '8px',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Lista por Categorias */}
      <div
        ref={scrollRef}
        className="custom-funnel-scroll"
        onWheel={handleMenuWheel}
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          scrollBehavior: 'smooth',
          padding: '8px',
        }}
      >
        {visibleCategories.map((cat) => {
          const matched = filterItems(cat.items);
          if (matched.length === 0) return null;
          return (
            <div key={cat.category} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', padding: '4px 6px', textTransform: 'uppercase' }}>
                {cat.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {matched.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNode(item.type, item.defaultData);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.18)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      data-testid={`add-node-${item.type}`}
                    >
                      <div style={{ color: item.color, display: 'flex', alignItems: 'center' }}>
                        <Icon size={15} />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {visibleCategories.every((cat) => filterItems(cat.items).length === 0) && (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
            Nenhum nó encontrado nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Image,
  Mic,
  Hourglass,
  Search,
  X,
  Zap,
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
} from 'lucide-react';

const NODE_CATALOG = [
  {
    category: 'GATILHOS',
    items: [
      { type: 'trigger', label: 'Aluno Criado', icon: Zap, color: '#eab308', defaultData: { trigger_event: 'student_created' } },
      { type: 'trigger_course_interest', label: 'Interesse em Curso', icon: Target, color: '#f59e0b', defaultData: { trigger_event: 'course_interest' } },
      { type: 'trigger_progress_milestone', label: 'Marco de Progresso', icon: Award, color: '#a855f7', defaultData: { trigger_event: 'progress_milestone', milestone: '100' } },
      { type: 'trigger_renewal_warning', label: 'Aviso de Expiração', icon: Hourglass, color: '#f43f5e', defaultData: { trigger_event: 'renewal_warning', days_before: 7 } },
      { type: 'trigger_student_inactivity', label: 'Alerta de Inatividade', icon: UserX, color: '#ec4899', defaultData: { trigger_event: 'student_inactivity', inactive_days: 7 } },
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

export default function FunnelNodeMenu({ position = { x: 300, y: 150 }, onSelectNode, onClose }) {
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);

  const handleMenuWheel = (e) => {
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollTop += e.deltaY;
    }
  };

  const filterItems = (items) => {
    if (!search.trim()) return items;
    return items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase().trim()));
  };

  const isFromBottom = !!position?.fromBottom;
  const menuStyle = isFromBottom
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

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={handleMenuWheel}
      style={{
        ...menuStyle,
        width: '260px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '12px',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85)',
        zIndex: 50,
        overflow: 'hidden',
        color: '#f8fafc',
      }}
      data-testid="funnel-node-menu"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#1e293b',
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.05em' }}>
          ADICIONAR NÓ
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
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

      {/* Lista por Categorias */}
      <div
        ref={scrollRef}
        className="custom-funnel-scroll"
        onWheel={handleMenuWheel}
        style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}
      >
        {NODE_CATALOG.map((cat) => {
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
      </div>
    </div>
  );
}

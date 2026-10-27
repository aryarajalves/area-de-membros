import React, { useState, useEffect } from 'react';
import {
  Zap,
  Target,
  Award,
  Hourglass,
  UserX,
  Copy,
  Trash2,
  MessageSquareText,
  Users,
  Trophy,
  CalendarCheck,
} from 'lucide-react';
import FunnelTriggerStudentCreatedConfig from './FunnelTriggerStudentCreatedConfig';
import FunnelTriggerCourseInterestConfig from './FunnelTriggerCourseInterestConfig';
import FunnelTriggerProgressConfig from './FunnelTriggerProgressConfig';
import FunnelTriggerRenewalConfig from './FunnelTriggerRenewalConfig';
import FunnelTriggerInactivityConfig from './FunnelTriggerInactivityConfig';
import FunnelTriggerTestimonialConfig from './FunnelTriggerTestimonialConfig';
import FunnelTriggerPresentationConfig from './FunnelTriggerPresentationConfig';
import FunnelTriggerLevelUpConfig from './FunnelTriggerLevelUpConfig';
import FunnelTriggerEventAttendanceConfig from './FunnelTriggerEventAttendanceConfig';

const TRIGGER_METADATA = {
  student_created: {
    label: 'ALUNO CRIADO',
    icon: Zap,
    themeColor: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    textColor: '#facc15',
  },
  course_interest: {
    label: 'INTERESSE EM CURSO',
    icon: Target,
    themeColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    textColor: '#fbbf24',
  },
  progress_milestone: {
    label: 'MARCO DE PROGRESSO',
    icon: Award,
    themeColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    textColor: '#c084fc',
  },
  renewal_warning: {
    label: 'AVISO DE EXPIRAÇÃO',
    icon: Hourglass,
    themeColor: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    textColor: '#fb7185',
  },
  student_inactivity: {
    label: 'ALERTA DE INATIVIDADE',
    icon: UserX,
    themeColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    textColor: '#f472b6',
  },
  first_testimonial: {
    label: 'PRIMEIRO DEPOIMENTO',
    icon: MessageSquareText,
    themeColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    textColor: '#7dd3fc',
  },
  first_presentation: {
    label: 'PRIMEIRA APRESENTAÇÃO',
    icon: Users,
    themeColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    textColor: '#34d399',
  },
  level_up: {
    label: 'SUBIDA DE NÍVEL (LEVEL UP)',
    icon: Trophy,
    themeColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    textColor: '#e9d5ff',
  },
  event_attendance: {
    label: 'PRESENÇA EM EVENTO',
    icon: CalendarCheck,
    themeColor: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.45)',
    textColor: '#fbcfe8',
  },
};

export default function FunnelNodeTrigger({
  node,
  isSelected,
  courses: propCourses,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const triggerEvent = data.trigger_event || 'student_created';
  const meta = TRIGGER_METADATA[triggerEvent] || TRIGGER_METADATA.student_created;
  const IconComponent = meta.icon;

  const [courses, setCourses] = useState(propCourses || []);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (propCourses && propCourses.length > 0) {
      setCourses(propCourses);
      return;
    }
    const EVENTS_REQUIRING_COURSES = ['course_interest', 'progress_milestone', 'renewal_warning', 'student_inactivity', 'first_testimonial'];
    if (!EVENTS_REQUIRING_COURSES.includes(triggerEvent)) return;
    let isMounted = true;
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setCourses(Array.isArray(list) ? list : []);
        }
      } catch {
        /* fallback silencioso */
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [triggerEvent]);

  return (
    <div
      style={{
        position: 'relative',
        width: '320px',
        backgroundColor: '#0b1329',
        border: isSelected ? `2px solid ${meta.themeColor}` : `1px solid ${meta.glowColor || 'rgba(56, 189, 248, 0.4)'}`,
        borderRadius: '14px',
        boxShadow: isSelected
          ? `0 10px 30px ${meta.glowColor}`
          : '0 12px 30px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-trigger-${node.id}`}
    >
      {/* Port de Saída (Conexão para a sequência de mensagens) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: meta.themeColor,
          border: '2px solid #0f172a',
          boxShadow: `0 0 10px ${meta.themeColor}`,
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste para conectar ao próximo passo do funil"
        data-testid={`node-output-handle-${node.id}`}
      />

      {/* Header do Nó */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: `1px solid ${meta.glowColor}`,
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.textColor,
            }}
          >
            <IconComponent size={14} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: meta.textColor, letterSpacing: '0.04em' }}>
              {meta.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: meta.themeColor,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${meta.glowColor}`,
              borderRadius: '10px',
              padding: '2px 6px',
            }}
          >
            GATILHO
          </span>

          {data.is_start && (
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
              data-testid={`funnel-node-start-badge-${node.id}`}
            >
              ▶ INÍCIO
            </span>
          )}

          <button
            onClick={() => onDuplicateNode && onDuplicateNode(node.id)}
            title="Duplicar nó"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => onDeleteNode && onDeleteNode(node.id)}
            title="Excluir nó"
            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Conteúdo Específico do Gatilho */}
      {triggerEvent === 'course_interest' && (
        <FunnelTriggerCourseInterestConfig
          nodeId={node.id}
          data={data}
          courses={courses}
          loadingCourses={loadingCourses}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'progress_milestone' && (
        <FunnelTriggerProgressConfig
          nodeId={node.id}
          data={data}
          courses={courses}
          loadingCourses={loadingCourses}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'renewal_warning' && (
        <FunnelTriggerRenewalConfig
          nodeId={node.id}
          data={data}
          courses={courses}
          loadingCourses={loadingCourses}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'student_inactivity' && (
        <FunnelTriggerInactivityConfig
          nodeId={node.id}
          data={data}
          courses={courses}
          loadingCourses={loadingCourses}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'student_created' && (
        <FunnelTriggerStudentCreatedConfig
          nodeId={node.id}
          data={data}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'first_testimonial' && (
        <FunnelTriggerTestimonialConfig
          nodeId={node.id}
          data={data}
          courses={courses}
          loadingCourses={loadingCourses}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'first_presentation' && (
        <FunnelTriggerPresentationConfig
          nodeId={node.id}
          data={data}
        />
      )}

      {triggerEvent === 'level_up' && (
        <FunnelTriggerLevelUpConfig
          nodeId={node.id}
          data={data}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'event_attendance' && (
        <FunnelTriggerEventAttendanceConfig
          nodeId={node.id}
          data={data}
          onUpdateData={onUpdateData}
        />
      )}
    </div>
  );
}

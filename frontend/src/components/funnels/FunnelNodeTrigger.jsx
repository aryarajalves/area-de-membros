import React, { useState, useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import FunnelTriggerStudentCreatedConfig from './FunnelTriggerStudentCreatedConfig';
import FunnelTriggerCourseInterestConfig from './FunnelTriggerCourseInterestConfig';
import FunnelTriggerProgressConfig from './FunnelTriggerProgressConfig';
import FunnelTriggerRenewalConfig from './FunnelTriggerRenewalConfig';
import FunnelTriggerInactivityConfig from './FunnelTriggerInactivityConfig';
import FunnelTriggerTestimonialConfig from './FunnelTriggerTestimonialConfig';
import FunnelTriggerPresentationConfig from './FunnelTriggerPresentationConfig';
import FunnelTriggerLevelUpConfig from './FunnelTriggerLevelUpConfig';
import FunnelTriggerEventAttendanceConfig from './FunnelTriggerEventAttendanceConfig';
import FunnelTriggerLessonModuleConfig from './FunnelTriggerLessonModuleConfig';
import FunnelTriggerTutorLifecycleConfig from './FunnelTriggerTutorLifecycleConfig';
import FunnelNodeTriggerPorts from './FunnelNodeTriggerPorts';
import { TRIGGER_METADATA } from './funnelTriggerMetadata';

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
  const data = node?.data || {};
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
    const EVENTS_REQUIRING_COURSES = [
      'course_interest',
      'progress_milestone',
      'renewal_warning',
      'student_inactivity',
      'first_testimonial',
      'lesson_module_activity',
    ];
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
  }, [triggerEvent, propCourses]);

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
      {/* Portas / Handles de Saída */}
      <FunnelNodeTriggerPorts
        node={node}
        data={data}
        triggerEvent={triggerEvent}
        meta={meta}
        onStartConnect={onStartConnect}
        onConnectTarget={onConnectTarget}
        isTargetActive={isTargetActive}
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

      {triggerEvent === 'lesson_module_activity' && (
        <FunnelTriggerLessonModuleConfig
          nodeId={node.id}
          data={data}
          courses={courses}
          loadingCourses={loadingCourses}
          onUpdateData={onUpdateData}
        />
      )}

      {triggerEvent === 'tutor_ia_lifecycle' && (
        <FunnelTriggerTutorLifecycleConfig
          nodeId={node.id}
          data={data}
          onUpdateData={onUpdateData}
        />
      )}
    </div>
  );
}

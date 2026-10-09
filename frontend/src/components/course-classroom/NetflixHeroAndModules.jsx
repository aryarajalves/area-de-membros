import React, { useRef, useState } from 'react';
import { Play, Plus, Edit2, Trash2, CheckCircle2, Layers, Sparkles } from 'lucide-react';
import CourseDescriptionModal from './CourseDescriptionModal';

export default function NetflixHeroAndModules({
  course,
  modules = [],
  selectedModuleId,
  activeLesson,
  completedLessonIds = [],
  isManager,
  bgColor = '#090d16',
  onSelectModule,
  onStartCourse,
  onOpenCreateModule,
  onOpenEditModule,
  onPromptDeleteModule,
  onOpenCreateLesson
}) {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const heroBgImage = course?.cover_image_url || course?.thumbnail_url || null;

  // Referência e controle de drag-to-scroll horizontal
  const carouselRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = (e) => {
    if (!carouselRef.current) return;
    isDraggingRef.current = true;
    setIsMouseDown(true);
    hasDraggedRef.current = false;
    const pageX = e.pageX !== undefined ? e.pageX : (e.clientX || 0);
    const offsetLeft = carouselRef.current.offsetLeft || 0;
    startXRef.current = pageX - offsetLeft;
    scrollLeftRef.current = carouselRef.current.scrollLeft || 0;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !carouselRef.current) return;
    const pageX = e.pageX !== undefined ? e.pageX : (e.clientX || 0);
    const offsetLeft = carouselRef.current.offsetLeft || 0;
    const x = pageX - offsetLeft;
    const distance = x - startXRef.current;
    if (Math.abs(distance) > 5) {
      hasDraggedRef.current = true;
    }
    carouselRef.current.scrollLeft = scrollLeftRef.current - distance;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsMouseDown(false);
  };

  // Total de aulas e aulas concluídas
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0);
  const completedCount = completedLessonIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div style={{ marginBottom: '28px' }} data-testid="netflix-showcase-section">
      {/* Banner Hero Cinemático no Topo */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          minHeight: '260px',
          backgroundColor: '#0f172a',
          backgroundImage: heroBgImage
            ? `linear-gradient(90deg, ${bgColor} 0%, rgba(9, 13, 22, 0.85) 45%, rgba(9, 13, 22, 0.35) 100%), linear-gradient(180deg, transparent 50%, ${bgColor} 100%), url(${heroBgImage})`
            : `radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.3), ${bgColor} 70%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
        data-testid="netflix-hero-banner"
      >
        <div style={{ maxWidth: '620px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(234, 179, 8, 0.18)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#facc15', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>
            <Sparkles size={12} />
            <span>Experiência Exclusiva • {modules.length} {modules.length === 1 ? 'Módulo' : 'Módulos'}</span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.02em', lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            {course?.title}
          </h1>

          {course?.description && (() => {
            const isLongDescription = course.description.length > 180;
            const previewText = isLongDescription
              ? course.description.slice(0, 180).trim() + '...'
              : course.description;

            return (
              <div style={{ marginBottom: '18px', maxWidth: '560px' }}>
                <p
                  onClick={() => isLongDescription && setShowDescriptionModal(true)}
                  title={isLongDescription ? 'Clique para ler a descrição completa' : undefined}
                  style={{
                    fontSize: '14px',
                    color: '#cbd5e1',
                    margin: 0,
                    lineHeight: 1.6,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    cursor: isLongDescription ? 'pointer' : 'default'
                  }}
                  data-testid="course-hero-description"
                >
                  <span>{previewText}</span>
                  {isLongDescription && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDescriptionModal(true);
                      }}
                      data-testid="course-hero-read-more-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#facc15',
                        fontWeight: 700,
                        fontSize: '13px',
                        marginLeft: '8px',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Ler mais
                    </button>
                  )}
                </p>
              </div>
            );
          })()}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onStartCourse}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#eab308',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '13.5px',
                padding: '10px 22px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(234, 179, 8, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              data-testid="netflix-hero-start-btn"
            >
              <Play size={16} fill="#0f172a" />
              <span>{completedCount > 0 ? 'Continuar Assistindo' : 'Comece Agora'}</span>
            </button>

            {totalLessons > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '80px', height: '6px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: '999px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                  {progressPct}% concluído
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trilha de Pôsteres dos Módulos Estilo Netflix */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={17} color="#eab308" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              Módulos da Jornada
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>
              (Clique em um módulo para ver as aulas abaixo)
            </span>
          </div>
        </div>

        {modules.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            color: '#94a3b8'
          }}>
            <Layers size={32} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
            <p style={{ fontSize: '13.5px', margin: 0 }}>Nenhum módulo criado ainda neste curso.</p>
            {isManager && (
              <button
                type="button"
                className="primary-btn"
                onClick={onOpenCreateModule}
                style={{ marginTop: '12px', fontSize: '12.5px', padding: '8px 16px' }}
              >
                + Criar primeiro módulo
              </button>
            )}
          </div>
        ) : (
          <div
            ref={carouselRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '12px',
              scrollbarWidth: 'thin',
              cursor: isMouseDown ? 'grabbing' : 'grab',
              userSelect: isMouseDown ? 'none' : 'auto',
              scrollBehavior: isMouseDown ? 'auto' : 'smooth'
            }}
            data-testid="netflix-modules-carousel"
          >
            {modules.map((mod, idx) => {
              const modLessons = mod.lessons || [];
              const firstLesson = modLessons[0];
              const isModSelected = selectedModuleId === mod.id;
              const modCompletedCount = modLessons.filter((l) => completedLessonIds.includes(l.id)).length;
              const modPoster = mod.image_url || firstLesson?.thumbnail_url || course?.thumbnail_url || null;

              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    if (!hasDraggedRef.current) {
                      onSelectModule(mod);
                    }
                  }}
                  style={{
                    position: 'relative',
                    minWidth: '195px',
                    width: '195px',
                    height: '275px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#0b1120',
                    border: isModSelected ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.12)',
                    boxShadow: isModSelected ? '0 10px 25px -5px rgba(234, 179, 8, 0.35)' : '0 8px 20px rgba(0,0,0,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '14px',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    flexShrink: 0
                  }}
                  data-testid={`netflix-module-card-${mod.id}`}
                >
                  {/* Camada Atmosférica de Fundo e Pôster com Enquadramento Inteligente */}
                  {modPoster ? (
                    <>
                      {/* Fundo com desfoque ambiente que preenche qualquer proporção (1:1, 16:9, etc) sem bordas secas */}
                      <div
                        data-testid={`module-ambient-glow-${mod.id}`}
                        style={{
                          position: 'absolute',
                          inset: '-12px',
                          backgroundImage: `url(${modPoster})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: 'blur(16px) brightness(0.35)',
                          zIndex: 0,
                          pointerEvents: 'none'
                        }}
                      />
                      {/* Pôster em alta definição contido e centralizado com degradê de leitura */}
                      <div
                        data-testid={`module-poster-image-${mod.id}`}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: `linear-gradient(180deg, rgba(9,13,22,0.18) 0%, rgba(9,13,22,0.3) 45%, rgba(9,13,22,0.92) 100%), url(${modPoster})`,
                          backgroundSize: 'contain',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          zIndex: 0,
                          pointerEvents: 'none'
                        }}
                      />
                    </>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                        zIndex: 0,
                        pointerEvents: 'none'
                      }}
                    />
                  )}

                  {/* Topo do Pôster: Tag MÓDULO X e botões Admin */}
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      backgroundColor: isModSelected ? '#eab308' : 'rgba(0,0,0,0.65)',
                      color: isModSelected ? '#0f172a' : '#eab308',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      MÓDULO {idx + 1}
                    </span>

                    {isManager && (
                      <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Adicionar Aula"
                          onClick={(e) => onOpenCreateLesson(mod, e)}
                          data-testid={`add-lesson-btn-${mod.id}`}
                          style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', color: '#38bdf8', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' }}
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          title="Editar Módulo"
                          onClick={(e) => onOpenEditModule(mod, e)}
                          data-testid={`edit-module-btn-${mod.id}`}
                          style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          title="Excluir Módulo"
                          onClick={(e) => onPromptDeleteModule(mod, e)}
                          data-testid={`delete-module-btn-${mod.id}`}
                          style={{ background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', color: '#f87171', borderRadius: '4px', padding: '4px', cursor: 'pointer', display: 'flex' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Base do Pôster: Título e Contagem de Aulas */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h4 style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: '0 0 6px 0',
                      lineHeight: 1.25,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {mod.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                      <span>{modLessons.length} {modLessons.length === 1 ? 'aula' : 'aulas'}</span>
                      {modCompletedCount > 0 && (
                        <span style={{ color: '#4ade80', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={12} />
                          {modCompletedCount}/{modLessons.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Centralizado de Leitura da Descrição Completa do Curso */}
      <CourseDescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title={course?.title || 'Sobre o Curso'}
        description={course?.description || ''}
      />
    </div>
  );
}

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, Flame, Clock, CheckCircle2, User, Pin, ChevronLeft, ChevronRight } from 'lucide-react';

export const PILL_FILTERS = [
  { id: 'all', label: 'Todas as Dúvidas', icon: Sparkles },
  { id: 'pinned', label: 'Fixadas por Mim', icon: Pin },
  { id: 'popular', label: 'Mais Populares', icon: Flame },
  { id: 'unanswered', label: 'Aguardando Resposta', icon: Clock },
  { id: 'resolved', label: 'Resolvidas', icon: CheckCircle2 },
  { id: 'my_topics', label: 'Minhas Dúvidas', icon: User },
];

export default function SupportFilterPills({ activeFilter, onSelectFilter, isLightBg }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isMouseDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasDragged = useRef(false);

  const activeBg = isLightBg ? '#0284c7' : '#0284c7';
  const activeColor = '#ffffff';
  const inactiveBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
  const inactiveBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)';
  const inactiveColor = isLightBg ? '#475569' : '#94a3b8';

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll]);

  const handleScrollBy = (offset) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 320);
  };

  // Suporte para rolagem com a roda do mouse horizontal
  const handleWheel = (e) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > 0) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  // Suporte para clicar e arrastar com o mouse (Mouse Drag to Scroll)
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    isMouseDown.current = true;
    const clientX = typeof e.clientX === 'number' ? e.clientX : (typeof e.pageX === 'number' ? e.pageX : 0);
    const offsetLeft = scrollRef.current.offsetLeft || 0;
    startX.current = clientX - offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft || 0;
    hasDragged.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current || !scrollRef.current) return;
    const clientX = typeof e.clientX === 'number' ? e.clientX : (typeof e.pageX === 'number' ? e.pageX : 0);
    const offsetLeft = scrollRef.current.offsetLeft || 0;
    const x = clientX - offsetLeft;
    const walk = x - startX.current;
    if (Math.abs(walk) > 4) {
      hasDragged.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    isMouseDown.current = false;
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
      }}
      data-testid="support-filter-pills-wrapper"
    >
      {/* Botão de Rolagem Esquerda */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScrollBy(-220)}
          style={{
            position: 'absolute',
            left: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isLightBg ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            color: isLightBg ? '#0f172a' : '#f8fafc',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.15s ease',
          }}
          title="Rolar filtros para esquerda"
          aria-label="Rolar filtros para esquerda"
          data-testid="support-scroll-left-btn"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Gradiente sutil à esquerda indicando conteúdo rolável */}
      {canScrollLeft && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: isLightBg
              ? 'linear-gradient(to right, rgba(248, 250, 252, 0.95), transparent)'
              : 'linear-gradient(to right, rgba(11, 15, 25, 0.95), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {/* Container de Filtros com Rolagem Touch e Drag */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          paddingBottom: '8px',
          paddingTop: '2px',
          paddingLeft: canScrollLeft ? '38px' : '2px',
          paddingRight: canScrollRight ? '38px' : '2px',
          width: '100%',
          maxWidth: '100%',
          scrollbarWidth: 'none',
          cursor: isMouseDown.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        data-testid="support-filter-pills"
      >
        {PILL_FILTERS.map((pill) => {
          const isActive = activeFilter === pill.id;
          const Icon = pill.icon;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => {
                if (!hasDragged.current) {
                  onSelectFilter(pill.id);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                backgroundColor: isActive ? activeBg : inactiveBg,
                color: isActive ? activeColor : inactiveColor,
                border: isActive ? '1px solid transparent' : inactiveBorder,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 2px 10px rgba(2, 132, 199, 0.35)' : 'none',
              }}
              data-testid={`support-pill-${pill.id}`}
            >
              <Icon size={14} />
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Gradiente sutil à direita indicando conteúdo rolável */}
      {canScrollRight && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '40px',
            background: isLightBg
              ? 'linear-gradient(to left, rgba(248, 250, 252, 0.95), transparent)'
              : 'linear-gradient(to left, rgba(11, 15, 25, 0.95), transparent)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {/* Botão de Rolagem Direita */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScrollBy(220)}
          style={{
            position: 'absolute',
            right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isLightBg ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.92)',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
            color: isLightBg ? '#0f172a' : '#f8fafc',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'transform 0.15s ease',
          }}
          title="Rolar filtros para direita"
          aria-label="Rolar filtros para direita"
          data-testid="support-scroll-right-btn"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  MessageSquare,
  Image,
  Mic,
  FileText,
  Clock,
  Hourglass,
  PauseCircle,
  Download,
  Search,
  X,
} from 'lucide-react';

const NODE_CATALOG = [
  {
    category: 'CONTEÚDO',
    items: [
      { type: 'message', label: 'Texto', icon: MessageSquare, color: '#38bdf8' },
      { type: 'media', label: 'Mídia', icon: Image, color: '#ec4899' },
      { type: 'audio', label: 'Áudio', icon: Mic, color: '#10b981' },
    ],
  },
  {
    category: 'FLUXO E TEMPO',
    items: [
      { type: 'delay', label: 'Delay', icon: Hourglass, color: '#f59e0b' },
    ],
  },
];

export default function FunnelNodeMenu({ position = { x: 300, y: 150 }, onSelectNode, onClose }) {
  const [search, setSearch] = useState('');

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
        transform: (position?.y ?? 0) > 280 ? 'translateY(-100%)' : 'none',
      };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
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
      <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px' }}>
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
                        onSelectNode(item.type);
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

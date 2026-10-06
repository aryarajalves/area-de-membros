import React from 'react';
import { getNodePortPos, getBezierPath } from './funnelCanvasUtils';

/**
 * Camada SVG para desenho de arestas (conexões entre nós) e linha temporária de arrasto.
 */
export default function FunnelCanvasEdgesLayer({
  nodes = [],
  edges = [],
  connectionDrag = null,
  onDeleteEdge,
  nodeHeights = {},
}) {

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '5000px',
        height: '5000px',
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'visible',
      }}
      data-testid="funnel-edges-layer"
    >
      <defs>
        {/* Marcador de seta final para arestas */}
        <marker
          id="edge-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
      </defs>

      {/* Arestas Estabelecidas */}
      {edges.map((edge) => {
        const srcNode = nodes.find((n) => n.id === edge.source);
        const tgtNode = nodes.find((n) => n.id === edge.target);
        if (!srcNode || !tgtNode) return null;

        const srcPos = getNodePortPos(srcNode, true, nodeHeights);
        const tgtPos = getNodePortPos(tgtNode, false, nodeHeights);

        const x1 = srcPos.x;
        const y1 = srcPos.y;
        const x2 = tgtPos.x;
        const y2 = tgtPos.y;
        const pathData = getBezierPath(x1, y1, x2, y2);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        return (
          <g key={edge.id} data-testid={`funnel-edge-${edge.id}`}>
            {/* Linha de conexão de fundo mais grossa para facilitar visualização */}
            <path
              d={pathData}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              opacity="0.85"
              markerEnd="url(#edge-arrow)"
            />

            {/* Ponto de origem */}
            <circle cx={x1} cy={y1} r="4" fill="#38bdf8" />

            {/* Ponto de destino */}
            <circle cx={x2} cy={y2} r="5" fill="#34d399" />

            {/* Botão para deletar a conexão no ponto médio */}
            {onDeleteEdge && (
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteEdge(edge.id);
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                title="Remover conexão"
                data-testid={`delete-edge-btn-${edge.id}`}
              >
                <circle
                  cx={mx}
                  cy={my}
                  r="11"
                  fill="#0f172a"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                />
                <text
                  x={mx}
                  y={my + 3.5}
                  textAnchor="middle"
                  fill="#ef4444"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Linha Dinâmica em Tempo Real durante o Arrasto (Drag-and-Drop) */}
      {connectionDrag && (
        <g data-testid="connection-drag-preview">
          {(() => {
            const x1 = connectionDrag.sourceX;
            const y1 = connectionDrag.sourceY;
            const x2 = connectionDrag.currentX;
            const y2 = connectionDrag.currentY;
            const pathData = getBezierPath(x1, y1, x2, y2);

            return (
              <>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeDasharray="6,6"
                  opacity="0.95"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))',
                  }}
                />
                <circle cx={x1} cy={y1} r="5" fill="#38bdf8" />
                <circle
                  cx={x2}
                  cy={y2}
                  r="7"
                  fill="#38bdf8"
                  stroke="#fff"
                  strokeWidth="2"
                  style={{
                    filter: 'drop-shadow(0 0 10px #38bdf8)',
                  }}
                />
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
}

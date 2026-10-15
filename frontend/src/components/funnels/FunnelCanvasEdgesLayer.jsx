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
        {/* Marcador de seta padrão (azul neon) */}
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
        {/* Marcador de seta SIM / Atendida (verde esmeralda neon) */}
        <marker
          id="edge-arrow-yes"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
        </marker>
        {/* Marcador de seta NÃO / Não atendida (vermelho neon) */}
        <marker
          id="edge-arrow-no"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
        </marker>
      </defs>

      {/* Arestas Estabelecidas */}
      {edges.map((edge) => {
        const srcNode = nodes.find((n) => n.id === edge.source);
        const tgtNode = nodes.find((n) => n.id === edge.target);
        if (!srcNode || !tgtNode) return null;

        const srcPos = getNodePortPos(srcNode, true, nodeHeights, edge.sourceHandle);
        const tgtPos = getNodePortPos(tgtNode, false, nodeHeights);

        const x1 = srcPos.x;
        const y1 = srcPos.y;
        const x2 = tgtPos.x;
        const y2 = tgtPos.y;
        const pathData = getBezierPath(x1, y1, x2, y2);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;

        const isYes = edge.sourceHandle === 'output_yes' || edge.sourceHandle === 'yes';
        const isNo = edge.sourceHandle === 'output_no' || edge.sourceHandle === 'no';

        const strokeColor = isYes ? '#10b981' : isNo ? '#f43f5e' : '#38bdf8';
        const markerEnd = isYes ? 'url(#edge-arrow-yes)' : isNo ? 'url(#edge-arrow-no)' : 'url(#edge-arrow)';

        return (
          <g key={edge.id} data-testid={`funnel-edge-${edge.id}`}>
            {/* Linha de conexão */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              opacity="0.88"
              markerEnd={markerEnd}
            />

            {/* Ponto de origem */}
            <circle cx={x1} cy={y1} r="4.5" fill={strokeColor} />

            {/* Badge de Ramo Condicional próximo à origem (SIM / NÃO) */}
            {(isYes || isNo) && (
              <g transform={`translate(${x1 + 18}, ${y1})`}>
                <rect
                  x="-12"
                  y="-9"
                  width="24"
                  height="18"
                  rx="4"
                  fill="#0b0614"
                  stroke={strokeColor}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="9px"
                  fontWeight="800"
                  letterSpacing="0.04em"
                >
                  {isYes ? 'SIM' : 'NÃO'}
                </text>
              </g>
            )}

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
                  fontSize="12px"
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

            const isDragYes = connectionDrag.portType === 'output_yes' || connectionDrag.portType === 'yes';
            const isDragNo = connectionDrag.portType === 'output_no' || connectionDrag.portType === 'no';
            const dragColor = isDragYes ? '#10b981' : isDragNo ? '#f43f5e' : '#38bdf8';

            return (
              <>
                <path
                  d={pathData}
                  fill="none"
                  stroke={dragColor}
                  strokeWidth="3.5"
                  strokeDasharray="6,6"
                  opacity="0.95"
                  style={{
                    filter: `drop-shadow(0 0 8px ${dragColor}CC)`,
                  }}
                />
                <circle cx={x1} cy={y1} r="5" fill={dragColor} />
                <circle
                  cx={x2}
                  cy={y2}
                  r="7"
                  fill={dragColor}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{
                    filter: `drop-shadow(0 0 10px ${dragColor})`,
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

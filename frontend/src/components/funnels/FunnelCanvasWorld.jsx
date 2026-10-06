import React from 'react';
import FunnelCanvasEdgesLayer from './FunnelCanvasEdgesLayer';
import FunnelNodeRenderer from './FunnelNodeRenderer';

/**
 * Camada do Mundo do Canvas, transformada matematicamente por pan e zoom.
 * Contém o layer SVG de arestas e todos os nós interativos.
 */
export default function FunnelCanvasWorld({
  pan = { x: 0, y: 0 },
  zoom = 1,
  nodes = [],
  edges = [],
  connectionDrag = null,
  onDeleteEdge,
  onNodeClick,
  onMouseDownNode,
  draggingNode,
  selectedNodeId,
  onUpdateNodeData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  activeConnectingSource,
  nodeHeights = {},
  onNodeHeightMeasured,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
        zIndex: 5,
        pointerEvents: 'none',
      }}
      data-testid="funnel-canvas-world"
    >
      {/* Camada SVG de Conexões */}
      <FunnelCanvasEdgesLayer
        nodes={nodes}
        edges={edges}
        connectionDrag={connectionDrag}
        onDeleteEdge={onDeleteEdge}
        nodeHeights={nodeHeights}
      />

      {/* Nós do Canvas */}
      {nodes.map((node) => (
        <div
          key={node.id}
          ref={(el) => {
            if (el && onNodeHeightMeasured) {
              const h = el.offsetHeight;
              if (h) onNodeHeightMeasured(node.id, h);
            }
          }}
          onClick={() => onNodeClick(node.id)}
          onMouseDown={(e) => onMouseDownNode(e, node)}
          onMouseUp={(e) => {
            if (activeConnectingSource && activeConnectingSource !== node.id) {
              e.stopPropagation();
              onConnectTarget(node.id);
            }
          }}
          style={{
            position: 'absolute',
            left: `${node.position.x}px`,
            top: `${node.position.y}px`,
            cursor: draggingNode === node.id ? 'grabbing' : 'grab',
            pointerEvents: 'auto',
          }}
        >
          <FunnelNodeRenderer
            node={node}
            isSelected={selectedNodeId === node.id}
            onUpdateData={onUpdateNodeData}
            onDeleteNode={onDeleteNode}
            onDuplicateNode={onDuplicateNode}
            onStartConnect={onStartConnect}
            onConnectTarget={onConnectTarget}
            isTargetActive={Boolean(activeConnectingSource && activeConnectingSource !== node.id)}
          />
        </div>
      ))}
    </div>
  );
}

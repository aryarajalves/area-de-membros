import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import FunnelCanvasWorld from './FunnelCanvasWorld';
import FunnelNodeMenu from './FunnelNodeMenu';
import FunnelDeleteConfirmModal from './FunnelDeleteConfirmModal';
import FunnelNodeConfirmModal from './FunnelNodeConfirmModal';
import FunnelCanvasToolbar from './FunnelCanvasToolbar';
import FunnelCanvasZoomControls from './FunnelCanvasZoomControls';
import {
  getNodePortPos, getInitialNodeData, normalizeFunnelNodes,
  filterValidEdges, calculateFitView, calculateFocalZoom,
} from './funnelCanvasUtils';

export default function FunnelCanvasPage({ funnelId, onBack }) {
  const [funnel, setFunnel] = useState(null);
  const [name, setName] = useState('Novo Funil');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const hasAutoCenteredRef = useRef(false);
  const [menuPos, setMenuPos] = useState(null);
  const [connectingSource, setConnectingSource] = useState(null);
  const [connectionDrag, setConnectionDrag] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nodeActionTarget, setNodeActionTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [draggingNode, setDraggingNode] = useState(null);
  const { addToast } = useToast();
  const [nodeHeights, setNodeHeights] = useState({});
  const [availableSenders, setAvailableSenders] = useState([]);

  const handleNodeHeightMeasured = useCallback((nodeId, height) => {
    setNodeHeights((prev) => (prev[nodeId] === height ? prev : { ...prev, [nodeId]: height }));
  }, []);

  const fetchFunnel = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/v1/funnels/${funnelId}`, { headers });
      if (!res?.ok) throw new Error('Falha ao carregar funil');
      const data = await res.json();
      setFunnel(data);
      setName(data.name || 'Novo Funil');

      const flow = JSON.parse(data.flow_data || '{}');
      const loadedNodes = normalizeFunnelNodes(flow.nodes || []);
      setNodes(loadedNodes);
      setEdges(filterValidEdges(flow.edges || [], loadedNodes));

      if (loadedNodes.length > 0) {
        const vpW = canvasRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1200);
        const vpH = canvasRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight - 80 : 800);
        const initialFit = calculateFitView(loadedNodes, { width: vpW, height: vpH });
        setPan(initialFit.pan);
        setZoom(initialFit.zoom);
      }

      try {
        const sRes = await fetch('/api/v1/funnels/senders', { headers });
        if (sRes?.ok) {
          const senders = await sRes.json();
          setAvailableSenders(Array.isArray(senders) ? senders : []);
        }
      } catch {
        /* fallback */
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [funnelId, addToast]);

  useEffect(() => {
    hasAutoCenteredRef.current = false;
    fetchFunnel();
  }, [fetchFunnel]);

  // Previne rolagem da janela no canvas, permitindo scroll dentro do menu de nós
  useEffect(() => {
    if (loading || !canvasRef.current) return;
    const preventNativeScroll = (e) => {
      if (e.target?.closest?.('[data-testid="funnel-node-menu"], .custom-funnel-scroll')) return;
      e.preventDefault();
    };
    const el = canvasRef.current;
    el.addEventListener('wheel', preventNativeScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventNativeScroll);
  }, [loading]);

  const centerOnNodes = useCallback((customNodes) => {
    const targetNodes = customNodes || nodes;
    if (targetNodes.length === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const width = rect?.width || (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const height = rect?.height || (typeof window !== 'undefined' ? window.innerHeight - 80 : 800);
    const fit = calculateFitView(targetNodes, { width, height }, nodeHeights);
    setPan(fit.pan);
    setZoom(fit.zoom);
  }, [nodes, nodeHeights]);

  // Centraliza e refina o enquadramento automaticamente na primeira vez que os nós são carregados
  useEffect(() => {
    if (loading || nodes.length === 0 || hasAutoCenteredRef.current) return;
    const timer = setTimeout(() => {
      centerOnNodes();
      hasAutoCenteredRef.current = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [loading, nodes.length, centerOnNodes]);

  const handleWheel = (e) => {
    if (!canvasRef.current) return;
    if (e.target?.closest && e.target.closest('[data-testid="funnel-node-menu"]')) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const focal = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const ratio = e.deltaY < 0 ? 1.08 : 0.92;
    const next = calculateFocalZoom(zoom, pan, ratio, focal);
    setZoom(next.zoom);
    setPan(next.pan);
  };

  const applyZoomAtCenter = (targetZoom) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const focal = { x: rect.width / 2, y: rect.height / 2 };
    const ratio = targetZoom / zoom;
    const next = calculateFocalZoom(zoom, pan, ratio, focal);
    setZoom(next.zoom);
    setPan(next.pan);
  };

  const getCanvasCoords = useCallback((clientX, clientY) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleSaveFlow = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const normalizedNodes = normalizeFunnelNodes(nodes);
      const validEdges = filterValidEdges(edges, normalizedNodes);
      setNodes(normalizedNodes); setEdges(validEdges);
      const flowData = JSON.stringify({ nodes: normalizedNodes, edges: validEdges });
      const res = await fetch(`/api/v1/funnels/${funnelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: name.trim(), flow_data: flowData }),
      });
      if (!res.ok) throw new Error('Falha ao salvar fluxo');
      addToast('Fluxo do funil salvo com sucesso!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ name, nodes, edges }, null, 2));
    const a = Object.assign(document.createElement('a'), { href: dataStr, download: `${name.replace(/\s+/g, '_')}_fluxo.json` });
    document.body.appendChild(a); a.click(); a.remove();
    addToast('Fluxo exportado em JSON com sucesso!', 'success');
  };

  const handleDeleteFunnel = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${funnelId}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error('Falha ao excluir funil');
      addToast('Funil excluído com sucesso!', 'success');
      setShowDeleteModal(false); onBack();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNode = (type, extraData = {}) => {
    const newId = `node_${Date.now()}`;
    let x = 350;
    let y = 200;

    if (menuPos && !menuPos.fromBottom && (menuPos.worldX !== undefined || menuPos.x !== undefined)) {
      x = menuPos.worldX ?? menuPos.x;
      y = menuPos.worldY ?? menuPos.y;
    } else if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerCoords = getCanvasCoords(rect.width / 2, rect.height / 2);
      x = Math.round(centerCoords.x - 140 + ((nodes.length % 6) * 35));
      y = Math.round(centerCoords.y - 70 + ((nodes.length % 6) * 35));
    }

    const nodeType = type.startsWith('trigger') ? 'trigger' : type;
    const newNode = { id: newId, type: nodeType, position: { x, y }, data: getInitialNodeData(type, extraData) };
    setNodes((prev) => normalizeFunnelNodes([...prev, newNode]));
    setSelectedNodeId(newId);
    setMenuPos(null);

    if (connectingSource) {
      const dragPortType = connectionDrag?.portType || 'output';
      const source = dragPortType === 'output' ? connectingSource : newId;
      const target = dragPortType === 'output' ? newId : connectingSource;
      setEdges((prev) => [...prev.filter((e) => e.source !== source && e.target !== target), { id: `edge_${Date.now()}`, source, target }]);
      setConnectingSource(null);
      setConnectionDrag(null);
    }
    addToast('Novo nó adicionado com sucesso!', 'success');
  };

  const handleUpdateNodeData = (nodeId, newData) => {
    setNodes((prev) => normalizeFunnelNodes(prev.map((n) => (n.id === nodeId ? { ...n, data: newData } : n))));
  };
  const handleRequestDeleteNode = (nodeId) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (target) setNodeActionTarget({ type: 'delete', node: target });
  };
  const handleRequestDuplicateNode = (nodeId) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (target) setNodeActionTarget({ type: 'duplicate', node: target });
  };
  const handleConfirmNodeAction = () => {
    if (!nodeActionTarget) return;
    const { type, node } = nodeActionTarget;
    if (type === 'delete') {
      setNodes((prev) => normalizeFunnelNodes(prev.filter((n) => n.id !== node.id)));
      setEdges((prev) => prev.filter((e) => e.source !== node.id && e.target !== node.id));
      addToast('Nó excluído com sucesso!', 'info');
    } else if (type === 'duplicate') {
      setNodes((prev) => normalizeFunnelNodes([
        ...prev,
        { ...node, id: `node_${Date.now()}`, position: { x: node.position.x + 40, y: node.position.y + 40 }, data: { ...node.data, is_start: false } },
      ]));
      addToast('Nó duplicado com sucesso!', 'success');
    }
    setNodeActionTarget(null);
  };
  const handleDeleteEdge = (edgeId) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    addToast('Conexão removida', 'info');
  };

  const handleStartConnect = (sourceId, e, node, portType = 'output') => {
    const n = node || nodes.find((item) => item.id === sourceId);
    if (!n) return;
    const isOutput = portType === 'output' || portType.startsWith('output');
    const portPos = getNodePortPos(n, isOutput, nodeHeights, portType);
    const sourceX = portPos.x;
    const sourceY = portPos.y;

    let currentX = sourceX;
    let currentY = sourceY;
    if (e && canvasRef.current) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      currentX = coords.x;
      currentY = coords.y;
    }

    setConnectingSource(sourceId);
    setConnectionDrag({
      sourceId,
      portType,
      sourceX,
      sourceY,
      currentX,
      currentY,
    });
  };

  const handleConnectTarget = (targetId, targetPortType = 'input') => {
    const sourceId = connectionDrag ? connectionDrag.sourceId : connectingSource;
    const dragPortType = connectionDrag?.portType || 'output';
    if (!sourceId || sourceId === targetId) {
      setConnectionDrag(null);
      setConnectingSource(null);
      return;
    }

    const isOutputSource = dragPortType === 'output' || dragPortType.startsWith('output');
    const effectiveSource = isOutputSource ? sourceId : targetId;
    const effectiveTarget = isOutputSource ? targetId : sourceId;
    const effectiveSourceHandle = isOutputSource && dragPortType.startsWith('output') ? dragPortType : 'output';
    const targetNode = nodes.find((n) => n.id === effectiveTarget);

    if (targetNode?.type === 'trigger') {
      addToast('O nó de gatilho é o ponto inicial do funil e não pode receber conexões de entrada!', 'warning');
      setConnectionDrag(null);
      setConnectingSource(null);
      return;
    }

    const alreadyConnected = edges.some(
      (e) =>
        e.source === effectiveSource &&
        (e.sourceHandle || 'output') === effectiveSourceHandle &&
        e.target === effectiveTarget
    );
    if (alreadyConnected) {
      addToast('Esta conexão já existe!', 'info');
    } else {
      const hadPrevious = edges.some(
        (e) =>
          (e.source === effectiveSource && (e.sourceHandle || 'output') === effectiveSourceHandle) ||
          e.target === effectiveTarget
      );
      setEdges((prev) => [
        ...prev.filter(
          (e) =>
            !(e.source === effectiveSource && (e.sourceHandle || 'output') === effectiveSourceHandle) &&
            e.target !== effectiveTarget
        ),
        {
          id: `edge_${Date.now()}`,
          source: effectiveSource,
          sourceHandle: effectiveSourceHandle,
          target: effectiveTarget,
          targetHandle: 'input',
        },
      ]);
      addToast(hadPrevious ? 'Conexão atualizada com sucesso!' : 'Nós conectados com sucesso!', 'success');
    }

    setConnectionDrag(null);
    setConnectingSource(null);
  };

  const handleNodeClick = (nodeId) => {
    if (connectingSource && connectingSource !== nodeId) {
      handleConnectTarget(nodeId);
    }
    setSelectedNodeId(nodeId);
  };

  const handleMouseDownCanvas = (e) => {
    if (e.button !== 0) return;
    if (e.target?.closest && (e.target.closest('[data-testid="funnel-node-menu"]') || e.target.closest('[data-testid="funnel-zoom-controls"]') || e.target.closest('[data-testid="add-node-canvas-btn"]'))) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setMenuPos(null);
    setSelectedNodeId(null);
  };

  const handleMouseDownNode = (e, node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDraggingNode(node.id);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    dragOffsetRef.current = { x: coords.x - node.position.x, y: coords.y - node.position.y };
  };

  const handleMouseMoveCanvas = (e) => {
    if (connectionDrag) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setConnectionDrag((prev) => ({ ...prev, currentX: Math.round(coords.x), currentY: Math.round(coords.y) }));
      return;
    }
    if (draggingNode && canvasRef.current) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newX = coords.x - dragOffsetRef.current.x;
      const newY = coords.y - dragOffsetRef.current.y;
      setNodes((prev) => prev.map((n) => (n.id === draggingNode ? { ...n, position: { x: Math.round(newX), y: Math.round(newY) } } : n)));
      return;
    }
    if (isPanning) {
      setPan({ x: Math.round(e.clientX - panStartRef.current.x), y: Math.round(e.clientY - panStartRef.current.y) });
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNode(null);
    setIsPanning(false);
    if (connectionDrag) setConnectionDrag(null);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        Carregando fluxo do funil...
      </div>
    );
  }

  const activeConnectingSource = connectionDrag?.sourceId || connectingSource;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 80px)',
        backgroundColor: '#070b19',
        color: '#f8fafc',
        overflow: 'hidden',
        position: 'relative',
      }}
      data-testid="funnel-canvas-page"
    >
      {/* Barra de Ferramentas Superior */}
      <FunnelCanvasToolbar
        name={name}
        setName={setName}
        saving={saving}
        onBack={onBack}
        onSaveFlow={handleSaveFlow}
        onExportJson={handleExportJson}
        onRequestDelete={() => setShowDeleteModal(true)}
      />

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const screenX = Math.round(Math.min(Math.max(10, e.clientX - rect.left), rect.width - 275));
          const screenY = Math.round(Math.min(Math.max(10, e.clientY - rect.top), rect.height - 320));
          const coords = getCanvasCoords(e.clientX, e.clientY);
          setMenuPos({ x: screenX, y: screenY, worldX: Math.round(coords.x - 140), worldY: Math.round(coords.y - 40) });
        }}
        onClick={() => {
          setMenuPos(null);
          setConnectingSource(null);
          setConnectionDrag(null);
        }}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)',
          backgroundSize: `${Math.round(24 * zoom)}px ${Math.round(24 * zoom)}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: isPanning ? 'grabbing' : draggingNode ? 'grabbing' : connectionDrag ? 'crosshair' : 'default',
        }}
        data-testid="funnel-canvas-board"
      >
        {/* Camada do Mundo (Transformada por Pan e Zoom) */}
        <FunnelCanvasWorld
          pan={pan} zoom={zoom} nodes={nodes} edges={edges}
          connectionDrag={connectionDrag} onDeleteEdge={handleDeleteEdge}
          onNodeClick={handleNodeClick} onMouseDownNode={handleMouseDownNode}
          draggingNode={draggingNode} selectedNodeId={selectedNodeId}
          onUpdateNodeData={handleUpdateNodeData} onDeleteNode={handleRequestDeleteNode}
          onDuplicateNode={handleRequestDuplicateNode} onStartConnect={handleStartConnect}
          onConnectTarget={handleConnectTarget} activeConnectingSource={activeConnectingSource}
          nodeHeights={nodeHeights} onNodeHeightMeasured={handleNodeHeightMeasured}
          availableSenders={availableSenders}
        />

        {/* Menu Flutuante "+ Adicionar Nó" */}
        {menuPos && (
          <FunnelNodeMenu position={menuPos} onSelectNode={handleAddNode} onClose={() => setMenuPos(null)} />
        )}

        {/* Controles de Zoom e Botão de Adicionar Nó */}
        <FunnelCanvasZoomControls
          zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan}
          onReset={centerOnNodes}
          onZoomIn={() => applyZoomAtCenter(zoom + 0.15)}
          onZoomOut={() => applyZoomAtCenter(zoom - 0.15)}
          onOpenAddMenu={(e) => { e.stopPropagation(); setMenuPos({ fromBottom: true, bottom: '80px', left: '50%', transform: 'translateX(-50%)' }); }}
        />
      </div>

      {/* Modal de Exclusão do Funil Inteiro */}
      <FunnelDeleteConfirmModal isOpen={showDeleteModal} funnelName={name} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteFunnel} deleting={deleting} />

      {/* Modal de Confirmação para Duplicar ou Excluir Nó Específico */}
      <FunnelNodeConfirmModal
        config={nodeActionTarget}
        onClose={() => setNodeActionTarget(null)}
        onConfirm={handleConfirmNodeAction}
      />
    </div>
  );
}

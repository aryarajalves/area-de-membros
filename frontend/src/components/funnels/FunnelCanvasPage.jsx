import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import FunnelCanvasWorld from './FunnelCanvasWorld';
import FunnelNodeMenu from './FunnelNodeMenu';
import FunnelDeleteConfirmModal from './FunnelDeleteConfirmModal';
import FunnelCanvasToolbar from './FunnelCanvasToolbar';
import FunnelCanvasZoomControls from './FunnelCanvasZoomControls';
import { getNodeWidth, getNodePortPos, getInitialNodeData } from './funnelCanvasUtils';

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
  const [menuPos, setMenuPos] = useState(null);
  const [connectingSource, setConnectingSource] = useState(null);
  const [connectionDrag, setConnectionDrag] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draggingNode, setDraggingNode] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const { addToast } = useToast();
  const [nodeHeights, setNodeHeights] = useState({});

  const handleNodeHeightMeasured = useCallback((nodeId, height) => {
    setNodeHeights((prev) => {
      if (prev[nodeId] === height) return prev;
      return { ...prev, [nodeId]: height };
    });
  }, []);

  const fetchFunnel = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${funnelId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao carregar funil');
      const data = await res.json();
      setFunnel(data);
      setName(data.name || 'Novo Funil');

      const flow = JSON.parse(data.flow_data || '{}');
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [funnelId, addToast]);

  useEffect(() => {
    fetchFunnel();
  }, [fetchFunnel]);

  // Previne rolagem padrão da janela no canvas assim que ele é carregado
  useEffect(() => {
    if (loading) return;
    const el = canvasRef.current;
    if (!el) return;

    const preventNativeScroll = (e) => {
      e.preventDefault();
    };

    el.addEventListener('wheel', preventNativeScroll, { passive: false });
    return () => {
      el.removeEventListener('wheel', preventNativeScroll);
    };
  }, [loading]);

  const handleWheel = (e) => {
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(Number((prevZoom * zoomFactor).toFixed(3)), 0.3), 2.0);
      if (nextZoom === prevZoom || !canvasRef.current) return prevZoom;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prevPan) => {
        const ratio = nextZoom / prevZoom;
        const newPanX = mouseX - (mouseX - prevPan.x) * ratio;
        const newPanY = mouseY - (mouseY - prevPan.y) * ratio;
        return { x: Math.round(newPanX), y: Math.round(newPanY) };
      });

      return nextZoom;
    });
  };

  const applyZoomAtCenter = (targetZoom) => {
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(Number(targetZoom.toFixed(2)), 0.3), 2.0);
      if (nextZoom === prevZoom || !canvasRef.current) return prevZoom;

      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      setPan((prevPan) => {
        const ratio = nextZoom / prevZoom;
        const newPanX = centerX - (centerX - prevPan.x) * ratio;
        const newPanY = centerY - (centerY - prevPan.y) * ratio;
        return { x: Math.round(newPanX), y: Math.round(newPanY) };
      });

      return nextZoom;
    });
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
      const flowData = JSON.stringify({ nodes, edges });
      const res = await fetch(`/api/v1/funnels/${funnelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${name.replace(/\s+/g, '_')}_fluxo.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Fluxo exportado em JSON com sucesso!', 'success');
  };

  const handleDeleteFunnel = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${funnelId}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao excluir funil');
      addToast('Funil excluído com sucesso!', 'success');
      setShowDeleteModal(false);
      onBack();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNode = (type) => {
    const newId = `node_${Date.now()}`;
    let x = 350;
    let y = 200;

    if (menuPos && !menuPos.fromBottom && menuPos.x !== undefined) {
      x = menuPos.x;
      y = menuPos.y;
    } else if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerCoords = getCanvasCoords(rect.width / 2, rect.height / 2);
      x = Math.round(centerCoords.x - 140 + ((nodes.length % 6) * 35));
      y = Math.round(centerCoords.y - 70 + ((nodes.length % 6) * 35));
    }

    const initialData = getInitialNodeData(type);

    const newNode = {
      id: newId,
      type: type,
      position: { x, y },
      data: initialData,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setMenuPos(null);

    if (connectingSource) {
      const dragPortType = connectionDrag?.portType || 'output';
      const effectiveSource = dragPortType === 'output' ? connectingSource : newId;
      const effectiveTarget = dragPortType === 'output' ? newId : connectingSource;
      setEdges((prev) => [...prev, { id: `edge_${Date.now()}`, source: effectiveSource, target: effectiveTarget }]);
      setConnectingSource(null);
      setConnectionDrag(null);
    }

    addToast('Novo nó adicionado com sucesso!', 'success');
  };

  const handleUpdateNodeData = (nodeId, newData) => {
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: newData } : n)));
  };

  const handleDeleteNode = (nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
  };

  const handleDeleteEdge = (edgeId) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    addToast('Conexão removida', 'info');
  };

  const handleDuplicateNode = (nodeId) => {
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    const newId = `node_${Date.now()}`;
    const newNode = {
      ...target,
      id: newId,
      position: { x: target.position.x + 40, y: target.position.y + 40 },
      data: { ...target.data, is_start: false },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handleStartConnect = (sourceId, e, node, portType = 'output') => {
    const n = node || nodes.find((item) => item.id === sourceId);
    if (!n) return;
    const isOutput = portType === 'output';
    const portPos = getNodePortPos(n, isOutput, nodeHeights);
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
    if (!sourceId) return;
    if (sourceId === targetId) {
      setConnectionDrag(null);
      setConnectingSource(null);
      return;
    }

    const effectiveSource = dragPortType === 'output' ? sourceId : targetId;
    const effectiveTarget = dragPortType === 'output' ? targetId : sourceId;

    const alreadyConnected = edges.some((e) => e.source === effectiveSource && e.target === effectiveTarget);
    if (alreadyConnected) {
      addToast('Esta conexão já existe!', 'info');
    } else {
      setEdges((prev) => [...prev, { id: `edge_${Date.now()}`, source: effectiveSource, target: effectiveTarget }]);
      addToast('Nós conectados com sucesso!', 'success');
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
    if (e.button === 0) {
      if (
        e.target?.closest &&
        (e.target.closest('[data-testid="funnel-node-menu"]') ||
          e.target.closest('[data-testid="funnel-zoom-controls"]') ||
          e.target.closest('[data-testid="add-node-canvas-btn"]'))
      ) {
        return;
      }
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setMenuPos(null);
      setSelectedNodeId(null);
    }
  };

  const handleMouseDownNode = (e, node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDraggingNode(node.id);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    dragOffsetRef.current = {
      x: coords.x - node.position.x,
      y: coords.y - node.position.y,
    };
  };

  const handleMouseMoveCanvas = (e) => {
    if (connectionDrag) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setConnectionDrag((prev) => ({
        ...prev,
        currentX: Math.round(coords.x),
        currentY: Math.round(coords.y),
      }));
      return;
    }

    if (draggingNode && canvasRef.current) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newX = coords.x - dragOffsetRef.current.x;
      const newY = coords.y - dragOffsetRef.current.y;
      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNode ? { ...n, position: { x: Math.round(newX), y: Math.round(newY) } } : n))
      );
      return;
    }

    if (isPanning) {
      setPan({
        x: Math.round(e.clientX - panStartRef.current.x),
        y: Math.round(e.clientY - panStartRef.current.y),
      });
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNode(null);
    setIsPanning(false);
    if (connectionDrag) {
      setConnectionDrag(null);
    }
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
          const coords = getCanvasCoords(e.clientX, e.clientY);
          setMenuPos({ x: Math.round(coords.x), y: Math.round(coords.y) });
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
          pan={pan}
          zoom={zoom}
          nodes={nodes}
          edges={edges}
          connectionDrag={connectionDrag}
          onDeleteEdge={handleDeleteEdge}
          onNodeClick={handleNodeClick}
          onMouseDownNode={handleMouseDownNode}
          draggingNode={draggingNode}
          selectedNodeId={selectedNodeId}
          onUpdateNodeData={handleUpdateNodeData}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          onStartConnect={handleStartConnect}
          onConnectTarget={handleConnectTarget}
          activeConnectingSource={activeConnectingSource}
          nodeHeights={nodeHeights}
          onNodeHeightMeasured={handleNodeHeightMeasured}
        />

        {/* Menu Flutuante "+ Adicionar Nó" */}
        {menuPos && (
          <FunnelNodeMenu
            position={menuPos}
            onSelectNode={handleAddNode}
            onClose={() => setMenuPos(null)}
          />
        )}

        {/* Controles de Zoom e Botão de Adicionar Nó */}
        <FunnelCanvasZoomControls
          zoom={zoom}
          setZoom={setZoom}
          pan={pan}
          setPan={setPan}
          onZoomIn={() => applyZoomAtCenter(zoom + 0.15)}
          onZoomOut={() => applyZoomAtCenter(zoom - 0.15)}
          onOpenAddMenu={(e) => {
            e.stopPropagation();
            setMenuPos({ fromBottom: true, bottom: '80px', left: '50%', transform: 'translateX(-50%)' });
          }}
        />
      </div>

      {/* Modal de Exclusão */}
      <FunnelDeleteConfirmModal
        isOpen={showDeleteModal}
        funnelName={name}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteFunnel}
        deleting={deleting}
      />
    </div>
  );
}

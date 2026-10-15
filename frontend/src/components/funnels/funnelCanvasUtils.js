/**
 * Utilitários de geometria e conexão para o Canvas de Funis.
 * Centraliza os cálculos de dimensões e coordenadas exatas dos pontos de conexão (bolinhas).
 */

export const getNodeWidth = (type) => {
  if (type === 'delay') return 240;
  if (type === 'trigger' || type === 'trigger_course_interest') return 320;
  if (type === 'tag') return 300;
  if (type === 'media') return 300;
  if (type === 'audio') return 290;
  return 320;
};

export const getDefaultNodeHeight = (node) => {
  if (!node) return 120;
  if (node.type === 'delay') return 94;
  if (node.type === 'tag') return 160;
  if (node.type === 'trigger' || node.type === 'trigger_course_interest') {
    return node.data?.trigger_event === 'course_interest' ? 220 : 215;
  }
  if (node.type === 'audio') return 138;
  if (node.type === 'media') return 214;
  if (node.type === 'message') {
    const btnCount = node.data?.buttons?.length || 0;
    return 320 + btnCount * 44;
  }
  return 120;
};

/**
 * Retorna as coordenadas exatas do centro da bolinha (handle) de entrada ou saída de um nó.
 * - Entrada (isOutput = false): borda esquerda do nó (x = position.x), centralizado verticalmente (top: 50%).
 * - Saída (isOutput = true): borda direita do nó (x = position.x + width), centralizado verticalmente (top: 50%).
 */
export const getNodePortPos = (node, isOutput = false, nodeHeights = {}, portId = null) => {
  if (!node) return { x: 0, y: 0 };
  const width = getNodeWidth(node.type);
  const height = (nodeHeights && nodeHeights[node.id]) || getDefaultNodeHeight(node);

  if (isOutput && node.type === 'tag' && node.data?.tag_action === 'condition') {
    const isYes = portId === 'output_yes' || portId === 'yes';
    const isNo = portId === 'output_no' || portId === 'no';
    if (isYes) {
      return { x: node.position.x + width, y: node.position.y + Math.round(height * 0.35) };
    }
    if (isNo) {
      return { x: node.position.x + width, y: node.position.y + Math.round(height * 0.65) };
    }
  }

  const centerY = Math.round(height / 2);
  const x = isOutput ? node.position.x + width : node.position.x;
  const y = node.position.y + centerY;
  return { x, y };
};

/**
 * Gera o path Bézier SVG suave entre dois pontos.
 */
export const getBezierPath = (x1, y1, x2, y2) => {
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
};

export const getInitialNodeData = (type, extraData = {}) => {
  if (type === 'trigger_course_interest' || (type === 'trigger' && extraData.trigger_event === 'course_interest')) {
    return {
      trigger_event: 'course_interest',
      course_id: null,
      course_title: 'Todos os Cursos',
      is_start: true,
      ...extraData,
    };
  }
  if (type === 'trigger') {
    return {
      trigger_event: 'student_created',
      delay_type: 'immediate',
      days_after: 0,
      is_start: true,
      ...extraData,
    };
  }
  if (type === 'tag') return { tag_id: null, tag_name: '', tag_color: '#3b82f6', ...extraData };
  if (type === 'message') return { text: 'Digite sua mensagem...', buttons: [], ...extraData };
  if (type === 'delay') return { delay_seconds: 2, ...extraData };
  if (type === 'media') return { media_url: '', caption: '', media_type: 'image', ...extraData };
  if (type === 'audio') return { audio_url: '', is_voice_note: true, ...extraData };
  return { text: 'Novo nó', ...extraData };
};

/**
 * Normaliza os nós do funil garantindo que:
 * 1. Se existir algum nó de tipo 'trigger', o primeiro gatilho é automaticamente o nó de início (is_start: true).
 * 2. Nenhum outro nó (mensagem, áudio, mídia, delay) possui is_start: true quando houver gatilho.
 * 3. Se NÃO houver gatilho, preserva ou define o primeiro nó como nó de início.
 */
export const normalizeFunnelNodes = (nodes = []) => {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const hasTrigger = nodes.some((n) => n.type === 'trigger');
  const targetIndex = hasTrigger
    ? nodes.findIndex((n) => n.type === 'trigger')
    : Math.max(0, nodes.findIndex((n) => n.data?.is_start));

  return nodes.map((node, index) => {
    const shouldBeStart = index === targetIndex;
    if (node.data?.is_start === shouldBeStart) {
      return node;
    }
    return {
      ...node,
      data: {
        ...(node.data || {}),
        is_start: shouldBeStart,
      },
    };
  });
};

/**
 * Valida se uma conexão entre nós é permitida no funil.
 * Regras:
 * - Origem e destino devem existir e ser diferentes.
 * - O nó de Gatilho/Início NUNCA pode ser destino (target), pois é o ponto de entrada do funil.
 */
export const isValidEdgeConnection = (sourceNode, targetNode) => {
  if (!sourceNode || !targetNode) return false;
  if (sourceNode.id === targetNode.id) return false;
  if (targetNode.type === 'trigger') return false;
  return true;
};

/**
 * Filtra a lista de arestas removendo conexões inválidas e garantindo unicidade 1-para-1:
 * - Origem e destino devem existir e ser diferentes.
 * - Nós de gatilho/início nunca podem receber conexões (target).
 * - Cada nó só pode se conectar com 1 outro nó (no máximo 1 saída por source e 1 entrada por target).
 *   Caso haja múltiplas, preserva a conexão mais recente e descarta anteriores.
 */
export const filterValidEdges = (edges = [], nodes = []) => {
  if (!Array.isArray(edges)) return [];
  const nodeMap = new Map((nodes || []).map((n) => [n.id, n]));
  const validEdges = [];
  const usedSources = new Set();
  const usedTargets = new Set();

  for (let i = edges.length - 1; i >= 0; i--) {
    const e = edges[i];
    const src = nodeMap.get(e.source);
    const tgt = nodeMap.get(e.target);
    if (!src || !tgt || !isValidEdgeConnection(src, tgt)) continue;

    const srcKey = e.sourceHandle ? `${e.source}__${e.sourceHandle}` : e.source;
    if (usedSources.has(srcKey) || usedTargets.has(e.target)) continue;

    usedSources.add(srcKey);
    usedTargets.add(e.target);
    validEdges.unshift(e);
  }

  return validEdges;
};

/**
 * Calcula o enquadramento ideal (pan e zoom) para centralizar todos os nós no viewport.
 * - Centraliza a caixa delimitadora (bounding box) dos nós no meio da tela.
 * - Ajusta o zoom automaticamente com margem (padding) se o conteúdo for maior que a tela.
 * - Limita o zoom máximo a 1.0 (100%) para não esticar os nós quando houver poucos elementos.
 */
export const calculateFitView = (
  nodes = [],
  viewport = { width: 1200, height: 800 },
  nodeHeights = {},
  padding = 80
) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { pan: { x: 0, y: 0 }, zoom: 1 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    const x = typeof n?.position?.x === 'number' ? n.position.x : 0;
    const y = typeof n?.position?.y === 'number' ? n.position.y : 0;
    const w = getNodeWidth(n?.type);
    const h = (nodeHeights && nodeHeights[n?.id]) || getDefaultNodeHeight(n);

    if (x < minX) minX = x;
    if (x + w > maxX) maxX = x + w;
    if (y < minY) minY = y;
    if (y + h > maxY) maxY = y + h;
  });

  const clusterWidth = Math.max(maxX - minX, 1);
  const clusterHeight = Math.max(maxY - minY, 1);
  const clusterCenterX = minX + clusterWidth / 2;
  const clusterCenterY = minY + clusterHeight / 2;

  const vpWidth = Math.max(viewport?.width || 1200, 300);
  const vpHeight = Math.max(viewport?.height || 800, 300);

  const availableWidth = Math.max(vpWidth - padding * 2, 100);
  const availableHeight = Math.max(vpHeight - padding * 2, 100);

  const zoomX = availableWidth / clusterWidth;
  const zoomY = availableHeight / clusterHeight;
  const targetZoom = Math.min(Math.max(Number(Math.min(zoomX, zoomY, 1.0).toFixed(2)), 0.3), 2.0);

  const panX = Math.round(vpWidth / 2 - clusterCenterX * targetZoom);
  const panY = Math.round(vpHeight / 2 - clusterCenterY * targetZoom);

  return {
    pan: { x: panX, y: panY },
    zoom: targetZoom,
  };
};

/**
 * Calcula a nova posição de pan e nível de zoom mantendo um ponto focal fixo na tela.
 */
export const calculateFocalZoom = (prevZoom, prevPan, zoomRatio, focalPoint, minZoom = 0.3, maxZoom = 2.0) => {
  const nextZoom = Math.min(Math.max(Number((prevZoom * zoomRatio).toFixed(3)), minZoom), maxZoom);
  if (nextZoom === prevZoom || !focalPoint) return { zoom: prevZoom, pan: prevPan };

  const ratio = nextZoom / prevZoom;
  const newPanX = focalPoint.x - (focalPoint.x - prevPan.x) * ratio;
  const newPanY = focalPoint.y - (focalPoint.y - prevPan.y) * ratio;

  return {
    zoom: nextZoom,
    pan: { x: Math.round(newPanX), y: Math.round(newPanY) },
  };
};


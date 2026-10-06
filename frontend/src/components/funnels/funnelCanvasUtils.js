/**
 * Utilitários de geometria e conexão para o Canvas de Funis.
 * Centraliza os cálculos de dimensões e coordenadas exatas dos pontos de conexão (bolinhas).
 */

export const getNodeWidth = (type) => {
  if (type === 'delay') return 240;
  if (type === 'media') return 300;
  if (type === 'audio') return 290;
  return 320;
};

export const getDefaultNodeHeight = (node) => {
  if (!node) return 120;
  if (node.type === 'delay') return 94;
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
export const getNodePortPos = (node, isOutput = false, nodeHeights = {}) => {
  if (!node) return { x: 0, y: 0 };
  const width = getNodeWidth(node.type);
  const height = (nodeHeights && nodeHeights[node.id]) || getDefaultNodeHeight(node);
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

export const getInitialNodeData = (type) => {
  if (type === 'message') return { text: 'Digite sua mensagem...', buttons: [] };
  if (type === 'delay') return { delay_seconds: 2 };
  if (type === 'media') return { media_url: '', caption: '', media_type: 'image' };
  if (type === 'audio') return { audio_url: '', is_voice_note: true };
  return { text: 'Novo nó' };
};

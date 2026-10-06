import { describe, it, expect } from 'vitest';
import {
  getNodeWidth,
  getDefaultNodeHeight,
  getNodePortPos,
  getBezierPath,
  getInitialNodeData,
} from './funnelCanvasUtils';

describe('funnelCanvasUtils Unit Tests', () => {
  it('returns correct widths for each node type', () => {
    expect(getNodeWidth('delay')).toBe(240);
    expect(getNodeWidth('audio')).toBe(290);
    expect(getNodeWidth('media')).toBe(300);
    expect(getNodeWidth('message')).toBe(320);
    expect(getNodeWidth('unknown')).toBe(320);
  });

  it('calculates default node height based on type and buttons count', () => {
    expect(getDefaultNodeHeight({ type: 'delay' })).toBe(94);
    expect(getDefaultNodeHeight({ type: 'audio' })).toBe(138);
    expect(getDefaultNodeHeight({ type: 'media' })).toBe(214);

    // Mensagem com 0 botões
    expect(getDefaultNodeHeight({ type: 'message', data: { buttons: [] } })).toBe(320);

    // Mensagem com 2 botões adicionais (+44px por botão)
    expect(getDefaultNodeHeight({ type: 'message', data: { buttons: [{}, {}] } })).toBe(408);
  });

  it('calculates exact handle/port center position (top: 50%) for input and output', () => {
    const node = {
      id: 'node_1',
      type: 'message',
      position: { x: 100, y: 200 },
      data: { buttons: [] },
    };

    // Altura padrão da mensagem = 320px -> centerY = 160px (top: 50%)
    // Entrada (esquerda): x = 100, y = 200 + 160 = 360
    const inputPort = getNodePortPos(node, false);
    expect(inputPort).toEqual({ x: 100, y: 360 });

    // Saída (direita): x = 100 + 320 = 420, y = 200 + 160 = 360
    const outputPort = getNodePortPos(node, true);
    expect(outputPort).toEqual({ x: 420, y: 360 });
  });

  it('uses measured DOM height when nodeHeights map contains the node ID', () => {
    const node = {
      id: 'node_delay',
      type: 'delay',
      position: { x: 50, y: 80 },
    };

    const measuredHeights = {
      node_delay: 100, // Medido no DOM como 100px -> centerY = 50px
    };

    const port = getNodePortPos(node, true, measuredHeights);
    expect(port).toEqual({ x: 50 + 240, y: 80 + 50 });
  });

  it('generates valid SVG cubic bezier curve string', () => {
    const path = getBezierPath(100, 200, 300, 400);
    expect(path).toContain('M 100 200 C');
    expect(path).toContain('300 400');
  });

  it('returns appropriate initial data for each node type', () => {
    expect(getInitialNodeData('message')).toHaveProperty('text');
    expect(getInitialNodeData('delay')).toEqual({ delay_seconds: 2 });
    expect(getInitialNodeData('media')).toEqual({ media_url: '', caption: '', media_type: 'image' });
    expect(getInitialNodeData('audio')).toEqual({ audio_url: '', is_voice_note: true });
    expect(getInitialNodeData('outro')).toEqual({ text: 'Novo nó' });
  });
});

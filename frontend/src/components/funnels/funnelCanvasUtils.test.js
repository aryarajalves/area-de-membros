import { describe, it, expect } from 'vitest';
import {
  getNodeWidth,
  getDefaultNodeHeight,
  getNodePortPos,
  getBezierPath,
  getInitialNodeData,
  normalizeFunnelNodes,
  isValidEdgeConnection,
  filterValidEdges,
  calculateFitView,
  calculateFocalZoom,
} from './funnelCanvasUtils';

describe('funnelCanvasUtils Unit Tests', () => {
  it('returns correct widths for each node type', () => {
    expect(getNodeWidth('delay')).toBe(240);
    expect(getNodeWidth('trigger')).toBe(320);
    expect(getNodeWidth('trigger_course_interest')).toBe(320);
    expect(getNodeWidth('tag')).toBe(300);
    expect(getNodeWidth('audio')).toBe(290);
    expect(getNodeWidth('media')).toBe(300);
    expect(getNodeWidth('message')).toBe(320);
    expect(getNodeWidth('unknown')).toBe(320);
  });

  it('calculates default node height based on type and buttons count', () => {
    expect(getDefaultNodeHeight({ type: 'delay' })).toBe(94);
    expect(getDefaultNodeHeight({ type: 'trigger' })).toBe(215);
    expect(getDefaultNodeHeight({ type: 'trigger', data: { trigger_event: 'course_interest' } })).toBe(220);
    expect(getDefaultNodeHeight({ type: 'tag' })).toBe(160);
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
    expect(getInitialNodeData('trigger')).toEqual({
      trigger_event: 'student_created',
      delay_type: 'immediate',
      days_after: 0,
      is_start: true,
    });
    expect(getInitialNodeData('trigger_course_interest')).toEqual({
      trigger_event: 'course_interest',
      course_id: null,
      course_title: 'Todos os Cursos',
      is_start: true,
    });
    expect(getInitialNodeData('tag')).toEqual({
      tag_id: null,
      tag_name: '',
      tag_color: '#3b82f6',
    });
    expect(getInitialNodeData('message')).toHaveProperty('text');
    expect(getInitialNodeData('delay')).toEqual({ delay_seconds: 2 });
    expect(getInitialNodeData('media')).toEqual({ media_url: '', caption: '', media_type: 'image' });
    expect(getInitialNodeData('audio')).toEqual({ audio_url: '', is_voice_note: true });
    expect(getInitialNodeData('outro')).toEqual({ text: 'Novo nó' });
  });

  describe('normalizeFunnelNodes', () => {
    it('returns empty array when passed empty or non-array values', () => {
      expect(normalizeFunnelNodes([])).toEqual([]);
      expect(normalizeFunnelNodes(null)).toEqual([]);
      expect(normalizeFunnelNodes(undefined)).toEqual([]);
    });

    it('makes trigger node the start node (is_start: true) and clears is_start on other nodes', () => {
      const nodes = [
        { id: 'msg_1', type: 'message', data: { is_start: true, text: 'Olá!' } },
        { id: 'trig_1', type: 'trigger', data: { trigger_event: 'student_created' } },
        { id: 'audio_1', type: 'audio', data: { is_start: true } },
      ];

      const normalized = normalizeFunnelNodes(nodes);

      expect(normalized.find((n) => n.id === 'trig_1').data.is_start).toBe(true);
      expect(normalized.find((n) => n.id === 'msg_1').data.is_start).toBe(false);
      expect(normalized.find((n) => n.id === 'audio_1').data.is_start).toBe(false);
    });

    it('assigns is_start: true strictly to the first trigger if multiple triggers exist', () => {
      const nodes = [
        { id: 'trig_1', type: 'trigger', data: { trigger_event: 'student_created' } },
        { id: 'trig_2', type: 'trigger', data: { trigger_event: 'student_created' } },
      ];

      const normalized = normalizeFunnelNodes(nodes);

      expect(normalized[0].data.is_start).toBe(true);
      expect(normalized[1].data.is_start).toBe(false);
    });

    it('falls back to message node when no triggers exist', () => {
      const nodes = [
        { id: 'msg_1', type: 'message', data: { is_start: false, text: 'Primeira mensagem' } },
        { id: 'msg_2', type: 'message', data: { is_start: false, text: 'Segunda mensagem' } },
      ];

      const normalized = normalizeFunnelNodes(nodes);

      expect(normalized[0].data.is_start).toBe(true);
      expect(normalized[1].data.is_start).toBe(false);
    });

    it('preserves existing start node when no triggers exist and one node is already start', () => {
      const nodes = [
        { id: 'msg_1', type: 'message', data: { is_start: false } },
        { id: 'msg_2', type: 'message', data: { is_start: true } },
      ];

      const normalized = normalizeFunnelNodes(nodes);

      expect(normalized[0].data.is_start).toBe(false);
      expect(normalized[1].data.is_start).toBe(true);
    });
  });

  describe('isValidEdgeConnection & filterValidEdges', () => {
    it('blocks connection if target node is of type trigger', () => {
      const source = { id: 'msg_1', type: 'message' };
      const triggerTarget = { id: 'trig_1', type: 'trigger' };

      expect(isValidEdgeConnection(source, triggerTarget)).toBe(false);
    });

    it('allows connection from trigger to message or message to message/delay', () => {
      const triggerSource = { id: 'trig_1', type: 'trigger' };
      const messageTarget = { id: 'msg_1', type: 'message' };
      const delayTarget = { id: 'delay_1', type: 'delay' };

      expect(isValidEdgeConnection(triggerSource, messageTarget)).toBe(true);
      expect(isValidEdgeConnection(messageTarget, delayTarget)).toBe(true);
    });

    it('blocks self-loops', () => {
      const node = { id: 'msg_1', type: 'message' };
      expect(isValidEdgeConnection(node, node)).toBe(false);
    });

    it('filters out invalid edges pointing to triggers from the edges list', () => {
      const nodes = [
        { id: 'trig_1', type: 'trigger' },
        { id: 'msg_1', type: 'message' },
      ];
      const edges = [
        { id: 'e1', source: 'trig_1', target: 'msg_1' }, // válido
        { id: 'e2', source: 'msg_1', target: 'trig_1' }, // inválido (aponta para o gatilho)
        { id: 'e3', source: 'msg_1', target: 'trig_inexistente' }, // inválido (nó inexistente)
      ];

      const validEdges = filterValidEdges(edges, nodes);
      expect(validEdges).toHaveLength(1);
      expect(validEdges[0].id).toBe('e1');
    });

    it('enforces 1-to-1 connections by filtering out duplicate outgoing edges from the same source', () => {
      const nodes = [
        { id: 'trig_1', type: 'trigger' },
        { id: 'msg_1', type: 'message' },
        { id: 'msg_2', type: 'message' },
      ];
      const edges = [
        { id: 'e1', source: 'trig_1', target: 'msg_1' },
        { id: 'e2', source: 'trig_1', target: 'msg_2' }, // mais recente
      ];

      const validEdges = filterValidEdges(edges, nodes);
      expect(validEdges).toHaveLength(1);
      expect(validEdges[0].id).toBe('e2');
      expect(validEdges[0].target).toBe('msg_2');
    });

    it('enforces 1-to-1 connections by filtering out duplicate incoming edges into the same target', () => {
      const nodes = [
        { id: 'msg_1', type: 'message' },
        { id: 'msg_2', type: 'message' },
        { id: 'msg_3', type: 'message' },
      ];
      const edges = [
        { id: 'e1', source: 'msg_1', target: 'msg_3' },
        { id: 'e2', source: 'msg_2', target: 'msg_3' }, // mais recente
      ];

      const validEdges = filterValidEdges(edges, nodes);
      expect(validEdges).toHaveLength(1);
      expect(validEdges[0].id).toBe('e2');
      expect(validEdges[0].source).toBe('msg_2');
    });
  });

  describe('calculateFitView Unit Tests', () => {
    it('returns default pan and zoom 1 when nodes array is empty or invalid', () => {
      expect(calculateFitView([])).toEqual({ pan: { x: 0, y: 0 }, zoom: 1 });
      expect(calculateFitView(null)).toEqual({ pan: { x: 0, y: 0 }, zoom: 1 });
    });

    it('centers a single node within the viewport without exceeding max zoom 1.0', () => {
      // Nó de gatilho: largura 320, altura 215 posicionado em (100, 100)
      // Centro do nó: x = 100 + 160 = 260, y = 100 + 107.5 = 207.5
      const nodes = [{ id: 'trig_1', type: 'trigger', position: { x: 100, y: 100 } }];
      const viewport = { width: 1000, height: 600 };

      const result = calculateFitView(nodes, viewport);
      expect(result.zoom).toBe(1);
      // PanX = 1000/2 - 260*1 = 500 - 260 = 240
      expect(result.pan.x).toBe(240);
      // PanY = Math.round(600/2 - 207.5*1) = Math.round(92.5) = 93
      expect(result.pan.y).toBe(93);
    });

    it('scales down zoom when nodes cluster exceeds viewport bounds', () => {
      // Dois nós muito distantes: x de 0 a 1920 (clusterWidth = 2000)
      const nodes = [
        { id: 'node_1', type: 'message', position: { x: 0, y: 0 } },
        { id: 'node_2', type: 'message', position: { x: 1680, y: 0 } }, // 1680 + 320 = 2000
      ];
      const viewport = { width: 1000, height: 600 };

      const result = calculateFitView(nodes, viewport, {}, 80);
      // availableWidth = 1000 - 160 = 840. zoomX = 840 / 2000 = 0.42
      expect(result.zoom).toBeCloseTo(0.42, 1);
      expect(result.zoom).toBeLessThan(1);
      // O centro do cluster (x=1000) deve estar posicionado no centro da tela (x=500)
      const screenCenterX = result.pan.x + 1000 * result.zoom;
      expect(Math.round(screenCenterX)).toBe(500);
    });

    it('respects dynamically measured heights from nodeHeights map', () => {
      const nodes = [{ id: 'node_custom', type: 'delay', position: { x: 0, y: 0 } }];
      const nodeHeights = { node_custom: 300 }; // Em vez dos 94px padrão
      const viewport = { width: 800, height: 600 };

      const result = calculateFitView(nodes, viewport, nodeHeights);
      // Centro Y do nó: 0 + 300/2 = 150
      // PanY = 600/2 - 150 = 150
      expect(result.pan.y).toBe(150);
    });
  });

  describe('calculateFocalZoom Unit Tests', () => {
    it('calculates updated pan correctly to keep focal point anchored', () => {
      const focal = { x: 400, y: 300 };
      const currentPan = { x: 100, y: 50 };
      const currentZoom = 1.0;
      const zoomRatio = 1.5;

      const result = calculateFocalZoom(currentZoom, currentPan, zoomRatio, focal);
      expect(result.zoom).toBe(1.5);
      // newPanX = 400 - (400 - 100) * 1.5 = 400 - 450 = -50
      expect(result.pan.x).toBe(-50);
      // newPanY = 300 - (300 - 50) * 1.5 = 300 - 375 = -75
      expect(result.pan.y).toBe(-75);
    });

    it('respects minZoom and maxZoom boundary limits', () => {
      const focal = { x: 200, y: 200 };
      // Tentativa de zoom out além do limite inferior (0.3)
      const minResult = calculateFocalZoom(0.35, { x: 0, y: 0 }, 0.5, focal, 0.3, 2.0);
      expect(minResult.zoom).toBe(0.3);

      // Tentativa de zoom in além do limite superior (2.0)
      const maxResult = calculateFocalZoom(1.9, { x: 0, y: 0 }, 1.5, focal, 0.3, 2.0);
      expect(maxResult.zoom).toBe(2.0);
    });
  });
});

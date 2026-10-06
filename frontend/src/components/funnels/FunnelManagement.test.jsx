import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelsListPage from './FunnelsListPage';
import FunnelCanvasPage from './FunnelCanvasPage';
import FunnelNodeMenu from './FunnelNodeMenu';
import FunnelNodeMedia from './FunnelNodeMedia';
import FunnelNodeAudio from './FunnelNodeAudio';
import FunnelDeleteConfirmModal from './FunnelDeleteConfirmModal';
import ChatBroadcastButtonConfig from '../student-management/ChatBroadcastButtonConfig';
import { ToastProvider } from '../../context/ToastContext';

describe('Funnel Components Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.setItem('auth_token', 'fake-jwt-token');
  });

  it('renders FunnelsListPage with title and empty state or list', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: 'Funil de Onboarding',
          description: 'Boas-vindas',
          nodes_count: 2,
          executions_count: 5,
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(
      <ToastProvider>
        <FunnelsListPage onSelectFunnel={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByText('Carregando seus funis...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Funil de Onboarding')).toBeInTheDocument();
      expect(screen.getByText('2 nós')).toBeInTheDocument();
      expect(screen.getByText('5 execuções')).toBeInTheDocument();
    });
  });

  it('opens and cancels delete modal in FunnelDeleteConfirmModal', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <FunnelDeleteConfirmModal
        isOpen={true}
        funnelName="Funil VIP"
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText(/Excluir Funil de Mensagens/i)).toBeInTheDocument();
    expect(screen.getByText(/"Funil VIP"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-delete-funnel-btn'));
    expect(handleClose).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('confirm-delete-funnel-btn'));
    expect(handleConfirm).toHaveBeenCalled();
  });

  it('renders FunnelNodeMenu and calls onSelectNode', () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <FunnelNodeMenu
        position={{ x: 200, y: 100 }}
        onSelectNode={handleSelect}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('ADICIONAR NÓ')).toBeInTheDocument();
    expect(screen.getByText('CONTEÚDO')).toBeInTheDocument();
    expect(screen.getByText('FLUXO E TEMPO')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-node-message'));
    expect(handleSelect).toHaveBeenCalledWith('message');

    fireEvent.click(screen.getByTestId('add-node-delay'));
    expect(handleSelect).toHaveBeenCalledWith('delay');
  });

  it('renders FunnelCanvasPage with nodes and top bar controls', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Funil Automatizado',
        flow_data: JSON.stringify({
          nodes: [
            {
              id: 'node_1',
              type: 'message',
              position: { x: 100, y: 100 },
              data: { is_start: true, text: 'Olá do funil!' },
            },
          ],
          edges: [],
        }),
      }),
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={1} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Funil Automatizado')).toBeInTheDocument();
      expect(screen.getByText('MENSAGEM')).toBeInTheDocument();
      expect(screen.getByText('▶ INÍCIO')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Olá do funil!')).toBeInTheDocument();
    });
  });

  it('renders FunnelNodeMedia with media types and URL input', () => {
    const handleUpdate = vi.fn();
    render(
      <FunnelNodeMedia
        node={{
          id: 'media_1',
          type: 'media',
          data: { media_url: 'https://exemplo.com/foto.jpg', caption: 'Foto de boas-vindas' },
        }}
        isSelected={false}
        onUpdateData={handleUpdate}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
      />
    );

    expect(screen.getByText('MÍDIA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://exemplo.com/foto.jpg')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Foto de boas-vindas')).toBeInTheDocument();
    expect(screen.getByText('Imagem')).toBeInTheDocument();
    expect(screen.getByText('Vídeo')).toBeInTheDocument();
    expect(screen.getByText('Documento')).toBeInTheDocument();
  });

  it('renders FunnelNodeAudio with audio URL and voice note toggle', () => {
    const handleUpdate = vi.fn();
    render(
      <FunnelNodeAudio
        node={{
          id: 'audio_1',
          type: 'audio',
          data: { audio_url: 'https://exemplo.com/audio.mp3', is_voice_note: true },
        }}
        isSelected={false}
        onUpdateData={handleUpdate}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
      />
    );

    expect(screen.getByText('ÁUDIO')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://exemplo.com/audio.mp3')).toBeInTheDocument();
    expect(screen.getByText(/Simular gravado na hora/i)).toBeInTheDocument();
  });

  it('verifies FunnelNodeMenu contains strictly the 4 basic nodes and positions correctly when fromBottom', () => {
    render(
      <FunnelNodeMenu
        position={{ fromBottom: true, bottom: '80px', left: '50%', transform: 'translateX(-50%)' }}
        onSelectNode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const menu = screen.getByTestId('funnel-node-menu');
    expect(menu.style.bottom).toBe('80px');

    // Estritamente os 4 nós básicos
    expect(screen.getByTestId('add-node-message')).toBeInTheDocument();
    expect(screen.getByTestId('add-node-media')).toBeInTheDocument();
    expect(screen.getByTestId('add-node-audio')).toBeInTheDocument();
    expect(screen.getByTestId('add-node-delay')).toBeInTheDocument();

    // Nós removidos não devem existir
    expect(screen.queryByTestId('add-node-template')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-node-window24h')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-node-wait_action')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-node-input_data')).not.toBeInTheDocument();
  });

  it('handles zoom controls and resets zoom and pan', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Funil Zoom Test',
        flow_data: JSON.stringify({
          nodes: [
            { id: 'node_1', type: 'message', position: { x: 50, y: 50 }, data: { text: 'Oi' } },
          ],
          edges: [],
        }),
      }),
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={1} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('100%');
    });

    // Clicar em Zoom In (+)
    fireEvent.click(screen.getByTestId('zoom-in-btn'));
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('115%');

    // Clicar em Zoom Out (-)
    fireEvent.click(screen.getByTestId('zoom-out-btn'));
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('100%');

    // Clicar novamente em Zoom In e depois Reset
    fireEvent.click(screen.getByTestId('zoom-in-btn'));
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('115%');
    fireEvent.click(screen.getByTestId('zoom-reset-btn'));
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('100%');
  });

  it('creates connection between nodes via output handle drag-and-drop and allows deleting edge', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Funil Drag Test',
        flow_data: JSON.stringify({
          nodes: [
            { id: 'node_src', type: 'message', position: { x: 50, y: 50 }, data: { is_start: true, text: 'Nó Origem' } },
            { id: 'node_tgt', type: 'delay', position: { x: 450, y: 50 }, data: { delay_seconds: 5 } },
          ],
          edges: [],
        }),
      }),
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={1} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('node-output-handle-node_src')).toBeInTheDocument();
      expect(screen.getByTestId('node-input-handle-node_tgt')).toBeInTheDocument();
    });

    const canvasBoard = screen.getByTestId('funnel-canvas-board');
    const outputHandle = screen.getByTestId('node-output-handle-node_src');
    const inputHandle = screen.getByTestId('node-input-handle-node_tgt');

    // 1. Iniciar arrasto na bolinha de saída
    fireEvent.mouseDown(outputHandle, { clientX: 370, clientY: 120 });

    // Preview dinâmico de arraste deve estar visível no SVG
    expect(screen.getByTestId('connection-drag-preview')).toBeInTheDocument();

    // 2. Mover o mouse pelo canvas
    fireEvent.mouseMove(canvasBoard, { clientX: 420, clientY: 120 });
    expect(screen.getByTestId('connection-drag-preview')).toBeInTheDocument();

    // 3. Soltar (mouseUp) na bolinha de entrada do nó destino
    fireEvent.mouseUp(inputHandle);

    // Conexão criada! O preview de arraste é finalizado
    expect(screen.queryByTestId('connection-drag-preview')).not.toBeInTheDocument();

    // A aresta foi criada e possui botão de deleção no SVG
    const deleteEdgeBtns = screen.getAllByTitle('Remover conexão');
    expect(deleteEdgeBtns.length).toBeGreaterThanOrEqual(1);

    // 4. Clicar no botão de exclusão da conexão
    fireEvent.click(deleteEdgeBtns[0]);
    expect(screen.queryByTitle('Remover conexão')).not.toBeInTheDocument();
  });

  it('opens node menu and successfully adds a new delay node to the canvas', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Funil Add Node Test',
        flow_data: JSON.stringify({
          nodes: [
            { id: 'node_init', type: 'message', position: { x: 50, y: 50 }, data: { is_start: true, text: 'Nó Inicial' } },
          ],
          edges: [],
        }),
      }),
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={1} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-node-canvas-btn')).toBeInTheDocument();
    });

    // Clica no botão central inferior para abrir o menu de adicionar nós
    fireEvent.click(screen.getByTestId('add-node-canvas-btn'));
    expect(screen.getByTestId('funnel-node-menu')).toBeInTheDocument();

    // Clica no botão "Delay" para adicionar
    fireEvent.click(screen.getByTestId('add-node-delay'));

    // Menu deve fechar e o nó de Delay deve aparecer no canvas
    expect(screen.queryByTestId('funnel-node-menu')).not.toBeInTheDocument();
    expect(screen.getByText('DELAY')).toBeInTheDocument();
  });

  it('handles mouse wheel zoom on the canvas board', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Funil Wheel Test',
        flow_data: JSON.stringify({
          nodes: [{ id: 'node_1', type: 'message', position: { x: 50, y: 50 }, data: { text: 'Olá' } }],
          edges: [],
        }),
      }),
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={1} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('100%');
    });

    const board = screen.getByTestId('funnel-canvas-board');

    // Rola para cima (deltaY < 0 -> zoom in)
    fireEvent.wheel(board, { deltaY: -100, clientX: 200, clientY: 200 });
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('108%');

    // Rola para baixo (deltaY > 0 -> zoom out)
    fireEvent.wheel(board, { deltaY: 100, clientX: 200, clientY: 200 });
    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('99%');
  });

  it('connects nodes starting from the left input handle and dropping on target output handle (bidirectional)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Funil In-To-Out Test',
        flow_data: JSON.stringify({
          nodes: [
            { id: 'node_msg', type: 'message', position: { x: 50, y: 50 }, data: { text: 'Olá' } },
            { id: 'node_delay', type: 'delay', position: { x: 450, y: 50 }, data: { delay_seconds: 3 } },
          ],
          edges: [],
        }),
      }),
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={1} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('node-input-handle-node_delay')).toBeInTheDocument();
      expect(screen.getByTestId('node-output-handle-node_msg')).toBeInTheDocument();
    });

    const inputHandle = screen.getByTestId('node-input-handle-node_delay');
    const outputHandle = screen.getByTestId('node-output-handle-node_msg');

    // Iniciar arrasto na bolinha de entrada (esquerda)
    fireEvent.mouseDown(inputHandle, { clientX: 450, clientY: 97 });
    expect(screen.getByTestId('connection-drag-preview')).toBeInTheDocument();

    // Soltar na bolinha de saída do outro nó (direita)
    fireEvent.mouseUp(outputHandle);

    // Conexão criada de forma bidirecional (origem -> destino)
    expect(screen.queryByTestId('connection-drag-preview')).not.toBeInTheDocument();
    expect(screen.getByTitle('Remover conexão')).toBeInTheDocument();
  });
});


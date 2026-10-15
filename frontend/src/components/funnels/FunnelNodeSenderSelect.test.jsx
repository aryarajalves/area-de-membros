import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeSenderSelect from './FunnelNodeSenderSelect';
import FunnelNodeMessage from './FunnelNodeMessage';
import FunnelNodeMedia from './FunnelNodeMedia';
import FunnelNodeAudio from './FunnelNodeAudio';
import { ToastProvider } from '../../context/ToastContext';

describe('FunnelNodeSenderSelect & DM Sender Tests', () => {
  const mockSenders = [
    { id: 1, name: 'Super Admin User', role: 'superadmin', email: 'admin@test.com' },
    { id: 2, name: 'Support Staff', role: 'admin', email: 'support@test.com' },
  ];

  it('renders default option and available senders correctly', () => {
    const handleChange = vi.fn();
    render(
      <FunnelNodeSenderSelect
        value={null}
        onChange={handleChange}
        availableSenders={mockSenders}
        nodeId="node_1"
      />
    );

    expect(screen.getByText('Remetente da DM:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '(Padrão: Criador do Funil / Super Admin)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Super Admin User (Super Admin)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Support Staff (Admin)' })).toBeInTheDocument();
  });

  it('triggers onChange with selected sender ID as number', () => {
    const handleChange = vi.fn();
    render(
      <FunnelNodeSenderSelect
        value={null}
        onChange={handleChange}
        availableSenders={mockSenders}
        nodeId="node_1"
      />
    );

    const select = screen.getByTestId('funnel-node-sender-select-node_1');
    fireEvent.change(select, { target: { value: '2' } });

    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('triggers onChange with null when selecting default option', () => {
    const handleChange = vi.fn();
    render(
      <FunnelNodeSenderSelect
        value={2}
        onChange={handleChange}
        availableSenders={mockSenders}
        nodeId="node_1"
      />
    );

    const select = screen.getByTestId('funnel-node-sender-select-node_1');
    fireEvent.change(select, { target: { value: '' } });

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('updates sender_id in FunnelNodeMessage', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeMessage
          node={{ id: 'msg_1', type: 'message', data: { text: 'Oi', sender_id: null } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          availableSenders={mockSenders}
        />
      </ToastProvider>
    );

    const select = screen.getByTestId('funnel-node-sender-select-msg_1');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '1' } });

    expect(handleUpdate).toHaveBeenCalledWith('msg_1', expect.objectContaining({ sender_id: 1 }));
  });

  it('updates sender_id in FunnelNodeMedia', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeMedia
          node={{ id: 'med_1', type: 'media', data: { media_type: 'image', sender_id: null } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          availableSenders={mockSenders}
        />
      </ToastProvider>
    );

    const select = screen.getByTestId('funnel-node-sender-select-med_1');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '2' } });

    expect(handleUpdate).toHaveBeenCalledWith('med_1', expect.objectContaining({ sender_id: 2 }));
  });

  it('updates sender_id in FunnelNodeAudio', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeAudio
          node={{ id: 'aud_1', type: 'audio', data: { sender_id: null } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          availableSenders={mockSenders}
        />
      </ToastProvider>
    );

    const select = screen.getByTestId('funnel-node-sender-select-aud_1');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '1' } });

    expect(handleUpdate).toHaveBeenCalledWith('aud_1', expect.objectContaining({ sender_id: 1 }));
  });
});

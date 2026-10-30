import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleModal from './ModuleModal';
import { ToastProvider } from '../../context/ToastContext';

describe('ModuleModal', () => {
  it('não renderiza se isOpen for falso', () => {
    const { container } = render(
      <ToastProvider>
        <ModuleModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />
      </ToastProvider>
    );
    expect(container.querySelector('.custom-modal-overlay')).toBeNull();
  });

  it('salva novo módulo com tipo de liberação imediata e sem exigência de elo por padrão', () => {
    const onSave = vi.fn();
    render(
      <ToastProvider>
        <ModuleModal isOpen={true} onClose={vi.fn()} onSave={onSave} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByTestId('module-title-input'), { target: { value: 'Módulo 1' } });
    fireEvent.click(screen.getByTestId('save-module-btn'));

    expect(onSave).toHaveBeenCalledWith({
      title: 'Módulo 1',
      description: null,
      image_url: null,
      order_index: 0,
      release_type: 'immediate',
      release_days: 0,
      release_date: null,
      required_tier: null
    });
  });

  it('permite configurar liberação por dias após matrícula e exigência de Elo Ouro', () => {
    const onSave = vi.fn();
    render(
      <ToastProvider>
        <ModuleModal isOpen={true} onClose={vi.fn()} onSave={onSave} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByTestId('module-title-input'), { target: { value: 'Módulo 2 - Avançado' } });
    fireEvent.click(screen.getByTestId('drip-type-days-after'));

    const daysInput = screen.getByTestId('drip-release-days-input');
    fireEvent.change(daysInput, { target: { value: '14' } });

    // Selecionar Elo Ouro
    fireEvent.click(screen.getByTestId('elo-tier-option-Ouro'));

    fireEvent.click(screen.getByTestId('save-module-btn'));

    expect(onSave).toHaveBeenCalledWith({
      title: 'Módulo 2 - Avançado',
      description: null,
      image_url: null,
      order_index: 0,
      release_type: 'days_after',
      release_days: 14,
      release_date: null,
      required_tier: 'Ouro'
    });
  });

  it('carrega dados de módulo existente para edição incluindo required_tier', () => {
    const editingModule = {
      id: 10,
      title: 'Módulo Existente',
      description: 'Desc',
      order_index: 2,
      release_type: 'days_after',
      release_days: 7,
      required_tier: 'Diamante'
    };

    render(
      <ToastProvider>
        <ModuleModal
          isOpen={true}
          editingModule={editingModule}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByTestId('module-title-input').value).toBe('Módulo Existente');
    expect(screen.getByTestId('drip-release-days-input').value).toBe('7');
  });
});

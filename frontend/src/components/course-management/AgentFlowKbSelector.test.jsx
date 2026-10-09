import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentFlowKbSelector from './AgentFlowKbSelector';
import { ToastProvider } from '../../context/ToastContext';

describe('AgentFlowKbSelector Component', () => {
  const mockBases = [
    {
      id: 10,
      name: 'Base - Tarcira',
      description: 'Essa é a base de conhecimento que explica as principais duvidas sobre o curso principal da Tarcira o MLD que é um curso para aprender a fazer uma renda extra'
    },
    {
      id: 20,
      name: 'Base - Crassos',
      description: 'É a base de conhecimento que responde as principais dúvidas sobre o curso Bussola Astrologica.'
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ configured: true })
        });
      }
      if (url.includes('/knowledge-bases')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBases)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <AgentFlowKbSelector
          selectedKbId={null}
          selectedKbName={null}
          onChangeKb={vi.fn()}
          courseTitle="Bússola Astrológica"
          {...props}
        />
      </ToastProvider>
    );
  };

  it('renderiza o seletor exibindo o placeholder de nenhuma base', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-kb-select')).toBeInTheDocument();
    });

    expect(screen.getByText('-- Nenhuma (Não sincronizar com AgentFlow) --')).toBeInTheDocument();
    expect(screen.queryByTestId('agentflow-kb-dropdown-menu')).not.toBeInTheDocument();
  });

  it('abre o menu suspenso ao clicar e exibe APENAS os nomes das bases sem as descrições extensas', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-kb-select')).toBeInTheDocument();
    });

    // Clica para abrir o dropdown
    fireEvent.click(screen.getByTestId('agentflow-kb-select'));

    // O menu suspenso deve estar visível
    const dropdownMenu = screen.getByTestId('agentflow-kb-dropdown-menu');
    expect(dropdownMenu).toBeInTheDocument();

    // Deve exibir o nome das bases
    expect(screen.getByText('Base - Tarcira')).toBeInTheDocument();
    expect(screen.getByText('Base - Crassos')).toBeInTheDocument();

    // NÃO deve exibir a descrição gigantesca no item
    expect(
      screen.queryByText(/Essa é a base de conhecimento que explica as principais duvidas/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/É a base de conhecimento que responde as principais dúvidas/i)
    ).not.toBeInTheDocument();
  });

  it('seleciona uma base da lista e chama onChangeKb com id e nome limpo', async () => {
    const onChangeKb = vi.fn();
    renderComponent({ onChangeKb });

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-kb-select')).toBeInTheDocument();
    });

    // Abre o menu
    fireEvent.click(screen.getByTestId('agentflow-kb-select'));

    // Clica na opção da Base - Crassos
    const option = screen.getByTestId('agentflow-kb-option-20');
    fireEvent.click(option);

    expect(onChangeKb).toHaveBeenCalledWith(20, 'Base - Crassos');
    // Dropdown fecha após selecionar
    expect(screen.queryByTestId('agentflow-kb-dropdown-menu')).not.toBeInTheDocument();
  });

  it('permite desvincular escolhendo a opção de nenhuma base', async () => {
    const onChangeKb = vi.fn();
    renderComponent({
      selectedKbId: 10,
      selectedKbName: 'Base - Tarcira',
      onChangeKb
    });

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-kb-select')).toBeInTheDocument();
    });

    // Abre o menu
    fireEvent.click(screen.getByTestId('agentflow-kb-select'));

    // Clica na opção de nenhuma
    const optionNone = screen.getByTestId('agentflow-kb-option-none');
    fireEvent.click(optionNone);

    expect(onChangeKb).toHaveBeenCalledWith(null, null);
    expect(screen.queryByTestId('agentflow-kb-dropdown-menu')).not.toBeInTheDocument();
  });

  it('exibe o badge de sincronização ativa quando há base selecionada', async () => {
    renderComponent({
      selectedKbId: 20,
      selectedKbName: 'Base - Crassos'
    });

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-kb-active-badge')).toBeInTheDocument();
    });

    expect(screen.getByText(/Sincronização ativa: Transcrições alimentarão a base/i)).toBeInTheDocument();
    expect(screen.getAllByText('Base - Crassos')).toHaveLength(2);
  });

  it('fecha o menu suspenso ao clicar fora', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-kb-select')).toBeInTheDocument();
    });

    // Abre o menu
    fireEvent.click(screen.getByTestId('agentflow-kb-select'));
    expect(screen.getByTestId('agentflow-kb-dropdown-menu')).toBeInTheDocument();

    // Dispara clique fora
    fireEvent.mouseDown(document.body);

    // O menu deve fechar
    expect(screen.queryByTestId('agentflow-kb-dropdown-menu')).not.toBeInTheDocument();
  });

  it('exibe aviso de não configurado quando configured for falso', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ configured: false })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('agentflow-not-configured-notice')).toBeInTheDocument();
    });
  });
});

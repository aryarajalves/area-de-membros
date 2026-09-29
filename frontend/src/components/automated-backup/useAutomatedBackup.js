import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';

export function useAutomatedBackup() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('active_backup_tab') || 's3'; // 's3', 'schedule', 'import'
  });

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('active_backup_tab', tab);
  };

  const { addToast } = useToast();

  // Estados dos Cards de Métricas do Topo
  const [stats, setStats] = useState({
    last_backup_filename: null,
    last_backup_date: null,
    next_backup_date: null,
    frequency_label: 'A cada 6 hora(s)',
    current_count: 0,
    retention_max: 30,
    total_bytes_used: 0,
    total_size_formatted: '0 B utilizados',
    b2_connected: false,
    b2_status: 'Não Configurado',
    b2_bucket: '—',
  });

  // Estados da Lista de Backups
  const [backups, setBackups] = useState([]);
  const [selectedBackupIds, setSelectedBackupIds] = useState([]);
  const [backupTypeFilter, setBackupTypeFilter] = useState('all'); // 'all', 'automatic', 'manual', 'imported'
  const [backupsPage, setBackupsPage] = useState(1);
  const PAGE_SIZE = 20;

  // Estados de Carregamento e Ações
  const [loadingManual, setLoadingManual] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState({ isOpen: false, backup: null, loading: false });
  const [loadingRestoreId, setLoadingRestoreId] = useState(null);

  // Estados do Agendador (Aba 2)
  const [scheduleConfig, setScheduleConfig] = useState({
    is_active: true,
    frequency: '6h',
    destination_folder: 'projetobase/backups/',
    retention_max: 30,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Estados da Importação Externa (Aba 3)
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Modal de Confirmação de Deleção / Restauração
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmAction: null,
    isDanger: true,
    confirmBtnText: 'Sim, Excluir',
    loading: false,
  });

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      confirmAction: null,
      isDanger: true,
      confirmBtnText: 'Confirmar',
      loading: false,
    });
  };

  // Carregar Dados da API
  const fetchDashboardStats = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/backups/dashboard-stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBackupsList = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/backups/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedule = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/backups/schedule', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScheduleConfig({
          is_active: data.is_active,
          frequency: data.frequency,
          destination_folder: data.destination_folder,
          retention_max: data.retention_max,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchBackupsList();
    fetchSchedule();
  }, []);

  // 1. Execução de Backup Manual Imediato
  const handleTriggerManualBackup = async (customName = '') => {
    setLoadingManual(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/backups/manual', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ custom_name: customName || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao gerar backup manual.');
      }
      addToast('Backup do PostgreSQL gerado com sucesso no S3!', 'success');
      setManualModalOpen(false);
      fetchDashboardStats();
      fetchBackupsList();
    } catch (err) {
      addToast(err.message || 'Erro ao gerar backup.', 'error');
    } finally {
      setLoadingManual(false);
    }
  };

  // 2. Salvar Configurações de Agendamento
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSavingSchedule(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/backups/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(scheduleConfig),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao salvar agendamento.');
      }
      addToast('Configurações de agendamento salvas com sucesso!', 'success');
      fetchDashboardStats();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar agendamento.', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  // 3. Download de Backup
  const handleDownloadBackup = async (backupId, filename) => {
    const token = localStorage.getItem('auth_token');
    try {
      addToast(`Iniciando download de ${filename}...`, 'info');
      const res = await fetch(`/api/v1/backups/download/${backupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Falha ao baixar arquivo de backup.');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Download concluído!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro no download.', 'error');
    }
  };

  // 4. Restauração de Banco de Dados com Modal
  const handlePromptRestore = (backupId, filename) => {
    setConfirmModal({
      isOpen: true,
      title: 'Restaurar Banco de Dados',
      message: `Atenção: A restauração substituirá os dados atuais do banco pelo conteúdo do arquivo "${filename}". Deseja prosseguir?`,
      isDanger: true,
      confirmBtnText: 'Sim, Restaurar Banco',
      confirmAction: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        setLoadingRestoreId(backupId);
        const token = localStorage.getItem('auth_token');
        try {
          const res = await fetch(`/api/v1/backups/restore/${backupId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Falha ao restaurar banco.');
          }
          addToast(data.message || 'Banco restaurado com sucesso!', 'success');
          closeConfirmModal();
        } catch (err) {
          addToast(err.message || 'Erro ao restaurar banco de dados.', 'error');
          setConfirmModal((prev) => ({ ...prev, loading: false }));
        } finally {
          setLoadingRestoreId(null);
        }
      },
      loading: false,
    });
  };

  // 4.1 Renomear Backup
  const handleOpenRename = (backup) => {
    setRenameModal({ isOpen: true, backup, loading: false });
  };

  const handleCloseRename = () => {
    setRenameModal({ isOpen: false, backup: null, loading: false });
  };

  const handleConfirmRename = async (backupId, newName) => {
    setRenameModal((prev) => ({ ...prev, loading: true }));
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/backups/${backupId}/rename`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_name: newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao renomear backup.');
      }
      addToast(`Backup renomeado para "${data.filename}" com sucesso!`, 'success');
      handleCloseRename();
      fetchDashboardStats();
      fetchBackupsList();
    } catch (err) {
      addToast(err.message || 'Erro ao renomear backup.', 'error');
      setRenameModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // 5. Exclusão Individual e em Massa de Backups
  const handleDeleteBackup = (backupId, filename) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Arquivo de Backup',
      message: `Tem certeza que deseja excluir o backup "${filename}" do bucket S3? Esta ação não pode ser desfeita.`,
      isDanger: true,
      confirmBtnText: 'Sim, Excluir',
      confirmAction: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        const token = localStorage.getItem('auth_token');
        try {
          const res = await fetch(`/api/v1/backups/${backupId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Falha ao excluir backup.');
          }
          addToast('Backup excluído do S3 com sucesso!', 'success');
          setSelectedBackupIds((prev) => prev.filter((id) => id !== backupId));
          closeConfirmModal();
          fetchDashboardStats();
          fetchBackupsList();
        } catch (err) {
          addToast(err.message || 'Erro ao excluir backup.', 'error');
          setConfirmModal((prev) => ({ ...prev, loading: false }));
        }
      },
      loading: false,
    });
  };

  const handleBulkDeleteBackups = () => {
    if (selectedBackupIds.length === 0) return;
    const count = selectedBackupIds.length;
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Backups Selecionados',
      message: `Tem certeza que deseja excluir os ${count} backup(s) selecionados do S3? Esta ação é irreversível.`,
      isDanger: true,
      confirmBtnText: 'Sim, Excluir Selecionados',
      confirmAction: async () => {
        setConfirmModal((prev) => ({ ...prev, loading: true }));
        const token = localStorage.getItem('auth_token');
        try {
          const res = await fetch('/api/v1/backups/bulk-delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids: selectedBackupIds }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || 'Falha ao excluir backups.');
          }
          addToast(data.message || 'Backups excluídos com sucesso!', 'success');
          setSelectedBackupIds([]);
          closeConfirmModal();
          fetchDashboardStats();
          fetchBackupsList();
        } catch (err) {
          addToast(err.message || 'Erro ao excluir backups.', 'error');
          setConfirmModal((prev) => ({ ...prev, loading: false }));
        }
      },
      loading: false,
    });
  };

  // 6. Upload de Backup Externo (Drag & Drop)
  const handleUploadBackupFile = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    setUploadingFile(true);
    const token = localStorage.getItem('auth_token');
    try {
      addToast(`Enviando ${file.name} para o Backblaze B2...`, 'info');
      const res = await fetch('/api/v1/backups/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao importar backup.');
      }
      addToast('Backup externo importado e armazenado no S3 com sucesso!', 'success');
      fetchDashboardStats();
      fetchBackupsList();
      handleSelectTab('s3');
    } catch (err) {
      addToast(err.message || 'Erro no envio do backup.', 'error');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadBackupFile(e.dataTransfer.files[0]);
    }
  };

  // Filtragem e Paginação da Tabela de Backups
  const filteredBackups = backups.filter((b) => {
    if (backupTypeFilter === 'all') return true;
    return b.backup_type === backupTypeFilter;
  });

  const totalBackupPages = Math.ceil(filteredBackups.length / PAGE_SIZE) || 1;
  const paginatedBackups = filteredBackups.slice(
    (backupsPage - 1) * PAGE_SIZE,
    backupsPage * PAGE_SIZE
  );

  const isAllPageSelected =
    paginatedBackups.length > 0 &&
    paginatedBackups.every((b) => selectedBackupIds.includes(b.id));

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedBackups.map((b) => b.id);
      setSelectedBackupIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedBackups.map((b) => b.id);
      setSelectedBackupIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedBackupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return {
    activeTab,
    handleSelectTab,
    stats,
    backups,
    selectedBackupIds,
    setSelectedBackupIds,
    backupTypeFilter,
    setBackupTypeFilter,
    backupsPage,
    setBackupsPage,
    PAGE_SIZE,
    loadingManual,
    manualModalOpen,
    setManualModalOpen,
    loadingRestoreId,
    scheduleConfig,
    setScheduleConfig,
    savingSchedule,
    dragActive,
    uploadingFile,
    fileInputRef,
    confirmModal,
    closeConfirmModal,
    handleTriggerManualBackup,
    handleSaveSchedule,
    handleDownloadBackup,
    handlePromptRestore,
    renameModal,
    handleOpenRename,
    handleCloseRename,
    handleConfirmRename,
    handleDeleteBackup,
    handleBulkDeleteBackups,
    handleUploadBackupFile,
    handleDrag,
    handleDrop,
    filteredBackups,
    totalBackupPages,
    paginatedBackups,
    isAllPageSelected,
    handleToggleSelectAll,
    handleToggleSelectOne,
  };
}

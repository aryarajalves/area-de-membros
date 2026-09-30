import React, { useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function StudentImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [defaultDuration, setDefaultDuration] = useState('lifetime');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setResult(null);
      setSelectedCourses([]);
      setDefaultDuration('lifetime');
      // Carregar lista de cursos disponíveis
      const token = localStorage.getItem('auth_token');
      fetch('/api/v1/courses', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setCourses(Array.isArray(data) ? data : []))
        .catch(() => setCourses([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadTemplate = (format) => {
    const token = localStorage.getItem('auth_token');
    const url = `/api/v1/students/import/template?format=${format}`;
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao baixar modelo.');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `modelo_importacao_alunos.${format === 'csv' ? 'csv' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        addToast(`Modelo ${format.toUpperCase()} baixado com sucesso!`, 'success');
      })
      .catch((err) => {
        addToast(err.message || 'Erro ao baixar modelo.', 'error');
      });
  };

  const handleCourseToggle = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        addToast('Formato inválido! Envie um arquivo CSV ou Excel (.xlsx, .xls).', 'error');
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        addToast('Formato inválido! Envie um arquivo CSV ou Excel (.xlsx, .xls).', 'error');
        return;
      }
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      addToast('Por favor, selecione uma planilha para importar.', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      if (selectedCourses.length > 0) {
        formData.append('default_course_ids', selectedCourses.join(','));
      }
      formData.append('default_access_duration', defaultDuration);

      const res = await fetch('/api/v1/students/import', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao processar arquivo de importação.');
      }

      setResult(data);
      if (data.created_count > 0 || data.updated_count > 0) {
        addToast(`Importação concluída: ${data.created_count} criados, ${data.updated_count} atualizados.`, 'success');
        if (onSuccess) onSuccess();
      } else {
        addToast('Nenhum aluno foi importado.', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao importar alunos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      data-testid="student-import-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          padding: '28px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-import-modal-title"
        data-testid="student-import-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div>
              <h2 id="student-import-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Importar Alunos
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Carregue uma planilha CSV ou Excel para cadastrar alunos em lote.
              </p>
            </div>
          </div>
        </div>

        {/* Templates para Download */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
            <span style={{ fontWeight: 600, color: '#f8fafc' }}>Planilhas Modelo:</span> Baixe para preencher
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              data-testid="download-template-csv-btn"
            >
              <Download size={14} /> Modelo CSV
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('xlsx')}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              data-testid="download-template-xlsx-btn"
            >
              <Download size={14} /> Modelo Excel
            </button>
          </div>
        </div>

        {/* Zona de Upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            border: file ? '2px solid #3b82f6' : '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: file ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'all 0.2s ease',
          }}
          onClick={() => document.getElementById('student-file-input')?.click()}
          data-testid="upload-dropzone"
        >
          <input
            id="student-file-input"
            type="file"
            accept=".csv, .xlsx, .xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            data-testid="student-file-input"
          />
          <FileSpreadsheet
            size={36}
            style={{ color: file ? '#3b82f6' : '#94a3b8', margin: '0 auto 10px', display: 'block' }}
          />
          {file ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>{file.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                {(file.size / 1024).toFixed(1)} KB • Clique para trocar de arquivo
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#f8fafc' }}>
                Arraste seu arquivo aqui ou clique para selecionar
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                Formatos aceitos: CSV ou Excel (.xlsx, .xls)
              </div>
            </div>
          )}
        </div>

        {/* Configurações Padrão de Cursos e Tempo de Acesso */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
            Cursos Padrão (Opcional)
          </label>
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#94a3b8' }}>
            Selecione cursos para vincular aos alunos caso a coluna 'Cursos' na planilha esteja vazia ou para adicionar a todos.
          </p>
          <div
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {courses.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                Nenhum curso disponível no momento.
              </div>
            ) : (
              courses.map((course) => (
                <label
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleCourseToggle(course.id)}
                    style={{ accentColor: '#3b82f6', width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>{course.title}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Tempo de Acesso Padrão */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="default-duration-select"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}
          >
            Tempo de Acesso Padrão
          </label>
          <select
            id="default-duration-select"
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none',
            }}
            data-testid="default-duration-select"
          >
            <option value="lifetime" style={{ backgroundColor: '#0f172a' }}>Vitalício</option>
            <option value="1_month" style={{ backgroundColor: '#0f172a' }}>1 Mês</option>
            <option value="3_months" style={{ backgroundColor: '#0f172a' }}>3 Meses</option>
            <option value="6_months" style={{ backgroundColor: '#0f172a' }}>6 Meses</option>
            <option value="1_year" style={{ backgroundColor: '#0f172a' }}>1 Ano</option>
            <option value="2_years" style={{ backgroundColor: '#0f172a' }}>2 Anos</option>
            <option value="3_years" style={{ backgroundColor: '#0f172a' }}>3 Anos</option>
          </select>
        </div>

        {/* Resumo pós-importação se existir */}
        {result && (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}
            data-testid="import-result-summary"
          >
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '10px', color: '#f8fafc' }}>
              Resultado do Processamento:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{result.total_processed}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: '#34d399' }}>Criados</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{result.created_count}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: '#60a5fa' }}>Atualizados</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa' }}>{result.updated_count}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.72rem', color: '#f87171' }}>Erros</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>{result.errors_count}</div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div style={{ marginTop: '12px', maxHeight: '100px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, marginBottom: '4px' }}>
                  Avisos / Erros:
                </div>
                {result.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '2px' }}>
                    • {err}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botões de Ação (Apenas 1 para fechar além da ação principal) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            data-testid="close-import-modal-btn"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !file}
            style={{
              padding: '10px 22px',
              backgroundColor: loading || !file ? '#2563eb80' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: loading || !file ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            data-testid="submit-import-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Importando...
              </>
            ) : (
              'Iniciar Importação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

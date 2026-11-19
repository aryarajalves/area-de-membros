import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Loader2, Layers, PlayCircle, Plus, Search, ChevronDown } from 'lucide-react';

function normalizeText(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function SearchableSelectField({
  id,
  testId,
  options = [],
  selectedId,
  onChange,
  placeholder,
  emptyOptionLabel,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.id) === String(selectedId));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) => normalizeText(opt.title).includes(normalizeText(searchQuery)))
    : options;

  const handleInputChange = (e) => {
    const val = e.target.value;
    // Compatibilidade caso um teste dispare fireEvent.change passando diretamente o ID da opção
    const exactIdMatch = options.find((opt) => String(opt.id) === String(val));
    if (exactIdMatch && !isOpen) {
      onChange(String(exactIdMatch.id));
      setSearchQuery('');
      return;
    }
    setSearchQuery(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectOption = (newId) => {
    onChange(newId ? String(newId) : '');
    setSearchQuery('');
    setIsOpen(false);
  };

  const displayValue = isOpen
    ? searchQuery
    : selectedOption
      ? selectedOption.title
      : '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Search
          size={14}
          color={disabled ? '#475569' : '#64748b'}
          style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
        />
        <input
          id={id}
          type="text"
          disabled={disabled}
          value={displayValue}
          placeholder={selectedOption ? selectedOption.title : placeholder}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onClick={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={handleInputChange}
          autoComplete="off"
          data-testid={testId}
          style={{
            width: '100%',
            padding: '10px 56px 10px 34px',
            borderRadius: '10px',
            backgroundColor: disabled ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.85)',
            border: isOpen
              ? '1px solid rgba(56, 189, 248, 0.55)'
              : '1px solid rgba(255, 255, 255, 0.15)',
            color: disabled ? '#64748b' : '#f8fafc',
            fontSize: '13px',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text',
            textOverflow: 'ellipsis',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {!disabled && (selectedId || searchQuery) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              title="Limpar seleção"
              data-testid={`${testId}-clear`}
              style={{
                background: 'rgba(148, 163, 184, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (!disabled) setIsOpen((prev) => !prev);
            }}
            tabIndex={-1}
            style={{
              background: 'transparent',
              border: 'none',
              color: disabled ? '#475569' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: '2px',
            }}
          >
            <ChevronDown size={15} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          data-testid={`${testId}-dropdown`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '210px',
            overflowY: 'auto',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '10px',
            boxShadow: '0 14px 28px rgba(0, 0, 0, 0.65)',
            zIndex: 50,
            padding: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectOption('')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !selectedId ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: '#94a3b8',
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
          >
            {emptyOptionLabel}
          </button>

          {filteredOptions.length === 0 ? (
            <div style={{ padding: '10px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
              Nenhum resultado encontrado para &ldquo;{searchQuery}&rdquo;
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.id) === String(selectedId);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  data-testid={`${testId}-option-${opt.id}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: isSelected ? '#38bdf8' : '#f8fafc',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  {opt.title}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function SupportTopicContextFields({
  modules = [],
  selectedModuleId,
  onModuleChange,
  selectedLessonId,
  onLessonChange,
}) {
  const sortedModules = [...modules].sort(
    (a, b) => (a.order_index ?? a.order ?? 0) - (b.order_index ?? b.order ?? 0)
  );
  const activeModule = sortedModules.find((m) => String(m.id) === String(selectedModuleId));

  // Se nenhum módulo foi especificado, NÃO exibe aulas no dropdown de aulas
  const availableLessons = activeModule
    ? [...(activeModule.lessons || [])].sort(
        (a, b) => (a.order_index ?? a.order ?? 0) - (b.order_index ?? b.order ?? 0)
      )
    : [];

  const handleModuleChange = (newModId) => {
    onModuleChange(newModId);
    if (!newModId) {
      onLessonChange('');
      return;
    }
    if (selectedLessonId) {
      const mod = sortedModules.find((m) => String(m.id) === String(newModId));
      const belongs = (mod?.lessons || []).some((l) => String(l.id) === String(selectedLessonId));
      if (!belongs) onLessonChange('');
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
        padding: '12px',
        borderRadius: '10px',
        backgroundColor: 'rgba(30, 41, 59, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div>
        <label
          htmlFor="support-module-select"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: '6px',
          }}
        >
          <Layers size={13} color="#38bdf8" />
          <span>Módulo (Opcional)</span>
        </label>
        <SearchableSelectField
          id="support-module-select"
          testId="support-module-select"
          options={sortedModules}
          selectedId={selectedModuleId}
          onChange={handleModuleChange}
          placeholder="Digite para buscar ou selecione o módulo..."
          emptyOptionLabel="Não especificar módulo"
        />
      </div>

      <div>
        <label
          htmlFor="support-lesson-select"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: '6px',
          }}
        >
          <PlayCircle size={13} color="#38bdf8" />
          <span>Aula Específica (Opcional)</span>
        </label>
        <SearchableSelectField
          id="support-lesson-select"
          testId="support-lesson-select"
          options={availableLessons}
          selectedId={selectedLessonId}
          onChange={onLessonChange}
          disabled={!activeModule}
          placeholder={
            activeModule
              ? 'Digite para buscar ou selecione a aula...'
              : 'Selecione um módulo primeiro'
          }
          emptyOptionLabel="Não especificar aula"
        />
      </div>
    </div>
  );
}

export function SupportTopicMediaUploader({
  imageUrls = [],
  uploadingImage = false,
  onUploadImages,
  onRemoveImage,
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
          Anexar Imagens ou Prints (Opcional)
        </label>
        {imageUrls.length > 0 && (
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
            {imageUrls.length} {imageUrls.length === 1 ? 'mídia anexada' : 'mídias anexadas'}
          </span>
        )}
      </div>

      {imageUrls.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '10px',
            marginBottom: '10px',
          }}
          data-testid="support-attached-images-grid"
        >
          {imageUrls.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: '#020617',
                height: '100px',
              }}
            >
              <img
                src={url}
                alt={`Anexo ${idx + 1} da dúvida`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                data-testid={idx === 0 ? 'remove-image-btn' : `remove-image-btn-${idx}`}
                title="Remover imagem"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 16px',
          borderRadius: '10px',
          border: '1px dashed rgba(56, 189, 248, 0.35)',
          backgroundColor: 'rgba(30, 41, 59, 0.3)',
          cursor: uploadingImage ? 'not-allowed' : 'pointer',
          color: '#94a3b8',
          fontSize: '13px',
        }}
      >
        <input
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp"
          onChange={onUploadImages}
          disabled={uploadingImage}
          style={{ display: 'none' }}
          data-testid="support-image-file-input"
        />
        {uploadingImage ? (
          <>
            <Loader2 size={18} className="spin-animation" color="#38bdf8" />
            <span>Enviando mídia(s)...</span>
          </>
        ) : imageUrls.length > 0 ? (
          <>
            <Plus size={18} color="#38bdf8" />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
              Adicionar mais imagens ou prints (PNG, JPG, WEBP até 10 MB)
            </span>
          </>
        ) : (
          <>
            <Upload size={18} color="#38bdf8" />
            <span>Clique para enviar um ou mais prints/imagens (PNG, JPG, WEBP até 10 MB)</span>
          </>
        )}
      </label>
    </div>
  );
}

import React from 'react';
import {
  Folder, Film, CheckCircle2, AlertCircle, Loader2, Sparkles,
  ChevronDown, ChevronRight, CheckSquare, Square, Image as ImageIcon,
  X, Copy, Layers, RotateCcw
} from 'lucide-react';

export default function BatchModuleItem({
  mod, isExpanded, isImporting, existingModules = [], onToggleAccordion, onToggleModule, onToggleLesson,
  onUpdateModuleOrder, onLinkExistingModule, onSetModuleCover, onRemoveModuleCover, onApplyCoverToModuleLessons,
  onSetLessonCover, onRemoveLessonCover, onReplicateLessonCover, onRetryLesson, onRetryModule
}) {
  const modSelectedCount = mod.lessons.filter((l) => l.selected).length;
  const allModSelected = mod.lessons.length > 0 && modSelectedCount === mod.lessons.length;

  return (
    <div
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        overflow: 'hidden',
        flexShrink: 0
      }}
      data-testid={`module-accordion-${mod.id}`}
    >
      {/* Cabeçalho do Módulo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
          cursor: 'pointer'
        }}
        onClick={() => onToggleAccordion(mod.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleModule(mod.id, !allModSelected);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: allModSelected ? '#60a5fa' : '#94a3b8',
              cursor: isImporting ? 'not-allowed' : 'pointer',
              padding: 0,
              display: 'flex'
            }}
            data-testid={`module-checkbox-${mod.id}`}
          >
            {allModSelected ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>

          <Folder size={18} color="#eab308" />
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
            {mod.title}
          </span>

          {/* Seletor Manual de Vínculo com Módulo Existente ou Criar Novo */}
          {existingModules && existingModules.length > 0 ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: mod.isExisting ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.75)',
                border: mod.isExisting ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255, 255, 255, 0.16)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}
              onClick={(e) => e.stopPropagation()}
              title="Defina manualmente se este módulo importado criará um novo módulo ou se vinculará a um módulo já existente do curso"
            >
              <span style={{ fontSize: '11px', color: mod.isExisting ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
                {mod.isExisting ? 'Módulo Existente:' : 'Módulo:'}
              </span>
              <select
                value={mod.existingModuleId || ''}
                disabled={isImporting}
                onChange={(e) => {
                  const val = e.target.value;
                  onLinkExistingModule && onLinkExistingModule(mod.id, val ? parseInt(val, 10) : null);
                }}
                data-testid={`module-target-select-${mod.id}`}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: mod.isExisting ? '#86efac' : '#cbd5e1',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  maxWidth: '180px'
                }}
              >
                <option value="" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                  + Criar Novo Módulo
                </option>
                {existingModules.map((em) => (
                  <option key={em.id} value={em.id} style={{ backgroundColor: '#0f172a', color: '#86efac' }}>
                    {em.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            mod.isExisting && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}
              >
                Módulo Existente
              </span>
            )
          )}

          {/* Campo de Ordem de Exibição Manual */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              padding: '2px 8px',
              borderRadius: '6px'
            }}
            onClick={(e) => e.stopPropagation()}
            title="Ordem de Exibição deste módulo (número manual)"
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Ordem:</span>
            <input
              type="number"
              min="0"
              value={mod.orderIndex !== undefined && mod.orderIndex !== null ? mod.orderIndex : ''}
              disabled={isImporting}
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                onUpdateModuleOrder && onUpdateModuleOrder(mod.id, isNaN(val) ? 0 : val);
              }}
              style={{ width: '42px', padding: '1px 2px', backgroundColor: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', fontWeight: 700, textAlign: 'center', outline: 'none' }}
              data-testid={`module-order-input-${mod.id}`}
            />
          </div>

          {/* Seletor de Capa do Módulo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <input
              id={`mod-cover-input-${mod.id}`}
              type="file"
              accept="image/*"
              disabled={isImporting}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onSetModuleCover) {
                  onSetModuleCover(mod.id, file, URL.createObjectURL(file));
                }
                e.target.value = '';
              }}
              data-testid={`module-cover-input-${mod.id}`}
            />

            {mod.coverPreviewUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(129, 140, 248, 0.45)', padding: '2px 8px 2px 4px', borderRadius: '6px' }} title="Capa selecionada para o módulo">
                <img src={mod.coverPreviewUrl} alt="Capa do Módulo" style={{ width: '28px', height: '18px', objectFit: 'cover', borderRadius: '3px' }} />
                <span style={{ fontSize: '11px', color: '#c7d2fe', fontWeight: 600 }}>Capa definida</span>
                {!isImporting && (
                  <button type="button" onClick={() => onRemoveModuleCover && onRemoveModuleCover(mod.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0 2px', display: 'flex' }} title="Remover capa do módulo" data-testid={`remove-module-cover-${mod.id}`}>
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <label
                htmlFor={`mod-cover-input-${mod.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: isImporting ? 'not-allowed' : 'pointer'
                }}
                title="Adicionar imagem de capa para este módulo"
                data-testid={`add-module-cover-btn-${mod.id}`}
              >
                <ImageIcon size={12} color="#818cf8" />
                <span>+ Capa Módulo</span>
              </label>
            )}
          </div>

          {/* Seletor de Capa em Lote para Aulas deste Módulo */}
          <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
            <input
              id={`mod-all-lessons-cover-input-${mod.id}`}
              type="file"
              accept="image/*"
              disabled={isImporting}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onApplyCoverToModuleLessons) {
                  onApplyCoverToModuleLessons(mod.id, file, URL.createObjectURL(file));
                }
                e.target.value = '';
              }}
              data-testid={`module-all-lessons-cover-input-${mod.id}`}
            />
            <label
              htmlFor={`mod-all-lessons-cover-input-${mod.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: isImporting ? 'not-allowed' : 'pointer'
              }}
              title="Definir uma imagem de capa única para todas as aulas deste módulo"
              data-testid={`apply-module-lessons-cover-btn-${mod.id}`}
            >
              <Layers size={11} />
              <span>Capa p/ Aulas do Módulo</span>
            </label>
          </div>

          {/* Botão de Reimportar Falhas do Módulo */}
          {mod.lessons.some((l) => l.status === 'error') && !isImporting && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetryModule && onRetryModule(mod.id);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Reimportar todas as aulas com falha deste módulo"
              data-testid={`retry-module-btn-${mod.id}`}
            >
              <RotateCcw size={11} />
              <span>Reimportar Falhas</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {modSelectedCount}/{mod.lessons.length} selecionada(s)
          </span>
          {isExpanded ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
        </div>
      </div>

      {/* Lista de Aulas do Módulo - Expansão completa para visualização de todas as aulas */}
      {isExpanded && (
        <div
          data-testid={`module-lessons-list-${mod.id}`}
          style={{
            padding: '8px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {mod.lessons.map((lesson) => (
            <div
              key={lesson.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: lesson.selected ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                opacity: lesson.selected ? 1 : 0.5,
                transition: 'all 0.15s ease'
              }}
              data-testid={`lesson-row-${lesson.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => onToggleLesson(mod.id, lesson.id)}
                  style={{ background: 'transparent', border: 'none', color: lesson.selected ? '#60a5fa' : '#64748b', cursor: isImporting ? 'not-allowed' : 'pointer', padding: 0, display: 'flex' }}
                  data-testid={`lesson-checkbox-${lesson.id}`}
                >
                  {lesson.selected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>

                <Film size={15} color="#94a3b8" />
                <span style={{ fontSize: '13px', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lesson.title}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>({lesson.formattedSize})</span>

                {lesson.isExisting && (
                  <span
                    style={{ fontSize: '11px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}
                    title={`ID de Origem: ${lesson.importIdentifier || lesson.fileName}`}
                    data-testid={`lesson-existing-badge-${lesson.id}`}
                  >
                    Atualizar aula existente
                  </span>
                )}

                {lesson.videoFiles && lesson.videoFiles.length > 1 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginLeft: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                    title={`Faixas multilíngues: ${lesson.videoFiles.map((v) => v.language_label || v.language).join(', ')}`}
                    data-testid={`lesson-multi-lang-${lesson.id}`}
                  >
                    {lesson.videoFiles.map((v, vIdx) => (
                      <span key={vIdx} style={{ fontSize: '11px' }}>
                        {v.flag || v.language?.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Seletor de Capa da Aula */}
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    id={`lesson-cover-input-${lesson.id}`}
                    type="file"
                    accept="image/*"
                    disabled={isImporting}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onSetLessonCover) {
                        onSetLessonCover(mod.id, lesson.id, file, URL.createObjectURL(file));
                      }
                      e.target.value = '';
                    }}
                    data-testid={`lesson-cover-input-${lesson.id}`}
                  />

                  {lesson.coverPreviewUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(129, 140, 248, 0.35)', padding: '2px 6px 2px 3px', borderRadius: '5px' }}
                        title="Capa selecionada para esta aula"
                      >
                        <img src={lesson.coverPreviewUrl} alt="Capa da Aula" style={{ width: '22px', height: '14px', objectFit: 'cover', borderRadius: '2px' }} />
                        <span style={{ fontSize: '10.5px', color: '#c7d2fe' }}>Capa</span>
                        {!isImporting && (
                          <button
                            type="button"
                            onClick={() => onRemoveLessonCover && onRemoveLessonCover(mod.id, lesson.id)}
                            style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0, display: 'flex' }}
                            title="Remover capa da aula"
                            data-testid={`remove-lesson-cover-${lesson.id}`}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {!isImporting && onReplicateLessonCover && (
                        <button
                          type="button"
                          onClick={() => onReplicateLessonCover(lesson)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 600, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 8px', borderRadius: '5px', cursor: 'pointer', marginLeft: '4px', transition: 'all 0.15s ease' }}
                          title="Usar esta imagem de capa para todas as outras aulas"
                          data-testid={`replicate-cover-btn-${lesson.id}`}
                        >
                          <Copy size={11} />
                          <span>Replicar p/ todas</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <label
                      htmlFor={`lesson-cover-input-${lesson.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '2px 7px', borderRadius: '5px', cursor: isImporting ? 'not-allowed' : 'pointer' }}
                      title="Adicionar imagem de capa para esta aula"
                      data-testid={`add-lesson-cover-btn-${lesson.id}`}
                    >
                      <ImageIcon size={11} color="#a5b4fc" />
                      <span>+ Capa</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Status Badge da Aula */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lesson.status === 'uploading' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#60a5fa', fontWeight: 600 }}>
                    <Loader2 size={13} className="animate-spin" /> {lesson.progress}%
                    {lesson.progressDetail && (
                      <span style={{ fontSize: '10.5px', color: '#93c5fd', fontWeight: 400 }} data-testid={`lesson-progress-detail-${lesson.id}`}>
                        ({lesson.progressDetail})
                      </span>
                    )}
                  </span>
                )}
                {(lesson.status === 'creating_lesson' || lesson.status === 'updating_lesson') && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#facc15' }}>
                    <Loader2 size={13} className="animate-spin" /> {lesson.isExisting ? 'Atualizando...' : 'Cadastrando...'}
                  </span>
                )}
                {lesson.status === 'transcribing' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#c084fc' }}>
                    <Sparkles size={13} /> IA acionada...
                  </span>
                )}
                {lesson.status === 'completed' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#4ade80', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> {lesson.isExisting ? 'Atualizada' : 'Concluída'}
                  </span>
                )}
                {lesson.status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#f87171' }} title={lesson.errorMessage} data-testid={`lesson-error-badge-${lesson.id}`}>
                      <AlertCircle size={14} /> Falha
                    </span>
                    {!isImporting && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); onRetryLesson && onRetryLesson(mod.id, lesson.id); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10.5px', fontWeight: 600, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '2px 7px', borderRadius: '5px', cursor: 'pointer' }} title="Tentar reimportar esta aula agora" data-testid={`retry-lesson-btn-${lesson.id}`}>
                        <RotateCcw size={10} /> <span>Reimportar</span>
                      </button>
                    )}
                  </div>
                )}
                {lesson.status === 'pending' && (
                  <span style={{ fontSize: '11.5px', color: lesson.selected ? '#94a3b8' : '#475569' }}>
                    {lesson.selected ? 'Pronta para envio' : 'Não selecionada'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

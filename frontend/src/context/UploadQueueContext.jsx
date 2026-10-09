import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';

const UploadQueueContext = createContext(null);

export function UploadQueueProvider({ children }) {
  const [uploads, setUploads] = useState([]);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const activeXhrsRef = useRef(new Map());
  const { addToast } = useToast();

  const cancelUpload = useCallback((uploadId) => {
    const xhr = activeXhrsRef.current.get(uploadId);
    if (xhr) {
      xhr.abort();
      activeXhrsRef.current.delete(uploadId);
    }
    setUploads((prev) =>
      prev.map((item) =>
        item.id === uploadId ? { ...item, status: 'cancelled', progress: 0 } : item
      )
    );
    addToast('Upload cancelado pelo usuário.', 'info');
  }, [addToast]);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === 'uploading'));
  }, []);

  const startVideoUpload = useCallback(async ({
    file,
    lessonId = null,
    lessonTitle = 'Aula',
    language = 'pt',
    onSuccessUrl,
    onError
  }) => {
    if (!file) return null;
    if (file.size > 2048 * 1024 * 1024) {
      addToast('O arquivo excede o limite máximo permitido de 2 GB.', 'error');
      return null;
    }

    const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const token = localStorage.getItem('auth_token');

    const newUpload = {
      id: uploadId,
      lessonId: lessonId || null,
      fileName: file.name,
      lessonTitle: lessonTitle || file.name,
      fileSize: file.size,
      language,
      progress: 0,
      status: 'uploading', // 'uploading' | 'completed' | 'error' | 'cancelled'
      error: null,
      finalUrl: null
    };

    setUploads((prev) => [newUpload, ...prev]);

    try {
      // 1. Solicita URL pré-assinada do Backblaze B2 (S3)
      const presignedRes = await fetch('/api/v1/courses/generate-video-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || 'video/mp4'
        })
      });

      if (presignedRes.ok) {
        const presignedData = await presignedRes.json();
        const targetVideoUrl = presignedData.video_url || presignedData.final_url;
        if (presignedData.direct_upload && presignedData.upload_url && targetVideoUrl) {
          // Já fornece a URL final imediatamente para o formulário da aula poder ser salvo!
          if (onSuccessUrl) {
            onSuccessUrl(targetVideoUrl, uploadId);
          }

          // Executa upload direto via PUT no S3/Backblaze em segundo plano
          return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            activeXhrsRef.current.set(uploadId, xhr);

            xhr.open('PUT', presignedData.upload_url);
            xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

            if (xhr.upload) {
              xhr.upload.onprogress = (evt) => {
                if (evt.lengthComputable) {
                  const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
                  setUploads((prev) =>
                    prev.map((item) =>
                      item.id === uploadId ? { ...item, progress: percent } : item
                    )
                  );
                }
              };
            }

            xhr.onload = () => {
              activeXhrsRef.current.delete(uploadId);
              if (xhr.status >= 200 && xhr.status < 300) {
                setUploads((prev) =>
                  prev.map((item) =>
                    item.id === uploadId
                      ? { ...item, status: 'completed', progress: 100, finalUrl: targetVideoUrl }
                      : item
                  )
                );
                addToast(`Vídeo de "${newUpload.lessonTitle}" enviado com sucesso para o Backblaze B2!`, 'success');
                resolve(targetVideoUrl);
              } else {
                const b2ErrorMsg = xhr.status === 403 
                  ? 'Acesso negado no bucket B2 (403)' 
                  : xhr.status === 400 
                  ? 'Parâmetros inválidos no B2 (400)' 
                  : `Falha no Backblaze B2 (Status ${xhr.status})`;
                setUploads((prev) =>
                  prev.map((item) =>
                    item.id === uploadId
                      ? { ...item, status: 'error', error: b2ErrorMsg }
                      : item
                  )
                );
                addToast(`Falha no upload do vídeo de "${newUpload.lessonTitle}": ${b2ErrorMsg}`, 'error');
                if (onError) onError();
                resolve(null);
              }
            };

            xhr.onerror = () => {
              activeXhrsRef.current.delete(uploadId);
              const netError = 'Falha de rede ou CORS com Backblaze B2';
              setUploads((prev) =>
                prev.map((item) =>
                  item.id === uploadId ? { ...item, status: 'error', error: netError } : item
                )
              );
              addToast(`Erro de conexão com Backblaze B2 ao enviar vídeo de "${newUpload.lessonTitle}".`, 'error');
              if (onError) onError();
              resolve(null);
            };

            xhr.send(file);
          });
        }
      }
    } catch (directErr) {
      console.warn('Erro ao obter presigned url, tentando upload local:', directErr);
    }

    // 2. Fallback: Upload tradicional em segundo plano pelo Backend
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      activeXhrsRef.current.set(uploadId, xhr);

      xhr.open('POST', '/api/v1/courses/upload-video');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      if (xhr.upload) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
            setUploads((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress: percent } : item
              )
            );
          }
        };
      }

      xhr.onload = () => {
        activeXhrsRef.current.delete(uploadId);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setUploads((prev) =>
              prev.map((item) =>
                item.id === uploadId
                  ? { ...item, status: 'completed', progress: 100, finalUrl: data.video_url }
                  : item
              )
            );
            if (onSuccessUrl) onSuccessUrl(data.video_url, uploadId);
            addToast(`Vídeo de "${newUpload.lessonTitle}" enviado com sucesso!`, 'success');
            resolve(data.video_url);
          } catch {
            resolve(null);
          }
        } else {
          let localErrorMsg = `Falha no envio (Status ${xhr.status || 'desconhecido'})`;
          if (xhr.status === 400) {
            localErrorMsg = 'Timeout ou rejeição pelo proxy (400)';
          } else if (xhr.status === 413) {
            localErrorMsg = 'Arquivo excede limite do proxy (413)';
          } else if (xhr.status === 504) {
            localErrorMsg = 'Timeout de gateway (504)';
          }
          setUploads((prev) =>
            prev.map((item) =>
              item.id === uploadId ? { ...item, status: 'error', error: localErrorMsg } : item
            )
          );
          addToast(`Falha no envio do vídeo de "${newUpload.lessonTitle}": ${localErrorMsg}`, 'error');
          if (onError) onError();
          resolve(null);
        }
      };

      xhr.onerror = () => {
        activeXhrsRef.current.delete(uploadId);
        const commError = 'Falha de comunicação/timeout com o servidor';
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: 'error', error: commError } : item
          )
        );
        addToast(`Erro ao enviar vídeo de "${newUpload.lessonTitle}": ${commError}`, 'error');
        if (onError) onError();
        resolve(null);
      };

      xhr.send(formData);
    });
  }, [addToast]);

  const activeUploadsCount = uploads.filter((u) => u.status === 'uploading').length;

  return (
    <UploadQueueContext.Provider
      value={{
        uploads,
        startVideoUpload,
        cancelUpload,
        clearCompleted,
        activeUploadsCount,
        isWidgetExpanded,
        setIsWidgetExpanded
      }}
    >
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const context = useContext(UploadQueueContext);
  return context || null;
}

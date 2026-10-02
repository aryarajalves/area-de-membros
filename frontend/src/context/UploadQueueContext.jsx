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
        if (presignedData.direct_upload && presignedData.upload_url) {
          // Já fornece a URL final imediatamente para o formulário da aula poder ser salvo!
          if (onSuccessUrl) {
            onSuccessUrl(presignedData.final_url, uploadId);
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
                      ? { ...item, status: 'completed', progress: 100, finalUrl: presignedData.final_url }
                      : item
                  )
                );
                addToast(`Vídeo de "${newUpload.lessonTitle}" enviado com sucesso para o Backblaze B2!`, 'success');
                resolve(presignedData.final_url);
              } else {
                setUploads((prev) =>
                  prev.map((item) =>
                    item.id === uploadId
                      ? { ...item, status: 'error', error: `Erro no storage (Status ${xhr.status})` }
                      : item
                  )
                );
                addToast(`Falha no upload do vídeo de "${newUpload.lessonTitle}".`, 'error');
                if (onError) onError();
                resolve(null);
              }
            };

            xhr.onerror = () => {
              activeXhrsRef.current.delete(uploadId);
              setUploads((prev) =>
                prev.map((item) =>
                  item.id === uploadId ? { ...item, status: 'error', error: 'Erro de conexão' } : item
                )
              );
              addToast(`Erro de conexão ao enviar vídeo de "${newUpload.lessonTitle}".`, 'error');
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
          setUploads((prev) =>
            prev.map((item) =>
              item.id === uploadId ? { ...item, status: 'error', error: 'Falha no envio' } : item
            )
          );
          if (onError) onError();
          resolve(null);
        }
      };

      xhr.onerror = () => {
        activeXhrsRef.current.delete(uploadId);
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: 'error', error: 'Falha de comunicação' } : item
          )
        );
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
  if (!context) {
    throw new Error('useUploadQueue must be used within an UploadQueueProvider');
  }
  return context;
}

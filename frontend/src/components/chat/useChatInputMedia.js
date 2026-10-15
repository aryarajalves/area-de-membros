import { useState, useRef, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export function useChatInputMedia({ onSendMessage }) {
  const { addToast } = useToast();
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pendingImageForCaption, setPendingImageForCaption] = useState(null);

  const fileInputRef = useRef(null);
  const imageOnlyInputRef = useRef(null);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const uploadFileToServer = async (file) => {
    if (file.size > 25 * 1024 * 1024) {
      addToast('O arquivo excede o limite máximo de 25 MB.', 'error');
      return null;
    }
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/v1/chat/upload-media', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (res.ok) {
      return await res.json();
    } else {
      const errData = await res.json().catch(() => ({}));
      addToast(errData.detail || 'Falha no upload da mídia.', 'error');
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setPendingImageForCaption(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const data = await uploadFileToServer(file);
      if (data) {
        setAttachedMedia({
          url: data.media_url,
          type: data.media_type,
          name: data.filename || file.name,
        });
        addToast('Mídia anexada com sucesso!', 'success');
      }
    } catch (err) {
      console.error('Erro ao enviar mídia:', err);
      addToast('Erro ao fazer upload da mídia.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageOnlyChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingImageForCaption(file);
    if (imageOnlyInputRef.current) imageOnlyInputRef.current.value = '';
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setPendingImageForCaption(file);
          return;
        }
      }
    }
  };

  const processDroppedFiles = (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
      setPendingImageForCaption(file);
    } else {
      (async () => {
        setUploading(true);
        try {
          const data = await uploadFileToServer(file);
          if (data) {
            setAttachedMedia({
              url: data.media_url,
              type: data.media_type,
              name: data.filename || file.name,
            });
            addToast('Arquivo anexado com sucesso!', 'success');
          }
        } finally {
          setUploading(false);
        }
      })();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const isOutsideWindow =
      e.clientX <= 0 ||
      e.clientY <= 0 ||
      e.clientX >= window.innerWidth ||
      e.clientY >= window.innerHeight ||
      !e.relatedTarget;
    if (isOutsideWindow) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processDroppedFiles(files);
    }
  };

  // Suporte a arrastar mídia para qualquer lugar da tela do chat sem piscar (zero flickering)
  useEffect(() => {
    let dragCounter = 0;

    const onWindowDragEnter = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        dragCounter++;
        setIsDraggingOver(true);
      }
    };

    const onWindowDragLeave = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        dragCounter--;
        const isOutsideWindow =
          e.clientX <= 0 ||
          e.clientY <= 0 ||
          e.clientX >= window.innerWidth ||
          e.clientY >= window.innerHeight ||
          !e.relatedTarget;
        if (dragCounter <= 0 || isOutsideWindow) {
          dragCounter = 0;
          setIsDraggingOver(false);
        }
      }
    };

    const onWindowDragOver = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const onWindowDrop = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        setIsDraggingOver(false);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          processDroppedFiles(files);
        }
      }
    };

    window.addEventListener('dragenter', onWindowDragEnter);
    window.addEventListener('dragleave', onWindowDragLeave);
    window.addEventListener('dragover', onWindowDragOver);
    window.addEventListener('drop', onWindowDrop);

    return () => {
      window.removeEventListener('dragenter', onWindowDragEnter);
      window.removeEventListener('dragleave', onWindowDragLeave);
      window.removeEventListener('dragover', onWindowDragOver);
      window.removeEventListener('drop', onWindowDrop);
    };
  }, []);

  const handleConfirmSendImageWithCaption = async (captionText) => {
    if (!pendingImageForCaption) return;
    setUploading(true);
    try {
      const data = await uploadFileToServer(pendingImageForCaption);
      if (data) {
        const success = await onSendMessage(captionText, data.media_url, 'image');
        if (success) {
          setPendingImageForCaption(null);
          addToast('Imagem enviada com sucesso!', 'success');
        }
      }
    } catch (err) {
      console.error('Erro ao enviar imagem com legenda:', err);
      addToast('Erro ao enviar imagem.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSendRecordedVideo = async (videoBlob, videoCaption) => {
    setUploading(true);
    try {
      const videoFile = new File([videoBlob], `video_${Date.now()}.webm`, {
        type: videoBlob.type || 'video/webm',
      });
      const data = await uploadFileToServer(videoFile);
      if (data) {
        const success = await onSendMessage(videoCaption, data.media_url, 'video');
        if (success) {
          addToast('Vídeo enviado com sucesso!', 'success');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Erro ao enviar vídeo:', err);
      addToast('Erro ao enviar vídeo gravado.', 'error');
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    attachedMedia,
    setAttachedMedia,
    uploading,
    setUploading,
    isDraggingOver,
    pendingImageForCaption,
    setPendingImageForCaption,
    fileInputRef,
    imageOnlyInputRef,
    uploadFileToServer,
    handleFileChange,
    handleImageOnlyChange,
    handlePaste,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleConfirmSendImageWithCaption,
    handleSendRecordedVideo,
  };
}

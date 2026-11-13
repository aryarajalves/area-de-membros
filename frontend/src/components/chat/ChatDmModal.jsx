import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Inbox, BellOff, X, Loader2, Sparkles, UserPlus, ArrowLeft, Lock, Users, CheckCheck } from 'lucide-react';
import ChatDmConversationView from './ChatDmConversationView';
import ChatDmNewContactSelector from './ChatDmNewContactSelector';
import ChatDmInboxList from './ChatDmInboxList';
import ChatDmAdminSupportList from './ChatDmAdminSupportList';
import ChatDmModalTabs from './ChatDmModalTabs';

const ITEMS_PER_PAGE = 20;

export default function ChatDmModal({
  isOpen,
  onClose,
  currentUser,
  targetContact = null,
}) {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'unread' | 'team_support'
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(targetContact);
  const [selectedAdminThread, setSelectedAdminThread] = useState(null);
  const [isSelectingNewContact, setIsSelectingNewContact] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const handleClose = () => {
    setSelectedContact(null);
    setSelectedAdminThread(null);
    setIsSelectingNewContact(false);
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedContact(null);
      setSelectedAdminThread(null);
      setIsSelectingNewContact(false);
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleCloseModal = () => handleClose();
    window.addEventListener('open_course_lesson', handleCloseModal);
    window.addEventListener('close_dm_modal', handleCloseModal);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('open_course_lesson', handleCloseModal);
      window.removeEventListener('close_dm_modal', handleCloseModal);
    };
  }, [isOpen]);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  useEffect(() => {
    if (targetContact) {
      setSelectedContact(targetContact);
      setIsSelectingNewContact(false);
    }
  }, [targetContact]);

  const fetchConversations = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const unreadParam = activeTab === 'unread' ? '?unread_only=true' : '';
      const res = await fetch(`/api/v1/chat/dm/conversations${unreadParam}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !selectedContact && !isSelectingNewContact) fetchConversations();
  }, [isOpen, activeTab, selectedContact, isSelectingNewContact]);

  const fetchMessages = async (contactId, adminId = null) => {
    const token = getAuthToken();
    if (!token || !contactId) return;
    setLoadingMessages(true);
    try {
      const url = adminId
        ? `/api/v1/chat/dm/admin-conversations/${contactId}/${adminId}/messages?limit=50`
        : `/api/v1/chat/dm/messages/${contactId}?limit=50`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error('Erro ao buscar mensagens da DM:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedContact?.id) fetchMessages(selectedContact.id, selectedAdminThread?.admin?.id);
  }, [selectedContact?.id, selectedAdminThread?.admin?.id]);

  // Sincronização em tempo real via WebSocket (recebe new_dm, dm_sent e dm_updated)
  useEffect(() => {
    if (!isOpen) return;

    const handleDmRealtimeUpdate = (e) => {
      const dmData = e?.detail;
      if (selectedContact?.id) {
        const contactId = Number(selectedContact.id);
        const senderId = Number(dmData?.sender_id || dmData?.message?.user?.id || dmData?.user?.id);
        const recipientId = Number(dmData?.recipient_id || dmData?.message?.recipient_id);

        if (dmData?.action && dmData?.message_id && dmData?.reactions) {
          setMessages((prev) =>
            prev.map((m) => (m.id === dmData.message_id ? { ...m, reactions: dmData.reactions } : m))
          );
        } else if (Number(dmData?.reader_id) === contactId) {
          setMessages((prev) => prev.map((m) => (m.user?.id === currentUser?.id ? { ...m, is_read: true } : m)));
        } else if (dmData?.is_read === false && (senderId === contactId || recipientId === contactId)) {
          setMessages((prev) =>
            prev.map((m, idx) => (idx === prev.length - 1 ? { ...m, is_read: false } : m))
          );
        } else if (senderId === contactId || recipientId === contactId) {
          const msgObj = dmData?.message || (dmData?.channel_type === 'dm' ? dmData : null);
          if (msgObj && msgObj.id) {
            setMessages((prev) => (prev.some((m) => m.id === msgObj.id) ? prev : [...prev, msgObj]));
          } else {
            fetchMessages(selectedContact.id);
          }
        }
      }
      fetchConversations();
    };

    window.addEventListener('dm_updated', handleDmRealtimeUpdate);
    return () => {
      window.removeEventListener('dm_updated', handleDmRealtimeUpdate);
    };
  }, [isOpen, selectedContact?.id]);

  // Enviar mensagem direta (com mídias, áudio, vídeo, imagens, GIFs e PDFs)
  const handleSendDmMessage = async (cleanText, mediaUrl = null, mediaType = null, buttonText = null, buttonUrl = null, buttonActionType = 'url') => {
    if ((!cleanText && !mediaUrl) || !selectedContact?.id) return false;
    const token = getAuthToken();
    try {
      const res = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          channel_type: 'dm',
          recipient_id: selectedContact.id,
          dm_thread_admin_id: selectedAdminThread?.admin?.id || null,
          message: cleanText || '',
          media_url: mediaUrl,
          media_type: mediaType,
          button_text: buttonText,
          button_url: buttonUrl,
          button_action_type: buttonActionType,
        }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => {
          const updated = prev.map((m) => (m.user?.id === selectedContact.id ? { ...m, is_read: true } : m));
          return updated.some((m) => m.id === newMsg.id) ? updated : [...updated, newMsg];
        });
        fetchConversations();
        window.dispatchEvent(new CustomEvent('dm_updated', {
          detail: {
            recipient_id: selectedContact.id,
            sender_id: currentUser?.id,
            message_id: newMsg.id,
            message: newMsg,
          }
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao enviar DM:', err);
      return false;
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    const token = getAuthToken();
    if (!token || !messageId || !emoji) return false;
    try {
      const res = await fetch(`/api/v1/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId) {
              return { ...m, reactions: data.reactions };
            }
            if (data.action !== 'removed' && m.user?.id === selectedContact?.id) {
              return { ...m, is_read: true };
            }
            return m;
          })
        );
        fetchConversations();
        window.dispatchEvent(new CustomEvent('dm_updated', {
          detail: {
            message_id: messageId,
            action: data.action,
            reactions: data.reactions,
            contact_id: selectedContact?.id,
          }
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao alternar reação:', err);
      return false;
    }
  };

  const handleMarkAsRead = async () => {
    if (!selectedContact?.id) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/chat/dm/${selectedContact.id}/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.user?.id === selectedContact.id ? { ...m, is_read: true } : m)));
        fetchConversations();
        window.dispatchEvent(new CustomEvent('dm_updated', { detail: { contact_id: selectedContact.id, is_read: true } }));
      }
    } catch (err) {
      console.error('Erro ao marcar DM como lida:', err);
    }
  };

  const handleMarkAsUnread = async () => {
    if (!selectedContact?.id) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/chat/dm/${selectedContact.id}/mark-unread`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => {
          let marked = false;
          return [...prev].reverse().map((m) => {
            if (!marked && m.user?.id === selectedContact.id) {
              marked = true;
              return { ...m, is_read: false };
            }
            return m;
          }).reverse();
        });
        fetchConversations();
        window.dispatchEvent(new CustomEvent('dm_updated', { detail: { contact_id: selectedContact.id, is_read: false } }));
      }
    } catch (err) {
      console.error('Erro ao marcar DM como não lida:', err);
    }
  };

  const handleDeleteDmMessage = async (messageId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/v1/chat/messages/${messageId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const isPrivileged = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
        if (data.permanent || !isPrivileged) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
        } else {
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, deleted_at: data.deleted_at || new Date().toISOString() } : m)));
        }
        fetchConversations();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao excluir mensagem da DM:', err);
      return false;
    }
  };

  if (!isOpen) return null;

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  const hasUnreadMessages = Boolean(
    selectedContact && !selectedAdminThread && messages.some((m) => !m.is_read && m.user?.id === selectedContact?.id)
  );

  const modalContent = (
    <div
      data-testid="chat-dm-modal"
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)', zIndex: 1000002, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: selectedContact ? '680px' : '490px',
          height: selectedContact ? '660px' : '620px', maxHeight: '90vh',
          backgroundColor: '#0f172a', borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: '#131d35',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isSelectingNewContact ? <UserPlus size={18} /> : <Mail size={18} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {selectedAdminThread
                  ? `Atendimento: ${selectedAdminThread.student.name} ↔ ${selectedAdminThread.admin.name}`
                  : selectedContact
                  ? `Mensagens com ${selectedContact.name}`
                  : isSelectingNewContact ? 'Iniciar Nova Conversa' : 'DMs (Mensagens Diretas)'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {selectedAdminThread
                    ? 'Modo Supervisão (Super Admin) • Atendimento da Equipe'
                    : selectedContact
                    ? (selectedContact.role === 'admin' ? 'Professor / Administrador' : 'Aluno')
                    : isSelectingNewContact ? 'Selecione um membro para conversar' : 'Bate-papo privado 1-a-1'}
                </span>
                {selectedContact && !selectedAdminThread && (
                  <span
                    data-testid="dm-encryption-badge"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 600, color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1px 7px' }}
                    title="Criptografia ativada: mensagens protegidas no banco de dados."
                  >
                    <Lock size={10} color="#34d399" />
                    <span>Criptografada</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedContact && !selectedAdminThread && (
              hasUnreadMessages ? (
                <button
                  type="button"
                  onClick={handleMarkAsRead}
                  data-testid="dm-mark-read-btn"
                  title="Marcar todas as mensagens como lidas"
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8', cursor: 'pointer', padding: '4px 10px',
                    borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <CheckCheck size={13} /> Marcar como lida
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkAsUnread}
                  data-testid="dm-mark-unread-btn"
                  title="Marcar conversa como não lida"
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94a3b8', cursor: 'pointer', padding: '4px 10px',
                    borderRadius: '6px', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                >
                  <Mail size={13} /> Marcar como não lida
                </button>
              )
            )}
            {(selectedContact || isSelectingNewContact) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedContact(null);
                  setSelectedAdminThread(null);
                  setIsSelectingNewContact(false);
                  fetchConversations();
                }}
                data-testid="dm-back-to-inbox-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px',
                  fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <ArrowLeft size={13} /> Ver Inbox
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              data-testid="close-dm-modal-btn"
              style={{
                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Abas Inbox / Não lidas + Botão Nova Conversa */}
        {!selectedContact && !isSelectingNewContact && (
          <ChatDmModalTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadTotal={unreadTotal}
            currentUser={currentUser}
            onStartNewConversation={() => setIsSelectingNewContact(true)}
          />
        )}

        {/* Conteúdo: Seletor de Novo Contato OU Listagem de Conversas OU Chat Privado */}
        {isSelectingNewContact ? (
          <ChatDmNewContactSelector
            onSelectContact={(contact) => {
              setSelectedContact(contact);
              setIsSelectingNewContact(false);
            }}
            onClose={() => setIsSelectingNewContact(false)}
          />
        ) : !selectedContact ? (
          activeTab === 'team_support' ? (
            <ChatDmAdminSupportList
              onSelectConversation={(thread) => {
                setSelectedAdminThread(thread);
                setSelectedContact(thread.student);
                setIsSelectingNewContact(false);
              }}
            />
          ) : (
            <ChatDmInboxList
              conversations={conversations}
              loading={loading}
              activeTab={activeTab}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onSelectContact={setSelectedContact}
              onStartNewConversation={() => setIsSelectingNewContact(true)}
            />
          )
        ) : (
          <ChatDmConversationView
            selectedContact={selectedContact}
            currentUser={currentUser}
            messages={messages}
            loading={loadingMessages}
            onSendMessage={handleSendDmMessage}
            onDeleteMessage={handleDeleteDmMessage}
            onToggleReaction={handleToggleReaction}
            adminThread={selectedAdminThread}
          />
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

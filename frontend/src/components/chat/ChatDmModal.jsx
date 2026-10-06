import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Inbox, BellOff, X, Loader2, Sparkles, UserPlus, ArrowLeft } from 'lucide-react';
import ChatDmConversationView from './ChatDmConversationView';
import ChatDmConversationItem from './ChatDmConversationItem';
import ChatDmNewContactSelector from './ChatDmNewContactSelector';

export default function ChatDmModal({
  isOpen,
  onClose,
  currentUser,
  targetContact = null,
}) {
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'unread'
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(targetContact);
  const [isSelectingNewContact, setIsSelectingNewContact] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Bloqueio do scroll do fundo quando o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  // Ao abrir o modal com contato pré-definido
  useEffect(() => {
    if (targetContact) {
      setSelectedContact(targetContact);
      setIsSelectingNewContact(false);
    }
  }, [targetContact]);

  // Carregar conversas da inbox
  const fetchConversations = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const unreadParam = activeTab === 'unread' ? '?unread_only=true' : '';
      const res = await fetch(`/api/v1/chat/dm/conversations${unreadParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !selectedContact && !isSelectingNewContact) {
      fetchConversations();
    }
  }, [isOpen, activeTab, selectedContact, isSelectingNewContact]);

  // Carregar mensagens do contato selecionado
  const fetchMessages = async (contactId) => {
    const token = getAuthToken();
    if (!token || !contactId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/v1/chat/dm/messages/${contactId}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens da DM:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedContact?.id) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact?.id]);

  // Enviar mensagem direta
  const handleSendDmMessage = async (cleanText) => {
    if (!cleanText || !selectedContact?.id) return false;
    const token = getAuthToken();
    try {
      const payload = {
        channel_type: 'dm',
        recipient_id: selectedContact.id,
        message: cleanText,
      };
      const res = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao enviar DM:', err);
      return false;
    }
  };

  if (!isOpen) return null;

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const modalContent = (
    <div
      data-testid="chat-dm-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: selectedContact ? '640px' : '490px',
          height: '620px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.2s ease',
        }}
      >
        {/* Cabeçalho do Modal */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#131d35',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelectingNewContact ? <UserPlus size={18} /> : <Mail size={18} />}
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                {selectedContact
                  ? `Mensagens com ${selectedContact.name}`
                  : isSelectingNewContact
                  ? 'Iniciar Nova Conversa'
                  : 'DMs (Mensagens Diretas)'}
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  margin: '2px 0 0',
                }}
              >
                {selectedContact
                  ? selectedContact.role === 'admin'
                    ? 'Professor / Administrador'
                    : 'Aluno'
                  : isSelectingNewContact
                  ? 'Selecione um membro para conversar'
                  : 'Bate-papo privado 1-a-1'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(selectedContact || isSelectingNewContact) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedContact(null);
                  setIsSelectingNewContact(false);
                  fetchConversations();
                }}
                data-testid="dm-back-to-inbox-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={13} /> Ver Inbox
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              data-testid="close-dm-modal-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Abas Inbox / Não lidas + Botão Nova Conversa */}
        {!selectedContact && !isSelectingNewContact && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#0c1322',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('inbox')}
                data-testid="dm-tab-inbox"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'inbox' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === 'inbox' ? '#38bdf8' : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Inbox size={14} />
                <span>Inbox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                data-testid="dm-tab-unread"
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'unread' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  color: activeTab === 'unread' ? '#f87171' : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <BellOff size={14} />
                <span>Não lidas</span>
                {unreadTotal > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                    }}
                  >
                    {unreadTotal}
                  </span>
                )}
              </button>
            </div>

            {/* Opção 1: Botão + Nova Conversa no Cabeçalho */}
            <button
              type="button"
              onClick={() => setIsSelectingNewContact(true)}
              data-testid="dm-new-conversation-btn"
              title="Iniciar conversa privada com um aluno ou membro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <UserPlus size={14} />
              <span>Nova Conversa</span>
            </button>
          </div>
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
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
            data-testid="dm-conversations-list"
          >
            {loading ? (
              <div
                style={{
                  padding: '40px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  color: '#94a3b8',
                }}
              >
                <Loader2 size={28} className="animate-spin" color="#38bdf8" />
                <span style={{ fontSize: '0.85rem' }}>Carregando conversas...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div
                style={{
                  padding: '48px 16px',
                  textAlign: 'center',
                  color: '#64748b',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Sparkles size={36} style={{ opacity: 0.5 }} />
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                    {activeTab === 'unread' ? 'Nenhuma mensagem não lida.' : 'Nenhuma conversa na Inbox ainda.'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                    Inicie uma conversa privada chamando qualquer membro da plataforma.
                  </p>
                </div>

                {/* Opção 2: Ação Destacada no Empty State */}
                <button
                  type="button"
                  onClick={() => setIsSelectingNewContact(true)}
                  data-testid="dm-empty-state-new-conversation-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginTop: '8px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <UserPlus size={16} />
                  <span>Iniciar Nova Conversa</span>
                </button>
              </div>
            ) : (
              conversations.map((item) => (
                <ChatDmConversationItem
                  key={item.contact.id}
                  item={item}
                  onSelect={setSelectedContact}
                />
              ))
            )}
          </div>
        ) : (
          <ChatDmConversationView
            selectedContact={selectedContact}
            currentUser={currentUser}
            messages={messages}
            loading={loadingMessages}
            onSendMessage={handleSendDmMessage}
          />
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}

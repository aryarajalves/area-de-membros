import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Loader2, UserCheck, Shield, GraduationCap } from 'lucide-react';

export default function ChatDmNewContactSelector({
  onSelectContact,
  onClose,
}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  useEffect(() => {
    const fetchContacts = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch('/api/v1/chat/mention-contacts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error('Erro ao carregar contatos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const filtered = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      data-testid="dm-new-contact-selector"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        backgroundColor: '#0f172a',
      }}
    >
      {/* Barra de Busca de Usuários */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0c1322',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            borderRadius: '10px',
            padding: '8px 12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="dm-search-contact-input"
            autoFocus
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.85rem',
              width: '100%',
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Contatos */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
        data-testid="dm-contacts-list"
      >
        {loading ? (
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              color: '#94a3b8',
            }}
          >
            <Loader2 size={24} className="animate-spin" color="#38bdf8" />
            <span style={{ fontSize: '0.82rem' }}>Carregando membros...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhum usuário encontrado.</p>
            <span style={{ fontSize: '0.75rem' }}>Verifique se o nome digitado está correto.</span>
          </div>
        ) : (
          filtered.map((contact) => {
            const isAdmin = ['superadmin', 'admin'].includes(contact.role);
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                data-testid={`dm-contact-item-${contact.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: isAdmin ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: isAdmin ? '#eab308' : '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {contact.avatar_url ? (
                    <img
                      src={contact.avatar_url}
                      alt={contact.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    (contact.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: '#f8fafc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {contact.name}
                    </span>
                    {isAdmin ? (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: 'rgba(234, 179, 8, 0.15)',
                          color: '#eab308',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Shield size={10} /> Admin
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <GraduationCap size={10} /> Aluno
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {contact.email}
                  </span>
                </div>

                {/* Botão Chamar */}
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  }}
                >
                  Conversar
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

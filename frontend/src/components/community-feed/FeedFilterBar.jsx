import React, { useState, useRef, useEffect } from 'react';
import {
  Compass, Flame, MessageSquare, BookmarkCheck, Share2,
  Users, BookOpen, UserCheck, Calendar, Bookmark, ChevronDown
} from 'lucide-react';

const PRIMARY_TABS = [
  { id: 'all', label: 'Para Você / Geral', icon: Compass },
  { id: 'following', label: 'Seguindo', icon: Users },
  { id: 'my_course', label: 'Meu Curso', icon: BookOpen },
];

const ENGAGEMENT_TABS = [
  { id: 'popular', label: 'Mais Curtidos', icon: Flame },
  { id: 'most_commented', label: 'Mais Comentados', icon: MessageSquare },
  { id: 'most_saved', label: 'Mais Salvos', icon: BookmarkCheck },
  { id: 'most_shared', label: 'Mais Compartilhados', icon: Share2 },
];

const PERSONAL_TABS = [
  { id: 'my_posts', label: 'Minhas Publicações', icon: UserCheck },
  { id: 'saved', label: 'Salvos por Mim', icon: Bookmark },
  { id: 'scheduled', label: 'Agendados', icon: Calendar },
];

function FilterDropdown({ label, defaultIcon: DefaultIcon, items, activeFilter, onSelect, testId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeItem = items.find((item) => item.id === activeFilter);
  const TriggerIcon = activeItem ? activeItem.icon : DefaultIcon;

  return (
    <div className="feed-filter-dropdown-wrapper" ref={ref}>
      <button
        type="button"
        className={`feed-filter-tab ${activeItem ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        data-testid={testId}
      >
        <TriggerIcon size={16} />
        <span>{activeItem ? activeItem.label : label}</span>
        <ChevronDown size={14} style={{ opacity: 0.75, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div className="feed-filter-dropdown-menu" role="menu">
          {items.map((item) => {
            const Icon = item.icon;
            const isSelected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`feed-filter-dropdown-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                data-testid={`feed-filter-tab-${item.id}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FeedFilterBar({ activeFilter, onSelectFilter }) {
  return (
    <div className="feed-filter-tabs">
      {PRIMARY_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`feed-filter-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectFilter(tab.id)}
            data-testid={`feed-filter-tab-${tab.id}`}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}

      <FilterDropdown
        label="Em Alta"
        defaultIcon={Flame}
        items={ENGAGEMENT_TABS}
        activeFilter={activeFilter}
        onSelect={onSelectFilter}
        testId="feed-filter-group-engagement"
      />

      <FilterDropdown
        label="Meus & Mais"
        defaultIcon={Bookmark}
        items={PERSONAL_TABS}
        activeFilter={activeFilter}
        onSelect={onSelectFilter}
        testId="feed-filter-group-personal"
      />
    </div>
  );
}

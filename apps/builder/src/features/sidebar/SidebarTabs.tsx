/**
 * Builder.io-style tabbed left sidebar.
 * Tabs: Insert (blocks), Site (settings), Pages (structure).
 */
import { useState, type ReactNode } from 'react';

type TabId = 'insert' | 'site' | 'pages';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  content: ReactNode;
}

interface Props {
  insertContent: ReactNode;
  siteContent: ReactNode;
  pagesContent: ReactNode;
  hasPages?: boolean;
}

export function SidebarTabs({
  insertContent,
  siteContent,
  pagesContent,
  hasPages = true,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('insert');

  const tabs: Tab[] = [
    { id: 'insert', label: 'Insert', icon: '+', content: insertContent },
    { id: 'site', label: 'Site', icon: '⚙', content: siteContent },
    ...(hasPages ? [{ id: 'pages' as TabId, label: 'Pages', icon: '☰', content: pagesContent }] : []),
  ];

  return (
    <div className="sidebar-tabs">
      <div className="sidebar-tabs-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sidebar-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            aria-label={tab.label}
          >
            <span className="sidebar-tab-icon">{tab.icon}</span>
            <span className="sidebar-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-tabs-panel">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}

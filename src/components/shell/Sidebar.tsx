import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { NAV_ITEMS, GROUP_LABELS, type ViewId, type NavItem } from './nav';

export interface SidebarProps {
  currentView: ViewId;
  onNavigate: (id: ViewId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  stationCode?: string;
  stationLabel?: string;
}

const Emblem: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div
    className="shrink-0 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-mono font-black shadow-glow"
    style={{ width: size, height: size, fontSize: size * 0.44 }}
    aria-hidden="true"
  >
    AL
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  stationCode = 'LOS',
  stationLabel = 'LAGOS TERMINAL',
}) => {
  const groups = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed z-50 top-3 bottom-3 left-3 rounded-xl bg-surface-container-low/95 backdrop-blur-2xl
          shadow-panel flex flex-col p-3 transition-[width,transform] duration-200
          ${collapsed ? 'lg:w-[4.75rem]' : 'lg:w-64'}
          w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-[110%] lg:translate-x-0'}
        `}
      >
        {/* Brand block */}
        <div className="p-2.5 rounded-lg bg-surface-container-lowest/80 mb-3">
          <div className="flex items-center gap-2.5">
            <Emblem size={collapsed ? 30 : 32} />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-label-caps text-label-caps tracking-widest text-accent-amber font-black truncate">
                  AEROLOGISTICS
                </span>
                <span className="font-label-caps text-label-caps tracking-wider text-on-surface-variant font-medium truncate">
                  CARGO DESK
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
              <span className="font-mono-data-sm text-mono-data-sm text-on-surface-variant">
                HUB // {stationCode}
              </span>
              <span className="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-high text-accent-amber font-bold">
                {stationLabel}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-none">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-0.5">
              {!collapsed && (
                <span className="px-3 pt-1 pb-1 font-label-caps text-label-caps tracking-widest text-text-disabled">
                  {GROUP_LABELS[group as NavItem['group']]}
                </span>
              )}
              {items.map((item) => {
                const active = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer
                      ${collapsed ? 'justify-center' : ''}
                      ${active
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-glow'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}
                    `}
                  >
                    <Icon name={item.icon} size={20} fill={active} />
                    {!collapsed && <span className="text-body-md">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-3 flex flex-col gap-2">
          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={18} />
            {!collapsed && <span className="font-label-caps text-label-caps">COLLAPSE</span>}
          </button>
          {!collapsed && (
            <div className="p-2 rounded-lg bg-surface-container-lowest/60 flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant">VERSION</span>
              <span className="font-mono-data-sm text-mono-data-sm text-accent-amber font-semibold">1.0.0</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

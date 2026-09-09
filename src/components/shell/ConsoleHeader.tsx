import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { useOnlineStatus } from '@/lib/offline/sync';

export interface ConsoleHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMobileNav: () => void;
  operatorInitials?: string;
  operatorRole?: string;
  stationCode?: string;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  isDark,
  onToggleTheme,
  onOpenMobileNav,
  operatorInitials = 'OA',
  operatorRole = 'SUP',
  stationCode = 'LOS',
}) => {
  const { isOnline, pendingSyncCount } = useOnlineStatus();

  return (
    <header className="sticky top-3 z-30 h-14 rounded-xl bg-surface-container-low/85 backdrop-blur-2xl shadow-panel px-3 sm:px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          aria-label="Open navigation"
        >
          <Icon name="menu" size={18} />
        </button>
        <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold tracking-wide truncate hidden sm:block">
          AeroLogistics — Cargo desk
        </span>
        <span className="font-mono-data-md text-mono-data-md text-on-surface font-semibold tracking-wide sm:hidden">
          AeroLogistics
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          title="Toggle luminescence"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <Icon name={isDark ? 'light_mode' : 'dark_mode'} size={18} />
        </button>

        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high ${isOnline ? 'text-success' : 'text-warning'}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success shadow-[0_0_8px_currentColor]' : 'bg-warning'}`}
          />
          <span className="font-label-caps text-label-caps text-on-surface">
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {pendingSyncCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-accent-amber">
            <Icon name="sync" size={15} className="animate-spin" />
            <span className="font-mono-data-sm text-mono-data-sm">
              {pendingSyncCount} waiting to sync
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="font-mono-data-sm text-mono-data-sm text-on-primary-container font-bold">
              {operatorInitials}
            </span>
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="font-mono-data-sm text-mono-data-sm text-on-surface font-bold">
              {operatorInitials}
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant">
              {operatorRole} // {stationCode}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

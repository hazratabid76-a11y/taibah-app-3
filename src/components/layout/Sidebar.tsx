import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Award,
  CreditCard,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { NavigationTab, SchoolProfile } from '../../types';
import { OFFICIAL_LOGO_URL } from '../../db/initialData';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  schoolProfile: SchoolProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  schoolProfile,
}) => {
  // 4 Primary Functional Modules + Dashboard Home
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Analytics, summary & quick access',
    },
    {
      id: 'results' as NavigationTab,
      label: 'Result Generation',
      icon: FileSpreadsheet,
      description: 'Spreadsheet, PDF & Excel export',
    },
    {
      id: 'dmc' as NavigationTab,
      label: 'DMC Generation',
      icon: Award,
      description: 'Official marks certificates & templates',
    },
    {
      id: 'cards' as NavigationTab,
      label: 'Student Card Generator',
      icon: CreditCard,
      description: 'Independent ID designer & 8 templates',
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Settings',
      icon: Settings,
      description: 'Profiles, classes, subjects & developer',
    },
  ];

  const logoSrc = schoolProfile.logoUrl || OFFICIAL_LOGO_URL;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-screen shrink-0 select-none shadow-xs transition-colors">
      <div>
        {/* School Identity Header with Official School Logo (IMAGE 1) & App Icon (IMAGE 3) */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          title="Go to Dashboard Home"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs relative">
            <img
              src={logoSrc}
              alt="Taibah School Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = OFFICIAL_LOGO_URL;
              }}
            />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-black text-slate-900 dark:text-white leading-snug tracking-tight uppercase line-clamp-1">
                TAIBAH
              </h1>
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                COLLEGE
              </span>
            </div>
            <p className="text-[10.5px] font-semibold text-blue-700 dark:text-blue-400 tracking-wide truncate">
              {schoolProfile.location}
            </p>
          </div>
        </div>

        {/* Navigation Items (The 4 Main Modules + Dashboard Home) */}
        <div className="px-3 py-4">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
            <span>Main Modules</span>
            <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded font-mono">
              4 Modules
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs ring-1 ring-blue-500'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  />
                  <div className="truncate">
                    <span className="text-xs block leading-tight">{item.label}</span>
                    <span
                      className={`text-[10px] block leading-tight mt-0.5 truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
        <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>System Active</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            Offline Ready
          </span>
        </div>
      </div>
    </aside>
  );
};

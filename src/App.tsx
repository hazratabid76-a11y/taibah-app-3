/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppDatabase, NavigationTab } from './types';
import { DatabaseService } from './db/storage';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ResultSpreadsheet } from './components/results/ResultSpreadsheet';
import { DMCGenerator } from './components/dmc/DMCGenerator';
import { StudentCardGenerator } from './components/cards/StudentCardGenerator';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const dbService = useMemo(() => DatabaseService.getInstance(), []);
  const [db, setDb] = useState<AppDatabase>(() => dbService.getDatabase());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Sync state when DB notifies listeners
  useEffect(() => {
    const unsubscribe = dbService.subscribe((freshDb) => {
      setDb(freshDb);
    });
    return () => unsubscribe();
  }, [dbService]);

  // Synchronize document root dark class
  useEffect(() => {
    if (db.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [db.themeMode]);

  // Update DB callback
  const handleUpdateDb = useCallback(
    (newDb: AppDatabase) => {
      setDb(newDb);
      dbService.saveDatabase(newDb);
    },
    [dbService]
  );

  return (
    <div className={`flex h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans ${db.themeMode === 'dark' ? 'dark' : ''}`}>
      {/* Main Left Navigation Sidebar (4 modules + Dashboard Home) */}
      <div className="no-print h-full">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          schoolProfile={db.schoolProfile}
        />
      </div>

      {/* Content Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="no-print">
          <TopBar
            currentTab={currentTab}
            db={db}
            onUpdateDb={handleUpdateDb}
            onNavigate={setCurrentTab}
          />
        </div>

        {/* Viewport for active tab - directly opens to Dashboard */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              db={db}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'results' && (
            <ResultSpreadsheet db={db} onUpdateDb={handleUpdateDb} />
          )}

          {currentTab === 'dmc' && (
            <DMCGenerator db={db} onUpdateDb={handleUpdateDb} />
          )}

          {currentTab === 'cards' && (
            <StudentCardGenerator db={db} onUpdateDb={handleUpdateDb} />
          )}

          {currentTab === 'settings' && (
            <SettingsView db={db} onUpdateDb={handleUpdateDb} />
          )}
        </main>
      </div>
    </div>
  );
}

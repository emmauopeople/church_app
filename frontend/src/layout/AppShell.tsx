import { Outlet } from 'react-router-dom';

import { Ribbon } from './Ribbon';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="flex h-dvh flex-col bg-[#EFE7D6] text-[#1F2933]">
      <TopBar />
      <Ribbon />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CatholicIcon } from '../components/decorative/CatholicIcon';
import type { CatholicIconName } from '../components/decorative/CatholicIcon';

type NavItem = {
  to: string;
  labelKey: string;
  icon: CatholicIconName;
};

const navItems: NavItem[] = [
  { to: '/app/dashboard', labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/app/members', labelKey: 'nav.members', icon: 'people' },
  { to: '/app/sacraments', labelKey: 'nav.sacraments', icon: 'chalice' },
  { to: '/app/certificates', labelKey: 'nav.certificates', icon: 'certificate' },
  { to: '/app/registers', labelKey: 'nav.registers', icon: 'book' },
  { to: '/app/documents', labelKey: 'nav.documents', icon: 'document' },
  { to: '/app/settings', labelKey: 'nav.settings', icon: 'settings' },
];

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="hidden h-full w-72 shrink-0 overflow-auto border-r border-[#D8C8A2] bg-[#FFF9EE] lg:block">
      <div className="border-b border-[#E5DED0] px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9D7A1E]">
          {t('nav.workspace')}
        </p>
        <p className="mt-2 text-sm text-[#667085]">{t('nav.workspaceDescription')}</p>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#0F3D2E] text-white shadow-md shadow-[#0F3D2E]/15'
                  : 'text-[#344054] hover:bg-[#F4E8C8] hover:text-[#0F3D2E]'
              }`
            }
          >
            <CatholicIcon name={item.icon} className="h-5 w-5 shrink-0" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

import { useTranslation } from 'react-i18next';

import { ChurchEmblem } from '../components/decorative/ChurchEmblem';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';

export function TopBar() {
  const { t } = useTranslation();

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-[#D8C8A2] bg-[#0F3D2E] px-4 text-white shadow-md lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-white/10 text-[#F3D98B]">
          <ChurchEmblem className="h-8 w-8" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold leading-tight text-[#FFF7DD] sm:text-xl">
            {t('app.title')}
          </h1>
          <p className="hidden text-xs text-[#EBDFAF] sm:block">{t('app.subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden rounded-lg bg-white/95 px-3 py-1.5 md:block">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-3 rounded-full border border-[#D4AF37]/40 bg-white/10 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4E8C8] text-sm font-bold text-[#0F3D2E]">
            SP
          </div>
          <div className="hidden text-sm leading-tight sm:block">
            <p className="font-semibold">{t('app.staffName')}</p>
            <p className="text-xs text-[#EBDFAF]">{t('app.staffRole')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

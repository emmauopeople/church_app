import { useTranslation } from 'react-i18next';

type LanguageSwitcherProps = {
  label?: string;
};

const languages = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
] as const;

export function LanguageSwitcher({ label }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.language?.startsWith('en') ? 'en' : 'fr';

  const changeLanguage = (language: 'fr' | 'en') => {
    void i18n.changeLanguage(language);
  };

  return (
    <div className="flex items-center justify-center gap-3 text-sm text-[#1F2933] sm:text-base">
      <span className="font-medium">{label ?? t('login.language')} :</span>
      <div className="flex items-center gap-2 font-semibold tracking-wide">
        {languages.map((language, index) => (
          <div key={language.code} className="flex items-center gap-2">
            {index > 0 && <span className="text-[#B7A475]">|</span>}
            <button
              type="button"
              onClick={() => changeLanguage(language.code)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                activeLanguage === language.code
                  ? 'bg-[#F4E8C8] text-[#0F3D2E] shadow-sm ring-1 ring-[#E0C978]'
                  : 'text-[#1F2933] hover:bg-[#F4E8C8]/60 hover:text-[#0F3D2E]'
              }`}
              aria-pressed={activeLanguage === language.code}
            >
              {language.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

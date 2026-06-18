import { Eye, LockKeyhole, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChurchEmblem } from '../../components/decorative/ChurchEmblem';
import { CurvedLoginDivider } from '../../components/decorative/CurvedLoginDivider';
import { OrnamentDivider } from '../../components/decorative/OrnamentDivider';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';

export function LoginPage() {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF9EE] text-[#1F2933]">
      <section className="relative grid min-h-screen lg:grid-cols-[56%_44%]">
        <div
          className="relative min-h-[48vh] overflow-hidden bg-[#0F3D2E] bg-cover bg-center lg:min-h-screen"
          style={{ backgroundImage: "url('/images/church-login-bg.png')" }}
        >
          <div className="absolute inset-0 bg-[#0B2F2A]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06352F]/85 via-[#0E4A42]/55 to-[#0F3D2E]/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />

          <div className="absolute -left-24 top-10 h-96 w-96 rounded-full border border-[#D4AF37]/10" />
          <div className="absolute -left-10 bottom-10 hidden text-[#F3D98B]/10 sm:block">
            <svg viewBox="0 0 240 360" className="h-[28rem] w-[18rem]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M120 104v56" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
              <path d="M92 132h56" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
              <path d="M58 174h124c0 52-27 92-62 92s-62-40-62-92Z" stroke="currentColor" strokeWidth="12" />
              <path d="M120 266v58M74 324h92" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
              <path d="M28 300c48-40 90-38 128 4 18 20 36 29 56 27" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="relative z-10 flex min-h-[48vh] items-center px-8 py-10 sm:px-14 lg:min-h-screen lg:px-20 xl:px-28">
            <div className="max-w-xl text-center lg:text-left">
              <div className="mb-8 flex justify-center lg:justify-start">
                <div className="text-[#F3D98B]">
                  <ChurchEmblem className="h-20 w-20" />
                </div>
              </div>

              <div className="mb-8 flex items-center justify-center gap-3 text-[#D4AF37]/80 lg:justify-start">
                <span className="h-px w-28 bg-current" />
                <span className="h-2 w-2 rotate-45 border border-current" />
                <span className="h-px w-28 bg-current" />
              </div>

              <h1 className="font-serif text-4xl font-bold leading-tight text-white drop-shadow-sm sm:text-5xl xl:text-6xl">
                <span className="block">{t('login.appTitleLine1')}</span>
                <span className="block text-[#F3D98B]">{t('login.appTitleLine2')}</span>
              </h1>

              <p className="mt-6 text-lg font-semibold text-[#FFF7DD] sm:text-xl">
                {t('login.diocese')}
              </p>

              <div className="mx-auto mt-16 max-w-md lg:mx-0">
                <OrnamentDivider className="mb-7 text-[#D4AF37]" />
                <p className="text-lg font-medium leading-relaxed text-white sm:text-xl">
                  {t('login.description')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <CurvedLoginDivider />

        <div className="relative flex min-h-[52vh] items-center justify-center bg-[#FFF9EE] px-6 py-10 lg:min-h-screen lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,249,238,0.92))]" />
          <div className="relative z-10 w-full max-w-xl">
            <div className="mb-9 text-center">
              <div className="mb-5 flex justify-center text-[#D4AF37]">
                <svg viewBox="0 0 36 36" className="h-10 w-10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 4v28M10 12h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M18 4c3 3.6 6 4.7 10 4.9-3.5 3.1-5.5 6.8-5.7 11.1-2.7-2.4-5.6-2.4-8.6 0-.2-4.3-2.2-8-5.7-11.1C12 8.7 15 7.6 18 4Z" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
                </svg>
              </div>
              <h2 className="font-serif text-3xl font-bold leading-tight text-[#0F3D2E] sm:text-4xl xl:text-5xl">
                {t('login.secureAccess')}
              </h2>
              <div className="mt-6 flex items-center justify-center gap-3 text-[#D4AF37]">
                <span className="h-px w-24 bg-current" />
                <span className="h-2 w-2 rotate-45 border border-current" />
                <span className="h-px w-24 bg-current" />
              </div>
            </div>

            <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
              <label className="group flex h-16 items-center gap-4 rounded-xl border border-[#D9CFB8] bg-white/85 px-5 shadow-[0_8px_24px_rgba(31,41,51,0.08)] transition focus-within:border-[#D4AF37] focus-within:ring-4 focus-within:ring-[#D4AF37]/15">
                <UserRound className="h-6 w-6 shrink-0 text-[#145C43]" aria-hidden="true" />
                <input
                  type="text"
                  className="h-full flex-1 bg-transparent text-lg text-[#1F2933] outline-none placeholder:text-[#7B8188]"
                  placeholder={t('login.email')}
                  autoComplete="username"
                />
              </label>

              <label className="group flex h-16 items-center gap-4 rounded-xl border border-[#D9CFB8] bg-white/85 px-5 shadow-[0_8px_24px_rgba(31,41,51,0.08)] transition focus-within:border-[#D4AF37] focus-within:ring-4 focus-within:ring-[#D4AF37]/15">
                <LockKeyhole className="h-6 w-6 shrink-0 text-[#145C43]" aria-hidden="true" />
                <input
                  type="password"
                  className="h-full flex-1 bg-transparent text-lg text-[#1F2933] outline-none placeholder:text-[#7B8188]"
                  placeholder={t('login.password')}
                  autoComplete="current-password"
                />
                <button type="button" className="text-[#7B8188] transition hover:text-[#145C43]" aria-label="Afficher ou masquer le mot de passe">
                  <Eye className="h-6 w-6" aria-hidden="true" />
                </button>
              </label>

              <div className="flex justify-start">
                <button type="button" className="text-base font-medium text-[#0F3D2E] underline underline-offset-4 transition hover:text-[#145C43]">
                  {t('login.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#0F3D2E] to-[#146046] text-xl font-bold text-white shadow-[0_14px_30px_rgba(15,61,46,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,61,46,0.32)] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/30"
              >
                <LockKeyhole className="h-6 w-6" aria-hidden="true" />
                {t('login.submit')}
              </button>
            </form>

            <div className="my-10 text-[#D4AF37]">
              <OrnamentDivider />
            </div>

            <LanguageSwitcher />

            <p className="mt-24 text-center text-sm text-[#4B5563] lg:mt-32">
              {t('login.footer')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

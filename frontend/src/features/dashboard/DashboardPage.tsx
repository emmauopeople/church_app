import { useTranslation } from 'react-i18next';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#9D7A1E]">
          <CatholicIcon name="church" className="h-5 w-5" />
          {t('dashboard.kicker')}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-bold text-[#0F3D2E]">
          {t('dashboard.title')}
        </h2>
        <p className="mt-2 max-w-3xl text-[#667085]">{t('dashboard.description')}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="people" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">0</p>
          <h3 className="mt-2 font-bold">{t('dashboard.cards.members')}</h3>
          <p className="text-sm text-[#667085]">{t('dashboard.descriptions.members')}</p>
        </article>
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="water" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">0</p>
          <h3 className="mt-2 font-bold">{t('dashboard.cards.baptisms')}</h3>
          <p className="text-sm text-[#667085]">{t('dashboard.descriptions.baptisms')}</p>
        </article>
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="rings" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">0</p>
          <h3 className="mt-2 font-bold">{t('dashboard.cards.marriages')}</h3>
          <p className="text-sm text-[#667085]">{t('dashboard.descriptions.marriages')}</p>
        </article>
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="certificate" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">0</p>
          <h3 className="mt-2 font-bold">{t('dashboard.cards.certificates')}</h3>
          <p className="text-sm text-[#667085]">{t('dashboard.descriptions.certificates')}</p>
        </article>
      </section>
    </div>
  );
}

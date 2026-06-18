import { useTranslation } from 'react-i18next';

import { RibbonButton } from './RibbonButton';

export function Ribbon() {
  const { t } = useTranslation();

  return (
    <div className="border-b border-[#D8C8A2] bg-[#F8F3E7] shadow-sm">
      <div className="flex min-h-24 items-stretch overflow-x-auto px-4 lg:px-6">
        <div className="flex items-center gap-2 border-r border-[#D8C8A2] pr-4">
          <RibbonButton icon="plus" label={t('ribbon.newMember')} />
          <RibbonButton icon="search" label={t('ribbon.search')} />
          <RibbonButton icon="save" label={t('ribbon.save')} />
          <RibbonButton icon="print" label={t('ribbon.print')} />
        </div>

        <div className="flex items-center gap-2 border-r border-[#D8C8A2] px-4">
          <RibbonButton icon="water" label={t('ribbon.newBaptism')} />
          <RibbonButton icon="rings" label={t('ribbon.newMarriage')} />
          <RibbonButton icon="dove" label={t('ribbon.confirmation')} />
        </div>

        <div className="flex items-center gap-2 px-4">
          <RibbonButton icon="certificate" label={t('ribbon.createCertificate')} />
          <RibbonButton icon="document" label={t('ribbon.preview')} />
          <RibbonButton icon="download" label={t('ribbon.exportPdf')} />
        </div>
      </div>
    </div>
  );
}

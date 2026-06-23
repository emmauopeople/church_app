import { useLocation, useNavigate } from 'react-router-dom';

import type { CatholicIconName } from '../components/decorative/CatholicIcon';
import { RibbonButton } from './RibbonButton';

type RibbonAction = {
  id: string;
  icon: CatholicIconName;
  label: string;
  description?: string;
  route?: string;
  event?: string;
};

type RibbonGroup = {
  title: string;
  actions: RibbonAction[];
};

const routeGroups: Array<{ match: string; title: string; groups: RibbonGroup[] }> = [
  {
    match: '/app/dashboard',
    title: 'Tableau de bord',
    groups: [
      {
        title: 'Actions rapides',
        actions: [
          { id: 'dashboard-new-member', icon: 'plus', label: 'Nouveau paroissien', route: '/app/members', event: 'members:new' },
          { id: 'dashboard-new-sacrament', icon: 'chalice', label: 'Nouvel acte', route: '/app/sacraments', event: 'sacraments:new' },
          { id: 'dashboard-certificate', icon: 'certificate', label: 'Certificat / carte', route: '/app/certificates' },
          { id: 'dashboard-upload-document', icon: 'document', label: 'Ajouter document', route: '/app/documents', event: 'documents:upload' },
        ],
      },
    ],
  },
  {
    match: '/app/members',
    title: 'Paroissiens',
    groups: [
      {
        title: 'Fiche paroissien',
        actions: [
          { id: 'members-new', icon: 'plus', label: 'Nouveau paroissien', event: 'members:new' },
          { id: 'members-search', icon: 'search', label: 'Rechercher', event: 'members:search' },
          { id: 'members-edit', icon: 'save', label: 'Modifier', event: 'members:edit' },
          { id: 'members-print', icon: 'print', label: 'Imprimer', event: 'members:print' },
        ],
      },
      {
        title: 'Actes sacramentels',
        actions: [
          { id: 'members-baptism', icon: 'water', label: 'Bapteme', event: 'members:baptism' },
          { id: 'members-marriage', icon: 'rings', label: 'Mariage', event: 'members:marriage' },
          { id: 'members-confirmation', icon: 'dove', label: 'Confirmation', event: 'members:confirmation' },
        ],
      },
    ],
  },
  {
    match: '/app/sacraments',
    title: 'Sacrements',
    groups: [
      {
        title: 'Actes',
        actions: [
          { id: 'sacraments-new', icon: 'plus', label: 'Nouvel acte', event: 'sacraments:new' },
          { id: 'sacraments-search', icon: 'search', label: 'Rechercher', event: 'sacraments:search' },
          { id: 'sacraments-baptism', icon: 'water', label: 'Bapteme', event: 'sacraments:baptism' },
          { id: 'sacraments-marriage', icon: 'rings', label: 'Mariage', event: 'sacraments:marriage' },
          { id: 'sacraments-confirmation', icon: 'dove', label: 'Confirmation', event: 'sacraments:confirmation' },
        ],
      },
      {
        title: 'Certificat',
        actions: [
          { id: 'sacraments-preview', icon: 'document', label: 'Apercu certificat', event: 'sacraments:preview-certificate' },
          { id: 'sacraments-pdf', icon: 'download', label: 'Exporter PDF', event: 'sacraments:download-certificate' },
        ],
      },
    ],
  },
  {
    match: '/app/certificates',
    title: 'Certificats',
    groups: [
      {
        title: 'Documents officiels',
        actions: [
          { id: 'certificates-search', icon: 'search', label: 'Rechercher', event: 'certificates:search' },
          { id: 'certificates-card', icon: 'certificate', label: 'Carte chretienne', event: 'certificates:create-card' },
          { id: 'certificates-certificate', icon: 'document', label: 'Creer certificat', event: 'certificates:create-certificate' },
          { id: 'certificates-pdf', icon: 'download', label: 'PDF', event: 'certificates:download' },
        ],
      },
    ],
  },
  {
    match: '/app/registers',
    title: 'Registres',
    groups: [
      {
        title: 'Registres paroissiaux',
        actions: [
          { id: 'registers-sacraments', icon: 'book', label: 'Registres sacramentels', event: 'registers:sacraments' },
          { id: 'registers-christians', icon: 'people', label: 'Registre des chretiens', event: 'registers:christians' },
          { id: 'registers-search', icon: 'search', label: 'Rechercher', event: 'registers:search' },
          { id: 'registers-print', icon: 'print', label: 'Imprimer registre', event: 'registers:print' },
          { id: 'registers-pdf', icon: 'download', label: 'Exporter PDF', event: 'registers:pdf' },
        ],
      },
    ],
  },
  {
    match: '/app/documents',
    title: 'Documents',
    groups: [
      {
        title: 'Archives',
        actions: [
          { id: 'documents-upload', icon: 'plus', label: 'Televerser', event: 'documents:upload' },
          { id: 'documents-search', icon: 'search', label: 'Rechercher', event: 'documents:search' },
          { id: 'documents-preview', icon: 'document', label: 'Apercu', event: 'documents:preview' },
          { id: 'documents-print', icon: 'print', label: 'Imprimer', event: 'documents:print' },
          { id: 'documents-download', icon: 'download', label: 'Telecharger', event: 'documents:download' },
        ],
      },
    ],
  },
  {
    match: '/app/settings',
    title: 'Parametres',
    groups: [
      {
        title: 'Configuration',
        actions: [
          { id: 'settings-save', icon: 'save', label: 'Enregistrer', event: 'settings:save' },
          { id: 'settings-print', icon: 'print', label: 'Imprimer', event: 'settings:print' },
        ],
      },
    ],
  },
];

function getRouteConfig(pathname: string) {
  return routeGroups.find((route) => pathname.startsWith(route.match)) ?? routeGroups[0];
}

function emitRibbonAction(action: RibbonAction) {
  if (!action.event) return;

  window.dispatchEvent(new CustomEvent('church:ribbon-action', {
    detail: {
      action: action.event,
    },
  }));
}

export function Ribbon() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeConfig = getRouteConfig(location.pathname);

  const handleAction = (action: RibbonAction) => {
    if (action.route && action.route !== location.pathname) {
      navigate(action.route);
      window.setTimeout(() => emitRibbonAction(action), 150);
      return;
    }

    emitRibbonAction(action);
  };

  return (
    <div className="border-b border-[#D8C8A2] bg-[#F8F3E7] shadow-sm">
      <div className="flex min-h-24 items-stretch overflow-x-auto px-4 lg:px-6">
        <div className="flex min-w-36 flex-col justify-center border-r border-[#D8C8A2] pr-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#9D7A1E]">Ruban</p>
          <p className="font-serif text-lg font-bold text-[#0F3D2E]">{routeConfig.title}</p>
        </div>

        {routeConfig.groups.map((group, groupIndex) => (
          <div key={group.title} className={`flex items-center gap-2 px-4 ${groupIndex < routeConfig.groups.length - 1 ? 'border-r border-[#D8C8A2]' : ''}`}>
            <div className="flex h-full min-w-24 flex-col justify-center pr-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9D7A1E]">{group.title}</p>
            </div>
            {group.actions.map((action) => (
              <RibbonButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                description={action.description}
                onClick={() => handleAction(action)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

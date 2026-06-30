import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type Lang = 'fr' | 'en';
type Attr = 'placeholder' | 'title' | 'aria-label';
type State = { src: string; out: string };

const attrs: Attr[] = ['placeholder', 'title', 'aria-label'];
const textState = new WeakMap<Text, State>();
const attrState = new WeakMap<Element, Partial<Record<Attr, State>>>();
const skippedTags = new Set(['CANVAS', 'CODE', 'IFRAME', 'NOSCRIPT', 'PRE', 'SCRIPT', 'STYLE', 'SVG', 'TEXTAREA']);

const en: Record<string, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DECEASED: 'Deceased',
  MALE: 'Male',
  FEMALE: 'Female',
  Actif: 'Active',
  Actifs: 'Active',
  Inactif: 'Inactive',
  Inactifs: 'Inactive',
  Decede: 'Deceased',
  Decedes: 'Deceased',
  Masculin: 'Male',
  Feminin: 'Female',
  Celibataire: 'Single',
  'Marie(e)': 'Married',
  'Veuf / Veuve': 'Widowed',
  'Divorce(e)': 'Divorced',
  Selectionner: 'Select',
  Annuler: 'Cancel',
  Fermer: 'Close',
  Effacer: 'Clear',
  OK: 'OK',
  Reinitialiser: 'Reset',
  Rechercher: 'Search',
  Modifier: 'Edit',
  Imprimer: 'Print',
  Ouvrir: 'Open',
  Enregistrer: 'Save',
  'Mettre a jour': 'Update',
  'Mettre a jour l acte': 'Update record',
  'Enregistrement...': 'Saving...',
  'Generation...': 'Generating...',
  'Televersement...': 'Uploading...',
  Precedent: 'Previous',
  Suivant: 'Next',
  Tous: 'All',
  PDF: 'PDF',
  Date: 'Date',
  Nom: 'Name',
  Prenom: 'First name',
  Code: 'Code',
  Statut: 'Status',
  Telephone: 'Phone',
  Email: 'Email',
  Adresse: 'Address',
  Ville: 'City',
  Pays: 'Country',
  Sexe: 'Gender',
  Age: 'Age',
  Groupe: 'Group',
  Lieu: 'Place',
  Officiant: 'Officiant',
  Parrain: 'Godfather',
  Marraine: 'Godmother',
  Notes: 'Notes',
  Actions: 'Actions',
  Type: 'Type',
  Fichier: 'File',
  Titre: 'Title',
  Categorie: 'Category',
  Description: 'Description',
  Taille: 'Size',
  Resultats: 'Results',
  Paroissien: 'Parishioner',
  Paroissiens: 'Parishioners',
  Chretien: 'Christian',
  Chretiens: 'Christians',
  Sacrement: 'Sacrament',
  Sacrements: 'Sacraments',
  Certificat: 'Certificate',
  Certificats: 'Certificates',
  Documents: 'Documents',
  Registres: 'Registers',
  Bapteme: 'Baptism',
  Mariage: 'Marriage',
  Confirmation: 'Confirmation',
  'Premiere communion': 'First Communion',
  'Parrain / Marraine': 'Godfather / Godmother',
  'Parrain / Sponsor 1': 'Godfather / Sponsor 1',
  'Marraine / Sponsor 2': 'Godmother / Sponsor 2',
  'Toutes categories': 'All categories',
  'Courrier / Lettre': 'Mail / Letter',
  'Proces-verbal': 'Minutes',
  Rapport: 'Report',
  Autorisation: 'Permission',
  Finance: 'Finance',
  Autre: 'Other',
  Archives: 'Archives',
  Configuration: 'Settings',
  'Tableau de bord': 'Dashboard',
  'Actions rapides': 'Quick actions',
  Ruban: 'Ribbon',
  Parametres: 'Settings',
  Deconnexion: 'Logout',
  'Nouveau paroissien': 'New parishioner',
  'Nouvel acte': 'New record',
  'Nouveau mariage': 'New marriage',
  'Certificat / carte': 'Certificate / card',
  'Ajouter document': 'Add document',
  'Fiche paroissien': 'Parishioner record',
  'Actes sacramentels': 'Sacramental records',
  Actes: 'Records',
  'Apercu certificat': 'Certificate preview',
  'Exporter PDF': 'Export PDF',
  'Documents officiels': 'Official documents',
  'Carte chretienne': 'Christian card',
  'Creer certificat': 'Create certificate',
  'Registres paroissiaux': 'Parish registers',
  'Registres sacramentels': 'Sacramental registers',
  'Registre des chretiens': 'Christian register',
  'Imprimer registre': 'Print register',
  Televerser: 'Upload',
  Apercu: 'Preview',
  Telecharger: 'Download',
  'Televerser document': 'Upload document',
  'Nouveau document': 'New document',
  'Televerser un fichier': 'Upload a file',
  'Apercu document': 'Document preview',
  'Document PDF': 'PDF document',
  'Apercu impression': 'Print preview',
  'Entree du registre': 'Register entry',
  'Dossier chretien': 'Christian file',
  'Detail de l acte': 'Record details',
  'Bureau paroissial': 'Parish office',
  'Bureau des paroissiens': 'Parishioner office',
  'Bureau des certificats': 'Certificate office',
  'Archives paroissiales': 'Parish archives',
  'Registre sacramentel': 'Sacramental register',
  'Registre paroissial': 'Parish register',
  'Registres officiels': 'Official registers',
  'Liste des paroissiens': 'Parishioner list',
  'Profil paroissien': 'Parishioner profile',
  'Aucune fiche selectionnee.': 'No record selected.',
  'Modifier la fiche': 'Edit record',
  'Nouvelle fiche': 'New record',
  'Code membre': 'Member code',
  'Generation automatique': 'Automatic generation',
  'Deuxieme prenom': 'Middle name',
  'Date de naissance': 'Date of birth',
  'Lieu de naissance': 'Place of birth',
  'Statut matrimonial': 'Marital status',
  'Nom du pere': 'Father name',
  'Nom de la mere': 'Mother name',
  Pere: 'Father',
  Mere: 'Mother',
  Reactiver: 'Reactivate',
  Desactiver: 'Deactivate',
  'Marquer decede': 'Mark deceased',
  'tapez decede': 'type deceased',
  'Paroissien selectionne': 'Selected parishioner',
  'Mode modification': 'Edit mode',
  'Annuler modification': 'Cancel edit',
  'Type de sacrement': 'Sacrament type',
  Naissance: 'Birth',
  'Nom du parrain': 'Godfather name',
  'Nom de la marraine': 'Godmother name',
  'Registres existants': 'Existing registers',
  'Tous les sacrements': 'All sacraments',
  'Tous les statuts': 'All statuses',
  'Tous statuts': 'All statuses',
  'Tous les groupes': 'All groups',
  'Age non renseigne': 'Age not provided',
  'Groupe inconnu': 'Unknown group',
  Enfants: 'Children',
  Jeunes: 'Youths',
  'Jeunes adultes': 'Young adults',
  Adultes: 'Adults',
  Aines: 'Older adults',
  '0 - 12 ans': '0 - 12 years',
  '13 - 17 ans': '13 - 17 years',
  '18 - 35 ans': '18 - 35 years',
  '36 - 59 ans': '36 - 59 years',
  '60 ans et plus': '60 years and older',
  'Activite recente': 'Recent activity',
  'Derniers paroissiens': 'Latest parishioners',
  'Registres recents': 'Recent registers',
  'Derniers sacrements': 'Latest sacraments',
  'Voir tout': 'View all',
  'A surveiller': 'Watch list',
  Attention: 'Attention',
  'Statistiques rapides': 'Quick statistics',
  Repartition: 'Distribution',
  'Age des chretiens': 'Christian ages',
  'Fiches enregistrees': 'Registered records',
  'Paroissiens actifs': 'Active parishioners',
  'Actes enregistres': 'Registered records',
  'Disponibles depuis les actes': 'Available from records',
  'Creer une fiche paroissien': 'Create a parishioner record',
  'Enregistrer un sacrement': 'Save a sacrament',
  'Generer un document officiel': 'Generate an official document',
  'Gerer les fichiers paroissiaux': 'Manage parish files',
  'Aucun paroissien recent.': 'No recent parishioner.',
  'Aucun sacrement recent.': 'No recent sacrament.',
  'Paroissiens sans date de naissance': 'Parishioners without birth date',
  'Actifs sans bapteme enregistre': 'Active parishioners without recorded baptism',
  'Paroissiens marques decedes': 'Parishioners marked deceased',
  'Selection du paroissien': 'Parishioner selection',
  'Rechercher un paroissien': 'Search parishioner',
  'Nom, code, telephone, email ou ville': 'Name, code, phone, email, or city',
  'Rechercher par nom, code, telephone, email ou ville': 'Search by name, code, phone, email, or city',
  'Rechercher acte, paroissien ou certificat': 'Search record, parishioner, or certificate',
  'Rechercher titre, fichier ou description': 'Search title, file, or description',
  'Rechercher nom, code, certificat, officiant, lieu': 'Search name, code, certificate, officiant, place',
  'Rechercher nom, code, telephone, ville': 'Search name, code, phone, city',
  'Ex: Lettre de nomination': 'Ex: Appointment letter',
  'Courte note sur le document': 'Short note about the document',
  'Selectionnez une fiche pour voir les details ou modifier le dossier.': 'Select a record to view details or edit the file.',
  'Le code membre est genere automatiquement.': 'The member code is generated automatically.',
  'Corriger les informations du paroissien selectionne.': 'Correct the selected parishioner information.',
  'Creer, rechercher et modifier les fiches des paroissiens.': 'Create, search, and edit parishioner records.',
  'Vue rapide des paroissiens, sacrements, certificats et travaux a suivre.': 'Quick view of parishioners, sacraments, certificates, and follow-up work.',
  'Televerser, consulter, imprimer et telecharger les documents importants de la paroisse.': 'Upload, view, print, and download important parish documents.',
  'PDF, images, fichiers texte, Word ou autres documents importants.': 'PDFs, images, text files, Word files, or other important documents.',
  'Selectionnez un paroissien, enregistrez un sacrement, puis gerez les actes existants.': 'Select a parishioner, record a sacrament, then manage existing records.',
  'Selectionner un chretien, puis creer une carte chretienne ou un certificat de sacrement.': 'Select a Christian, then create a Christian card or sacrament certificate.',
  'Choisir un sacrement dans le detail du chretien pour creer son certificat.': 'Choose a sacrament in the Christian details to create its certificate.',
  'Consultez les registres sacramentels et le registre des chretiens.': 'Review sacramental registers and the Christian register.',
  'Aucun paroissien trouve.': 'No parishioner found.',
  'Aucun chretien trouve.': 'No Christian found.',
  'Aucun document trouve.': 'No document found.',
  'Aucun acte sacramentel trouve.': 'No sacramental record found.',
  'Aucun acte trouve pour ces filtres.': 'No record found for these filters.',
  'Aucun chretien trouve pour ces filtres.': 'No Christian found for these filters.',
  'Chargement des paroissiens...': 'Loading parishioners...',
  'Chargement des chretiens...': 'Loading Christians...',
  'Chargement des documents...': 'Loading documents...',
  'Chargement des actes...': 'Loading records...',
  'Chargement des registres...': 'Loading registers...',
  'Chargement de tous les chretiens...': 'Loading all Christians...',
};

const fr: Record<string, string> = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  DECEASED: 'Decede',
  MALE: 'Masculin',
  FEMALE: 'Feminin',
};

function getLanguage(value?: string): Lang {
  return value?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

function dynamicTranslate(source: string, lang: Lang) {
  if (lang !== 'en') return undefined;

  if (source.startsWith('Page ') && source.includes(' sur ')) {
    const parts = source.slice(5).split(' sur ');
    if (parts.length === 2) return `Page ${parts[0]} of ${parts[1]}`;
  }

  if (source.startsWith('Total: ')) {
    return source
      .replace(' chretien', ' Christian')
      .replace(' personne', ' person')
      .replace(' document', ' document')
      .replace(' entree', ' entry');
  }

  return undefined;
}

function translateValue(value: string, lang: Lang) {
  const source = value.trim();
  if (!source) return value;

  const translated = (lang === 'en' ? en : fr)[source] ?? dynamicTranslate(source, lang);
  return translated ? value.replace(source, translated) : value;
}

function shouldSkip(element: Element) {
  return skippedTags.has(element.tagName) || Boolean(element.closest('[data-i18n-skip]')) || (element instanceof HTMLElement && element.isContentEditable);
}

function translateTextNode(node: Text, lang: Lang) {
  if (!node.parentElement || shouldSkip(node.parentElement)) return;

  const current = node.nodeValue ?? '';
  const previous = textState.get(node);
  const source = previous && current === previous.out ? previous.src : current;
  const out = translateValue(source, lang);

  if (current !== out) node.nodeValue = out;
  textState.set(node, { src: source, out });
}

function translateAttribute(element: Element, attr: Attr, lang: Lang) {
  const current = element.getAttribute(attr);
  if (!current) return;

  const state = attrState.get(element) ?? {};
  const previous = state[attr];
  const source = previous && current === previous.out ? previous.src : current;
  const out = translateValue(source, lang);

  if (current !== out) element.setAttribute(attr, out);
  state[attr] = { src: source, out };
  attrState.set(element, state);
}

function translateRoot(root: HTMLElement, lang: Lang) {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || shouldSkip(parent)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let current = walker.nextNode();
  while (current) {
    translateTextNode(current as Text, lang);
    current = walker.nextNode();
  }

  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    if (shouldSkip(element)) continue;
    for (const attr of attrs) translateAttribute(element, attr, lang);
  }
}

function translateFrames(lang: Lang) {
  for (const frame of Array.from(document.querySelectorAll('iframe'))) {
    try {
      const body = frame.contentDocument?.body;
      if (body) translateRoot(body, lang);
    } catch {
      // Browser PDF/blob frames may not expose a readable document.
    }
  }
}

export function AppLanguageBridge({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = getLanguage(i18n.language);
    let frameId = 0;

    const schedule = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        translateRoot(document.body, lang);
        translateFrames(lang);
      });
    };

    schedule();

    const observer = new MutationObserver(schedule);
    const handleLoad = (event: Event) => {
      if (event.target instanceof HTMLIFrameElement) schedule();
    };

    observer.observe(document.body, {
      attributeFilter: attrs,
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    document.addEventListener('load', handleLoad, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('load', handleLoad, true);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [i18n.language]);

  return children;
}

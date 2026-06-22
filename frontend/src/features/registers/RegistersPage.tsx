import { useEffect, useMemo, useRef, useState } from 'react';

import { CatholicIcon, type CatholicIconName } from '../../components/decorative/CatholicIcon';
import { listMembers } from '../members/members.api';
import type { Member, MemberStatus } from '../members/members.types';
import { listSacraments, listSacramentTypes } from '../sacraments/sacraments.api';
import type { Sacrament, SacramentType } from '../sacraments/sacraments.types';

const filterInputClass = 'h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]';

type RegisterMode = 'sacraments' | 'christians';
type AgeGroupKey = 'ALL' | 'CHILDREN' | 'YOUTHS' | 'YOUNG_ADULTS' | 'ADULTS' | 'OLDER_ADULTS' | 'UNKNOWN';
type MemberStatusFilter = 'ALL' | MemberStatus;

type RegisterStatistic = {
  label: string;
  count: number;
  color: string;
};

const ageGroups: Array<{ key: Exclude<AgeGroupKey, 'ALL' | 'UNKNOWN'>; label: string; range: string; color: string }> = [
  { key: 'CHILDREN', label: 'Enfants', range: '0 - 12 ans', color: '#0EA5E9' },
  { key: 'YOUTHS', label: 'Jeunes', range: '13 - 17 ans', color: '#7C3AED' },
  { key: 'YOUNG_ADULTS', label: 'Jeunes adultes', range: '18 - 35 ans', color: '#16A34A' },
  { key: 'ADULTS', label: 'Adultes', range: '36 - 59 ans', color: '#D97706' },
  { key: 'OLDER_ADULTS', label: 'Aines', range: '60 ans et plus', color: '#B91C1C' },
];

const statusLabels: Record<MemberStatusFilter, string> = {
  ALL: 'Tous les statuts',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  DECEASED: 'Decede',
};

function getDateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function formatDate(value?: string | null) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) {
    return '-';
  }

  const [year, month, day] = dateOnly.split('-');

  if (!year || !month || !day) {
    return dateOnly;
  }

  return `${day}/${month}/${year}`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSearchableSacramentText(record: Sacrament) {
  return [
    record.memberFirstName,
    record.memberLastName,
    record.memberCode,
    record.certificateNumber,
    record.sacramentTypeName,
    record.place,
    record.officiant,
    record.sponsor1Name,
    record.sponsor2Name,
    record.notes,
  ].filter(Boolean).join(' ').toLowerCase();
}

function getSearchableMemberText(member: Member) {
  return [
    member.firstName,
    member.lastName,
    member.middleName,
    member.memberCode,
    member.phone,
    member.email,
    member.city,
    member.country,
    member.address,
    member.fatherName,
    member.motherName,
  ].filter(Boolean).join(' ').toLowerCase();
}

function getSacramentIcon(type?: SacramentType): CatholicIconName {
  const value = `${type?.code ?? ''} ${type?.name ?? ''}`.toLowerCase();

  if (value.includes('bapt')) return 'water';
  if (value.includes('mari')) return 'rings';
  if (value.includes('confirm')) return 'dove';
  if (value.includes('commun')) return 'chalice';

  return 'book';
}

function isSacramentWithinDateRange(record: Sacrament, startDate: string, endDate: string) {
  const recordDate = getDateOnly(record.sacramentDate);

  if (!recordDate) return false;
  if (startDate && recordDate < startDate) return false;
  if (endDate && recordDate > endDate) return false;

  return true;
}

function getAge(dateOfBirth?: string | null) {
  const dateOnly = getDateOnly(dateOfBirth);

  if (!dateOnly) return null;

  const birthDate = new Date(`${dateOnly}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getMemberAgeGroup(member: Member): AgeGroupKey {
  const age = getAge(member.dateOfBirth);

  if (age === null) return 'UNKNOWN';
  if (age <= 12) return 'CHILDREN';
  if (age <= 17) return 'YOUTHS';
  if (age <= 35) return 'YOUNG_ADULTS';
  if (age <= 59) return 'ADULTS';

  return 'OLDER_ADULTS';
}

function getAgeGroupLabel(groupKey: AgeGroupKey) {
  if (groupKey === 'ALL') return 'Tous les groupes';
  if (groupKey === 'UNKNOWN') return 'Age non renseigne';

  return ageGroups.find((group) => group.key === groupKey)?.label ?? 'Groupe inconnu';
}

function getMemberPeriodDate(member: Member) {
  return getDateOnly(member.createdAt);
}

function isMemberWithinPeriod(member: Member, year: string, startDate: string, endDate: string) {
  const memberDate = getMemberPeriodDate(member);
  const cleanYear = year.trim();

  if (!memberDate) return !cleanYear && !startDate && !endDate;
  if (cleanYear && !memberDate.startsWith(cleanYear)) return false;
  if (startDate && memberDate < startDate) return false;
  if (endDate && memberDate > endDate) return false;

  return true;
}

function buildFilterText(items: string[]) {
  return items.filter(Boolean).join(' | ');
}

function getSacramentStatistics(records: Sacrament[]): RegisterStatistic[] {
  return [
    {
      label: 'Bapteme',
      color: '#0EA5E9',
      count: records.filter((record) => record.sacramentTypeName.toLowerCase().includes('bapt')).length,
    },
    {
      label: 'Confirmation',
      color: '#7C3AED',
      count: records.filter((record) => record.sacramentTypeName.toLowerCase().includes('confirm')).length,
    },
    {
      label: 'Mariage',
      color: '#D97706',
      count: records.filter((record) => record.sacramentTypeName.toLowerCase().includes('mari')).length,
    },
    {
      label: 'Premiere communion',
      color: '#16A34A',
      count: records.filter((record) => record.sacramentTypeName.toLowerCase().includes('commun')).length,
    },
  ];
}

function getChristianStatistics(members: Member[]): RegisterStatistic[] {
  return ageGroups.map((group) => ({
    label: group.label,
    count: members.filter((member) => getMemberAgeGroup(member) === group.key).length,
    color: group.color,
  }));
}

function buildStatisticsChartHtml(title: string, subtitle: string, statistics: RegisterStatistic[]) {
  const maxCount = Math.max(...statistics.map((statistic) => statistic.count), 1);
  const totalCount = statistics.reduce((sum, statistic) => sum + statistic.count, 0);
  const rows = statistics.map((statistic) => {
    const width = Math.max((statistic.count / maxCount) * 100, statistic.count > 0 ? 8 : 0);
    const percentage = totalCount > 0 ? Math.round((statistic.count / totalCount) * 100) : 0;

    return `
      <div class="chart-row">
        <div class="chart-label"><span class="chart-dot" style="background: ${statistic.color};"></span><strong>${escapeHtml(statistic.label)}</strong></div>
        <div class="chart-track"><div class="chart-bar" style="width: ${width}%; background: ${statistic.color};"></div></div>
        <div class="chart-count">${statistic.count} <span>${percentage}%</span></div>
      </div>
    `;
  }).join('');

  return `
    <section class="stats-section">
      <div class="stats-header">
        <div><p>${escapeHtml(subtitle)}</p><h2>${escapeHtml(title)}</h2></div>
        <div class="stats-total">${totalCount} total</div>
      </div>
      <div class="chart-box">${rows}</div>
    </section>
  `;
}

function getPrintDocumentStyles() {
  return `
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1f2933; background: #ffffff; font-family: Arial, sans-serif; font-size: 11px; }
    .page { width: 100%; min-height: 100vh; border: 2px solid #0f3d2e; padding: 10mm; background: #fffdf8; }
    .header { display: grid; grid-template-columns: 70px minmax(0, 1fr) 70px; align-items: center; gap: 14px; border-bottom: 2px solid #d4af37; padding-bottom: 8px; }
    .mark { display: flex; align-items: center; justify-content: center; width: 62px; height: 62px; border: 2px solid #d4af37; border-radius: 50%; color: #0f3d2e; font-family: Georgia, serif; font-size: 18px; font-weight: 700; }
    .title { text-align: center; }
    .title p { margin: 0; color: #9d7a1e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .title h1 { margin: 4px 0 0; color: #0f3d2e; font-family: Georgia, serif; font-size: 25px; text-transform: uppercase; }
    .meta { margin-top: 8px; display: flex; justify-content: space-between; gap: 12px; color: #667085; font-size: 10px; font-weight: 700; }
    .stats-section { margin-top: 10px; border: 1px solid #d8c8a2; background: #ffffff; padding: 9px 10px; }
    .stats-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 8px; }
    .stats-header p { margin: 0; color: #9d7a1e; font-size: 9px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; }
    .stats-header h2 { margin: 2px 0 0; color: #0f3d2e; font-family: Georgia, serif; font-size: 17px; }
    .stats-total { border: 1px solid #d4af37; color: #0f3d2e; padding: 5px 9px; font-weight: 700; background: #fff9ee; }
    .chart-box { display: grid; gap: 6px; }
    .chart-row { display: grid; grid-template-columns: 150px minmax(0, 1fr) 76px; align-items: center; gap: 10px; }
    .chart-label { display: flex; align-items: center; gap: 7px; color: #1f2933; font-size: 10px; }
    .chart-dot { width: 9px; height: 9px; border-radius: 999px; flex: 0 0 auto; }
    .chart-track { height: 13px; overflow: hidden; border-radius: 999px; background: #efe7d6; border: 1px solid #e5ded0; }
    .chart-bar { height: 100%; border-radius: 999px; }
    .chart-count { text-align: right; color: #0f3d2e; font-size: 10px; font-weight: 700; }
    .chart-count span { color: #667085; font-size: 9px; }
    table { width: 100%; margin-top: 10px; border-collapse: collapse; table-layout: fixed; }
    th { background: #0f3d2e; color: #ffffff; border: 1px solid #0f3d2e; padding: 6px 5px; text-align: left; font-size: 9px; text-transform: uppercase; }
    td { border: 1px solid #d8c8a2; padding: 5px; vertical-align: top; overflow-wrap: anywhere; }
    td span { display: block; margin-top: 2px; color: #667085; font-size: 9px; font-weight: 700; }
    tr:nth-child(even) td { background: #fff9ee; }
    .empty { margin-top: 20px; border: 1px dashed #d8c8a2; padding: 18px; text-align: center; color: #667085; font-weight: 700; }
    .signature-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18mm; margin-top: 16mm; padding: 0 16mm; text-align: center; font-size: 10px; font-weight: 700; color: #0f3d2e; }
    .signature-line { border-top: 1px solid #1f2933; padding-top: 6px; }
    @media print { body { background: #ffffff; } .page { border: none; padding: 0; } }
  `;
}

function buildSacramentRegisterPrintHtml(params: {
  registerName: string;
  records: Sacrament[];
  startDate: string;
  endDate: string;
  searchTerm: string;
  showStatistics: boolean;
}) {
  const generatedAt = formatDate(new Date().toISOString());
  const filterText = buildFilterText([
    `Registre: ${params.registerName}`,
    params.startDate ? `Du: ${formatDate(params.startDate)}` : '',
    params.endDate ? `Au: ${formatDate(params.endDate)}` : '',
    params.searchTerm.trim() ? `Recherche: ${params.searchTerm.trim()}` : '',
    `Total: ${params.records.length} entree${params.records.length > 1 ? 's' : ''}`,
  ]);
  const statisticsHtml = params.showStatistics ? buildStatisticsChartHtml('Resume par registre', 'Statistiques des sacrements', getSacramentStatistics(params.records)) : '';
  const rows = params.records.map((record, index) => `
    <tr>
      <td>${String(index + 1).padStart(3, '0')}</td>
      <td>${escapeHtml(formatDate(record.sacramentDate))}</td>
      <td><strong>${escapeHtml(`${record.memberFirstName} ${record.memberLastName}`)}</strong><span>${escapeHtml(record.memberCode)}</span></td>
      <td>${escapeHtml(record.sacramentTypeName)}</td>
      <td>${escapeHtml(record.certificateNumber)}</td>
      <td>${escapeHtml(record.place || '-')}</td>
      <td>${escapeHtml(record.officiant || '-')}</td>
      <td>${escapeHtml(record.sponsor1Name || '-')}<br />${escapeHtml(record.sponsor2Name || '-')}</td>
      <td>${escapeHtml(record.notes || '-')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /><title>${escapeHtml(params.registerName)}</title><style>${getPrintDocumentStyles()}</style></head><body>
    <main class="page">
      <header class="header"><div class="mark">IHS</div><div class="title"><p>Registre paroissial officiel</p><h1>${escapeHtml(params.registerName)}</h1></div><div class="mark">+</div></header>
      <section class="meta"><span>${escapeHtml(filterText)}</span><span>Genere le ${escapeHtml(generatedAt)}</span></section>
      ${statisticsHtml}
      ${params.records.length > 0 ? `<table><thead><tr><th style="width: 4%;">No</th><th style="width: 8%;">Date</th><th style="width: 16%;">Paroissien</th><th style="width: 11%;">Type</th><th style="width: 13%;">Certificat</th><th style="width: 12%;">Lieu</th><th style="width: 12%;">Officiant</th><th style="width: 13%;">Parrain / Marraine</th><th style="width: 11%;">Notes</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">Aucune entree trouvee pour ces filtres.</div>'}
      <section class="signature-row"><div class="signature-line">Secretaire paroissial</div><div class="signature-line">Cure / Responsable</div><div class="signature-line">Cachet de la paroisse</div></section>
    </main>
  </body></html>`;
}

function buildChristianRegisterPrintHtml(params: {
  ageGroupName: string;
  members: Member[];
  year: string;
  startDate: string;
  endDate: string;
  status: MemberStatusFilter;
  searchTerm: string;
}) {
  const generatedAt = formatDate(new Date().toISOString());
  const filterText = buildFilterText([
    `Groupe: ${params.ageGroupName}`,
    params.year.trim() ? `Annee: ${params.year.trim()}` : '',
    params.startDate ? `Du: ${formatDate(params.startDate)}` : '',
    params.endDate ? `Au: ${formatDate(params.endDate)}` : '',
    `Statut: ${statusLabels[params.status]}`,
    params.searchTerm.trim() ? `Recherche: ${params.searchTerm.trim()}` : '',
    `Total: ${params.members.length} personne${params.members.length > 1 ? 's' : ''}`,
  ]);
  const statisticsHtml = buildStatisticsChartHtml('Resume par groupe d age', 'Statistiques des chretiens', getChristianStatistics(params.members));
  const rows = params.members.map((member, index) => {
    const age = getAge(member.dateOfBirth);

    return `
      <tr>
        <td>${String(index + 1).padStart(3, '0')}</td>
        <td>${escapeHtml(member.memberCode)}</td>
        <td><strong>${escapeHtml(`${member.firstName} ${member.lastName}`)}</strong><span>${escapeHtml(member.middleName || '')}</span></td>
        <td>${escapeHtml(age === null ? '-' : age)}</td>
        <td>${escapeHtml(getAgeGroupLabel(getMemberAgeGroup(member)))}</td>
        <td>${escapeHtml(member.gender === 'MALE' ? 'M' : member.gender === 'FEMALE' ? 'F' : '-')}</td>
        <td>${escapeHtml(member.phone || '-')}</td>
        <td>${escapeHtml(member.city || '-')}</td>
        <td>${escapeHtml(statusLabels[member.status])}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8" /><title>Registre des chretiens</title><style>${getPrintDocumentStyles()}</style></head><body>
    <main class="page">
      <header class="header"><div class="mark">IHS</div><div class="title"><p>Registre paroissial officiel</p><h1>Registre des chretiens</h1></div><div class="mark">+</div></header>
      <section class="meta"><span>${escapeHtml(filterText)}</span><span>Genere le ${escapeHtml(generatedAt)}</span></section>
      ${statisticsHtml}
      ${params.members.length > 0 ? `<table><thead><tr><th style="width: 4%;">No</th><th style="width: 10%;">Code</th><th style="width: 20%;">Nom</th><th style="width: 6%;">Age</th><th style="width: 14%;">Groupe</th><th style="width: 6%;">Sexe</th><th style="width: 14%;">Telephone</th><th style="width: 13%;">Ville</th><th style="width: 13%;">Statut</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">Aucun chretien trouve pour ces filtres.</div>'}
      <section class="signature-row"><div class="signature-line">Secretaire paroissial</div><div class="signature-line">Cure / Responsable</div><div class="signature-line">Cachet de la paroisse</div></section>
    </main>
  </body></html>`;
}

export function RegistersPage() {
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [registerMode, setRegisterMode] = useState<RegisterMode>('sacraments');
  const [sacramentTypes, setSacramentTypes] = useState<SacramentType[]>([]);
  const [records, setRecords] = useState<Sacrament[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [christianSearchTerm, setChristianSearchTerm] = useState('');
  const [christianYear, setChristianYear] = useState('');
  const [christianStartDate, setChristianStartDate] = useState('');
  const [christianEndDate, setChristianEndDate] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupKey>('ALL');
  const [selectedMemberStatus, setSelectedMemberStatus] = useState<MemberStatusFilter>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<Sacrament | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [registerPreviewHtml, setRegisterPreviewHtml] = useState('');
  const [isRegisterPreviewOpen, setIsRegisterPreviewOpen] = useState(false);
  const [isSacramentLoading, setIsSacramentLoading] = useState(false);
  const [isChristianLoading, setIsChristianLoading] = useState(false);
  const [sacramentErrorMessage, setSacramentErrorMessage] = useState('');
  const [christianErrorMessage, setChristianErrorMessage] = useState('');

  useEffect(() => {
    async function loadSacramentRegisters() {
      try {
        setIsSacramentLoading(true);
        setSacramentErrorMessage('');

        const [typesResponse, recordsResponse] = await Promise.all([
          listSacramentTypes(),
          listSacraments({ page: 1, limit: 100 }),
        ]);

        setSacramentTypes(typesResponse.data);
        setRecords(recordsResponse.data);
      } catch (error) {
        setSacramentErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les registres sacramentels.');
        setSacramentTypes([]);
        setRecords([]);
      } finally {
        setIsSacramentLoading(false);
      }
    }

    loadSacramentRegisters();
  }, []);

  useEffect(() => {
    if (registerMode !== 'christians' || members.length > 0 || isChristianLoading) return;

    async function loadChristianRegisters() {
      try {
        setIsChristianLoading(true);
        setChristianErrorMessage('');

        const response = await listMembers({ page: 1, limit: 100 });
        setMembers(response.data);
      } catch (error) {
        setChristianErrorMessage(error instanceof Error ? error.message : 'Impossible de charger le registre des chretiens.');
        setMembers([]);
      } finally {
        setIsChristianLoading(false);
      }
    }

    loadChristianRegisters();
  }, [isChristianLoading, members.length, registerMode]);

  const typeCounts = useMemo(() => {
    return sacramentTypes.map((type) => ({
      type,
      count: records.filter((record) => record.sacramentTypeId === type.id).length,
    }));
  }, [records, sacramentTypes]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return records
      .filter((record) => !selectedTypeId || String(record.sacramentTypeId) === selectedTypeId)
      .filter((record) => isSacramentWithinDateRange(record, startDate, endDate))
      .filter((record) => !search || getSearchableSacramentText(record).includes(search))
      .sort((first, second) => getDateOnly(second.sacramentDate).localeCompare(getDateOnly(first.sacramentDate)));
  }, [endDate, records, searchTerm, selectedTypeId, startDate]);

  const filteredMembers = useMemo(() => {
    const search = christianSearchTerm.trim().toLowerCase();

    return members
      .filter((member) => selectedAgeGroup === 'ALL' || getMemberAgeGroup(member) === selectedAgeGroup)
      .filter((member) => selectedMemberStatus === 'ALL' || member.status === selectedMemberStatus)
      .filter((member) => isMemberWithinPeriod(member, christianYear, christianStartDate, christianEndDate))
      .filter((member) => !search || getSearchableMemberText(member).includes(search))
      .sort((first, second) => `${first.lastName} ${first.firstName}`.localeCompare(`${second.lastName} ${second.firstName}`));
  }, [christianEndDate, christianSearchTerm, christianStartDate, christianYear, members, selectedAgeGroup, selectedMemberStatus]);

  const currentYear = String(new Date().getFullYear());
  const recordsThisYear = records.filter((record) => getDateOnly(record.sacramentDate).startsWith(currentYear)).length;
  const membersThisYear = members.filter((member) => getMemberPeriodDate(member).startsWith(currentYear)).length;
  const activeRegisterName = selectedTypeId ? sacramentTypes.find((type) => String(type.id) === selectedTypeId)?.name ?? 'Registre selectionne' : 'Tous les registres';
  const activeAgeGroupName = getAgeGroupLabel(selectedAgeGroup);

  const handleResetSacramentFilters = () => {
    setSelectedTypeId('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const handleResetChristianFilters = () => {
    setSelectedAgeGroup('ALL');
    setSelectedMemberStatus('ALL');
    setChristianSearchTerm('');
    setChristianYear('');
    setChristianStartDate('');
    setChristianEndDate('');
  };

  const handleOpenRegisterPreview = () => {
    if (registerMode === 'christians') {
      setRegisterPreviewHtml(buildChristianRegisterPrintHtml({
        ageGroupName: activeAgeGroupName,
        members: filteredMembers,
        year: christianYear,
        startDate: christianStartDate,
        endDate: christianEndDate,
        status: selectedMemberStatus,
        searchTerm: christianSearchTerm,
      }));
      setIsRegisterPreviewOpen(true);
      return;
    }

    setRegisterPreviewHtml(buildSacramentRegisterPrintHtml({
      registerName: activeRegisterName,
      records: filteredRecords,
      startDate,
      endDate,
      searchTerm,
      showStatistics: !selectedTypeId,
    }));
    setIsRegisterPreviewOpen(true);
  };

  const handleCloseRegisterPreview = () => {
    setIsRegisterPreviewOpen(false);
    setRegisterPreviewHtml('');
  };

  const handlePrintRegisterPreview = () => {
    printFrameRef.current?.contentWindow?.focus();
    printFrameRef.current?.contentWindow?.print();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
              <CatholicIcon name="book" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Registres officiels</p>
              <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Registres paroissiaux</h2>
              <p className="text-[#667085]">Consultez les registres sacramentels et le registre des chretiens.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenRegisterPreview}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]"
            >
              <CatholicIcon name="print" className="h-4 w-4" />
              Imprimer registre
            </button>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white opacity-50"
              title="Export PDF du registre sera ajoute apres validation de cette page."
            >
              <CatholicIcon name="download" className="h-4 w-4" />
              Export PDF plus tard
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E5DED0] pt-4">
          <button
            type="button"
            onClick={() => setRegisterMode('sacraments')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${registerMode === 'sacraments' ? 'bg-[#0F3D2E] text-white' : 'border border-[#D8C8A2] bg-white text-[#0F3D2E] hover:bg-[#FFF9EE]'}`}
          >
            <CatholicIcon name="chalice" className="h-4 w-4" />
            Registres sacramentels
          </button>
          <button
            type="button"
            onClick={() => setRegisterMode('christians')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${registerMode === 'christians' ? 'bg-[#0F3D2E] text-white' : 'border border-[#D8C8A2] bg-white text-[#0F3D2E] hover:bg-[#FFF9EE]'}`}
          >
            <CatholicIcon name="people" className="h-4 w-4" />
            Registre des chretiens
          </button>
        </div>
      </section>

      {registerMode === 'sacraments' && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Total actes</p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#0F3D2E]">{records.length}</p>
              <p className="mt-1 text-sm font-semibold text-[#667085]">Actes charges dans le registre</p>
            </div>
            <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Annee courante</p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#0F3D2E]">{recordsThisYear}</p>
              <p className="mt-1 text-sm font-semibold text-[#667085]">Actes enregistres en {currentYear}</p>
            </div>
            <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Affichage actuel</p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#0F3D2E]">{filteredRecords.length}</p>
              <p className="mt-1 text-sm font-semibold text-[#667085]">Resultats apres filtres</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Choisir un registre</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{activeRegisterName}</h3>
              </div>
              {isSacramentLoading && <span className="text-sm font-semibold text-[#667085]">Chargement des registres...</span>}
            </div>

            {sacramentErrorMessage && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold">{sacramentErrorMessage}</p>
                <button type="button" onClick={() => setSacramentErrorMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <button
                type="button"
                onClick={() => setSelectedTypeId('')}
                className={`rounded-2xl border p-4 text-left transition ${!selectedTypeId ? 'border-[#0F3D2E] bg-[#F4E8C8]' : 'border-[#E5DED0] bg-[#FFFDF8] hover:bg-[#FFF9EE]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F3D2E]"><CatholicIcon name="book" className="h-5 w-5" /></div>
                  <div><p className="text-sm font-bold text-[#0F3D2E]">Tous</p><p className="text-xs font-semibold text-[#667085]">{records.length} actes</p></div>
                </div>
              </button>

              {typeCounts.map(({ type, count }) => {
                const isSelected = selectedTypeId === String(type.id);

                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => setSelectedTypeId(String(type.id))}
                    className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-[#0F3D2E] bg-[#F4E8C8]' : 'border-[#E5DED0] bg-[#FFFDF8] hover:bg-[#FFF9EE]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F3D2E]"><CatholicIcon name={getSacramentIcon(type)} className="h-5 w-5" /></div>
                      <div><p className="text-sm font-bold text-[#0F3D2E]">{type.name}</p><p className="text-xs font-semibold text-[#667085]">{count} actes</p></div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
                <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher nom, code, certificat, officiant, lieu" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]" />
              </label>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={filterInputClass} aria-label="Date debut" />
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={filterInputClass} aria-label="Date fin" />
              <button type="button" onClick={handleResetSacramentFilters} className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Reinitialiser</button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Table du registre</p><h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{activeRegisterName}</h3></div>
              <p className="text-sm font-semibold text-[#667085]">{filteredRecords.length} entree{filteredRecords.length > 1 ? 's' : ''} affichee{filteredRecords.length > 1 ? 's' : ''}</p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Paroissien</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Certificat</th><th className="px-4 py-3">Lieu</th><th className="px-4 py-3">Officiant</th><th className="px-4 py-3">Parrain / Marraine</th></tr></thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} onClick={() => setSelectedRecord(record)} className="cursor-pointer bg-white transition hover:bg-[#FFF9EE]">
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">{String(index + 1).padStart(3, '0')}</td>
                      <td className="px-4 py-3 font-semibold text-[#344054]">{formatDate(record.sacramentDate)}</td>
                      <td className="px-4 py-3 font-semibold text-[#1F2933]">{record.memberFirstName} {record.memberLastName}<span className="block text-xs font-bold text-[#667085]">{record.memberCode}</span></td>
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.place || '-'}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.officiant || '-'}</td>
                      <td className="px-4 py-3 text-[#667085]"><span className="block">{record.sponsor1Name || '-'}</span><span className="block text-xs">{record.sponsor2Name || '-'}</span></td>
                    </tr>
                  ))}
                  {!isSacramentLoading && filteredRecords.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun acte trouve pour ces filtres.</td></tr>}
                  {isSacramentLoading && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Chargement des registres...</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {registerMode === 'christians' && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Total chretiens</p><p className="mt-2 font-serif text-3xl font-bold text-[#0F3D2E]">{members.length}</p><p className="mt-1 text-sm font-semibold text-[#667085]">Paroissiens charges</p></div>
            <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Inscrits cette annee</p><p className="mt-2 font-serif text-3xl font-bold text-[#0F3D2E]">{membersThisYear}</p><p className="mt-1 text-sm font-semibold text-[#667085]">Dossiers crees en {currentYear}</p></div>
            <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Affichage actuel</p><p className="mt-2 font-serif text-3xl font-bold text-[#0F3D2E]">{filteredMembers.length}</p><p className="mt-1 text-sm font-semibold text-[#667085]">Resultats apres filtres</p></div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Registre des chretiens</p><h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{activeAgeGroupName}</h3></div>
              {isChristianLoading && <span className="text-sm font-semibold text-[#667085]">Chargement des chretiens...</span>}
            </div>

            {christianErrorMessage && (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold">{christianErrorMessage}</p>
                <button type="button" onClick={() => setChristianErrorMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <button type="button" onClick={() => setSelectedAgeGroup('ALL')} className={`rounded-2xl border p-4 text-left transition ${selectedAgeGroup === 'ALL' ? 'border-[#0F3D2E] bg-[#F4E8C8]' : 'border-[#E5DED0] bg-[#FFFDF8] hover:bg-[#FFF9EE]'}`}>
                <p className="text-sm font-bold text-[#0F3D2E]">Tous</p><p className="text-xs font-semibold text-[#667085]">{members.length} chretiens</p>
              </button>
              {ageGroups.map((group) => {
                const count = members.filter((member) => getMemberAgeGroup(member) === group.key).length;
                const isSelected = selectedAgeGroup === group.key;

                return (
                  <button type="button" key={group.key} onClick={() => setSelectedAgeGroup(group.key)} className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-[#0F3D2E] bg-[#F4E8C8]' : 'border-[#E5DED0] bg-[#FFFDF8] hover:bg-[#FFF9EE]'}`}>
                    <p className="text-sm font-bold text-[#0F3D2E]">{group.label}</p><p className="text-xs font-semibold text-[#667085]">{group.range}</p><p className="mt-1 text-xs font-bold text-[#9D7A1E]">{count} personne{count > 1 ? 's' : ''}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_130px_170px_170px_170px_auto]">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
                <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
                <input value={christianSearchTerm} onChange={(event) => setChristianSearchTerm(event.target.value)} placeholder="Rechercher nom, code, telephone, ville" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]" />
              </label>
              <input type="text" inputMode="numeric" maxLength={4} value={christianYear} onChange={(event) => setChristianYear(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Annee" className={filterInputClass} aria-label="Annee" />
              <input type="date" value={christianStartDate} onChange={(event) => setChristianStartDate(event.target.value)} className={filterInputClass} aria-label="Date debut" />
              <input type="date" value={christianEndDate} onChange={(event) => setChristianEndDate(event.target.value)} className={filterInputClass} aria-label="Date fin" />
              <select value={selectedMemberStatus} onChange={(event) => setSelectedMemberStatus(event.target.value as MemberStatusFilter)} className={filterInputClass}>
                <option value="ALL">Tous statuts</option><option value="ACTIVE">Actif</option><option value="INACTIVE">Inactif</option><option value="DECEASED">Decede</option>
              </select>
              <button type="button" onClick={handleResetChristianFilters} className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Reinitialiser</button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Table du registre</p><h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Registre des chretiens</h3></div><p className="text-sm font-semibold text-[#667085]">{filteredMembers.length} personne{filteredMembers.length > 1 ? 's' : ''} affichee{filteredMembers.length > 1 ? 's' : ''}</p></div>
            <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]"><tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Age</th><th className="px-4 py-3">Groupe</th><th className="px-4 py-3">Sexe</th><th className="px-4 py-3">Telephone</th><th className="px-4 py-3">Ville</th><th className="px-4 py-3">Statut</th></tr></thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {filteredMembers.map((member, index) => {
                    const age = getAge(member.dateOfBirth);

                    return (
                      <tr key={member.id} onClick={() => setSelectedMember(member)} className="cursor-pointer bg-white transition hover:bg-[#FFF9EE]">
                        <td className="px-4 py-3 font-bold text-[#0F3D2E]">{String(index + 1).padStart(3, '0')}</td><td className="px-4 py-3 font-semibold text-[#344054]">{member.memberCode}</td><td className="px-4 py-3 font-semibold text-[#1F2933]">{member.firstName} {member.lastName}<span className="block text-xs font-bold text-[#667085]">{member.middleName || '-'}</span></td><td className="px-4 py-3 text-[#667085]">{age ?? '-'}</td><td className="px-4 py-3 font-bold text-[#0F3D2E]">{getAgeGroupLabel(getMemberAgeGroup(member))}</td><td className="px-4 py-3 text-[#667085]">{member.gender === 'MALE' ? 'M' : member.gender === 'FEMALE' ? 'F' : '-'}</td><td className="px-4 py-3 text-[#667085]">{member.phone || '-'}</td><td className="px-4 py-3 text-[#667085]">{member.city || '-'}</td><td className="px-4 py-3 text-[#667085]">{statusLabels[member.status]}</td>
                      </tr>
                    );
                  })}
                  {!isChristianLoading && filteredMembers.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun chretien trouve pour ces filtres.</td></tr>}
                  {isChristianLoading && <tr><td colSpan={9} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Chargement des chretiens...</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isRegisterPreviewOpen && registerPreviewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#D8C8A2] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4">
              <div><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Apercu impression</p><h3 className="font-serif text-xl font-bold text-[#0F3D2E]">{registerMode === 'christians' ? 'Registre des chretiens' : activeRegisterName}</h3></div>
              <div className="flex gap-2"><button type="button" onClick={handlePrintRegisterPreview} className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Imprimer</button><button type="button" onClick={handleCloseRegisterPreview} className="rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white hover:bg-[#145C43]">Fermer</button></div>
            </div>
            <iframe ref={printFrameRef} title="Apercu impression registre" srcDoc={registerPreviewHtml} className="h-full w-full bg-[#EFE7D6]" />
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="dialog" aria-modal="true">
          <aside className="h-full w-full max-w-md overflow-auto border-l border-[#D8C8A2] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Entree du registre</p><h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{selectedRecord.sacramentTypeName}</h3></div><button type="button" onClick={() => setSelectedRecord(null)} className="rounded-lg border border-[#D8C8A2] px-3 py-1.5 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Fermer</button></div>
            <div className="mt-6 space-y-3 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm"><p><span className="font-bold text-[#9D7A1E]">Paroissien:</span> {selectedRecord.memberFirstName} {selectedRecord.memberLastName}</p><p><span className="font-bold text-[#9D7A1E]">Code:</span> {selectedRecord.memberCode}</p><p><span className="font-bold text-[#9D7A1E]">Certificat:</span> {selectedRecord.certificateNumber}</p><p><span className="font-bold text-[#9D7A1E]">Date:</span> {formatDate(selectedRecord.sacramentDate)}</p><p><span className="font-bold text-[#9D7A1E]">Lieu:</span> {selectedRecord.place || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Officiant:</span> {selectedRecord.officiant || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Parrain:</span> {selectedRecord.sponsor1Name || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Marraine:</span> {selectedRecord.sponsor2Name || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Notes:</span> {selectedRecord.notes || '-'}</p></div>
            <div className="mt-5 rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] p-4 text-sm font-semibold text-[#667085]">La modification et les certificats se font dans la page Sacrements. Cette page est reservee a la consultation officielle des registres.</div>
          </aside>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="dialog" aria-modal="true">
          <aside className="h-full w-full max-w-md overflow-auto border-l border-[#D8C8A2] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Dossier chretien</p><h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{selectedMember.firstName} {selectedMember.lastName}</h3></div><button type="button" onClick={() => setSelectedMember(null)} className="rounded-lg border border-[#D8C8A2] px-3 py-1.5 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Fermer</button></div>
            <div className="mt-6 space-y-3 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm"><p><span className="font-bold text-[#9D7A1E]">Code:</span> {selectedMember.memberCode}</p><p><span className="font-bold text-[#9D7A1E]">Age:</span> {getAge(selectedMember.dateOfBirth) ?? '-'}</p><p><span className="font-bold text-[#9D7A1E]">Groupe:</span> {getAgeGroupLabel(getMemberAgeGroup(selectedMember))}</p><p><span className="font-bold text-[#9D7A1E]">Date naissance:</span> {formatDate(selectedMember.dateOfBirth)}</p><p><span className="font-bold text-[#9D7A1E]">Lieu naissance:</span> {selectedMember.birthPlace || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Sexe:</span> {selectedMember.gender === 'MALE' ? 'Masculin' : selectedMember.gender === 'FEMALE' ? 'Feminin' : '-'}</p><p><span className="font-bold text-[#9D7A1E]">Telephone:</span> {selectedMember.phone || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Ville:</span> {selectedMember.city || '-'}</p><p><span className="font-bold text-[#9D7A1E]">Statut:</span> {statusLabels[selectedMember.status]}</p></div>
            <div className="mt-5 rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] p-4 text-sm font-semibold text-[#667085]">La modification du dossier chretien se fait dans la page Paroissiens. Cette section sert a consulter et imprimer les registres.</div>
          </aside>
        </div>
      )}
    </div>
  );
}

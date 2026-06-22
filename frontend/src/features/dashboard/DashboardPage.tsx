import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { listAllMembers } from '../members/members.api';
import type { Member } from '../members/members.types';
import { listSacraments } from '../sacraments/sacraments.api';
import type { Sacrament } from '../sacraments/sacraments.types';

const sacramentPageSize = 100;

function getDateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function formatDate(value?: string | null) {
  const dateOnly = getDateOnly(value);

  if (!dateOnly) return '-';

  const [year, month, day] = dateOnly.split('-');

  if (!year || !month || !day) return dateOnly;

  return `${day}/${month}/${year}`;
}

function getMemberName(member: Member) {
  return `${member.firstName} ${member.lastName}`.trim();
}

function getSacramentMemberName(record: Sacrament) {
  return `${record.memberFirstName} ${record.memberLastName}`.trim();
}

async function listAllSacramentRecords() {
  const records: Sacrament[] = [];
  let page = 1;
  let keepLoading = true;

  while (keepLoading) {
    const response = await listSacraments({ page, limit: sacramentPageSize });
    records.push(...response.data);
    keepLoading = response.data.length === sacramentPageSize;
    page += 1;
  }

  return records;
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

function getAgeGroupLabel(member: Member) {
  const age = getAge(member.dateOfBirth);

  if (age === null) return 'Age non renseigne';
  if (age <= 12) return 'Enfants';
  if (age <= 17) return 'Jeunes';
  if (age <= 35) return 'Jeunes adultes';
  if (age <= 59) return 'Adultes';

  return 'Aines';
}

function isBaptismRecord(record: Sacrament) {
  return record.sacramentTypeName.toLowerCase().includes('bapt');
}

function countSacramentsByName(records: Sacrament[], keyword: string) {
  return records.filter((record) => record.sacramentTypeName.toLowerCase().includes(keyword)).length;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [sacraments, setSacraments] = useState<Sacrament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [memberRecords, sacramentRecords] = await Promise.all([
          listAllMembers(),
          listAllSacramentRecords(),
        ]);

        setMembers(memberRecords);
        setSacraments(sacramentRecords);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.');
        setMembers([]);
        setSacraments([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const currentYear = String(new Date().getFullYear());
  const activeMembers = members.filter((member) => member.status === 'ACTIVE');
  const deceasedMembers = members.filter((member) => member.status === 'DECEASED');
  const membersWithoutDateOfBirth = members.filter((member) => !member.dateOfBirth);
  const baptismMemberIds = new Set(sacraments.filter(isBaptismRecord).map((record) => record.memberId));
  const activeMembersWithoutBaptism = activeMembers.filter((member) => !baptismMemberIds.has(member.id));
  const sacramentsThisYear = sacraments.filter((record) => getDateOnly(record.sacramentDate).startsWith(currentYear));

  const recentMembers = useMemo(() => {
    return [...members]
      .sort((first, second) => getDateOnly(second.createdAt).localeCompare(getDateOnly(first.createdAt)))
      .slice(0, 5);
  }, [members]);

  const recentSacraments = useMemo(() => {
    return [...sacraments]
      .sort((first, second) => getDateOnly(second.createdAt || second.sacramentDate).localeCompare(getDateOnly(first.createdAt || first.sacramentDate)))
      .slice(0, 5);
  }, [sacraments]);

  const sacramentStats = [
    { label: 'Bapteme', count: countSacramentsByName(sacraments, 'bapt') },
    { label: 'Confirmation', count: countSacramentsByName(sacraments, 'confirm') },
    { label: 'Mariage', count: countSacramentsByName(sacraments, 'mari') },
    { label: 'Premiere communion', count: countSacramentsByName(sacraments, 'commun') },
  ];
  const maxSacramentCount = Math.max(...sacramentStats.map((item) => item.count), 1);

  const ageGroupStats = [
    { label: 'Enfants', count: members.filter((member) => getAgeGroupLabel(member) === 'Enfants').length },
    { label: 'Jeunes', count: members.filter((member) => getAgeGroupLabel(member) === 'Jeunes').length },
    { label: 'Jeunes adultes', count: members.filter((member) => getAgeGroupLabel(member) === 'Jeunes adultes').length },
    { label: 'Adultes', count: members.filter((member) => getAgeGroupLabel(member) === 'Adultes').length },
    { label: 'Aines', count: members.filter((member) => getAgeGroupLabel(member) === 'Aines').length },
  ];
  const maxAgeGroupCount = Math.max(...ageGroupStats.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
              <CatholicIcon name="church" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Bureau paroissial</p>
              <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Tableau de bord</h2>
              <p className="text-[#667085]">Vue rapide des paroissiens, sacrements, certificats et travaux a suivre.</p>
            </div>
          </div>

          {isLoading && <span className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#667085]">Chargement...</span>}
        </div>
      </section>

      {errorMessage && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{errorMessage}</p>
          <button type="button" onClick={() => setErrorMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="people" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">{members.length}</p>
          <h3 className="mt-2 font-bold">Paroissiens</h3>
          <p className="text-sm text-[#667085]">Fiches enregistrees</p>
        </article>
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="people" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">{activeMembers.length}</p>
          <h3 className="mt-2 font-bold">Actifs</h3>
          <p className="text-sm text-[#667085]">Paroissiens actifs</p>
        </article>
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="water" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">{sacraments.length}</p>
          <h3 className="mt-2 font-bold">Sacrements</h3>
          <p className="text-sm text-[#667085]">Actes enregistres</p>
        </article>
        <article className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <CatholicIcon name="certificate" className="h-8 w-8 text-[#0F3D2E]" />
          <p className="mt-4 font-serif text-4xl font-bold text-[#0F3D2E]">{sacraments.length}</p>
          <h3 className="mt-2 font-bold">Certificats</h3>
          <p className="text-sm text-[#667085]">Disponibles depuis les actes</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button type="button" onClick={() => navigate('/app/members')} className="rounded-2xl border border-[#E5DED0] bg-white p-5 text-left shadow-sm transition hover:border-[#D4AF37] hover:bg-[#FFF9EE]">
          <CatholicIcon name="plus" className="h-6 w-6 text-[#0F3D2E]" />
          <p className="mt-3 font-bold text-[#0F3D2E]">Nouveau paroissien</p>
          <p className="text-sm text-[#667085]">Creer une fiche paroissien</p>
        </button>
        <button type="button" onClick={() => navigate('/app/sacraments')} className="rounded-2xl border border-[#E5DED0] bg-white p-5 text-left shadow-sm transition hover:border-[#D4AF37] hover:bg-[#FFF9EE]">
          <CatholicIcon name="chalice" className="h-6 w-6 text-[#0F3D2E]" />
          <p className="mt-3 font-bold text-[#0F3D2E]">Nouvel acte</p>
          <p className="text-sm text-[#667085]">Enregistrer un sacrement</p>
        </button>
        <button type="button" onClick={() => navigate('/app/certificates')} className="rounded-2xl border border-[#E5DED0] bg-white p-5 text-left shadow-sm transition hover:border-[#D4AF37] hover:bg-[#FFF9EE]">
          <CatholicIcon name="certificate" className="h-6 w-6 text-[#0F3D2E]" />
          <p className="mt-3 font-bold text-[#0F3D2E]">Certificat / carte</p>
          <p className="text-sm text-[#667085]">Generer un document officiel</p>
        </button>
        <button type="button" onClick={() => navigate('/app/documents')} className="rounded-2xl border border-[#E5DED0] bg-white p-5 text-left shadow-sm transition hover:border-[#D4AF37] hover:bg-[#FFF9EE]">
          <CatholicIcon name="book" className="h-6 w-6 text-[#0F3D2E]" />
          <p className="mt-3 font-bold text-[#0F3D2E]">Documents</p>
          <p className="text-sm text-[#667085]">Gerer les fichiers paroissiaux</p>
        </button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Activite recente</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Derniers paroissiens</h3>
              </div>
              <button type="button" onClick={() => navigate('/app/members')} className="text-sm font-bold text-[#0F3D2E] hover:text-[#9D7A1E]">Voir tout</button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                  <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {recentMembers.map((member) => (
                    <tr key={member.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-[#1F2933]">{getMemberName(member)}</td>
                      <td className="px-4 py-3 text-[#667085]">{member.memberCode}</td>
                      <td className="px-4 py-3 text-[#667085]">{member.status}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(member.createdAt)}</td>
                    </tr>
                  ))}
                  {!isLoading && recentMembers.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm font-semibold text-[#667085]">Aucun paroissien recent.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Registres recents</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Derniers sacrements</h3>
              </div>
              <button type="button" onClick={() => navigate('/app/sacraments')} className="text-sm font-bold text-[#0F3D2E] hover:text-[#9D7A1E]">Voir tout</button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                  <tr><th className="px-4 py-3">Paroissien</th><th className="px-4 py-3">Sacrement</th><th className="px-4 py-3">Certificat</th><th className="px-4 py-3">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {recentSacraments.map((record) => (
                    <tr key={record.id} className="bg-white">
                      <td className="px-4 py-3 font-semibold text-[#1F2933]">{getSacramentMemberName(record)}</td>
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(record.sacramentDate)}</td>
                    </tr>
                  ))}
                  {!isLoading && recentSacraments.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-sm font-semibold text-[#667085]">Aucun sacrement recent.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">A surveiller</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Attention</h3>
            <div className="mt-4 space-y-3">
              <button type="button" onClick={() => navigate('/app/members')} className="block w-full rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-left hover:border-[#D4AF37]">
                <p className="font-serif text-2xl font-bold text-[#0F3D2E]">{membersWithoutDateOfBirth.length}</p>
                <p className="text-sm font-semibold text-[#667085]">Paroissiens sans date de naissance</p>
              </button>
              <button type="button" onClick={() => navigate('/app/sacraments')} className="block w-full rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-left hover:border-[#D4AF37]">
                <p className="font-serif text-2xl font-bold text-[#0F3D2E]">{activeMembersWithoutBaptism.length}</p>
                <p className="text-sm font-semibold text-[#667085]">Actifs sans bapteme enregistre</p>
              </button>
              <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4">
                <p className="font-serif text-2xl font-bold text-[#0F3D2E]">{deceasedMembers.length}</p>
                <p className="text-sm font-semibold text-[#667085]">Paroissiens marques decedes</p>
              </div>
              <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4">
                <p className="font-serif text-2xl font-bold text-[#0F3D2E]">{sacramentsThisYear.length}</p>
                <p className="text-sm font-semibold text-[#667085]">Sacrements enregistres en {currentYear}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Statistiques rapides</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Sacrements</h3>
            <div className="mt-4 space-y-3">
              {sacramentStats.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm font-bold text-[#344054]"><span>{item.label}</span><span>{item.count}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EFE7D6]"><div className="h-full rounded-full bg-[#0F3D2E]" style={{ width: `${Math.max((item.count / maxSacramentCount) * 100, item.count > 0 ? 6 : 0)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Repartition</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Age des chretiens</h3>
            <div className="mt-4 space-y-3">
              {ageGroupStats.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm font-bold text-[#344054]"><span>{item.label}</span><span>{item.count}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EFE7D6]"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${Math.max((item.count / maxAgeGroupCount) * 100, item.count > 0 ? 6 : 0)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

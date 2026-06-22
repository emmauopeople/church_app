import { useEffect, useMemo, useRef, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { listAllMembers } from '../members/members.api';
import type { Member } from '../members/members.types';
import {
  downloadSacramentCertificate,
  listSacraments,
  previewSacramentCertificate,
} from '../sacraments/sacraments.api';
import type { Sacrament } from '../sacraments/sacraments.types';

type PreviewMode = 'certificate' | 'church-card';
type GeneratedDocument = {
  id: string;
  title: string;
  type: 'Certificat' | 'Carte chretienne';
  memberName: string;
  reference: string;
  createdAt: string;
};

const memberPageSize = 20;
const inputClass = 'h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]';

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

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getMemberName(member: Member) {
  return `${member.firstName} ${member.lastName}`.trim();
}

function getSacramentMemberName(record: Sacrament) {
  return `${record.memberFirstName} ${record.memberLastName}`.trim();
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
  ].filter(Boolean).join(' ').toLowerCase();
}

function buildCertificateFileName(record: Sacrament) {
  const safeType = record.sacramentTypeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `certificat-${safeType || 'sacrement'}-${record.certificateNumber}.pdf`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function getSacramentByKeyword(records: Sacrament[], keyword: string) {
  return records.find((record) => record.sacramentTypeName.toLowerCase().includes(keyword));
}

function renderSacramentSummary(title: string, record?: Sacrament) {
  return `
    <section class="sacrament-block">
      <h3>${escapeHtml(title)}</h3>
      <div class="sacrament-grid">
        <div><span>Date</span><strong>${escapeHtml(formatDate(record?.sacramentDate))}</strong></div>
        <div><span>Paroisse / Lieu</span><strong>${escapeHtml(record?.place || '-')}</strong></div>
        <div><span>Administre par</span><strong>${escapeHtml(record?.officiant || '-')}</strong></div>
        <div><span>Numero certificat</span><strong>${escapeHtml(record?.certificateNumber || '-')}</strong></div>
        <div><span>Parrain</span><strong>${escapeHtml(record?.sponsor1Name || '-')}</strong></div>
        <div><span>Marraine</span><strong>${escapeHtml(record?.sponsor2Name || '-')}</strong></div>
      </div>
    </section>
  `;
}

function buildChurchCardHtml(member: Member, sacraments: Sacrament[]) {
  const baptism = getSacramentByKeyword(sacraments, 'bapt');
  const firstCommunion = getSacramentByKeyword(sacraments, 'commun');
  const confirmation = getSacramentByKeyword(sacraments, 'confirm');
  const marriage = getSacramentByKeyword(sacraments, 'mari');
  const generatedAt = formatDate(new Date().toISOString());

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Carte chretienne - ${escapeHtml(getMemberName(member))}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; color: #1f2933; font-family: Arial, sans-serif; font-size: 11px; }
    .card { min-height: 100vh; border: 2px solid #0f3d2e; background: #fffdf8; padding: 9mm; }
    .header { display: grid; grid-template-columns: 74px minmax(0, 1fr) 74px; align-items: center; gap: 14px; border-bottom: 2px solid #d4af37; padding-bottom: 8px; }
    .seal { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border: 2px solid #d4af37; border-radius: 50%; color: #0f3d2e; font-family: Georgia, serif; font-size: 18px; font-weight: 800; }
    .title { text-align: center; }
    .title p { margin: 0; color: #9d7a1e; font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .title h1 { margin: 3px 0 0; color: #0f3d2e; font-family: Georgia, serif; font-size: 28px; text-transform: uppercase; }
    .meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 7px; color: #667085; font-size: 10px; font-weight: 700; }
    .identity { display: grid; grid-template-columns: 1.1fr 1fr; gap: 10px; margin-top: 10px; }
    .box, .sacrament-block, .back-note { border: 1px solid #d8c8a2; background: #ffffff; padding: 8px; }
    .box h2, .sacrament-block h3, .back-note h3 { margin: 0 0 7px; color: #0f3d2e; font-family: Georgia, serif; font-size: 16px; }
    .grid, .sacrament-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .grid span, .sacrament-grid span { display: block; color: #9d7a1e; font-size: 8px; font-weight: 800; text-transform: uppercase; }
    .grid strong, .sacrament-grid strong { display: block; margin-top: 1px; color: #1f2933; font-size: 11px; }
    .sacraments { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 9px; }
    .back-note { margin-top: 9px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .back-note p { margin: 0; line-height: 1.45; color: #344054; }
    .signature-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18mm; margin-top: 10mm; padding: 0 14mm; text-align: center; font-size: 10px; font-weight: 700; color: #0f3d2e; }
    .signature-line { border-top: 1px solid #1f2933; padding-top: 5px; }
    @media print { .card { border: none; padding: 0; } }
  </style>
</head>
<body>
  <main class="card">
    <header class="header">
      <div class="seal">IHS</div>
      <div class="title">
        <p>Paroisse catholique</p>
        <h1>Carte chretienne</h1>
      </div>
      <div class="seal">+</div>
    </header>
    <section class="meta">
      <span>Paroissien: ${escapeHtml(member.memberCode)}</span>
      <span>Genere le ${escapeHtml(generatedAt)}</span>
    </section>

    <section class="identity">
      <div class="box">
        <h2>Identite du chretien</h2>
        <div class="grid">
          <div><span>Nom complet</span><strong>${escapeHtml(getMemberName(member))}</strong></div>
          <div><span>Code</span><strong>${escapeHtml(member.memberCode)}</strong></div>
          <div><span>Date de naissance</span><strong>${escapeHtml(formatDate(member.dateOfBirth))}</strong></div>
          <div><span>Lieu de naissance</span><strong>${escapeHtml(member.birthPlace || '-')}</strong></div>
          <div><span>Sexe</span><strong>${escapeHtml(member.gender === 'MALE' ? 'Masculin' : member.gender === 'FEMALE' ? 'Feminin' : '-')}</strong></div>
          <div><span>Statut</span><strong>${escapeHtml(member.status)}</strong></div>
        </div>
      </div>
      <div class="box">
        <h2>Famille et paroisse</h2>
        <div class="grid">
          <div><span>Pere</span><strong>${escapeHtml(member.fatherName || '-')}</strong></div>
          <div><span>Mere</span><strong>${escapeHtml(member.motherName || '-')}</strong></div>
          <div><span>Telephone</span><strong>${escapeHtml(member.phone || '-')}</strong></div>
          <div><span>Adresse / Ville</span><strong>${escapeHtml(member.city || '-')}</strong></div>
          <div><span>Paroisse</span><strong>Paroisse locale</strong></div>
          <div><span>Email</span><strong>${escapeHtml(member.email || '-')}</strong></div>
        </div>
      </div>
    </section>

    <section class="sacraments">
      ${renderSacramentSummary('Bapteme', baptism)}
      ${renderSacramentSummary('Premiere communion', firstCommunion)}
      ${renderSacramentSummary('Confirmation', confirmation)}
      ${renderSacramentSummary('Mariage', marriage)}
    </section>

    <section class="back-note">
      <div>
        <h3>Information paroissiale</h3>
        <p>Cette carte resume les informations chretiennes du paroissien selon les actes disponibles dans le registre paroissial.</p>
      </div>
      <div>
        <h3>Note sur la carte</h3>
        <p>La carte sert a identifier le chretien et a presenter rapidement les sacrements deja enregistres. Toute correction doit etre faite dans le dossier paroissien ou dans le registre sacramentel.</p>
      </div>
    </section>

    <section class="signature-row">
      <div class="signature-line">Secretaire paroissial</div>
      <div class="signature-line">Cure / Responsable</div>
      <div class="signature-line">Cachet de la paroisse</div>
    </section>
  </main>
</body>
</html>`;
}

export function CertificatesPage() {
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberSacraments, setSelectedMemberSacraments] = useState<Sacrament[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('church-card');
  const [previewUrl, setPreviewUrl] = useState('');
  const [churchCardHtml, setChurchCardHtml] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMemberSacraments, setIsLoadingMemberSacraments] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    async function loadMembers() {
      try {
        setIsLoadingMembers(true);
        setMessage('');
        const allMembers = await listAllMembers();
        setMembers(allMembers);
        setSelectedMemberId((current) => current || allMembers[0]?.id || '');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Impossible de charger les chretiens.');
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    }

    loadMembers();
  }, []);

  useEffect(() => {
    if (!selectedMemberId) {
      setSelectedMemberSacraments([]);
      return;
    }

    async function loadMemberSacraments() {
      try {
        setIsLoadingMemberSacraments(true);
        setMessage('');
        const response = await listSacraments({ memberId: selectedMemberId, page: 1, limit: 100 });
        setSelectedMemberSacraments(response.data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Impossible de charger les sacrements du chretien.');
        setSelectedMemberSacraments([]);
      } finally {
        setIsLoadingMemberSacraments(false);
      }
    }

    loadMemberSacraments();
  }, [selectedMemberId]);

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    return members
      .filter((member) => !search || getSearchableMemberText(member).includes(search))
      .sort((first, second) => `${first.lastName} ${first.firstName}`.localeCompare(`${second.lastName} ${second.firstName}`));
  }, [memberSearch, members]);

  useEffect(() => {
    setMemberPage(1);
  }, [memberSearch]);

  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;
  const totalMemberPages = Math.max(1, Math.ceil(filteredMembers.length / memberPageSize));
  const safeMemberPage = Math.min(memberPage, totalMemberPages);
  const memberStartIndex = (safeMemberPage - 1) * memberPageSize;
  const paginatedMembers = filteredMembers.slice(memberStartIndex, memberStartIndex + memberPageSize);

  const addGeneratedDocument = (document: Omit<GeneratedDocument, 'id' | 'createdAt'>) => {
    setGeneratedDocuments((current) => [
      {
        ...document,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 20));
  };

  const handlePreviewCertificate = async (record: Sacrament) => {
    try {
      setMessage('');
      const blob = await previewSacramentCertificate(record.id);

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setPreviewUrl(URL.createObjectURL(blob));
      setChurchCardHtml('');
      setPreviewMode('certificate');
      setIsPreviewOpen(true);
      addGeneratedDocument({
        title: `${record.sacramentTypeName} - ${record.certificateNumber}`,
        type: 'Certificat',
        memberName: getSacramentMemberName(record),
        reference: record.certificateNumber,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de generer l apercu du certificat.');
    }
  };

  const handleDownloadCertificate = async (record: Sacrament) => {
    try {
      setMessage('');
      const blob = await downloadSacramentCertificate(record.id);
      downloadBlob(blob, buildCertificateFileName(record));
      addGeneratedDocument({
        title: `${record.sacramentTypeName} - ${record.certificateNumber}`,
        type: 'Certificat',
        memberName: getSacramentMemberName(record),
        reference: record.certificateNumber,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de telecharger le certificat.');
    }
  };

  const handlePreviewChurchCard = () => {
    if (!selectedMember) {
      setMessage('Selectionnez un chretien pour creer la carte chretienne.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl('');
    setChurchCardHtml(buildChurchCardHtml(selectedMember, selectedMemberSacraments));
    setPreviewMode('church-card');
    setIsPreviewOpen(true);
    addGeneratedDocument({
      title: `Carte chretienne - ${getMemberName(selectedMember)}`,
      type: 'Carte chretienne',
      memberName: getMemberName(selectedMember),
      reference: selectedMember.memberCode,
    });
  };

  const handlePrintPreview = () => {
    previewFrameRef.current?.contentWindow?.focus();
    previewFrameRef.current?.contentWindow?.print();
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
            <CatholicIcon name="certificate" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Certificats officiels</p>
            <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Certificats et carte chretienne</h2>
            <p className="text-[#667085]">Selectionnez un chretien, consultez ses informations, puis creez un certificat ou une carte chretienne.</p>
          </div>
        </div>
      </section>

      {message && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{message}</p>
          <button type="button" onClick={() => setMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Liste des chretiens</p>
              <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Paroissiens</h3>
            </div>
            {isLoadingMembers && <span className="text-xs font-bold text-[#667085]">Chargement...</span>}
          </div>

          <label className="mt-5 flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
            <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
            <input
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Rechercher nom, code, telephone"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
            />
          </label>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#EEE6D6]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                <tr>
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Tel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6D6]">
                {paginatedMembers.map((member) => {
                  const isSelected = selectedMemberId === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`cursor-pointer transition ${isSelected ? 'bg-[#F4E8C8]' : 'bg-white hover:bg-[#FFF9EE]'}`}
                    >
                      <td className="px-3 py-3 font-bold text-[#0F3D2E]">{getMemberName(member)}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-[#667085]">{member.memberCode}</td>
                      <td className="px-3 py-3 text-xs font-semibold text-[#667085]">{member.phone || '-'}</td>
                    </tr>
                  );
                })}

                {!isLoadingMembers && filteredMembers.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun chretien trouve.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredMembers.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] px-4 py-3">
              <p className="text-sm font-semibold text-[#667085]">
                Affichage {memberStartIndex + 1} - {Math.min(memberStartIndex + memberPageSize, filteredMembers.length)} sur {filteredMembers.length}
              </p>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={safeMemberPage <= 1}
                  onClick={() => setMemberPage((page) => Math.max(1, page - 1))}
                  className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-sm font-bold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Precedent
                </button>
                <span className="text-sm font-bold text-[#0F3D2E]">Page {safeMemberPage} / {totalMemberPages}</span>
                <button
                  type="button"
                  disabled={safeMemberPage >= totalMemberPages}
                  onClick={() => setMemberPage((page) => Math.min(totalMemberPages, page + 1))}
                  className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-sm font-bold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Details du chretien</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{selectedMember ? getMemberName(selectedMember) : 'Aucun chretien selectionne'}</h3>
                <p className="text-sm font-semibold text-[#667085]">Les actions sont disponibles apres selection d un chretien.</p>
              </div>
              <button
                type="button"
                onClick={handlePreviewChurchCard}
                disabled={!selectedMember || isLoadingMemberSacraments}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CatholicIcon name="print" className="h-4 w-4" />
                Creer carte chretienne
              </button>
            </div>

            {selectedMember && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm">
                  <p><span className="font-bold text-[#9D7A1E]">Code:</span> {selectedMember.memberCode}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Date naissance:</span> {formatDate(selectedMember.dateOfBirth)}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Lieu naissance:</span> {selectedMember.birthPlace || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Sexe:</span> {selectedMember.gender === 'MALE' ? 'Masculin' : selectedMember.gender === 'FEMALE' ? 'Feminin' : '-'}</p>
                </div>
                <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm">
                  <p><span className="font-bold text-[#9D7A1E]">Pere:</span> {selectedMember.fatherName || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Mere:</span> {selectedMember.motherName || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Ville:</span> {selectedMember.city || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Telephone:</span> {selectedMember.phone || '-'}</p>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Sacrements du chretien</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Creer certificat</h3>
              </div>
              {isLoadingMemberSacraments && <span className="text-sm font-semibold text-[#667085]">Chargement des sacrements...</span>}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                  <tr>
                    <th className="px-4 py-3">Sacrement</th>
                    <th className="px-4 py-3">Certificat</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Lieu</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {selectedMemberSacraments.map((record) => (
                    <tr key={record.id} className="bg-white hover:bg-[#FFF9EE]">
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(record.sacramentDate)}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.place || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handlePreviewCertificate(record)} className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-xs font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Apercu certificat</button>
                          <button type="button" onClick={() => handleDownloadCertificate(record)} className="rounded-lg bg-[#0F3D2E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#145C43]">PDF</button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!isLoadingMemberSacraments && selectedMember && selectedMemberSacraments.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun sacrement enregistre pour ce chretien.</td></tr>
                  )}
                  {!selectedMember && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Selectionnez un chretien a gauche.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Historique des documents generes</p>
          <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Certificats et cartes crees</h3>
          <p className="text-sm font-semibold text-[#667085]">Cette table garde les documents crees pendant la session. Le stockage permanent peut etre branche ensuite au document-service.</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Chretien</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Date cree</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6D6]">
              {generatedDocuments.map((document) => (
                <tr key={document.id} className="bg-white">
                  <td className="px-4 py-3 font-bold text-[#0F3D2E]">{document.title}</td>
                  <td className="px-4 py-3 text-[#667085]">{document.type}</td>
                  <td className="px-4 py-3 text-[#667085]">{document.memberName}</td>
                  <td className="px-4 py-3 text-[#667085]">{document.reference}</td>
                  <td className="px-4 py-3 text-[#667085]">{formatDate(document.createdAt)}</td>
                </tr>
              ))}

              {generatedDocuments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun document genere pour le moment.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#D8C8A2] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Apercu</p>
                <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">{previewMode === 'certificate' ? 'Certificat' : 'Carte chretienne'}</h3>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handlePrintPreview} className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Imprimer</button>
                <button type="button" onClick={closePreview} className="rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white hover:bg-[#145C43]">Fermer</button>
              </div>
            </div>
            {previewMode === 'certificate' ? (
              <iframe ref={previewFrameRef} title="Apercu certificat" src={previewUrl} className="h-full w-full bg-[#EFE7D6]" />
            ) : (
              <iframe ref={previewFrameRef} title="Apercu carte chretienne" srcDoc={churchCardHtml} className="h-full w-full bg-[#EFE7D6]" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

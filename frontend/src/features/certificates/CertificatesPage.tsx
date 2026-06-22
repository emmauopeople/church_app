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

type CertificateMode = 'certificates' | 'church-card';
type PreviewMode = 'certificate' | 'church-card';

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

function getSearchableCertificateText(record: Sacrament) {
  return [
    record.memberFirstName,
    record.memberLastName,
    record.memberCode,
    record.certificateNumber,
    record.sacramentTypeName,
    record.place,
    record.officiant,
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

function buildChurchCardHtml(member: Member, sacraments: Sacrament[]) {
  const generatedAt = formatDate(new Date().toISOString());
  const sacramentRows = sacraments.map((record) => `
    <tr>
      <td>${escapeHtml(record.sacramentTypeName)}</td>
      <td>${escapeHtml(record.certificateNumber)}</td>
      <td>${escapeHtml(formatDate(record.sacramentDate))}</td>
      <td>${escapeHtml(record.place || '-')}</td>
      <td>${escapeHtml(record.officiant || '-')}</td>
      <td>${escapeHtml(record.sponsor1Name || '-')}<br />${escapeHtml(record.sponsor2Name || '-')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Carte chretienne - ${escapeHtml(getMemberName(member))}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; color: #1f2933; font-family: Arial, sans-serif; font-size: 12px; }
    .card { min-height: 100vh; border: 2px solid #0f3d2e; background: #fffdf8; padding: 12mm; }
    .header { display: grid; grid-template-columns: 76px minmax(0, 1fr) 76px; gap: 16px; align-items: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
    .seal { display: flex; align-items: center; justify-content: center; width: 68px; height: 68px; border: 2px solid #d4af37; border-radius: 50%; color: #0f3d2e; font-family: Georgia, serif; font-size: 18px; font-weight: 800; }
    .title { text-align: center; }
    .title p { margin: 0; color: #9d7a1e; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .title h1 { margin: 5px 0 0; color: #0f3d2e; font-family: Georgia, serif; font-size: 30px; text-transform: uppercase; }
    .meta { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; color: #667085; font-size: 10px; font-weight: 700; }
    .profile { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; margin-top: 12px; }
    .box { border: 1px solid #d8c8a2; background: #ffffff; padding: 10px; }
    .box h2 { margin: 0 0 8px; color: #0f3d2e; font-family: Georgia, serif; font-size: 18px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .item span { display: block; color: #9d7a1e; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .item strong { display: block; margin-top: 2px; color: #1f2933; font-size: 12px; }
    table { width: 100%; margin-top: 12px; border-collapse: collapse; table-layout: fixed; }
    th { background: #0f3d2e; color: #ffffff; border: 1px solid #0f3d2e; padding: 7px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { border: 1px solid #d8c8a2; padding: 7px 6px; vertical-align: top; overflow-wrap: anywhere; }
    tr:nth-child(even) td { background: #fff9ee; }
    .empty { margin-top: 12px; border: 1px dashed #d8c8a2; padding: 16px; text-align: center; color: #667085; font-weight: 700; }
    .signature-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18mm; margin-top: 18mm; padding: 0 16mm; text-align: center; font-size: 10px; font-weight: 700; color: #0f3d2e; }
    .signature-line { border-top: 1px solid #1f2933; padding-top: 6px; }
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

    <section class="profile">
      <div class="box">
        <h2>Identite du chretien</h2>
        <div class="grid">
          <div class="item"><span>Nom complet</span><strong>${escapeHtml(getMemberName(member))}</strong></div>
          <div class="item"><span>Code</span><strong>${escapeHtml(member.memberCode)}</strong></div>
          <div class="item"><span>Date naissance</span><strong>${escapeHtml(formatDate(member.dateOfBirth))}</strong></div>
          <div class="item"><span>Lieu naissance</span><strong>${escapeHtml(member.birthPlace || '-')}</strong></div>
          <div class="item"><span>Sexe</span><strong>${escapeHtml(member.gender === 'MALE' ? 'Masculin' : member.gender === 'FEMALE' ? 'Feminin' : '-')}</strong></div>
          <div class="item"><span>Statut</span><strong>${escapeHtml(member.status)}</strong></div>
        </div>
      </div>
      <div class="box">
        <h2>Famille et paroisse</h2>
        <div class="grid">
          <div class="item"><span>Pere</span><strong>${escapeHtml(member.fatherName || '-')}</strong></div>
          <div class="item"><span>Mere</span><strong>${escapeHtml(member.motherName || '-')}</strong></div>
          <div class="item"><span>Ville</span><strong>${escapeHtml(member.city || '-')}</strong></div>
          <div class="item"><span>Paroisse</span><strong>Paroisse locale</strong></div>
          <div class="item"><span>Telephone</span><strong>${escapeHtml(member.phone || '-')}</strong></div>
          <div class="item"><span>Email</span><strong>${escapeHtml(member.email || '-')}</strong></div>
        </div>
      </div>
    </section>

    ${sacraments.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 16%;">Sacrement</th>
            <th style="width: 16%;">Certificat</th>
            <th style="width: 12%;">Date</th>
            <th style="width: 18%;">Paroisse / Lieu</th>
            <th style="width: 18%;">Officiant</th>
            <th style="width: 20%;">Parrain / Marraine</th>
          </tr>
        </thead>
        <tbody>${sacramentRows}</tbody>
      </table>
    ` : '<div class="empty">Aucun sacrement n est encore enregistre pour ce chretien.</div>'}

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
  const [mode, setMode] = useState<CertificateMode>('certificates');
  const [certificateRecords, setCertificateRecords] = useState<Sacrament[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberSacraments, setSelectedMemberSacraments] = useState<Sacrament[]>([]);
  const [certificateSearch, setCertificateSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('certificate');
  const [previewUrl, setPreviewUrl] = useState('');
  const [churchCardHtml, setChurchCardHtml] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingMemberSacraments, setIsLoadingMemberSacraments] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  useEffect(() => {
    async function loadCertificateRecords() {
      try {
        setIsLoadingCertificates(true);
        setMessage('');
        const response = await listSacraments({ page: 1, limit: 100 });
        setCertificateRecords(response.data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Impossible de charger les certificats.');
        setCertificateRecords([]);
      } finally {
        setIsLoadingCertificates(false);
      }
    }

    loadCertificateRecords();
  }, []);

  useEffect(() => {
    if (mode !== 'church-card' || members.length > 0 || isLoadingMembers) return;

    async function loadMembers() {
      try {
        setIsLoadingMembers(true);
        setMessage('');
        const allMembers = await listAllMembers();
        setMembers(allMembers);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Impossible de charger les chretiens.');
        setMembers([]);
      } finally {
        setIsLoadingMembers(false);
      }
    }

    loadMembers();
  }, [isLoadingMembers, members.length, mode]);

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

  const filteredCertificateRecords = useMemo(() => {
    const search = certificateSearch.trim().toLowerCase();

    return certificateRecords
      .filter((record) => !search || getSearchableCertificateText(record).includes(search))
      .sort((first, second) => getDateOnly(second.sacramentDate).localeCompare(getDateOnly(first.sacramentDate)));
  }, [certificateRecords, certificateSearch]);

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    return members
      .filter((member) => !search || getSearchableMemberText(member).includes(search))
      .sort((first, second) => `${first.lastName} ${first.firstName}`.localeCompare(`${second.lastName} ${second.firstName}`));
  }, [memberSearch, members]);

  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;

  const handlePreviewCertificate = async (record: Sacrament) => {
    try {
      setMessage('');
      const blob = await previewSacramentCertificate(record.id);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(blob));
      setChurchCardHtml('');
      setPreviewMode('certificate');
      setIsPreviewOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de generer l apercu du certificat.');
    }
  };

  const handleDownloadCertificate = async (record: Sacrament) => {
    try {
      setMessage('');
      const blob = await downloadSacramentCertificate(record.id);
      downloadBlob(blob, buildCertificateFileName(record));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de telecharger le certificat.');
    }
  };

  const handlePreviewChurchCard = () => {
    if (!selectedMember) {
      setMessage('Selectionnez un chretien pour creer la carte chretienne.');
      return;
    }

    setPreviewUrl('');
    setChurchCardHtml(buildChurchCardHtml(selectedMember, selectedMemberSacraments));
    setPreviewMode('church-card');
    setIsPreviewOpen(true);
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
              <CatholicIcon name="certificate" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Certificats officiels</p>
              <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Certificats et cartes chretiennes</h2>
              <p className="text-[#667085]">Generez les certificats de sacrement et la carte chretienne complete d un paroissien.</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E5DED0] pt-4">
          <button
            type="button"
            onClick={() => setMode('certificates')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${mode === 'certificates' ? 'bg-[#0F3D2E] text-white' : 'border border-[#D8C8A2] bg-white text-[#0F3D2E] hover:bg-[#FFF9EE]'}`}
          >
            <CatholicIcon name="certificate" className="h-4 w-4" />
            Certificats
          </button>
          <button
            type="button"
            onClick={() => setMode('church-card')}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${mode === 'church-card' ? 'bg-[#0F3D2E] text-white' : 'border border-[#D8C8A2] bg-white text-[#0F3D2E] hover:bg-[#FFF9EE]'}`}
          >
            <CatholicIcon name="people" className="h-4 w-4" />
            Carte chretienne
          </button>
        </div>
      </section>

      {message && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{message}</p>
          <button type="button" onClick={() => setMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      {mode === 'certificates' && (
        <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Certificats generes a partir des actes</p>
              <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Certificats de sacrement</h3>
            </div>
            {isLoadingCertificates && <span className="text-sm font-semibold text-[#667085]">Chargement des certificats...</span>}
          </div>

          <label className="mt-5 flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
            <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
            <input
              value={certificateSearch}
              onChange={(event) => setCertificateSearch(event.target.value)}
              placeholder="Rechercher nom, code, numero certificat, sacrement"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
            />
          </label>

          <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                <tr>
                  <th className="px-4 py-3">Paroissien</th>
                  <th className="px-4 py-3">Sacrement</th>
                  <th className="px-4 py-3">Certificat</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Lieu</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6D6]">
                {filteredCertificateRecords.map((record) => (
                  <tr key={record.id} className="bg-white transition hover:bg-[#FFF9EE]">
                    <td className="px-4 py-3 font-semibold text-[#1F2933]">
                      {getSacramentMemberName(record)}
                      <span className="block text-xs font-bold text-[#667085]">{record.memberCode}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                    <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                    <td className="px-4 py-3 text-[#667085]">{formatDate(record.sacramentDate)}</td>
                    <td className="px-4 py-3 text-[#667085]">{record.place || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handlePreviewCertificate(record)} className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-xs font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">Apercu</button>
                        <button type="button" onClick={() => handleDownloadCertificate(record)} className="rounded-lg bg-[#0F3D2E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#145C43]">PDF</button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!isLoadingCertificates && filteredCertificateRecords.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun certificat trouve.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mode === 'church-card' && (
        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Selectionner un chretien</p>
              <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Carte chretienne</h3>
            </div>

            {isLoadingMembers && <p className="mt-3 text-sm font-semibold text-[#667085]">Chargement des chretiens...</p>}

            <label className="mt-5 flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
              <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
              <input
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Rechercher nom, code, telephone"
                className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
              />
            </label>

            <div className="mt-4 max-h-[28rem] overflow-auto rounded-xl border border-[#EEE6D6]">
              {filteredMembers.map((member) => {
                const isSelected = selectedMemberId === member.id;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`block w-full border-b border-[#EEE6D6] px-4 py-3 text-left transition last:border-b-0 ${isSelected ? 'bg-[#F4E8C8]' : 'bg-white hover:bg-[#FFF9EE]'}`}
                  >
                    <span className="block text-sm font-bold text-[#0F3D2E]">{getMemberName(member)}</span>
                    <span className="block text-xs font-semibold text-[#667085]">{member.memberCode} {member.phone ? `| ${member.phone}` : ''}</span>
                  </button>
                );
              })}

              {!isLoadingMembers && filteredMembers.length === 0 && (
                <div className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun chretien trouve.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Resume de la carte</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{selectedMember ? getMemberName(selectedMember) : 'Aucun chretien selectionne'}</h3>
                <p className="text-sm font-semibold text-[#667085]">La carte contient l identite du chretien et tous ses sacrements enregistres.</p>
              </div>
              <button
                type="button"
                onClick={handlePreviewChurchCard}
                disabled={!selectedMember || isLoadingMemberSacraments}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CatholicIcon name="print" className="h-4 w-4" />
                Apercu / Imprimer
              </button>
            </div>

            {selectedMember && (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm">
                  <p><span className="font-bold text-[#9D7A1E]">Code:</span> {selectedMember.memberCode}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Date naissance:</span> {formatDate(selectedMember.dateOfBirth)}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Lieu naissance:</span> {selectedMember.birthPlace || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Telephone:</span> {selectedMember.phone || '-'}</p>
                </div>
                <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm">
                  <p><span className="font-bold text-[#9D7A1E]">Pere:</span> {selectedMember.fatherName || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Mere:</span> {selectedMember.motherName || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Ville:</span> {selectedMember.city || '-'}</p>
                  <p><span className="font-bold text-[#9D7A1E]">Statut:</span> {selectedMember.status}</p>
                </div>
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                  <tr>
                    <th className="px-4 py-3">Sacrement</th>
                    <th className="px-4 py-3">Certificat</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Lieu</th>
                    <th className="px-4 py-3">Officiant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {selectedMemberSacraments.map((record) => (
                    <tr key={record.id} className="bg-white">
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(record.sacramentDate)}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.place || '-'}</td>
                      <td className="px-4 py-3 text-[#667085]">{record.officiant || '-'}</td>
                    </tr>
                  ))}

                  {!isLoadingMemberSacraments && selectedMember && selectedMemberSacraments.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun sacrement enregistre pour ce chretien.</td></tr>
                  )}
                  {!selectedMember && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Selectionnez un chretien pour voir ses sacrements.</td></tr>
                  )}
                  {isLoadingMemberSacraments && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Chargement des sacrements...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

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

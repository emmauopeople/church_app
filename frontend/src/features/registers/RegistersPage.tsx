import { useEffect, useMemo, useRef, useState } from 'react';

import { CatholicIcon, type CatholicIconName } from '../../components/decorative/CatholicIcon';
import { listSacraments, listSacramentTypes } from '../sacraments/sacraments.api';
import type { Sacrament, SacramentType } from '../sacraments/sacraments.types';

const filterInputClass = 'h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]';

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

function getSearchableRecordText(record: Sacrament) {
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
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getSacramentIcon(type?: SacramentType): CatholicIconName {
  const value = `${type?.code ?? ''} ${type?.name ?? ''}`.toLowerCase();

  if (value.includes('bapt')) {
    return 'water';
  }

  if (value.includes('mari')) {
    return 'rings';
  }

  if (value.includes('confirm')) {
    return 'dove';
  }

  if (value.includes('commun')) {
    return 'chalice';
  }

  return 'book';
}

function isRecordWithinDateRange(record: Sacrament, startDate: string, endDate: string) {
  const recordDate = getDateOnly(record.sacramentDate);

  if (!recordDate) {
    return false;
  }

  if (startDate && recordDate < startDate) {
    return false;
  }

  if (endDate && recordDate > endDate) {
    return false;
  }

  return true;
}

function buildRegisterFilterText(params: {
  registerName: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  count: number;
}) {
  const filters = [
    `Registre: ${params.registerName}`,
    params.startDate ? `Du: ${formatDate(params.startDate)}` : '',
    params.endDate ? `Au: ${formatDate(params.endDate)}` : '',
    params.searchTerm.trim() ? `Recherche: ${params.searchTerm.trim()}` : '',
    `Total: ${params.count} entree${params.count > 1 ? 's' : ''}`,
  ].filter(Boolean);

  return filters.join(' | ');
}

function buildRegisterPrintDocumentHtml(params: {
  registerName: string;
  records: Sacrament[];
  startDate: string;
  endDate: string;
  searchTerm: string;
}) {
  const generatedAt = formatDate(new Date().toISOString());
  const filterText = buildRegisterFilterText({
    registerName: params.registerName,
    startDate: params.startDate,
    endDate: params.endDate,
    searchTerm: params.searchTerm,
    count: params.records.length,
  });

  const rows = params.records.map((record, index) => `
    <tr>
      <td>${String(index + 1).padStart(3, '0')}</td>
      <td>${escapeHtml(formatDate(record.sacramentDate))}</td>
      <td>
        <strong>${escapeHtml(`${record.memberFirstName} ${record.memberLastName}`)}</strong>
        <span>${escapeHtml(record.memberCode)}</span>
      </td>
      <td>${escapeHtml(record.sacramentTypeName)}</td>
      <td>${escapeHtml(record.certificateNumber)}</td>
      <td>${escapeHtml(record.place || '-')}</td>
      <td>${escapeHtml(record.officiant || '-')}</td>
      <td>${escapeHtml(record.sponsor1Name || '-')}<br />${escapeHtml(record.sponsor2Name || '-')}</td>
      <td>${escapeHtml(record.notes || '-')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(params.registerName)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1f2933;
      background: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 11px;
    }
    .page {
      width: 100%;
      min-height: 100vh;
      border: 2px solid #0f3d2e;
      padding: 10mm;
      background: #fffdf8;
    }
    .header {
      display: grid;
      grid-template-columns: 70px minmax(0, 1fr) 70px;
      align-items: center;
      gap: 14px;
      border-bottom: 2px solid #d4af37;
      padding-bottom: 8px;
    }
    .mark {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 62px;
      height: 62px;
      border: 2px solid #d4af37;
      border-radius: 50%;
      color: #0f3d2e;
      font-family: Georgia, serif;
      font-size: 18px;
      font-weight: 700;
    }
    .title {
      text-align: center;
    }
    .title p {
      margin: 0;
      color: #9d7a1e;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title h1 {
      margin: 4px 0 0;
      color: #0f3d2e;
      font-family: Georgia, serif;
      font-size: 25px;
      text-transform: uppercase;
    }
    .meta {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: #667085;
      font-size: 10px;
      font-weight: 700;
    }
    table {
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th {
      background: #0f3d2e;
      color: #ffffff;
      border: 1px solid #0f3d2e;
      padding: 6px 5px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #d8c8a2;
      padding: 5px;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    td span {
      display: block;
      margin-top: 2px;
      color: #667085;
      font-size: 9px;
      font-weight: 700;
    }
    tr:nth-child(even) td {
      background: #fff9ee;
    }
    .empty {
      margin-top: 20px;
      border: 1px dashed #d8c8a2;
      padding: 18px;
      text-align: center;
      color: #667085;
      font-weight: 700;
    }
    .signature-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18mm;
      margin-top: 16mm;
      padding: 0 16mm;
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      color: #0f3d2e;
    }
    .signature-line {
      border-top: 1px solid #1f2933;
      padding-top: 6px;
    }
    @media print {
      body { background: #ffffff; }
      .page { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="header">
      <div class="mark">IHS</div>
      <div class="title">
        <p>Registre paroissial officiel</p>
        <h1>${escapeHtml(params.registerName)}</h1>
      </div>
      <div class="mark">+</div>
    </header>
    <section class="meta">
      <span>${escapeHtml(filterText)}</span>
      <span>Genere le ${escapeHtml(generatedAt)}</span>
    </section>
    ${params.records.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 8%;">Date</th>
            <th style="width: 16%;">Paroissien</th>
            <th style="width: 11%;">Type</th>
            <th style="width: 13%;">Certificat</th>
            <th style="width: 12%;">Lieu</th>
            <th style="width: 12%;">Officiant</th>
            <th style="width: 13%;">Parrain / Marraine</th>
            <th style="width: 11%;">Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    ` : '<div class="empty">Aucune entree trouvee pour ces filtres.</div>'}
    <section class="signature-row">
      <div class="signature-line">Secretaire paroissial</div>
      <div class="signature-line">Cure / Responsable</div>
      <div class="signature-line">Cachet de la paroisse</div>
    </section>
  </main>
</body>
</html>`;
}

export function RegistersPage() {
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [sacramentTypes, setSacramentTypes] = useState<SacramentType[]>([]);
  const [records, setRecords] = useState<Sacrament[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Sacrament | null>(null);
  const [registerPreviewHtml, setRegisterPreviewHtml] = useState('');
  const [isRegisterPreviewOpen, setIsRegisterPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadRegisterData() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [typesResponse, recordsResponse] = await Promise.all([
          listSacramentTypes(),
          listSacraments({ page: 1, limit: 100 }),
        ]);

        setSacramentTypes(typesResponse.data);
        setRecords(recordsResponse.data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les registres.');
        setSacramentTypes([]);
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadRegisterData();
  }, []);

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
      .filter((record) => isRecordWithinDateRange(record, startDate, endDate))
      .filter((record) => !search || getSearchableRecordText(record).includes(search))
      .sort((first, second) => getDateOnly(second.sacramentDate).localeCompare(getDateOnly(first.sacramentDate)));
  }, [endDate, records, searchTerm, selectedTypeId, startDate]);

  const currentYear = String(new Date().getFullYear());
  const recordsThisYear = records.filter((record) => getDateOnly(record.sacramentDate).startsWith(currentYear)).length;
  const activeRegisterName = selectedTypeId
    ? sacramentTypes.find((type) => String(type.id) === selectedTypeId)?.name ?? 'Registre selectionne'
    : 'Tous les registres';

  const handleResetFilters = () => {
    setSelectedTypeId('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const handleOpenRegisterPreview = () => {
    setRegisterPreviewHtml(buildRegisterPrintDocumentHtml({
      registerName: activeRegisterName,
      records: filteredRecords,
      startDate,
      endDate,
      searchTerm,
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
              <p className="text-[#667085]">Consultez les registres de bapteme, confirmation, mariage et premiere communion.</p>
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
      </section>

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

          {isLoading && <span className="text-sm font-semibold text-[#667085]">Chargement des registres...</span>}
        </div>

        {errorMessage && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto"
            >
              OK
            </button>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => setSelectedTypeId('')}
            className={`rounded-2xl border p-4 text-left transition ${!selectedTypeId ? 'border-[#0F3D2E] bg-[#F4E8C8]' : 'border-[#E5DED0] bg-[#FFFDF8] hover:bg-[#FFF9EE]'}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F3D2E]">
                <CatholicIcon name="book" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F3D2E]">Tous</p>
                <p className="text-xs font-semibold text-[#667085]">{records.length} actes</p>
              </div>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0F3D2E]">
                    <CatholicIcon name={getSacramentIcon(type)} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F3D2E]">{type.name}</p>
                    <p className="text-xs font-semibold text-[#667085]">{count} actes</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
            <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher nom, code, certificat, officiant, lieu"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
            />
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={filterInputClass}
            aria-label="Date debut"
          />
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={filterInputClass}
            aria-label="Date fin"
          />
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]"
          >
            Reinitialiser
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Table du registre</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{activeRegisterName}</h3>
          </div>
          <p className="text-sm font-semibold text-[#667085]">
            {filteredRecords.length} entree{filteredRecords.length > 1 ? 's' : ''} affichee{filteredRecords.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Paroissien</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Certificat</th>
                <th className="px-4 py-3">Lieu</th>
                <th className="px-4 py-3">Officiant</th>
                <th className="px-4 py-3">Parrain / Marraine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6D6]">
              {filteredRecords.map((record, index) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="cursor-pointer bg-white transition hover:bg-[#FFF9EE]"
                >
                  <td className="px-4 py-3 font-bold text-[#0F3D2E]">{String(index + 1).padStart(3, '0')}</td>
                  <td className="px-4 py-3 font-semibold text-[#344054]">{formatDate(record.sacramentDate)}</td>
                  <td className="px-4 py-3 font-semibold text-[#1F2933]">
                    {record.memberFirstName} {record.memberLastName}
                    <span className="block text-xs font-bold text-[#667085]">{record.memberCode}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                  <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                  <td className="px-4 py-3 text-[#667085]">{record.place || '-'}</td>
                  <td className="px-4 py-3 text-[#667085]">{record.officiant || '-'}</td>
                  <td className="px-4 py-3 text-[#667085]">
                    <span className="block">{record.sponsor1Name || '-'}</span>
                    <span className="block text-xs">{record.sponsor2Name || '-'}</span>
                  </td>
                </tr>
              ))}

              {!isLoading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">
                    Aucun acte trouve pour ces filtres.
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">
                    Chargement des registres...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isRegisterPreviewOpen && registerPreviewHtml && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#D8C8A2] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Apercu impression</p>
                <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">{activeRegisterName}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintRegisterPreview}
                  className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]"
                >
                  Imprimer
                </button>
                <button
                  type="button"
                  onClick={handleCloseRegisterPreview}
                  className="rounded-xl bg-[#0F3D2E] px-4 py-2 text-sm font-bold text-white hover:bg-[#145C43]"
                >
                  Fermer
                </button>
              </div>
            </div>
            <iframe
              ref={printFrameRef}
              title="Apercu impression registre"
              srcDoc={registerPreviewHtml}
              className="h-full w-full bg-[#EFE7D6]"
            />
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="dialog" aria-modal="true">
          <aside className="h-full w-full max-w-md overflow-auto border-l border-[#D8C8A2] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Entree du registre</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{selectedRecord.sacramentTypeName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg border border-[#D8C8A2] px-3 py-1.5 text-sm font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]"
              >
                Fermer
              </button>
            </div>

            <div className="mt-6 space-y-3 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm">
              <p><span className="font-bold text-[#9D7A1E]">Paroissien:</span> {selectedRecord.memberFirstName} {selectedRecord.memberLastName}</p>
              <p><span className="font-bold text-[#9D7A1E]">Code:</span> {selectedRecord.memberCode}</p>
              <p><span className="font-bold text-[#9D7A1E]">Certificat:</span> {selectedRecord.certificateNumber}</p>
              <p><span className="font-bold text-[#9D7A1E]">Date:</span> {formatDate(selectedRecord.sacramentDate)}</p>
              <p><span className="font-bold text-[#9D7A1E]">Lieu:</span> {selectedRecord.place || '-'}</p>
              <p><span className="font-bold text-[#9D7A1E]">Officiant:</span> {selectedRecord.officiant || '-'}</p>
              <p><span className="font-bold text-[#9D7A1E]">Parrain:</span> {selectedRecord.sponsor1Name || '-'}</p>
              <p><span className="font-bold text-[#9D7A1E]">Marraine:</span> {selectedRecord.sponsor2Name || '-'}</p>
              <p><span className="font-bold text-[#9D7A1E]">Notes:</span> {selectedRecord.notes || '-'}</p>
            </div>

            <div className="mt-5 rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] p-4 text-sm font-semibold text-[#667085]">
              La modification et les certificats se font dans la page Sacrements. Cette page est reservee a la consultation officielle des registres.
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

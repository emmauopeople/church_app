import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { listMembers } from '../members/members.api';
import type { Member } from '../members/members.types';
import { createSacrament, listSacraments, listSacramentTypes, updateSacrament } from './sacraments.api';
import type { Sacrament, SacramentType, UpdateSacramentPayload } from './sacraments.types';

const inputClass = 'h-10 w-full rounded-lg border border-[#D9CFB8] bg-[#FFFDF8] px-3 text-sm outline-none focus:border-[#D4AF37]';
const labelClass = 'space-y-1.5';
const labelTextClass = 'text-xs font-bold uppercase tracking-wide text-[#667085]';

type SelectedParishioner = {
  id: string;
  memberCode: string;
  fullName: string;
  dateOfBirth?: string | null;
};

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function getNullableText(formData: FormData, key: string) {
  const value = getText(formData, key);
  return value || null;
}

function toSelectedParishioner(member: Member): SelectedParishioner {
  return {
    id: member.id,
    memberCode: member.memberCode,
    fullName: `${member.firstName} ${member.lastName}`,
    dateOfBirth: member.dateOfBirth,
  };
}

function toSelectedParishionerFromRecord(record: Sacrament): SelectedParishioner {
  return {
    id: record.memberId,
    memberCode: record.memberCode,
    fullName: `${record.memberFirstName} ${record.memberLastName}`,
  };
}

function findRequestedType(types: SacramentType[], requestedType: string | null) {
  if (!requestedType) {
    return undefined;
  }

  const normalized = requestedType.toLowerCase();
  const keywordMap: Record<string, string[]> = {
    baptism: ['bapt', 'bapteme'],
    marriage: ['mari', 'marriage'],
    confirmation: ['confirm'],
  };
  const keywords = keywordMap[normalized] ?? [normalized];

  return types.find((type) => {
    const code = type.code.toLowerCase();
    const name = type.name.toLowerCase();
    return keywords.some((keyword) => code.includes(keyword) || name.includes(keyword));
  });
}

function isConfirmationType(type?: SacramentType) {
  if (!type) {
    return false;
  }

  const code = type.code.toLowerCase();
  const name = type.name.toLowerCase();
  return code.includes('confirm') || name.includes('confirm');
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-';
}

export function SacramentsPage() {
  const [searchParams] = useSearchParams();
  const queryMemberId = searchParams.get('memberId') ?? '';
  const queryMemberName = searchParams.get('memberName') ?? '';
  const queryMemberCode = searchParams.get('memberCode') ?? '';
  const queryType = searchParams.get('type');

  const [sacramentTypes, setSacramentTypes] = useState<SacramentType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedParishioner, setSelectedParishioner] = useState<SelectedParishioner | null>(null);
  const [records, setRecords] = useState<Sacrament[]>([]);
  const [recordSearchTerm, setRecordSearchTerm] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<Sacrament | null>(null);
  const [editingRecord, setEditingRecord] = useState<Sacrament | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [sponsor1Name, setSponsor1Name] = useState('');
  const [sponsor2Name, setSponsor2Name] = useState('');
  const [refreshRecordsKey, setRefreshRecordsKey] = useState(0);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedSacramentType = sacramentTypes.find((type) => String(type.id) === selectedTypeId);
  const selectedIsConfirmation = isConfirmationType(selectedSacramentType);

  const duplicateSacramentRecord = useMemo(() => {
    if (!selectedParishioner || !selectedTypeId) {
      return null;
    }

    return records.find((record) => (
      record.memberId === selectedParishioner.id &&
      String(record.sacramentTypeId) === selectedTypeId &&
      record.id !== editingRecord?.id
    )) ?? null;
  }, [editingRecord?.id, records, selectedParishioner, selectedTypeId]);

  const hasDuplicateSacrament = Boolean(duplicateSacramentRecord);

  const filteredRecords = useMemo(() => {
    const search = recordSearchTerm.trim().toLowerCase();

    if (!search) {
      return records;
    }

    return records.filter((record) => {
      const memberName = `${record.memberFirstName} ${record.memberLastName}`.toLowerCase();
      return (
        memberName.includes(search) ||
        record.memberCode.toLowerCase().includes(search) ||
        record.certificateNumber.toLowerCase().includes(search) ||
        record.sacramentTypeName.toLowerCase().includes(search)
      );
    });
  }, [recordSearchTerm, records]);

  useEffect(() => {
    if (queryMemberId) {
      setSelectedParishioner({
        id: queryMemberId,
        memberCode: queryMemberCode,
        fullName: queryMemberName || 'Paroissien selectionne',
      });
    }
  }, [queryMemberCode, queryMemberId, queryMemberName]);

  useEffect(() => {
    async function loadTypes() {
      try {
        setIsLoadingTypes(true);
        setErrorMessage('');

        const response = await listSacramentTypes();
        setSacramentTypes(response.data);

        const requestedType = findRequestedType(response.data, queryType);
        setSelectedTypeId(requestedType ? String(requestedType.id) : '');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les types de sacrement.');
        setSacramentTypes([]);
      } finally {
        setIsLoadingTypes(false);
      }
    }

    loadTypes();
  }, [queryType]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadMembers() {
        try {
          setIsLoadingMembers(true);
          setErrorMessage('');

          const response = await listMembers({
            search: memberSearchTerm.trim() || undefined,
            status: 'ACTIVE',
            page: 1,
            limit: 10,
          });

          setMembers(response.data);

          const selectedFromList = response.data.find((member) => member.id === selectedParishioner?.id);
          if (selectedFromList) {
            setSelectedParishioner(toSelectedParishioner(selectedFromList));
          }
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les paroissiens.');
          setMembers([]);
        } finally {
          setIsLoadingMembers(false);
        }
      }

      loadMembers();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [memberSearchTerm, selectedParishioner?.id]);

  useEffect(() => {
    async function loadRecords() {
      try {
        setIsLoadingRecords(true);
        setErrorMessage('');

        const response = await listSacraments({
          sacramentTypeId: recordTypeFilter ? Number(recordTypeFilter) : undefined,
          page: 1,
          limit: 100,
        });

        setRecords(response.data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les actes sacramentels.');
        setRecords([]);
      } finally {
        setIsLoadingRecords(false);
      }
    }

    loadRecords();
  }, [recordTypeFilter, refreshRecordsKey]);

  useEffect(() => {
    if (selectedIsConfirmation) {
      setSponsor1Name((current) => current || 'N/A');
      setSponsor2Name((current) => current || 'N/A');
    } else {
      setSponsor1Name((current) => (current === 'N/A' ? '' : current));
      setSponsor2Name((current) => (current === 'N/A' ? '' : current));
    }
  }, [selectedIsConfirmation]);

  const handleSelectParishioner = (member: Member) => {
    setSelectedParishioner(toSelectedParishioner(member));
    setEditingRecord(null);
    setSuccessMessage('');
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setSelectedTypeId('');
    setSponsor1Name('');
    setSponsor2Name('');
    setSuccessMessage('');
  };

  const handleStartEditRecord = (record: Sacrament) => {
    setEditingRecord(record);
    setSelectedRecord(null);
    setSelectedParishioner(toSelectedParishionerFromRecord(record));
    setSelectedTypeId(String(record.sacramentTypeId));
    setSponsor1Name(record.sponsor1Name ?? '');
    setSponsor2Name(record.sponsor2Name ?? '');
    setErrorMessage('');
    setSuccessMessage('Mode modification active. Corrigez l acte puis cliquez Mettre a jour.');
    window.setTimeout(() => {
      document.getElementById('sacrament-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const formElement = event.currentTarget;

    if (!selectedParishioner) {
      setErrorMessage('Selectionnez d abord un paroissien dans la liste.');
      return;
    }

    const formData = new FormData(formElement);
    const sacramentTypeId = Number(getText(formData, 'sacramentTypeId'));
    const sacramentDate = getText(formData, 'sacramentDate');
    const sponsor1 = getText(formData, 'sponsor1Name');
    const sponsor2 = getText(formData, 'sponsor2Name');

    if (!sacramentTypeId || !sacramentDate) {
      setErrorMessage('Le type de sacrement et la date sont obligatoires.');
      return;
    }

    if (hasDuplicateSacrament) {
      setErrorMessage('Ce paroissien a deja ce type de sacrement. Ouvrez l acte existant pour le modifier.');
      return;
    }

    if (!sponsor1 || !sponsor2) {
      setErrorMessage('Sponsor 1 et Sponsor 2 sont obligatoires. Pour la confirmation, utilisez N/A si non applicable.');
      return;
    }

    if (!selectedIsConfirmation && (sponsor1.toLowerCase() === 'n/a' || sponsor2.toLowerCase() === 'n/a')) {
      setErrorMessage('Pour ce sacrement, les noms des sponsors doivent etre renseignes. N/A est reserve a la confirmation.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (editingRecord) {
        const payload: UpdateSacramentPayload = {
          certificateNumber: editingRecord.certificateNumber,
          sacramentTypeId,
          sacramentDate,
          place: getNullableText(formData, 'place'),
          officiant: getNullableText(formData, 'officiant'),
          sponsor1Name: sponsor1,
          sponsor2Name: sponsor2,
          notes: getNullableText(formData, 'notes'),
        };
        const response = await updateSacrament(editingRecord.id, payload);
        setRecords((current) => current.map((record) => (record.id === response.data.id ? response.data : record)));
        setSuccessMessage('Acte de sacrement mis a jour avec succes.');
      } else {
        const response = await createSacrament({
          memberId: selectedParishioner.id,
          sacramentTypeId,
          sacramentDate,
          place: getNullableText(formData, 'place'),
          officiant: getNullableText(formData, 'officiant'),
          sponsor1Name: sponsor1,
          sponsor2Name: sponsor2,
          notes: getNullableText(formData, 'notes'),
        });
        setRecords((current) => [response.data, ...current]);
        setSuccessMessage(`Acte de sacrement enregistre avec succes. Numero certificat: ${response.data.certificateNumber}.`);
      }

      formElement.reset();
      setEditingRecord(null);
      setSelectedTypeId('');
      setSponsor1Name('');
      setSponsor2Name('');
      setRefreshRecordsKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d enregistrer le sacrement.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
            <CatholicIcon name="chalice" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Registre sacramentel</p>
            <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Sacrements</h2>
            <p className="text-[#667085]">Selectionnez un paroissien, enregistrez un sacrement, puis gerez les actes existants.</p>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">
          {successMessage}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Selection du paroissien</p>
              <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">Rechercher un paroissien</h3>
            </div>
            {isLoadingMembers && <span className="text-xs font-semibold text-[#667085]">Chargement...</span>}
          </div>

          <label className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
            <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
            <input
              value={memberSearchTerm}
              onChange={(event) => setMemberSearchTerm(event.target.value)}
              placeholder="Nom, code, telephone, email ou ville"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
            />
          </label>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#EEE6D6]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                <tr>
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Naissance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6D6]">
                {members.map((member) => {
                  const isSelected = selectedParishioner?.id === member.id;

                  return (
                    <tr
                      key={member.id}
                      onClick={() => handleSelectParishioner(member)}
                      className={`cursor-pointer transition ${isSelected ? 'bg-[#F4E8C8]' : 'bg-white hover:bg-[#FFF9EE]'}`}
                    >
                      <td className="px-3 py-3 font-bold text-[#0F3D2E]">{member.memberCode}</td>
                      <td className="px-3 py-3 font-semibold text-[#1F2933]">{member.firstName} {member.lastName}</td>
                      <td className="px-3 py-3 text-[#667085]">{formatDate(member.dateOfBirth)}</td>
                    </tr>
                  );
                })}

                {!isLoadingMembers && members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm font-semibold text-[#667085]">
                      Aucun paroissien trouve.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          id="sacrament-form"
          key={editingRecord?.id ?? selectedParishioner?.id ?? 'create'}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm"
        >
          <div className="mb-5 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">
                  {editingRecord ? 'Mode modification' : 'Paroissien selectionne'}
                </p>
                {selectedParishioner ? (
                  <div className="mt-1">
                    <p className="font-serif text-xl font-bold text-[#0F3D2E]">{selectedParishioner.fullName}</p>
                    <p className="text-sm font-semibold text-[#667085]">
                      {selectedParishioner.memberCode} - Naissance: {formatDate(selectedParishioner.dateOfBirth)}
                    </p>
                    {editingRecord && (
                      <p className="mt-1 text-sm font-bold text-[#9D7A1E]">Certificat: {editingRecord.certificateNumber}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-[#667085]">
                    Selectionnez un paroissien a gauche avant d enregistrer un sacrement.
                  </p>
                )}
              </div>

              {editingRecord && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-2 text-xs font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]"
                >
                  Annuler modification
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>Type de sacrement</span>
              <select
                name="sacramentTypeId"
                className={inputClass}
                value={selectedTypeId}
                onChange={(event) => setSelectedTypeId(event.target.value)}
                disabled={isSaving || isLoadingTypes}
                required
              >
                <option value="">Selectionner</option>
                {sacramentTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Date</span>
              <input
                name="sacramentDate"
                type="date"
                className={inputClass}
                defaultValue={formatDate(editingRecord?.sacramentDate).replace('-', '') ? formatDate(editingRecord?.sacramentDate) : ''}
                disabled={isSaving}
                required
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Lieu</span>
              <input name="place" className={inputClass} defaultValue={editingRecord?.place ?? 'Paroisse'} disabled={isSaving} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Officiant</span>
              <input name="officiant" className={inputClass} defaultValue={editingRecord?.officiant ?? ''} disabled={isSaving} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Sponsor 1 / Parrain</span>
              <input
                name="sponsor1Name"
                className={inputClass}
                value={sponsor1Name}
                onChange={(event) => setSponsor1Name(event.target.value)}
                placeholder={selectedIsConfirmation ? 'N/A' : 'Nom du sponsor 1'}
                disabled={isSaving}
                required
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Sponsor 2 / Marraine</span>
              <input
                name="sponsor2Name"
                className={inputClass}
                value={sponsor2Name}
                onChange={(event) => setSponsor2Name(event.target.value)}
                placeholder={selectedIsConfirmation ? 'N/A' : 'Nom du sponsor 2'}
                disabled={isSaving}
                required
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              <span className={labelTextClass}>Notes</span>
              <textarea
                name="notes"
                defaultValue={editingRecord?.notes ?? ''}
                className="min-h-20 w-full rounded-lg border border-[#D9CFB8] bg-[#FFFDF8] px-3 py-2 text-sm outline-none focus:border-[#D4AF37]"
                disabled={isSaving}
              />
            </label>
          </div>

          <p className="mt-3 text-xs font-semibold text-[#667085]">
            Le numero de certificat est genere automatiquement par le systeme. Sponsor 1 et Sponsor 2 sont obligatoires; pour la confirmation, utilisez N/A si non applicable.
          </p>

          {hasDuplicateSacrament && (
            <p className="mt-3 rounded-xl border border-[#F4C7C7] bg-[#FFF5F5] p-3 text-sm font-semibold text-[#8A1F1F]">
              Ce paroissien a deja ce type de sacrement. Selectionnez l acte existant dans le tableau pour le modifier.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !selectedParishioner || hasDuplicateSacrament}
              className="rounded-xl bg-[#0F3D2E] px-5 py-2.5 font-semibold text-white hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Enregistrement...' : editingRecord ? 'Mettre a jour l acte' : 'Enregistrer le sacrement'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Registres existants</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Actes sacramentels</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] xl:w-[620px]">
            <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
              <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
              <input
                value={recordSearchTerm}
                onChange={(event) => setRecordSearchTerm(event.target.value)}
                placeholder="Rechercher acte, paroissien ou certificat"
                className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[#98A2B3]"
              />
            </label>
            <select
              value={recordTypeFilter}
              onChange={(event) => setRecordTypeFilter(event.target.value)}
              className="h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]"
            >
              <option value="">Tous les sacrements</option>
              {sacramentTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
              <tr>
                <th className="px-4 py-3">Paroissien</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Certificat</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Officiant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6D6]">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="cursor-pointer bg-white transition hover:bg-[#FFF9EE]"
                >
                  <td className="px-4 py-3 font-semibold text-[#1F2933]">
                    {record.memberFirstName} {record.memberLastName}
                    <span className="block text-xs font-bold text-[#667085]">{record.memberCode}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-[#0F3D2E]">{record.sacramentTypeName}</td>
                  <td className="px-4 py-3 text-[#667085]">{record.certificateNumber}</td>
                  <td className="px-4 py-3 text-[#667085]">{formatDate(record.sacramentDate)}</td>
                  <td className="px-4 py-3 text-[#667085]">{record.officiant || '-'}</td>
                </tr>
              ))}

              {!isLoadingRecords && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm font-semibold text-[#667085]">
                    Aucun acte sacramentel trouve.
                  </td>
                </tr>
              )}

              {isLoadingRecords && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm font-semibold text-[#667085]">
                    Chargement des actes...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="dialog" aria-modal="true">
          <aside className="h-full w-full max-w-md overflow-auto border-l border-[#D8C8A2] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Detail de l acte</p>
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
              <p><span className="font-bold text-[#9D7A1E]">Sponsor 1:</span> {selectedRecord.sponsor1Name || '-'}</p>
              <p><span className="font-bold text-[#9D7A1E]">Sponsor 2:</span> {selectedRecord.sponsor2Name || '-'}</p>
              <p><span className="font-bold text-[#9D7A1E]">Notes:</span> {selectedRecord.notes || '-'}</p>
            </div>

            <div className="mt-5 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleStartEditRecord(selectedRecord)}
                  className="rounded-xl border border-[#D8C8A2] px-4 py-2.5 font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]"
                >
                  Modifier
                </button>
                <button type="button" className="rounded-xl border border-[#D8C8A2] px-4 py-2.5 font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">
                  Apercu certificat
                </button>
              </div>
              <button type="button" className="rounded-xl bg-[#0F3D2E] px-4 py-2.5 font-bold text-white hover:bg-[#145C43]">
                Exporter PDF
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

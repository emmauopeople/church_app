import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { createSacrament, listSacraments, listSacramentTypes } from './sacraments.api';
import type { Sacrament, SacramentType } from './sacraments.types';

const inputClass = 'h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]';
const labelClass = 'space-y-2';
const labelTextClass = 'text-sm font-semibold text-[#344054]';

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function getNullableText(formData: FormData, key: string) {
  const value = getText(formData, key);
  return value || null;
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

function formatDate(value: string) {
  return value ? value.slice(0, 10) : '-';
}

export function SacramentsPage() {
  const [searchParams] = useSearchParams();
  const queryMemberId = searchParams.get('memberId') ?? '';
  const queryMemberName = searchParams.get('memberName') ?? '';
  const queryMemberCode = searchParams.get('memberCode') ?? '';
  const queryType = searchParams.get('type');

  const [sacramentTypes, setSacramentTypes] = useState<SacramentType[]>([]);
  const [sacraments, setSacraments] = useState<Sacrament[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [sponsor1Name, setSponsor1Name] = useState('');
  const [sponsor2Name, setSponsor2Name] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedSacramentType = sacramentTypes.find((type) => String(type.id) === selectedTypeId);
  const selectedIsConfirmation = isConfirmationType(selectedSacramentType);

  useEffect(() => {
    async function loadSacramentPage() {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const [typesResponse, sacramentsResponse] = await Promise.all([
          listSacramentTypes(),
          listSacraments({ memberId: queryMemberId || undefined, page: 1, limit: 20 }),
        ]);

        setSacramentTypes(typesResponse.data);
        setSacraments(sacramentsResponse.data);

        const requestedType = findRequestedType(typesResponse.data, queryType);
        setSelectedTypeId(requestedType ? String(requestedType.id) : '');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les sacrements.');
        setSacramentTypes([]);
        setSacraments([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSacramentPage();
  }, [queryMemberId, queryType]);

  useEffect(() => {
    if (selectedIsConfirmation) {
      setSponsor1Name((current) => current || 'N/A');
      setSponsor2Name((current) => current || 'N/A');
    } else if (sponsor1Name === 'N/A' && sponsor2Name === 'N/A') {
      setSponsor1Name('');
      setSponsor2Name('');
    }
  }, [selectedIsConfirmation, sponsor1Name, sponsor2Name]);

  const reloadSacraments = async () => {
    const response = await listSacraments({ memberId: queryMemberId || undefined, page: 1, limit: 20 });
    setSacraments(response.data);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!queryMemberId) {
      setErrorMessage('Selectionnez d abord un paroissien dans le module Paroissiens.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const sacramentTypeId = Number(getText(formData, 'sacramentTypeId'));
    const certificateNumber = getText(formData, 'certificateNumber');
    const sacramentDate = getText(formData, 'sacramentDate');
    const sponsor1 = getText(formData, 'sponsor1Name');
    const sponsor2 = getText(formData, 'sponsor2Name');

    if (!sacramentTypeId || !certificateNumber || !sacramentDate) {
      setErrorMessage('Le type de sacrement, le numero de certificat et la date sont obligatoires.');
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

      await createSacrament({
        memberId: queryMemberId,
        sacramentTypeId,
        certificateNumber,
        sacramentDate,
        place: getNullableText(formData, 'place'),
        officiant: getNullableText(formData, 'officiant'),
        sponsor1Name: sponsor1,
        sponsor2Name: sponsor2,
        notes: getNullableText(formData, 'notes'),
      });

      event.currentTarget.reset();
      setSelectedTypeId(String(sacramentTypeId));
      setSponsor1Name(selectedIsConfirmation ? 'N/A' : '');
      setSponsor2Name(selectedIsConfirmation ? 'N/A' : '');
      await reloadSacraments();
      setSuccessMessage('Acte de sacrement enregistre avec succes.');
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
            <p className="text-[#667085]">Enregistrer les actes de bapteme, mariage et confirmation.</p>
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
          <div className="mb-6 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Paroissien selectionne</p>
            {queryMemberId ? (
              <div className="mt-2">
                <p className="font-serif text-xl font-bold text-[#0F3D2E]">{queryMemberName || 'Paroissien selectionne'}</p>
                <p className="text-sm font-semibold text-[#667085]">{queryMemberCode}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-[#667085]">
                Selectionnez un paroissien dans le module Paroissiens, puis cliquez Bapteme, Mariage ou Confirmation.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>Type de sacrement</span>
              <select
                name="sacramentTypeId"
                className={inputClass}
                value={selectedTypeId}
                onChange={(event) => setSelectedTypeId(event.target.value)}
                disabled={isSaving || isLoading}
                required
              >
                <option value="">Selectionner</option>
                {sacramentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Numero de certificat</span>
              <input name="certificateNumber" className={inputClass} placeholder="CERT-0001" disabled={isSaving} required />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Date du sacrement</span>
              <input name="sacramentDate" type="date" className={inputClass} disabled={isSaving} required />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Lieu</span>
              <input name="place" className={inputClass} defaultValue="Paroisse" disabled={isSaving} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Celebrant / Officiant</span>
              <input name="officiant" className={inputClass} disabled={isSaving} />
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
                className="min-h-24 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#D4AF37]"
                disabled={isSaving}
              />
            </label>
          </div>

          <p className="mt-4 text-xs font-semibold text-[#667085]">
            Sponsor 1 et Sponsor 2 sont obligatoires. Pour la confirmation, vous pouvez utiliser N/A si non applicable.
          </p>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !queryMemberId}
              className="rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer le sacrement'}
            </button>
          </div>
        </form>

        <aside className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Historique</h3>
          <p className="mt-1 text-sm text-[#667085]">
            {queryMemberId ? 'Derniers sacrements du paroissien.' : 'Derniers sacrements enregistres.'}
          </p>

          <div className="mt-5 space-y-3">
            {sacraments.map((sacrament) => (
              <div key={sacrament.id} className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4">
                <p className="font-bold text-[#0F3D2E]">{sacrament.sacramentTypeName}</p>
                <p className="text-sm font-semibold text-[#1F2933]">
                  {sacrament.memberFirstName} {sacrament.memberLastName}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#667085]">
                  Certificat: {sacrament.certificateNumber} - Date: {formatDate(sacrament.sacramentDate)}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#667085]">
                  Sponsor 1: {sacrament.sponsor1Name || '-'} - Sponsor 2: {sacrament.sponsor2Name || '-'}
                </p>
              </div>
            ))}

            {!isLoading && sacraments.length === 0 && (
              <p className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm font-semibold text-[#667085]">
                Aucun sacrement enregistre.
              </p>
            )}

            {isLoading && (
              <p className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 text-sm font-semibold text-[#667085]">
                Chargement des sacrements...
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

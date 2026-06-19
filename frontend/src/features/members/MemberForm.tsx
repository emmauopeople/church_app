import type { FormEvent } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import type { Gender, MaritalStatus, MemberFormValues, MemberStatus } from './members.types';

type MemberFormProps = {
  mode?: 'create' | 'edit';
  initialValues?: MemberFormValues;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: MemberFormValues) => void | Promise<void>;
};

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

function getNullableGender(formData: FormData) {
  const value = getText(formData, 'gender');
  return value ? (value as Gender) : null;
}

function getNullableMaritalStatus(formData: FormData) {
  const value = getText(formData, 'maritalStatus');
  return value ? (value as MaritalStatus) : null;
}

function getStatus(formData: FormData) {
  return getText(formData, 'status') as MemberStatus;
}

function formatDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

export function MemberForm({
  mode = 'create',
  initialValues,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: MemberFormProps) {
  const isEditMode = mode === 'edit';

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const values: MemberFormValues = {
      memberCode: getText(formData, 'memberCode'),
      lastName: getText(formData, 'lastName'),
      firstName: getText(formData, 'firstName'),
      middleName: getNullableText(formData, 'middleName'),
      dateOfBirth: getNullableText(formData, 'dateOfBirth'),
      birthPlace: getNullableText(formData, 'birthPlace'),
      gender: getNullableGender(formData),
      phone: getNullableText(formData, 'phone'),
      email: getNullableText(formData, 'email'),
      address: getNullableText(formData, 'address'),
      city: getNullableText(formData, 'city'),
      country: getNullableText(formData, 'country'),
      fatherName: getNullableText(formData, 'fatherName'),
      motherName: getNullableText(formData, 'motherName'),
      maritalStatus: getNullableMaritalStatus(formData),
      status: getStatus(formData),
    };

    onSubmit(values);
  };

  return (
    <form
      className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
          <CatholicIcon name={isEditMode ? 'save' : 'plus'} className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">
            {isEditMode ? 'Modifier la fiche' : 'Nouvelle fiche'}
          </h3>
          <p className="text-sm text-[#667085]">
            {isEditMode ? 'Corriger les informations du paroissien selectionne.' : 'Formulaire complet pour enregistrer un paroissien.'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className={labelClass}>
          <span className={labelTextClass}>Code membre</span>
          <input name="memberCode" placeholder="MBR-0004" className={inputClass} required disabled={isSubmitting} defaultValue={initialValues?.memberCode ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Nom</span>
          <input name="lastName" className={inputClass} required disabled={isSubmitting} defaultValue={initialValues?.lastName ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Prenom</span>
          <input name="firstName" className={inputClass} required disabled={isSubmitting} defaultValue={initialValues?.firstName ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Deuxieme prenom</span>
          <input name="middleName" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.middleName ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Date de naissance</span>
          <input name="dateOfBirth" type="date" className={inputClass} disabled={isSubmitting} defaultValue={formatDateInput(initialValues?.dateOfBirth)} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Lieu de naissance</span>
          <input name="birthPlace" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.birthPlace ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Sexe</span>
          <select name="gender" className={inputClass} defaultValue={initialValues?.gender ?? ''} disabled={isSubmitting}>
            <option value="">Selectionner</option>
            <option value="MALE">Masculin</option>
            <option value="FEMALE">Feminin</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Statut matrimonial</span>
          <select name="maritalStatus" className={inputClass} defaultValue={initialValues?.maritalStatus ?? ''} disabled={isSubmitting}>
            <option value="">Selectionner</option>
            <option value="SINGLE">Celibataire</option>
            <option value="MARRIED">Marie(e)</option>
            <option value="WIDOWED">Veuf / Veuve</option>
            <option value="DIVORCED">Divorce(e)</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Statut</span>
          <select name="status" className={inputClass} defaultValue={initialValues?.status ?? 'ACTIVE'} disabled={isSubmitting}>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
            <option value="DECEASED">Decede</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Telephone</span>
          <input name="phone" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.phone ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Email</span>
          <input name="email" type="email" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.email ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Adresse</span>
          <input name="address" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.address ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Ville</span>
          <input name="city" className={inputClass} defaultValue={initialValues?.city ?? 'Ouagadougou'} disabled={isSubmitting} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Pays</span>
          <input name="country" className={inputClass} defaultValue={initialValues?.country ?? 'Burkina Faso'} disabled={isSubmitting} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Nom du pere</span>
          <input name="fatherName" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.fatherName ?? ''} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Nom de la mere</span>
          <input name="motherName" className={inputClass} disabled={isSubmitting} defaultValue={initialValues?.motherName ?? ''} />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="reset" disabled={isSubmitting} className="rounded-xl border border-[#D8C8A2] px-5 py-3 font-semibold text-[#0F3D2E] hover:bg-[#FFF9EE] disabled:cursor-not-allowed disabled:opacity-50">
          Effacer
        </button>
        <button type="button" disabled={isSubmitting} onClick={onCancel} className="rounded-xl border border-[#D8C8A2] px-5 py-3 font-semibold text-[#0F3D2E] hover:bg-[#FFF9EE] disabled:cursor-not-allowed disabled:opacity-50">
          Annuler
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Mettre a jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

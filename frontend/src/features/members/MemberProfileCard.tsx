import { useEffect, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import type { Member, MemberStatus } from './members.types';

type MemberProfileCardProps = {
  member: Member | null;
  isUpdatingStatus?: boolean;
  onEdit?: () => void;
  onSetStatus?: (status: MemberStatus) => void;
};

const maritalStatusLabels = {
  SINGLE: 'Celibataire',
  MARRIED: 'Marie(e)',
  WIDOWED: 'Veuf / Veuve',
  DIVORCED: 'Divorce(e)',
};

const statusLabels = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  DECEASED: 'Decede',
};

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-[#EEE6D6] py-3 last:border-b-0">
      <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1F2933]">{value || '-'}</p>
    </div>
  );
}

export function MemberProfileCard({
  member,
  isUpdatingStatus = false,
  onEdit,
  onSetStatus,
}: MemberProfileCardProps) {
  const [showDeceasedConfirm, setShowDeceasedConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    setShowDeceasedConfirm(false);
    setConfirmText('');
  }, [member?.id]);

  if (!member) {
    return (
      <aside className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CatholicIcon name="people" className="h-7 w-7 text-[#D4AF37]" />
          <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">Profil paroissien</h3>
        </div>
        <p className="mt-6 text-sm text-[#667085]">Aucune fiche selectionnee.</p>
      </aside>
    );
  }

  const secondaryStatusAction = member.status === 'ACTIVE'
    ? { label: 'Desactiver', status: 'INACTIVE' as MemberStatus }
    : { label: 'Reactiver', status: 'ACTIVE' as MemberStatus };

  const canMarkDeceased = confirmText.trim().toLowerCase() === 'decede';

  const handleConfirmDeceased = () => {
    if (!canMarkDeceased) {
      return;
    }

    onSetStatus?.('DECEASED');
    setShowDeceasedConfirm(false);
    setConfirmText('');
  };

  return (
    <aside className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4E8C8] text-[#0F3D2E]">
          <CatholicIcon name="cross" className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-serif text-2xl font-bold text-[#0F3D2E]">
          {member.firstName} {member.lastName}
        </h3>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-[#D8C8A2] bg-white px-2 py-2 text-xs font-bold text-[#0F3D2E] transition hover:bg-[#FFF9EE] sm:text-sm"
        >
          Modifier
        </button>
        <button
          type="button"
          disabled={isUpdatingStatus}
          onClick={() => onSetStatus?.(secondaryStatusAction.status)}
          className="rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] px-2 py-2 text-xs font-bold text-[#0F3D2E] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          {secondaryStatusAction.label}
        </button>
        <button
          type="button"
          disabled={isUpdatingStatus || member.status === 'DECEASED'}
          onClick={() => setShowDeceasedConfirm(true)}
          className="rounded-xl border border-[#E7C7C7] bg-[#FFF5F5] px-2 py-2 text-xs font-bold text-[#8A1F1F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        >
          Decede
        </button>
      </div>

      {showDeceasedConfirm && member.status !== 'DECEASED' && (
        <div className="mt-4 rounded-xl border border-[#E7C7C7] bg-[#FFF5F5] p-4 text-left">
          <p className="text-sm font-bold text-[#8A1F1F]">
            Etes-vous sur de vouloir marquer ce paroissien comme decede ?
          </p>
          <p className="mt-2 text-xs font-semibold text-[#667085]">
            Pour continuer, tapez <span className="font-bold text-[#8A1F1F]">decede</span> ci-dessous.
          </p>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={isUpdatingStatus}
            className="mt-3 h-11 w-full rounded-xl border border-[#E7C7C7] bg-white px-3 text-sm outline-none focus:border-[#8A1F1F]"
            placeholder="tapez decede"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => {
                setShowDeceasedConfirm(false);
                setConfirmText('');
              }}
              className="rounded-xl border border-[#D8C8A2] bg-white px-3 py-2 text-sm font-bold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!canMarkDeceased || isUpdatingStatus}
              onClick={handleConfirmDeceased}
              className="rounded-xl bg-[#8A1F1F] px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Marquer decede
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] px-4">
        <FieldRow label="Statut" value={statusLabels[member.status]} />
        <FieldRow label="Date de naissance" value={member.dateOfBirth} />
        <FieldRow label="Lieu de naissance" value={member.birthPlace} />
        <FieldRow label="Telephone" value={member.phone} />
        <FieldRow label="Email" value={member.email} />
        <FieldRow label="Adresse" value={member.address} />
        <FieldRow label="Ville" value={member.city} />
        <FieldRow label="Pays" value={member.country} />
        <FieldRow label="Pere" value={member.fatherName} />
        <FieldRow label="Mere" value={member.motherName} />
        <FieldRow label="Statut matrimonial" value={member.maritalStatus ? maritalStatusLabels[member.maritalStatus] : '-'} />
      </div>
    </aside>
  );
}

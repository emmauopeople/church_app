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

  return (
    <aside className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4E8C8] text-[#0F3D2E]">
          <CatholicIcon name="cross" className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-serif text-2xl font-bold text-[#0F3D2E]">
          {member.firstName} {member.lastName}
        </h3>
        <p className="mt-1 text-sm font-semibold text-[#9D7A1E]">{member.memberCode}</p>

        <button
          type="button"
          onClick={onEdit}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] transition hover:bg-[#FFF9EE]"
        >
          <CatholicIcon name="save" className="h-4 w-4" />
          Modifier
        </button>
      </div>

      <div className="mt-5 grid gap-2">
        {member.status !== 'ACTIVE' && (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onSetStatus?.('ACTIVE')}
            className="rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] px-4 py-2 text-sm font-bold text-[#0F3D2E] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reactiver
          </button>
        )}
        {member.status === 'ACTIVE' && (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onSetStatus?.('INACTIVE')}
            className="rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] px-4 py-2 text-sm font-bold text-[#0F3D2E] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Desactiver
          </button>
        )}
        {member.status !== 'DECEASED' && (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => onSetStatus?.('DECEASED')}
            className="rounded-xl border border-[#E7C7C7] bg-[#FFF5F5] px-4 py-2 text-sm font-bold text-[#8A1F1F] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Marquer decede
          </button>
        )}
      </div>

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

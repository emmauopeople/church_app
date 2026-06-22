import type { Member, MemberStatus } from './members.types';

type MemberListProps = {
  members: Member[];
  selectedMemberId: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onSelectMember: (member: Member) => void;
};

const genderLabels = {
  MALE: 'Masculin',
  FEMALE: 'Feminin',
};

const statusLabels = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  DECEASED: 'Decede',
};

const statusBadgeClass: Record<MemberStatus, string> = {
  ACTIVE: 'bg-[#E7F5EF] text-[#0F3D2E]',
  INACTIVE: 'bg-[#FFF4D6] text-[#7A5A00]',
  DECEASED: 'bg-[#FFF0F0] text-[#8A1F1F]',
};

export function MemberList({
  members,
  selectedMemberId,
  page,
  pageSize,
  total,
  totalPages,
  isLoading = false,
  onPageChange,
  onSelectMember,
}: MemberListProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5DED0] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Registre paroissial</p>
          <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">Liste des paroissiens</h3>
          <p className="text-sm text-[#667085]">Selectionnez une fiche pour voir les details ou modifier le dossier.</p>
        </div>
        <div className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-right">
          <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Resultats</p>
          <p className="text-sm font-bold text-[#0F3D2E]">{startItem}-{endItem} sur {total}</p>
        </div>
      </div>

      <div className="max-h-[500px] overflow-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#F8F3E7] text-xs uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-5 py-3">Paroissien</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Telephone</th>
              <th className="px-5 py-3">Sexe</th>
              <th className="px-5 py-3">Ville</th>
              <th className="px-5 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6D6]">
            {members.map((member) => {
              const isActive = member.id === selectedMemberId;

              return (
                <tr
                  key={member.id}
                  aria-selected={isActive}
                  className={`cursor-pointer transition ${isActive ? 'bg-[#F4E8C8]' : 'bg-white hover:bg-[#FFF9EE]'}`}
                  onClick={() => onSelectMember(member)}
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-[#1F2933]">{member.lastName}</p>
                    <p className="text-[#667085]">{member.firstName}{member.middleName ? ` ${member.middleName}` : ''}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold text-[#0F3D2E]">{member.memberCode}</td>
                  <td className="px-5 py-3 text-[#344054]">{member.phone ?? '-'}</td>
                  <td className="px-5 py-3 text-[#344054]">{member.gender ? genderLabels[member.gender] : '-'}</td>
                  <td className="px-5 py-3 text-[#344054]">{member.city ?? '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass[member.status]}`}>
                      {statusLabels[member.status]}
                    </span>
                  </td>
                </tr>
              );
            })}

            {!isLoading && members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#667085]">
                  Aucun paroissien trouve.
                </td>
              </tr>
            )}

            {isLoading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#667085]">
                  Chargement des paroissiens...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#E5DED0] bg-[#FFF9EE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#667085]">
          Page {page} sur {safeTotalPages} - {pageSize} lignes par page
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={page === 1 || isLoading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="rounded-xl border border-[#D8C8A2] px-4 py-2 text-sm font-semibold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Precedent
          </button>
          <button
            type="button"
            disabled={page >= safeTotalPages || isLoading}
            onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
            className="rounded-xl border border-[#D8C8A2] bg-[#0F3D2E] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

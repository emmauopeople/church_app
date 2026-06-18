import { useEffect, useMemo, useState } from 'react';

import type { Member } from './members.types';

type MemberListProps = {
  members: Member[];
  selectedMemberId: string;
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

const pageSize = 10;

export function MemberList({ members, selectedMemberId, onSelectMember }: MemberListProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(members.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [members]);

  const visibleMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return members.slice(start, start + pageSize);
  }, [members, page]);

  const startItem = members.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, members.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5DED0] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">Liste des paroissiens</h3>
          <p className="text-sm text-[#667085]">Selectionnez une fiche pour voir les details.</p>
        </div>
        <p className="text-sm font-semibold text-[#9D7A1E]">
          {startItem}-{endItem} sur {members.length}
        </p>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#F8F3E7] text-xs uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-5 py-3">Nom</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Telephone</th>
              <th className="px-5 py-3">Sexe</th>
              <th className="px-5 py-3">Ville</th>
              <th className="px-5 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6D6]">
            {visibleMembers.map((member) => {
              const isActive = member.id === selectedMemberId;

              return (
                <tr
                  key={member.id}
                  className={`cursor-pointer transition ${isActive ? 'bg-[#F4E8C8]' : 'hover:bg-[#FFF9EE]'}`}
                  onClick={() => onSelectMember(member)}
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-[#1F2933]">{member.lastName}</p>
                    <p className="text-[#667085]">{member.firstName}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#0F3D2E]">{member.memberCode}</td>
                  <td className="px-5 py-4 text-[#344054]">{member.phone ?? '-'}</td>
                  <td className="px-5 py-4 text-[#344054]">{member.gender ? genderLabels[member.gender] : '-'}</td>
                  <td className="px-5 py-4 text-[#344054]">{member.city ?? '-'}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#E7F5EF] px-3 py-1 text-xs font-bold text-[#0F3D2E]">
                      {statusLabels[member.status]}
                    </span>
                  </td>
                </tr>
              );
            })}

            {visibleMembers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#667085]">
                  Aucun paroissien trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#E5DED0] bg-[#FFF9EE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-[#667085]">
          Page {page} sur {totalPages} - {pageSize} lignes par page
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-xl border border-[#D8C8A2] px-4 py-2 text-sm font-semibold text-[#0F3D2E] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Precedent
          </button>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-xl border border-[#D8C8A2] bg-[#0F3D2E] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

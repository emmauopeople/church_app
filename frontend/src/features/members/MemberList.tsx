import type { Member } from './members.types';

type MemberListProps = {
  members: Member[];
  selectedMemberId: string;
  onSelectMember: (member: Member) => void;
};

const genderLabels = {
  male: 'Masculin',
  female: 'Feminin',
};

export function MemberList({ members, selectedMemberId, onSelectMember }: MemberListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5DED0] bg-white shadow-sm">
      <div className="border-b border-[#E5DED0] bg-[#FFF9EE] px-5 py-4">
        <h3 className="font-serif text-xl font-bold text-[#0F3D2E]">Liste des paroissiens</h3>
        <p className="text-sm text-[#667085]">Selectionnez une fiche pour voir les details.</p>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#F8F3E7] text-xs uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-5 py-3">Nom</th>
              <th className="px-5 py-3">Telephone</th>
              <th className="px-5 py-3">Sexe</th>
              <th className="px-5 py-3">Adresse</th>
              <th className="px-5 py-3">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6D6]">
            {members.map((member) => {
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
                  <td className="px-5 py-4 text-[#344054]">{member.phone}</td>
                  <td className="px-5 py-4 text-[#344054]">{genderLabels[member.gender]}</td>
                  <td className="px-5 py-4 text-[#344054]">{member.address}</td>
                  <td className="px-5 py-4 font-semibold text-[#0F3D2E]">{member.id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

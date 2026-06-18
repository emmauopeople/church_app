import { useMemo, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { MemberForm } from './MemberForm';
import { MemberList } from './MemberList';
import { MemberProfileCard } from './MemberProfileCard';
import { mockMembers } from './members.mock';
import type { Member } from './members.types';

export function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(mockMembers[0] ?? null);
  const [showForm, setShowForm] = useState(false);

  const filteredMembers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return mockMembers;
    }

    return mockMembers.filter((member) => {
      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return (
        fullName.includes(search) ||
        member.phone.toLowerCase().includes(search) ||
        member.id.toLowerCase().includes(search)
      );
    });
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
              <CatholicIcon name="people" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Bureau des paroissiens</p>
              <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Paroissiens</h2>
              <p className="text-[#667085]">Creer, rechercher et modifier les fiches des paroissiens.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#145C43]"
          >
            <CatholicIcon name="plus" className="h-5 w-5" />
            Nouveau paroissien
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E5DED0] bg-white p-4 shadow-sm">
            <label className="flex h-12 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
              <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher par nom, telephone ou reference"
                className="h-full flex-1 bg-transparent outline-none placeholder:text-[#98A2B3]"
              />
            </label>
          </div>

          {showForm && <MemberForm onCancel={() => setShowForm(false)} />}

          <MemberList
            members={filteredMembers}
            selectedMemberId={selectedMember?.id ?? ''}
            onSelectMember={setSelectedMember}
          />
        </div>

        <MemberProfileCard member={selectedMember} />
      </section>
    </div>
  );
}

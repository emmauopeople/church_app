import { useEffect, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { MemberForm } from './MemberForm';
import { MemberList } from './MemberList';
import { MemberProfileCard } from './MemberProfileCard';
import { listMembers } from './members.api';
import type { Member } from './members.types';

const pageSize = 10;

export function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadMembers() {
        try {
          setIsLoading(true);
          setErrorMessage('');

          const response = await listMembers({
            search: searchTerm.trim() || undefined,
            page,
            limit: pageSize,
          });

          setMembers(response.data);
          setPagination({
            total: response.pagination.total,
            totalPages: response.pagination.totalPages,
          });

          setSelectedMember((current) => {
            if (current && response.data.some((member) => member.id === current.id)) {
              return current;
            }

            return response.data[0] ?? null;
          });
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les paroissiens.');
          setMembers([]);
          setSelectedMember(null);
          setPagination({ total: 0, totalPages: 1 });
        } finally {
          setIsLoading(false);
        }
      }

      loadMembers();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [page, searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

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
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Rechercher par nom, code, telephone, email ou ville"
                className="h-full flex-1 bg-transparent outline-none placeholder:text-[#98A2B3]"
              />
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {showForm && <MemberForm onCancel={() => setShowForm(false)} />}

          <MemberList
            members={members}
            selectedMemberId={selectedMember?.id ?? ''}
            page={page}
            pageSize={pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
            onSelectMember={setSelectedMember}
          />
        </div>

        <div className="xl:sticky xl:top-0 xl:max-h-[calc(100dvh-12rem)] xl:overflow-auto">
          <MemberProfileCard member={selectedMember} />
        </div>
      </section>
    </div>
  );
}

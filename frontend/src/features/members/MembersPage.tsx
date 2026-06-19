import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { MemberForm } from './MemberForm';
import { MemberList } from './MemberList';
import { MemberProfileCard } from './MemberProfileCard';
import { createMember, getNextMemberCode, listMembers, updateMember } from './members.api';
import type { Member, MemberFormValues, MemberStatus } from './members.types';

const pageSize = 10;

type FormMode = 'create' | 'edit';

type StatusFilter = MemberStatus | '';

type SacramentShortcut = 'baptism' | 'marriage' | 'confirmation';

function memberToFormValues(member: Member): MemberFormValues {
  return {
    memberCode: member.memberCode,
    firstName: member.firstName,
    lastName: member.lastName,
    middleName: member.middleName ?? null,
    dateOfBirth: member.dateOfBirth ?? null,
    birthPlace: member.birthPlace ?? null,
    gender: member.gender ?? null,
    phone: member.phone ?? null,
    email: member.email ?? null,
    address: member.address ?? null,
    city: member.city ?? null,
    country: member.country ?? null,
    fatherName: member.fatherName ?? null,
    motherName: member.motherName ?? null,
    maritalStatus: member.maritalStatus ?? null,
    status: member.status,
  };
}

function createEmptyMemberFormValues(memberCode = ''): MemberFormValues {
  return {
    memberCode,
    firstName: '',
    lastName: '',
    middleName: null,
    dateOfBirth: null,
    birthPlace: null,
    gender: null,
    phone: null,
    email: null,
    address: null,
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    fatherName: null,
    motherName: null,
    maritalStatus: null,
    status: 'ACTIVE',
  };
}

export function MembersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [createInitialValues, setCreateInitialValues] = useState<MemberFormValues | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
            status: statusFilter || undefined,
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
  }, [page, refreshKey, searchTerm, statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  const openCreateForm = async () => {
    setFormMode('create');
    setEditingMember(null);
    setCreateInitialValues(createEmptyMemberFormValues());
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await getNextMemberCode();
      setCreateInitialValues(createEmptyMemberFormValues(response.data.memberCode));
    } catch {
      setErrorMessage('Impossible de generer le code membre automatiquement. Vous pouvez le saisir manuellement.');
    }
  };

  const openEditForm = () => {
    if (!selectedMember) {
      return;
    }

    setFormMode('edit');
    setEditingMember(selectedMember);
    setCreateInitialValues(undefined);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingMember(null);
    setCreateInitialValues(undefined);
  };

  const handleCreateMember = async (values: MemberFormValues) => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await createMember(values);

      setSelectedMember(response.data);
      closeForm();
      setSearchTerm('');
      setStatusFilter('ACTIVE');
      setPage(1);
      setRefreshKey((current) => current + 1);
      setSuccessMessage('Paroissien enregistre avec succes.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d enregistrer le paroissien.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMember = async (values: MemberFormValues) => {
    if (!editingMember) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await updateMember(editingMember.id, values);

      setSelectedMember(response.data);
      closeForm();
      setRefreshKey((current) => current + 1);
      setSuccessMessage('Fiche paroissien mise a jour avec succes.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de modifier le paroissien.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetMemberStatus = async (status: MemberStatus) => {
    if (!selectedMember) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const response = await updateMember(selectedMember.id, {
        ...memberToFormValues(selectedMember),
        status,
      });

      setSelectedMember(response.data);
      setRefreshKey((current) => current + 1);
      setSuccessMessage('Statut du paroissien mis a jour.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de mettre a jour le statut.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSacrament = (shortcut: SacramentShortcut) => {
    if (!selectedMember) {
      return;
    }

    const params = new URLSearchParams({
      memberId: selectedMember.id,
      memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
      memberCode: selectedMember.memberCode,
      type: shortcut,
    });

    navigate(`/app/sacraments?${params.toString()}`);
  };

  const formInitialValues = formMode === 'edit' && editingMember
    ? memberToFormValues(editingMember)
    : createInitialValues;

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
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#145C43]"
          >
            <CatholicIcon name="plus" className="h-5 w-5" />
            Nouveau paroissien
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid gap-3 rounded-2xl border border-[#E5DED0] bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="flex h-12 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4">
              <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
              <input
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Rechercher par nom, code, telephone, email ou ville"
                className="h-full flex-1 bg-transparent outline-none placeholder:text-[#98A2B3]"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => handleStatusFilterChange(event.target.value as StatusFilter)}
              className="h-12 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 font-semibold text-[#344054] outline-none focus:border-[#D4AF37]"
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="INACTIVE">Inactifs</option>
              <option value="DECEASED">Decedes</option>
            </select>
          </div>

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

          {formMode && (
            <MemberForm
              key={`${formMode}-${editingMember?.id ?? formInitialValues?.memberCode ?? 'new'}`}
              mode={formMode}
              initialValues={formInitialValues}
              isSubmitting={isSaving}
              onCancel={closeForm}
              onSubmit={formMode === 'edit' ? handleUpdateMember : handleCreateMember}
            />
          )}

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
          <MemberProfileCard
            member={selectedMember}
            isUpdatingStatus={isSaving}
            onEdit={openEditForm}
            onSetStatus={handleSetMemberStatus}
            onAddSacrament={handleAddSacrament}
          />
        </div>
      </section>
    </div>
  );
}

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import { createAuthUser, listAuthUsers } from '../auth/auth.api';
import { getStoredUser } from '../auth/auth.storage';
import type { AuthUser } from '../auth/auth.types';

const inputClass = 'h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-');
  return year && month && day ? `${day}/${month}/${year}` : dateOnly;
}

export function SettingsPage() {
  const currentUser = useMemo(() => getStoredUser(), []);
  const isAdmin = currentUser?.role === 'ADMIN';
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeConfirm, setAccessCodeConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadUsers() {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const response = await listAuthUsers();
        setUsers(response.data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, [isAdmin, refreshKey]);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setRole('USER');
    setAccessCode('');
    setAccessCodeConfirm('');
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin) {
      setErrorMessage('Seul un administrateur peut creer des utilisateurs.');
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Le nom complet et l email sont obligatoires.');
      return;
    }

    if (accessCode.length < 8) {
      setErrorMessage('Le code d acces doit contenir au moins 8 caracteres.');
      return;
    }

    if (accessCode !== accessCodeConfirm) {
      setErrorMessage('Les deux codes d acces ne correspondent pas.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      await createAuthUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: accessCode,
        role,
      });
      resetForm();
      setRefreshKey((current) => current + 1);
      setSuccessMessage('Utilisateur cree avec succes.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de creer l utilisateur.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
              <CatholicIcon name="settings" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Administration</p>
              <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Parametres</h2>
              <p className="text-[#667085]">Gerer les comptes utilisateurs du systeme paroissial.</p>
            </div>
          </div>

          {currentUser && (
            <div className="rounded-xl border border-[#D8C8A2] bg-white px-4 py-3 text-sm">
              <p className="font-bold text-[#0F3D2E]">{currentUser.fullName}</p>
              <p className="font-semibold text-[#667085]">{currentUser.email} | {currentUser.role}</p>
            </div>
          )}
        </div>
      </section>

      {errorMessage && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{errorMessage}</p>
          <button type="button" onClick={() => setErrorMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      {successMessage && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">{successMessage}</p>
          <button type="button" onClick={() => setSuccessMessage('')} className="self-start rounded-lg border border-current px-4 py-1.5 text-sm font-bold sm:self-auto">OK</button>
        </div>
      )}

      {!isAdmin && (
        <section className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
          <div className="rounded-xl border border-dashed border-[#D8C8A2] bg-[#FFF9EE] p-6 text-center">
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Acces administrateur requis</h3>
            <p className="mt-2 text-sm font-semibold text-[#667085]">Connectez-vous comme administrateur pour creer des utilisateurs.</p>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <form onSubmit={handleCreateUser} className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Nouvel utilisateur</p>
              <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Creer un compte</h3>
              <p className="mt-1 text-sm font-semibold text-[#667085]">Le compte sera rattache a la paroisse de l administrateur.</p>
            </div>

            <div className="mt-5 space-y-4">
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={`${inputClass} w-full`} placeholder="Nom complet" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} w-full`} placeholder="Email" />
              <select value={role} onChange={(event) => setRole(event.target.value as 'ADMIN' | 'USER')} className={`${inputClass} w-full`}>
                <option value="USER">Utilisateur</option>
                <option value="ADMIN">Administrateur</option>
              </select>
              <input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} className={`${inputClass} w-full`} placeholder="Code d acces temporaire" />
              <input type="password" value={accessCodeConfirm} onChange={(event) => setAccessCodeConfirm(event.target.value)} className={`${inputClass} w-full`} placeholder="Confirmer code d acces" />

              <button type="submit" disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-50">
                <CatholicIcon name="plus" className="h-5 w-5" />
                {isSaving ? 'Creation...' : 'Creer utilisateur'}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Utilisateurs systeme</p>
                <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Comptes de la paroisse</h3>
              </div>
              {isLoading && <span className="text-sm font-semibold text-[#667085]">Chargement...</span>}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-[#EEE6D6]">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Cree le</th>
                    <th className="px-4 py-3">Derniere connexion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6D6]">
                  {users.map((user) => (
                    <tr key={user.id} className="bg-white hover:bg-[#FFF9EE]">
                      <td className="px-4 py-3 font-bold text-[#0F3D2E]">{user.fullName}</td>
                      <td className="px-4 py-3 text-[#667085]">{user.email}</td>
                      <td className="px-4 py-3 text-[#667085]">{user.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}</td>
                      <td className="px-4 py-3 text-[#667085]">{user.status}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-[#667085]">{formatDate(user.lastLoginAt)}</td>
                    </tr>
                  ))}

                  {!isLoading && users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun utilisateur trouve.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

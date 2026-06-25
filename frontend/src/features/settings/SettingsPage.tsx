import { type FormEvent, useEffect, useMemo, useState } from 'react';

import { CatholicIcon } from '../../components/decorative/CatholicIcon';
import {
  createAuthUser,
  listAuthUsers,
  updateAuthUser,
  updateAuthUserStatus,
} from '../auth/auth.api';
import { getStoredUser } from '../auth/auth.storage';
import type { AuthUser } from '../auth/auth.types';
import {
  listAuthAuditLogs,
  listCertificateAuditLogs,
  loadSystemMetrics,
  type ServiceMetricSnapshot,
} from './settings.api';

type SettingsSection = 'users' | 'audit' | 'system';

type AuditRow = {
  id: string;
  source: 'Auth' | 'Certificat';
  action: string;
  status: string;
  actor: string;
  detail: string;
  createdAt: string;
};

const inputClass = 'h-11 rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#344054] outline-none focus:border-[#D4AF37]';
const subtleButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#D8C8A2] bg-white px-4 py-2 text-sm font-bold text-[#0F3D2E] transition hover:bg-[#FFF9EE] disabled:cursor-not-allowed disabled:opacity-50';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-50';

const settingsSections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: 'people' | 'document' | 'dashboard';
}> = [
  {
    id: 'users',
    label: 'Users',
    description: 'Creation, modification et statut des comptes',
    icon: 'people',
  },
  {
    id: 'audit',
    label: 'Audit',
    description: 'Connexions et actions sur les certificats',
    icon: 'document',
  },
  {
    id: 'system',
    label: 'System',
    description: 'CPU, memoire et disponibilite des services',
    icon: 'dashboard',
  },
];

function formatDate(value?: string | null) {
  if (!value) return '-';
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-');
  return year && month && day ? `${day}/${month}/${year}` : dateOnly;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatDate(value);
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function formatMetric(value?: number, suffix = '') {
  if (value === undefined) return '-';
  return `${value.toFixed(1)}${suffix}`;
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    LOGIN: 'Connexion',
    LOGOUT: 'Deconnexion',
    USER_CREATED: 'Utilisateur cree',
    USER_UPDATED: 'Utilisateur modifie',
    USER_ACTIVATED: 'Utilisateur active',
    USER_DEACTIVATED: 'Utilisateur desactive',
    HTML_PREVIEW: 'Apercu HTML certificat',
    PDF_PREVIEW: 'Apercu PDF certificat',
    PDF_DOWNLOAD: 'Telechargement certificat',
    GENERATE_PDF: 'Generation certificat',
  };

  return labels[action] ?? action;
}

export function SettingsPage() {
  const currentUser = useMemo(() => getStoredUser(), []);
  const isAdmin = currentUser?.role === 'ADMIN';
  const [activeSection, setActiveSection] = useState<SettingsSection>('users');
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeConfirm, setAccessCodeConfirm] = useState('');
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [metrics, setMetrics] = useState<ServiceMetricSnapshot[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const isEditing = editingUserId !== null;
  const hasAuditFilters = Boolean(auditSearchTerm || auditActionFilter || auditStartDate || auditEndDate);
  const auditActionOptions = useMemo(() => {
    return Array.from(new Set(auditRows.map((row) => row.action)))
      .sort((first, second) => getActionLabel(first).localeCompare(getActionLabel(second)));
  }, [auditRows]);
  const filteredAuditRows = useMemo(() => {
    const normalizedSearch = auditSearchTerm.trim().toLowerCase();
    const startTimestamp = auditStartDate ? new Date(`${auditStartDate}T00:00:00`).getTime() : null;
    const endTimestamp = auditEndDate ? new Date(`${auditEndDate}T23:59:59.999`).getTime() : null;

    return auditRows.filter((row) => {
      const createdTimestamp = new Date(row.createdAt).getTime();

      if (auditActionFilter && row.action !== auditActionFilter) return false;
      if (startTimestamp !== null && (!Number.isFinite(createdTimestamp) || createdTimestamp < startTimestamp)) return false;
      if (endTimestamp !== null && (!Number.isFinite(createdTimestamp) || createdTimestamp > endTimestamp)) return false;

      if (!normalizedSearch) return true;

      return [
        row.source,
        row.action,
        getActionLabel(row.action),
        row.status,
        row.status === 'SUCCESS' ? 'Succes' : 'Echec',
        row.actor,
        row.detail,
        formatDateTime(row.createdAt),
      ].join(' ').toLowerCase().includes(normalizedSearch);
    });
  }, [auditActionFilter, auditEndDate, auditRows, auditSearchTerm, auditStartDate]);

  useEffect(() => {
    if (!isAdmin || activeSection !== 'users') return;

    async function loadUsers() {
      try {
        setIsLoadingUsers(true);
        setErrorMessage('');
        const response = await listAuthUsers();
        setUsers(response.data);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.');
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    }

    loadUsers();
  }, [activeSection, isAdmin, refreshKey]);

  useEffect(() => {
    if (!isAdmin || activeSection !== 'audit') return;

    async function loadAuditRows() {
      try {
        setIsLoadingAudit(true);
        setErrorMessage('');

        const [authResult, certificateResult] = await Promise.allSettled([
          listAuthAuditLogs(),
          listCertificateAuditLogs(),
        ]);

        const rows: AuditRow[] = [];
        const failures: string[] = [];

        if (authResult.status === 'fulfilled') {
          rows.push(...authResult.value.data.map((log) => ({
            id: `auth-${log.id}`,
            source: 'Auth' as const,
            action: log.action,
            status: log.status,
            actor: log.email ?? log.userId ?? '-',
            detail: log.reason ?? log.ipAddress ?? '-',
            createdAt: log.createdAt,
          })));
        } else {
          failures.push('auth');
        }

        if (certificateResult.status === 'fulfilled') {
          rows.push(...certificateResult.value.data.map((log) => ({
            id: `certificate-${log.id}`,
            source: 'Certificat' as const,
            action: log.action,
            status: 'SUCCESS',
            actor: log.generatedBy,
            detail: log.fileName ?? log.referenceEntityId,
            createdAt: log.createdAt,
          })));
        } else {
          failures.push('certificats');
        }

        rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAuditRows(rows);

        if (failures.length > 0) {
          setErrorMessage(`Certaines donnees audit ne sont pas disponibles: ${failures.join(', ')}.`);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les logs audit.');
        setAuditRows([]);
      } finally {
        setIsLoadingAudit(false);
      }
    }

    loadAuditRows();
  }, [activeSection, isAdmin, refreshKey]);

  useEffect(() => {
    if (!isAdmin || activeSection !== 'system') return;

    async function loadMetrics() {
      try {
        setIsLoadingMetrics(true);
        setErrorMessage('');
        setMetrics(await loadSystemMetrics());
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les metriques systeme.');
        setMetrics([]);
      } finally {
        setIsLoadingMetrics(false);
      }
    }

    loadMetrics();
  }, [activeSection, isAdmin, refreshKey]);

  const resetForm = () => {
    setEditingUserId(null);
    setFullName('');
    setEmail('');
    setRole('USER');
    setAccessCode('');
    setAccessCodeConfirm('');
  };

  const handleEditUser = (user: AuthUser) => {
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setEmail(user.email);
    setRole(user.role);
    setAccessCode('');
    setAccessCodeConfirm('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmitUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdmin) {
      setErrorMessage('Seul un administrateur peut gerer les utilisateurs.');
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Le nom complet et l email sont obligatoires.');
      return;
    }

    if (!isEditing && accessCode.length < 8) {
      setErrorMessage('Le code d acces doit contenir au moins 8 caracteres.');
      return;
    }

    if (!isEditing && accessCode !== accessCodeConfirm) {
      setErrorMessage('Les deux codes d acces ne correspondent pas.');
      return;
    }

    try {
      setIsSavingUser(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (isEditing && editingUserId) {
        await updateAuthUser(editingUserId, {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          role,
        });
        setSuccessMessage('Utilisateur modifie avec succes.');
      } else {
        await createAuthUser({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: accessCode,
          role,
        });
        setSuccessMessage('Utilisateur cree avec succes.');
      }

      resetForm();
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d enregistrer l utilisateur.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUserStatus = async (user: AuthUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      setErrorMessage('');
      setSuccessMessage('');
      await updateAuthUserStatus(user.id, { status: nextStatus });
      setSuccessMessage(nextStatus === 'ACTIVE' ? 'Utilisateur active.' : 'Utilisateur desactive.');
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de changer le statut utilisateur.');
    }
  };

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  const handleClearAuditFilters = () => {
    setAuditSearchTerm('');
    setAuditActionFilter('');
    setAuditStartDate('');
    setAuditEndDate('');
  };

  const renderAdminGate = () => (
    <section className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
      <div className="rounded-xl border border-dashed border-[#D8C8A2] bg-[#FFF9EE] p-6 text-center">
        <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Acces administrateur requis</h3>
        <p className="mt-2 text-sm font-semibold text-[#667085]">Connectez-vous comme administrateur pour ouvrir les parametres.</p>
      </div>
    </section>
  );

  const renderUsersSection = () => (
    <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form onSubmit={handleSubmitUser} className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">{isEditing ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">{isEditing ? 'Mettre a jour le compte' : 'Creer un compte'}</h3>
            <p className="mt-1 text-sm font-semibold text-[#667085]">Le compte reste rattache a la paroisse de l administrateur.</p>
          </div>
          {isEditing && (
            <button type="button" onClick={resetForm} className={subtleButtonClass}>
              Annuler
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={`${inputClass} w-full`} placeholder="Nom complet" />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClass} w-full`} placeholder="Email" />
          <select value={role} onChange={(event) => setRole(event.target.value as 'ADMIN' | 'USER')} className={`${inputClass} w-full`}>
            <option value="USER">Utilisateur</option>
            <option value="ADMIN">Administrateur</option>
          </select>

          {!isEditing && (
            <>
              <input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} className={`${inputClass} w-full`} placeholder="Code d acces temporaire" />
              <input type="password" value={accessCodeConfirm} onChange={(event) => setAccessCodeConfirm(event.target.value)} className={`${inputClass} w-full`} placeholder="Confirmer code d acces" />
            </>
          )}

          <button type="submit" disabled={isSavingUser} className={`${primaryButtonClass} w-full`}>
            <CatholicIcon name={isEditing ? 'save' : 'plus'} className="h-5 w-5" />
            {isSavingUser ? 'Enregistrement...' : isEditing ? 'Enregistrer modifications' : 'Creer utilisateur'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Utilisateurs systeme</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Comptes de la paroisse</h3>
          </div>
          <button type="button" onClick={handleRefresh} className={subtleButtonClass}>
            Actualiser
          </button>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-[#EEE6D6]">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Cree le</th>
                <th className="px-4 py-3">Derniere connexion</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6D6]">
              {users.map((user) => {
                const isCurrentUser = currentUser?.id === user.id;
                const nextStatusLabel = user.status === 'ACTIVE' ? 'Desactiver' : 'Activer';

                return (
                  <tr key={user.id} className="bg-white hover:bg-[#FFF9EE]">
                    <td className="px-4 py-3 font-bold text-[#0F3D2E]">{user.fullName}</td>
                    <td className="px-4 py-3 text-[#667085]">{user.email}</td>
                    <td className="px-4 py-3 text-[#667085]">{user.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {user.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-[#667085]">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleEditUser(user)} className="rounded-lg border border-[#D8C8A2] bg-white px-3 py-1.5 text-xs font-bold text-[#0F3D2E] hover:bg-[#FFF9EE]">
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={isCurrentUser && user.status === 'ACTIVE'}
                          className="rounded-lg bg-[#0F3D2E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#145C43] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {nextStatusLabel}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!isLoadingUsers && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Aucun utilisateur trouve.</td>
                </tr>
              )}

              {isLoadingUsers && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Chargement des utilisateurs...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );

  const renderAuditSection = () => (
    <section className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Journal audit</p>
          <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Activite systeme</h3>
          <p className="mt-1 text-sm font-semibold text-[#667085]">Connexions, deconnexions, gestion des utilisateurs et actions sur certificats.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] px-4 py-2 text-sm font-bold text-[#667085]">
            {filteredAuditRows.length} / {auditRows.length}
          </span>
          <button type="button" onClick={handleRefresh} className={subtleButtonClass}>
            Actualiser
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-[#EEE6D6] bg-[#FFF9EE] p-4 xl:grid-cols-[minmax(0,1fr)_220px_170px_170px_auto]">
        <label className="flex h-11 items-center gap-3 rounded-xl border border-[#D9CFB8] bg-white px-4">
          <CatholicIcon name="search" className="h-5 w-5 text-[#9D7A1E]" />
          <input
            value={auditSearchTerm}
            onChange={(event) => setAuditSearchTerm(event.target.value)}
            placeholder="Rechercher acteur, action ou detail"
            className="h-full flex-1 bg-transparent text-sm font-semibold text-[#344054] outline-none placeholder:text-[#98A2B3]"
          />
        </label>

        <select value={auditActionFilter} onChange={(event) => setAuditActionFilter(event.target.value)} className={inputClass}>
          <option value="">Toutes actions</option>
          {auditActionOptions.map((action) => (
            <option key={action} value={action}>{getActionLabel(action)}</option>
          ))}
        </select>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Debut</span>
          <input type="date" value={auditStartDate} onChange={(event) => setAuditStartDate(event.target.value)} className={inputClass} />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Fin</span>
          <input type="date" value={auditEndDate} onChange={(event) => setAuditEndDate(event.target.value)} className={inputClass} />
        </label>

        <button type="button" onClick={handleClearAuditFilters} disabled={!hasAuditFilters} className={subtleButtonClass}>
          Effacer
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-[#EEE6D6]">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-[#FFF9EE] text-xs uppercase tracking-wide text-[#9D7A1E]">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Acteur</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEE6D6]">
            {filteredAuditRows.map((row) => (
              <tr key={row.id} className="bg-white hover:bg-[#FFF9EE]">
                <td className="px-4 py-3 font-semibold text-[#344054]">{formatDateTime(row.createdAt)}</td>
                <td className="px-4 py-3 text-[#667085]">{row.source}</td>
                <td className="px-4 py-3 font-bold text-[#0F3D2E]">{getActionLabel(row.action)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {row.status === 'SUCCESS' ? 'Succes' : 'Echec'}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#667085]">{row.actor}</td>
                <td className="px-4 py-3 text-[#667085]">{row.detail}</td>
              </tr>
            ))}

            {!isLoadingAudit && filteredAuditRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">
                  {auditRows.length === 0 ? 'Aucun log audit trouve.' : 'Aucun log audit ne correspond aux filtres.'}
                </td>
              </tr>
            )}

            {isLoadingAudit && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-[#667085]">Chargement des logs audit...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSystemMetric = (metric: ServiceMetricSnapshot) => (
    <article key={metric.id} className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">{metric.label}</p>
          <h3 className="mt-1 font-serif text-2xl font-bold text-[#0F3D2E]">{metric.status === 'ok' ? 'En ligne' : 'Indisponible'}</h3>
          <p className="mt-1 break-all text-xs font-semibold text-[#667085]">{metric.url}/metrics</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${metric.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {metric.status === 'ok' ? 'OK' : 'OFF'}
        </span>
      </div>

      {metric.status === 'ok' ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-3">
            <p className="text-xs font-bold uppercase text-[#9D7A1E]">CPU total</p>
            <p className="mt-1 text-2xl font-bold text-[#0F3D2E]">{formatMetric(metric.cpuSeconds, 's')}</p>
          </div>
          <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-3">
            <p className="text-xs font-bold uppercase text-[#9D7A1E]">Memoire RSS</p>
            <p className="mt-1 text-2xl font-bold text-[#0F3D2E]">{formatMetric(metric.memoryRssMb, ' MB')}</p>
          </div>
          <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-3">
            <p className="text-xs font-bold uppercase text-[#9D7A1E]">Heap utilise</p>
            <p className="mt-1 text-2xl font-bold text-[#0F3D2E]">{formatMetric(metric.heapUsedMb, ' MB')}</p>
          </div>
          <div className="rounded-xl border border-[#EEE6D6] bg-[#FFF9EE] p-3">
            <p className="text-xs font-bold uppercase text-[#9D7A1E]">Requetes</p>
            <p className="mt-1 text-2xl font-bold text-[#0F3D2E]">{metric.requestsTotal?.toFixed(0) ?? '-'}</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[#D8C8A2] bg-[#FFF9EE] p-4 text-sm font-semibold text-[#667085]">
          {metric.error ?? 'Metriques non disponibles. Verifiez que le service est demarre et que /metrics est accessible.'}
        </div>
      )}
    </article>
  );

  const renderSystemSection = () => (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#E5DED0] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#9D7A1E]">Tableau systeme</p>
            <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Metriques services</h3>
            <p className="mt-1 text-sm font-semibold text-[#667085]">Lecture directe de la route /metrics de chaque service.</p>
          </div>
          <button type="button" onClick={handleRefresh} className={subtleButtonClass}>
            {isLoadingMetrics ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {metrics.map(renderSystemMetric)}

        {!isLoadingMetrics && metrics.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#D8C8A2] bg-[#FFF9EE] p-6 text-center text-sm font-semibold text-[#667085] xl:col-span-3">
            Aucune metrique chargee.
          </div>
        )}
      </div>
    </section>
  );

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
              <p className="text-[#667085]">Gerer les utilisateurs, consulter les audits et surveiller les services.</p>
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

      <section className="grid gap-3 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${isActive ? 'border-[#D4AF37] bg-[#0F3D2E] text-white' : 'border-[#E5DED0] bg-white text-[#0F3D2E] hover:bg-[#FFF9EE]'}`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/15' : 'bg-[#F4E8C8]'}`}>
                <CatholicIcon name={section.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold">{section.label}</span>
                <span className={`mt-1 block text-xs font-semibold ${isActive ? 'text-white/75' : 'text-[#667085]'}`}>{section.description}</span>
              </span>
            </button>
          );
        })}
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

      {!isAdmin && renderAdminGate()}
      {isAdmin && activeSection === 'users' && renderUsersSection()}
      {isAdmin && activeSection === 'audit' && renderAuditSection()}
      {isAdmin && activeSection === 'system' && renderSystemSection()}
    </div>
  );
}

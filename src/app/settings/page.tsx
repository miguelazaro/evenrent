'use client';

import { useState, useEffect } from 'react';
import { Save, User, Building2, CreditCard, Shield, Users, UserPlus, Trash2, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TIMEZONES = [
  'America/Mexico_City',
  'America/Monterrey',
  'America/Tijuana',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'Europe/Madrid',
];

const CURRENCIES = ['MXN', 'USD', 'EUR', 'COP', 'PEN', 'ARS', 'CLP'];

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  STAFF: 'Staff',
};

const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  FREE:       { label: 'Gratis',      color: 'bg-zinc-100 text-zinc-600' },
  STARTER:    { label: 'Starter',     color: 'bg-blue-100 text-blue-700' },
  PRO:        { label: 'Pro',         color: 'bg-violet-100 text-violet-700' },
  ENTERPRISE: { label: 'Enterprise',  color: 'bg-amber-100 text-amber-700' },
};

type Section = 'perfil' | 'organizacion' | 'plan' | 'seguridad' | 'usuarios';

export default function SettingsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.settings.getProfile.useQuery();
  const { update: updateSession } = useSession();

  const updateProfile = trpc.settings.updateProfile.useMutation({
    onSuccess: async (updated) => {
      await utils.settings.getProfile.invalidate();
      await updateSession({ name: updated.name });
    },
  });
  const updateOrg = trpc.settings.updateOrganization.useMutation({
    onSuccess: () => utils.settings.getProfile.invalidate(),
  });
  const changePassword = trpc.settings.changePassword.useMutation();

  // Equipo
  const { data: teamMembers = [], isLoading: teamLoading } = trpc.settings.getTeamMembers.useQuery();
  const inviteUser    = trpc.settings.inviteUser.useMutation({
    onSuccess: () => { utils.settings.getTeamMembers.invalidate(); setInviteOpen(false); resetInvite(); },
  });
  const updateRole    = trpc.settings.updateMemberRole.useMutation({
    onSuccess: () => utils.settings.getTeamMembers.invalidate(),
  });
  const removeMember  = trpc.settings.removeMember.useMutation({
    onSuccess: () => utils.settings.getTeamMembers.invalidate(),
  });

  const [section, setSection] = useState<Section>('perfil');

  // Perfil
  const [name, setName]   = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Org
  const [orgName, setOrgName]       = useState('');
  const [timezone, setTimezone]     = useState('');
  const [currency, setCurrency]     = useState('');
  const [orgSaved, setOrgSaved]     = useState(false);

  // Seguridad
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError]     = useState('');
  const [pwdSaved, setPwdSaved]     = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Invitar usuario
  const [inviteOpen, setInviteOpen]     = useState(false);
  const [inviteName, setInviteName]     = useState('');
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteRole, setInviteRole]     = useState<'ADMIN' | 'MANAGER' | 'STAFF'>('MANAGER');
  const [invitePwd, setInvitePwd]       = useState('');
  const [inviteError, setInviteError]   = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  function resetInvite() {
    setInviteName(''); setInviteEmail(''); setInviteRole('MANAGER'); setInvitePwd(''); setInviteError('');
  }

  async function handleInvite() {
    setInviteError('');
    try {
      await inviteUser.mutateAsync({ name: inviteName, email: inviteEmail, role: inviteRole, password: invitePwd });
    } catch (err: any) {
      setInviteError(err?.message ?? 'Error al crear el usuario');
    }
  }

  useEffect(() => {
    if (data) {
      setName(data.name);
      setOrgName(data.organization.name);
      setTimezone(data.organization.timezone);
      setCurrency(data.organization.currency);
    }
  }, [data]);

  async function handleSaveProfile() {
    await updateProfile.mutateAsync({ name });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleSaveOrg() {
    await updateOrg.mutateAsync({ name: orgName, timezone, currency });
    setOrgSaved(true);
    setTimeout(() => setOrgSaved(false), 2500);
  }

  async function handleChangePassword() {
    setPwdError('');
    if (newPwd !== confirmPwd) {
      setPwdError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPwd.length < 6) {
      setPwdError('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (err: any) {
      setPwdError(err?.message ?? 'Error al cambiar la contraseña');
    }
  }

  const navItems: { key: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'perfil',       label: 'Perfil',        icon: User },
    { key: 'organizacion', label: 'Organización',  icon: Building2 },
    { key: 'usuarios',     label: 'Equipo',        icon: Users },
    { key: 'plan',         label: 'Plan & Límites', icon: CreditCard },
    { key: 'seguridad',    label: 'Seguridad',      icon: Shield },
  ];

  const plan = PLAN_LABEL[data?.organization.plan ?? 'FREE'] ?? PLAN_LABEL.FREE;

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <div className="max-w-4xl mx-auto px-6 py-7">

        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Sistema</p>
          <h1 className="text-[22px] font-bold text-zinc-900 mt-0.5 tracking-tight">Configuración</h1>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <aside className="w-44 shrink-0">
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setSection(item.key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-left ${
                      active
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── PERFIL ── */}
            {section === 'perfil' && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                  <p className="text-[13px] font-semibold text-zinc-900">Perfil de usuario</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Tu información personal en evenrent</p>
                </div>

                {isLoading ? (
                  <div className="px-6 py-12 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="px-6 py-5 space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                        <span className="text-[15px] font-bold text-white">
                          {(data?.name ?? 'U').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-zinc-900">{data?.name}</p>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 mt-1`}>
                          {ROLE_LABEL[data?.role ?? ''] ?? data?.role}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-100" />

                    {/* Nombre */}
                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                        Nombre completo
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
                        placeholder="Tu nombre"
                      />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                        Correo electrónico
                        <span className="ml-2 text-[10px] font-normal text-zinc-400">— no editable</span>
                      </label>
                      <input
                        value={data?.email ?? ''}
                        readOnly
                        className="w-full border border-zinc-100 rounded-lg px-3 py-2 text-[13px] text-zinc-400 bg-zinc-50 cursor-not-allowed"
                      />
                    </div>

                    {/* Cuenta desde */}
                    {data?.createdAt && (
                      <p className="text-[11px] text-zinc-400">
                        Cuenta creada el{' '}
                        {format(new Date(data.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isPending || !name.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {updateProfile.isPending ? 'Guardando…' : profileSaved ? '¡Guardado!' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ORGANIZACIÓN ── */}
            {section === 'organizacion' && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                  <p className="text-[13px] font-semibold text-zinc-900">Organización</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Datos de tu empresa en la plataforma</p>
                </div>

                {isLoading ? (
                  <div className="px-6 py-12 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="px-6 py-5 space-y-5">
                    {/* Slug (read-only) */}
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div className="h-8 w-8 rounded-md bg-zinc-900 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-black text-white">ER</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-zinc-800">{data?.organization.name}</p>
                        <p className="text-[10px] text-zinc-400">/{data?.organization.slug}</p>
                      </div>
                    </div>

                    {/* Nombre organización */}
                    <div>
                      <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                        Nombre de la empresa
                      </label>
                      <input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
                        placeholder="Nombre de empresa"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Zona horaria */}
                      <div>
                        <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                          Zona horaria
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors appearance-none cursor-pointer"
                        >
                          {TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>

                      {/* Moneda */}
                      <div>
                        <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                          Moneda
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors appearance-none cursor-pointer"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={handleSaveOrg}
                        disabled={updateOrg.isPending || !orgName.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {updateOrg.isPending ? 'Guardando…' : orgSaved ? '¡Guardado!' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── USUARIOS ── */}
            {section === 'usuarios' && (
              <div className="space-y-4">
                {/* Header + invite button */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-900">Equipo</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {teamMembers.length} de {data?.organization.maxUsers} usuarios en tu plan
                      </p>
                    </div>
                    {['OWNER', 'ADMIN'].includes((data?.role ?? '')) && (
                      <button
                        onClick={() => setInviteOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Añadir usuario
                      </button>
                    )}
                  </div>

                  {/* Lista */}
                  {teamLoading ? (
                    <div className="px-6 py-12 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100">
                      {teamMembers.map((member) => {
                        const isMe = member.id === (data as any)?.id;
                        const canManage = ['OWNER', 'ADMIN'].includes(data?.role ?? '') && !isMe && member.role !== 'OWNER';
                        return (
                          <div key={member.id} className="px-6 py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                                {member.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-[13px] font-medium text-zinc-900 truncate">{member.name}</p>
                                  {isMe && <span className="text-[10px] text-zinc-400">(tú)</span>}
                                </div>
                                <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Role selector */}
                              {canManage ? (
                                <div className="relative">
                                  <select
                                    value={member.role}
                                    onChange={(e) => updateRole.mutate({ userId: member.id, role: e.target.value as any })}
                                    className="appearance-none pl-2 pr-6 py-1 text-[11px] font-semibold rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 cursor-pointer focus:outline-none"
                                  >
                                    <option value="ADMIN">Administrador</option>
                                    <option value="MANAGER">Gerente</option>
                                    <option value="STAFF">Staff</option>
                                  </select>
                                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                                  {ROLE_LABEL[member.role] ?? member.role}
                                </span>
                              )}

                              {/* Remove button */}
                              {canManage && (
                                <button
                                  onClick={() => setRemoveTarget(member.id)}
                                  className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm remove dialog */}
                {removeTarget && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                      <p className="text-[14px] font-semibold text-zinc-900 mb-1">Eliminar usuario</p>
                      <p className="text-[12px] text-zinc-500 mb-5">¿Estas seguro? Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.</p>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setRemoveTarget(null)}
                          className="px-4 py-2 text-[12px] font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                        >Cancelar</button>
                        <button
                          onClick={async () => {
                            await removeMember.mutateAsync({ userId: removeTarget });
                            setRemoveTarget(null);
                          }}
                          disabled={removeMember.isPending}
                          className="px-4 py-2 text-[12px] font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >{removeMember.isPending ? 'Eliminando…' : 'Eliminar'}</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Invite modal */}
                {inviteOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                      <p className="text-[15px] font-bold text-zinc-900 mb-1">Añadir usuario al equipo</p>
                      <p className="text-[11px] text-zinc-400 mb-5">El usuario podrá iniciar sesión con el correo y contraseña que definas</p>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Nombre completo</label>
                          <input
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                            placeholder="Nombre del usuario"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Correo electrónico</label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                            placeholder="correo@empresa.com"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Rol</label>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value as any)}
                              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                            >
                              <option value="ADMIN">Administrador</option>
                              <option value="MANAGER">Gerente</option>
                              <option value="STAFF">Staff</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Contraseña inicial</label>
                            <input
                              type="password"
                              value={invitePwd}
                              onChange={(e) => setInvitePwd(e.target.value)}
                              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400"
                              placeholder="Mínimo 6 car."
                            />
                          </div>
                        </div>

                        {inviteError && (
                          <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                            <p className="text-[11px] text-red-600 font-medium">{inviteError}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end mt-5">
                        <button
                          onClick={() => { setInviteOpen(false); resetInvite(); }}
                          className="px-4 py-2 text-[12px] font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                        >Cancelar</button>
                        <button
                          onClick={handleInvite}
                          disabled={inviteUser.isPending || !inviteName || !inviteEmail || !invitePwd}
                          className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {inviteUser.isPending ? 'Creando…' : 'Añadir'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PLAN ── */}
            {section === 'plan' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-100">
                    <p className="text-[13px] font-semibold text-zinc-900">Plan actual</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Detalles de tu suscripción</p>
                  </div>
                  {isLoading ? (
                    <div className="px-6 py-12 flex items-center justify-center">
                      <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="px-6 py-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${plan.color}`}>
                          {plan.label}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          data?.organization.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {data?.organization.status === 'ACTIVE' ? 'Activo' : data?.organization.status}
                        </span>
                      </div>

                      <div className="h-px bg-zinc-100" />

                      {/* Límites */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 mb-1">
                            Usuarios permitidos
                          </p>
                          <p className="text-[24px] font-bold text-zinc-900 tabular-nums">
                            {data?.organization.maxUsers}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">usuarios en tu plan</p>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 mb-1">
                            Almacenamiento
                          </p>
                          <p className="text-[24px] font-bold text-zinc-900 tabular-nums">
                            {data?.organization.maxStorage}
                            <span className="text-[13px] font-medium text-zinc-400 ml-1">MB</span>
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">límite de archivos</p>
                        </div>
                      </div>

                      {data?.organization.createdAt && (
                        <p className="text-[11px] text-zinc-400">
                          Organización creada el{' '}
                          {format(new Date(data.organization.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900 rounded-xl p-5">
                  <p className="text-[13px] font-semibold text-white mb-1">¿Necesitas más funcionalidades?</p>
                  <p className="text-[11px] text-zinc-400 mb-4">
                    Actualiza tu plan para desbloquear más usuarios, almacenamiento y reportes avanzados.
                  </p>
                  <button className="text-[12px] font-bold bg-white text-zinc-900 px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors">
                    Ver planes disponibles
                  </button>
                </div>
              </div>
            )}

            {/* ── SEGURIDAD ── */}
            {section === 'seguridad' && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100">
                  <p className="text-[13px] font-semibold text-zinc-900">Cambiar contraseña</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Actualiza tu contraseña de acceso</p>
                </div>

                <div className="px-6 py-5 space-y-4">

                  {/* Contraseña actual */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 pr-10 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[11px] font-medium"
                      >
                        {showCurrent ? 'ocultar' : 'ver'}
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100" />

                  {/* Contraseña nueva */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                      Nueva contraseña
                      <span className="ml-2 text-[10px] font-normal text-zinc-400">mínimo 6 caracteres</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 pr-10 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[11px] font-medium"
                      >
                        {showNew ? 'ocultar' : 'ver'}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label className="block text-[12px] font-semibold text-zinc-700 mb-1.5">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 pr-10 text-[13px] text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-colors ${
                          confirmPwd && newPwd !== confirmPwd
                            ? 'border-red-300 focus:border-red-400'
                            : confirmPwd && newPwd === confirmPwd
                            ? 'border-emerald-300 focus:border-emerald-400'
                            : 'border-zinc-200 focus:border-zinc-400'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-[11px] font-medium"
                      >
                        {showConfirm ? 'ocultar' : 'ver'}
                      </button>
                    </div>
                    {confirmPwd && newPwd === confirmPwd && (
                      <p className="text-[11px] text-emerald-600 mt-1">Las contraseñas coinciden</p>
                    )}
                  </div>

                  {/* Error */}
                  {pwdError && (
                    <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-[12px] text-red-600 font-medium">{pwdError}</p>
                    </div>
                  )}

                  {/* Success */}
                  {pwdSaved && (
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                      <p className="text-[12px] text-emerald-600 font-medium">Contraseña actualizada correctamente</p>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={handleChangePassword}
                      disabled={changePassword.isPending || !currentPwd || !newPwd || !confirmPwd}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {changePassword.isPending ? 'Guardando…' : 'Actualizar contraseña'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

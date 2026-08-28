import { useState } from 'react'
import { ShieldCheck, Plus, KeyRound, Pencil } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import useAdminAuthStore from '../../stores/adminAuthStore'
import {
  useAdminAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useSetAdminActive,
  useResetAdminPassword,
} from '../../hooks/useAdminAdmins'

const PERMISSION_LABELS = {
  manageRestaurants:   'Gerenciar restaurantes',
  manageBilling:       'Gerenciar financeiro',
  managePlans:         'Gerenciar plano',
  manageAdmins:        'Gerenciar administradores',
  manageNotifications: 'Gerenciar avisos',
  viewReports:         'Ver relatórios',
}

const EMPTY_PERMISSIONS = Object.fromEntries(Object.keys(PERMISSION_LABELS).map((k) => [k, false]))

function AdminFormModal({ open, onClose, admin }) {
  const isEditing = !!admin
  const [name, setName] = useState(admin?.name || '')
  const [email, setEmail] = useState(admin?.email || '')
  const [password, setPassword] = useState('')
  const [permissions, setPermissions] = useState(admin?.permissions || EMPTY_PERMISSIONS)

  const createAdmin = useCreateAdmin()
  const updateAdmin = useUpdateAdmin()
  const isSaving = createAdmin.isPending || updateAdmin.isPending

  const togglePermission = (key) => setPermissions((p) => ({ ...p, [key]: !p[key] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isEditing) {
      await updateAdmin.mutateAsync({ id: admin._id, name, email, permissions })
    } else {
      await createAdmin.mutateAsync({ name, email, password, permissions })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar administrador' : 'Novo administrador'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {!isEditing && (
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
          />
        )}

        <div>
          <h3 className="text-xs font-semibold uppercase text-muted mb-2">Permissões (abas liberadas)</h3>
          <div className="space-y-2">
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!permissions[key]}
                  onChange={() => togglePermission(key)}
                  className="w-4 h-4 rounded accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" full loading={isSaving}>
          {isEditing ? 'Salvar alterações' : 'Criar administrador'}
        </Button>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ open, onClose, admin }) {
  const [newPassword, setNewPassword] = useState('')
  const resetPassword = useResetAdminPassword()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await resetPassword.mutateAsync({ id: admin._id, newPassword })
    setNewPassword('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Redefinir senha — ${admin?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nova senha"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
        />
        <Button type="submit" full loading={resetPassword.isPending}>Redefinir senha</Button>
      </form>
    </Modal>
  )
}

export default function AdminAdminsPage() {
  const currentUser = useAdminAuthStore((s) => s.user)
  const { data: admins, isLoading } = useAdminAdmins()
  const setActive = useSetAdminActive()

  const [formModal, setFormModal] = useState(null)   // null | {} (novo) | admin (editar)
  const [passwordModal, setPasswordModal] = useState(null) // admin | null

  return (
    <div>
      <PageHeader
        title="Administradores"
        subtitle="Contas com acesso ao painel administrativo"
        action={
          <Button onClick={() => setFormModal({})}>
            <Plus size={16} />
            Novo administrador
          </Button>
        }
      />

      <div className="p-4 sm:p-8 max-w-3xl space-y-3">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          admins?.map((admin) => (
            <Card key={admin._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {admin.name}
                      {admin._id === currentUser?.id && <span className="text-muted font-normal"> (você)</span>}
                    </p>
                    <p className="text-xs text-muted truncate">{admin.email}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(PERMISSION_LABELS)
                        .filter(([key]) => admin.permissions?.[key])
                        .map(([key, label]) => (
                          <span key={key} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {label}
                          </span>
                        ))}
                      {!admin.isActive && (
                        <span className="text-[10px] bg-danger/10 text-danger px-2 py-0.5 rounded-full">Desativado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => setFormModal(admin)}
                    className="p-2 rounded-lg hover:bg-surface-hover"
                    title="Editar"
                  >
                    <Pencil size={15} className="text-muted" />
                  </button>
                  <button
                    onClick={() => setPasswordModal(admin)}
                    className="p-2 rounded-lg hover:bg-surface-hover"
                    title="Redefinir senha"
                  >
                    <KeyRound size={15} className="text-muted" />
                  </button>
                </div>
              </div>

              {admin._id !== currentUser?.id && (
                <div className="mt-3 pt-3 border-t border-muted-border">
                  <Button
                    variant="ghost"
                    className={`!min-h-0 !h-8 !px-3 text-xs ${admin.isActive ? 'text-danger' : 'text-success'}`}
                    loading={setActive.isPending}
                    onClick={() => setActive.mutate({ id: admin._id, isActive: !admin.isActive })}
                  >
                    {admin.isActive ? 'Desativar' : 'Reativar'}
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {formModal !== null && (
        <AdminFormModal
          open
          onClose={() => setFormModal(null)}
          admin={formModal._id ? formModal : null}
        />
      )}

      {passwordModal && (
        <ResetPasswordModal open onClose={() => setPasswordModal(null)} admin={passwordModal} />
      )}
    </div>
  )
}

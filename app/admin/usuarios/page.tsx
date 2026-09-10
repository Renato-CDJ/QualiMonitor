import { AdminUsuarios } from "@/components/admin-usuarios"
import { PageHeader } from "@/components/page-header"

export default function AdminUsuariosPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Gestão de Usuários"
          description="Cadastre, edite e remova os usuários com acesso à plataforma. Defina o perfil de cada um e a senha dos administradores."
        />
        <AdminUsuarios />
      </div>
    </main>
  )
}

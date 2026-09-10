import { AdminOperadores } from "@/components/admin-operadores"
import { PageHeader } from "@/components/page-header"

export default function AdminOperadoresPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Gestão de Operadores"
          description="Cadastre, edite e exclua os operadores monitorados na plataforma."
        />
        <AdminOperadores />
      </div>
    </main>
  )
}

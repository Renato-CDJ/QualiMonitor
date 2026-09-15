import { AdminVisualizarChecklists } from "@/components/admin-visualizar-checklists"
import { PageHeader } from "@/components/page-header"

export default function AdminChecklistsPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader title="Visualizar Checklists" description="Consulte todos os checklists cadastrados na plataforma em uma visão organizada e somente leitura." />
        <AdminVisualizarChecklists />
      </div>
    </main>
  )
}

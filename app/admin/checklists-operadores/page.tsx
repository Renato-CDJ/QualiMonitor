import { AdminChecklistsOperadores } from "@/components/admin-checklists-operadores"
import { PageHeader } from "@/components/page-header"

export default function AdminChecklistsOperadoresPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Checklists & Operadores"
          description="Visualize os checklists em detalhe e importe os operadores de cada carteira por planilha Excel."
        />
        <AdminChecklistsOperadores />
      </div>
    </main>
  )
}

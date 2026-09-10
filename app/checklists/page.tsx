import { ChecklistEditor } from "@/components/checklist-editor"
import { PageHeader } from "@/components/page-header"

export default function ChecklistsPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Editor de Checklist"
          description="Visão do monitor de qualidade. Crie e edite checklists por carteira, ajuste pesos de cada item e defina itens críticos que zeram a nota."
        />
        <ChecklistEditor />
      </div>
    </main>
  )
}

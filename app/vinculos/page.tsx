import { VinculosEditor } from "@/components/vinculos-editor"
import { PageHeader } from "@/components/page-header"

export default function VinculosPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Vínculos de Tabulação"
          description="Vincule cada carteira a um checklist e a uma tabulação. Esses vínculos definem quais tabulações ficam disponíveis na Nova Monitoria e qual checklist é carregado para cada uma delas."
        />
        <VinculosEditor />
      </div>
    </main>
  )
}

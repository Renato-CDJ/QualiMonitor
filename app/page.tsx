import { MonitoriaForm } from "@/components/monitoria-form"
import { PageHeader } from "@/components/page-header"

export default function Page() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Nova Monitoria"
          description="Selecione a carteira, busque o operador e a tabulação para carregar o checklist. A nota inicia em 100 e os apontamentos descontam os pesos definidos."
        />
        <MonitoriaForm />
      </div>
    </main>
  )
}

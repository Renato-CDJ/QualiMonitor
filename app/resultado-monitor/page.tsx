import { ResultadoMonitor } from "@/components/resultado-monitor"
import { PageHeader } from "@/components/page-header"

export default function ResultadoMonitorPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Resultado por Monitor"
          description="Desempenho consolidado por monitor com filtros de monitor, carteiras e período. Inclui notas médias, conformidades e inconformidades pontuadas, insights por carteira e ranking de monitores."
        />
        <ResultadoMonitor />
      </div>
    </main>
  )
}

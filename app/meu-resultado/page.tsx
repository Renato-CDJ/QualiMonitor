import { ResultadoMonitor } from "@/components/resultado-monitor"
import { PageHeader } from "@/components/page-header"

export default function MeuResultadoPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Meu Resultado"
          description="Acompanhe exclusivamente o resultado das monitorias realizadas por você, com volume, notas, conformidade, oportunidades e análise detalhada por carteira e categoria."
        />
        <ResultadoMonitor escopo="proprio" />
      </div>
    </main>
  )
}

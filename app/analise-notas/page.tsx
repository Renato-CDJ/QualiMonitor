import { AnaliseNotas } from "@/components/analise-notas"
import { PageHeader } from "@/components/page-header"

export default function AnaliseNotasPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Análise de Notas"
          description="Visão aprofundada da distribuição das notas: dispersão dos operadores por quadrantes de desempenho, distribuição por faixa (Excelente, Bom, Regular e Crítico), histograma de frequência e nota média."
        />
        <AnaliseNotas />
      </div>
    </main>
  )
}

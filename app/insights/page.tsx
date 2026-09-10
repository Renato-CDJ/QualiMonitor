import { Insights } from "@/components/insights"
import { PageHeader } from "@/components/page-header"

export default function InsightsPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Insights"
          description="Aderência dos itens do checklist: quais geram maior conformidade, quais representam oportunidades (inconformes) e quantos são marcados como 'Não se aplica'. Filtre por carteira e período e explore por tabela ou gráfico."
        />
        <Insights />
      </div>
    </main>
  )
}

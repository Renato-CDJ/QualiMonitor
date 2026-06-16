import { ExportarRelatorio } from "@/components/exportar-relatorio"
import { PageHeader } from "@/components/page-header"

export default function ExportarRelatorioPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Exportar Relatório"
          description="Central de exportação em Excel. Todos os gráficos e tabelas do site estão organizados por seção (Dashboard, Notas por Carteira, Análise de Notas, Insights, Quadrante e Monitoria). Aplique os filtros e exporte cada gráfico individualmente, uma seção inteira ou tudo de uma só vez."
        />
        <ExportarRelatorio />
      </div>
    </main>
  )
}

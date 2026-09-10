import { HistoricoOperador } from "@/components/historico-operador"
import { PageHeader } from "@/components/page-header"

export default function HistoricoOperadorPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Histórico do Operador"
          description="Pesquise um operador específico para visualizar o consolidado completo do seu histórico — desde a primeira monitoria analisada — reunindo as informações de todas as abas analíticas em um só lugar. Os dados são carregados somente após a seleção do operador."
        />
        <HistoricoOperador />
      </div>
    </main>
  )
}

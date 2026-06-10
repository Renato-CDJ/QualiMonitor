import { Operadores } from "@/components/operadores"
import { PageHeader } from "@/components/page-header"

export default function OperadoresPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Operadores"
          description="Ranking de desempenho dos operadores e histórico das monitorias mais recentes."
        />
        <Operadores />
      </div>
    </main>
  )
}

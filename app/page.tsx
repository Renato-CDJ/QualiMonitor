import { Dashboard } from "@/components/dashboard"
import { PageHeader } from "@/components/page-header"

export default function Page() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Dashboard Analítico"
          description="Visão somente leitura para acompanhamento. Comparativos de notas, distribuição, Pareto de inconformidades e análise de quartil."
        />
        <Dashboard />
      </div>
    </main>
  )
}

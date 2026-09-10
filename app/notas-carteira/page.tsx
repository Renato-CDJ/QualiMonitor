import { NotasCarteira } from "@/components/notas-carteira"
import { PageHeader } from "@/components/page-header"

export default function NotasCarteiraPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Notas por Carteira"
          description="Comparativo de notas entre carteiras com filtro de seleção múltipla, ranking por nota e rankings de conformidade e inconformidade dos apontamentos."
        />
        <NotasCarteira />
      </div>
    </main>
  )
}

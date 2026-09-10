import { JornadaOperadorView } from "@/components/jornada-operador-view"
import { PageHeader } from "@/components/page-header"

export default function JornadaOperadorPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Jornada do Operador"
          description="Comparativo das notas, quantidade de operadores e distribuição nos quadrantes Q1 a Q4 segmentado pelo tempo de empresa (0 a 3, 4 a 6 e acima de 7 meses)."
        />
        <JornadaOperadorView />
      </div>
    </main>
  )
}

import { Quadrante } from "@/components/quadrante"
import { PageHeader } from "@/components/page-header"

export default function QuadrantePage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Quadrante"
          description="Cruzamento entre Qualidade (calculada automaticamente pelas notas) e Recebimento (definido manualmente por operador). A matriz 2x2 gera as siglas AA, AB, BA e BB, mapeadas para os quadrantes Q1, Q2, Q3 e Q4."
        />
        <Quadrante />
      </div>
    </main>
  )
}

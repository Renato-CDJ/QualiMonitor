import { AnaliseCategoriaView } from "@/components/analise-categoria-view"
import { PageHeader } from "@/components/page-header"

export default function AnaliseCategoriaPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Análise por Categoria"
          description="Conformidade agrupada por bloco/categoria do checklist. Clique em um bloco para abrir e ver os itens que o compõem, com filtro por carteira."
        />
        <AnaliseCategoriaView />
      </div>
    </main>
  )
}

import { FeedbackInvertido } from "@/components/feedback-invertido"
import { PageHeader } from "@/components/page-header"

export default function FeedbackPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Feedback — Monitoria Invertida"
          description="O monitor chama um operador para que ele se auto-avalie preenchendo o mesmo checklist da monitoria já avaliada. Ao finalizar, o sistema compara o resultado do monitor com o do operador."
        />
        <FeedbackInvertido />
      </div>
    </main>
  )
}

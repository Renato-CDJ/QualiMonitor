"use client"

import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import {
  Upload,
  Download,
  Users,
  ListChecks,
  Trash2,
  Search,
  FileSpreadsheet,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"
import { parseAdmissao, tempoDeEmpresa, formatarData } from "@/lib/analytics"
import { normalizarCarteira } from "@/lib/utils"
import type { Checklist, Operador } from "@/lib/types"

const SEM_BLOCO = "Sem bloco"

/** Remove acentos e normaliza para comparar nomes de colunas da planilha. */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

/** Procura o valor de uma coluna a partir de possíveis nomes (já normalizados). */
function pegarColuna(linha: Record<string, unknown>, possiveis: string[]): string {
  for (const chave of Object.keys(linha)) {
    if (possiveis.includes(normalizar(chave))) {
      const v = linha[chave]
      return v == null ? "" : String(v).trim()
    }
  }
  return ""
}

/**
 * Igual a pegarColuna, mas retorna o valor BRUTO (sem converter para string),
 * preservando datas/números seriais do Excel para o parseAdmissao interpretar.
 */
function pegarColunaCrua(linha: Record<string, unknown>, possiveis: string[]): unknown {
  for (const chave of Object.keys(linha)) {
    if (possiveis.includes(normalizar(chave))) {
      return linha[chave]
    }
  }
  return ""
}

interface LinhaImportada {
  nome: string
  admissao: string
}

export function AdminChecklistsOperadores() {
  const { checklists, operadores, ready } = useQualityData()
  const [aberto, setAberto] = useState<Checklist | null>(null)

  // Operadores agrupados por carteira NORMALIZADA (sem acento/caixa/espaços),
  // para que a contagem e a listagem funcionem mesmo quando a carteira foi
  // digitada de forma ligeiramente diferente do nome do checklist.
  const operadoresPorCarteira = useMemo(() => {
    const mapa = new Map<string, Operador[]>()
    for (const op of operadores) {
      const chave = normalizarCarteira(op.carteira)
      const arr = mapa.get(chave) ?? []
      arr.push(op)
      mapa.set(chave, arr)
    }
    return mapa
  }, [operadores])

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Checklists e Operadores por Carteira</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada carteira possui um checklist. Clique em um checklist para visualizá-lo e importar
            os operadores daquela carteira via planilha Excel. Os operadores importados aparecem
            automaticamente na Nova Monitoria ao selecionar a carteira.
          </p>
        </CardHeader>
        <CardContent>
          {checklists.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum checklist cadastrado. Crie um na aba Editor de Checklist.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {checklists.map((c) => {
                const qtdOperadores =
                  operadoresPorCarteira.get(normalizarCarteira(c.carteira))?.length ?? 0
                const blocos = new Set(
                  c.itens.map((i) => i.bloco?.trim() || SEM_BLOCO),
                ).size
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAberto(c)}
                    className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-secondary/40"
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ListChecks className="size-5" />
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Users className="size-3" /> {qtdOperadores}
                      </Badge>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.carteira}</p>
                      <p className="truncate text-sm text-muted-foreground">{c.nome}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <span className="rounded-md bg-secondary px-2 py-0.5">{c.itens.length} itens</span>
                      <span className="rounded-md bg-secondary px-2 py-0.5">
                        {blocos} {blocos === 1 ? "bloco" : "blocos"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ChecklistDialog
        checklist={aberto}
        operadores={
          aberto ? (operadoresPorCarteira.get(normalizarCarteira(aberto.carteira)) ?? []) : []
        }
        onClose={() => setAberto(null)}
      />
    </div>
  )
}

/* -------------------- Modal do checklist -------------------- */

function ChecklistDialog({
  checklist,
  operadores,
  onClose,
}: {
  checklist: Checklist | null
  operadores: Operador[]
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)
  const [busca, setBusca] = useState("")

  const operadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const lista = [...operadores].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    if (!termo) return lista
    return lista.filter((o) => o.nome.toLowerCase().includes(termo))
  }, [operadores, busca])

  async function importarPlanilha(file: File) {
    if (!checklist) return
    setImportando(true)
    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      if (!ws) {
        toast.error("Planilha vazia ou ilegível.")
        return
      }
      const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })

      const importadas: LinhaImportada[] = linhas
        .map((linha) => ({
          nome: pegarColuna(linha, ["nome", "nome completo", "operador", "colaborador", "agente"]),
          admissao: parseAdmissao(
            pegarColunaCrua(linha, [
              "admissao",
              "admissão",
              "data de admissao",
              "data de admissão",
              "data admissao",
              "data admissão",
              "dt admissao",
              "dt admissão",
            ]),
          ),
        }))
        .filter((r) => r.nome)

      if (importadas.length === 0) {
        toast.error("Nenhuma linha válida encontrada. Verifique a coluna Nome.")
        return
      }

      const existentes = store.getOperadores()
      // Deduplica por nome + carteira (não há mais matrícula).
      const chaveDe = (nome: string) => `${checklist.carteira.toLowerCase()}::${nome.toLowerCase()}`
      const porChave = new Map(
        existentes
          .filter((o) => o.carteira === checklist.carteira)
          .map((o) => [chaveDe(o.nome), o]),
      )
      const resultado = [...existentes]
      let novos = 0
      let atualizados = 0
      let semAdmissao = 0

      for (const r of importadas) {
        if (!r.admissao) semAdmissao++
        const chave = chaveDe(r.nome)
        const existente = porChave.get(chave)
        if (existente) {
          const idx = resultado.findIndex((o) => o.id === existente.id)
          resultado[idx] = {
            ...existente,
            nome: r.nome,
            carteira: checklist.carteira,
            admissao: r.admissao || existente.admissao,
          }
          atualizados++
        } else {
          const novo: Operador = {
            id: store.uid(),
            nome: r.nome,
            carteira: checklist.carteira,
            admissao: r.admissao,
          }
          resultado.push(novo)
          porChave.set(chave, novo)
          novos++
        }
      }

      store.setOperadores(resultado)

      const partes = [`${novos} novo(s)`, `${atualizados} atualizado(s)`]
      if (semAdmissao > 0) partes.push(`${semAdmissao} sem data de admissão`)
      toast.success(`Importação concluída: ${partes.join(", ")}.`)
    } catch (err) {
      console.error("[v0] Erro ao importar planilha:", err)
      toast.error("Não foi possível ler a planilha. Use um arquivo .xlsx, .xls ou .csv.")
    } finally {
      setImportando(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function baixarModelo() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nome", "Admissão"],
      ["João Pereira", "15/03/2023"],
      ["Ana Souza", "02/08/2024"],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Operadores")
    XLSX.writeFile(wb, "modelo-operadores.xlsx")
  }

  function removerOperador(op: Operador) {
    store.setOperadores(store.getOperadores().filter((o) => o.id !== op.id))
    toast.success(`${op.nome} removido da carteira.`)
  }

  return (
    <Dialog open={!!checklist} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-4 overflow-y-auto sm:max-w-4xl lg:max-w-5xl">
        {checklist && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ListChecks className="size-5 text-primary" />
                {checklist.carteira}
              </DialogTitle>
              <DialogDescription>
                {checklist.nome} · {checklist.itens.length} itens
              </DialogDescription>
            </DialogHeader>

            {/* Operadores da carteira */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="size-4" /> Operadores da carteira
                  <Badge variant="secondary">{operadores.length}</Badge>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={baixarModelo} className="gap-1.5">
                    <Download className="size-4" /> Modelo
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={importando}
                    className="gap-1.5"
                  >
                    <Upload className="size-4" />
                    {importando ? "Importando..." : "Importar Excel"}
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void importarPlanilha(file)
                    }}
                  />
                </div>
              </div>

              <p className="flex items-start gap-1.5 rounded-md bg-secondary/40 p-2.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="mt-0.5 size-3.5 shrink-0" />
                A planilha deve conter as colunas <span className="font-medium text-foreground">Nome</span> e{" "}
                <span className="font-medium text-foreground">Admissão</span> (data de admissão). O tempo de
                empresa é calculado automaticamente a partir da admissão. Operadores com o mesmo nome nesta
                carteira são atualizados.
              </p>

              {operadores.length > 0 && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar operador..."
                    className="pl-9"
                  />
                </div>
              )}

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead>Tempo de empresa</TableHead>
                      <TableHead className="w-12 text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operadoresFiltrados.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.nome}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {o.admissao ? formatarData(o.admissao) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{tempoDeEmpresa(o.admissao)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removerOperador(o)}
                            aria-label={`Remover ${o.nome}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {operadoresFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                          {operadores.length === 0
                            ? "Nenhum operador nesta carteira. Importe uma planilha para começar."
                            : "Nenhum operador encontrado para a busca."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

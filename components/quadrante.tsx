"use client"

import { useMemo, useState } from "react"
import { Grid2x2, Plus, Tag, Type, Download, Inbox, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useQualityData } from "@/lib/use-quality-data"
import {
  quadranteOperadores,
  QUADRANTE_MAPA,
  type OperadorQuadrante,
} from "@/lib/aggregations"
import type { NivelRecebimento, SiglaQuadrante } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"
import { toast } from "sonner"

type Visao = "sigla" | "nome"

type SortKey =
  | "operador"
  | "carteira"
  | "volume"
  | "nota"
  | "qualidade"
  | "recebimento"
  | "quadrante"
type SortDir = "asc" | "desc"

const META_QUALIDADE = 85

/** Estilo de cor por sigla de quadrante */
function siglaClass(sigla: SiglaQuadrante | null) {
  switch (sigla) {
    case "AA":
      return "bg-chart-5/15 text-chart-5 border-chart-5/30"
    case "AB":
      return "bg-chart-1/15 text-chart-1 border-chart-1/30"
    case "BA":
      return "bg-chart-3/15 text-chart-3 border-chart-3/30"
    case "BB":
      return "bg-destructive/15 text-destructive border-destructive/30"
    default:
      return "bg-secondary text-muted-foreground border-border"
  }
}

function rotuloVisao(op: OperadorQuadrante, visao: Visao) {
  if (!op.sigla || !op.info) return "—"
  return visao === "sigla" ? `${op.sigla} · ${op.info.quadrante}` : op.info.nome
}

export function Quadrante() {
  const { monitorias, recebimentos, ready, store } = useQualityData()
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")
  const [visao, setVisao] = useState<Visao>("sigla")
  const [sortKey, setSortKey] = useState<SortKey>("nota")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // estado do dialog de recebimento
  const [dialogAberto, setDialogAberto] = useState(false)
  const [operadorSel, setOperadorSel] = useState<string>("")
  const [nivelSel, setNivelSel] = useState<NivelRecebimento>("alto")

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))),
    [monitorias],
  )

  const filtradas = useMemo(
    () =>
      carteiraFiltro === "todas"
        ? monitorias
        : monitorias.filter((m) => m.carteira === carteiraFiltro),
    [monitorias, carteiraFiltro],
  )

  const dados = useMemo(
    () => quadranteOperadores(filtradas, recebimentos, META_QUALIDADE),
    [filtradas, recebimentos],
  )

  // ordem usada para classificar valores categóricos
  const ordemQualidade: Record<string, number> = { alta: 1, baixa: 0 }
  const ordemRecebimento: Record<string, number> = { alto: 2, baixo: 1 }
  const ordemQuadrante: Record<SiglaQuadrante, number> = { AA: 4, AB: 3, BA: 2, BB: 1 }

  const dadosOrdenados = useMemo(() => {
    const valor = (o: OperadorQuadrante): string | number => {
      switch (sortKey) {
        case "operador":
          return o.operador
        case "carteira":
          return o.carteira
        case "volume":
          return o.volume
        case "nota":
          return o.nota
        case "qualidade":
          return ordemQualidade[o.qualidade] ?? -1
        case "recebimento":
          return o.recebimento ? ordemRecebimento[o.recebimento] : 0
        case "quadrante":
          return o.sigla ? ordemQuadrante[o.sigla] : 0
        default:
          return 0
      }
    }
    const arr = [...dados].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb)
      }
      return (va as number) - (vb as number)
    })
    return sortDir === "desc" ? arr.reverse() : arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "operador" || key === "carteira" ? "asc" : "desc")
    }
  }

  // operadores agrupados por quadrante (apenas os com recebimento definido)
  const porQuadrante = useMemo(() => {
    const grupos: Record<SiglaQuadrante, OperadorQuadrante[]> = {
      AA: [],
      AB: [],
      BA: [],
      BB: [],
    }
    for (const d of dados) {
      if (d.sigla) grupos[d.sigla].push(d)
    }
    return grupos
  }, [dados])

  const pendentes = useMemo(() => dados.filter((d) => !d.sigla), [dados])

  function abrirDialog(operador?: string) {
    setOperadorSel(operador ?? "")
    const atual = recebimentos.find((r) => r.operadorNome === operador)
    setNivelSel(atual?.nivel ?? "alto")
    setDialogAberto(true)
  }

  function salvarRecebimento() {
    if (!operadorSel) {
      toast.error("Selecione um operador")
      return
    }
    store.setRecebimentoOperador(operadorSel, nivelSel)
    toast.success(
      `Recebimento ${nivelSel === "alto" ? "Alto" : "Baixo"} definido para ${operadorSel}`,
    )
    setDialogAberto(false)
  }

  function exportarExcel() {
    const linhas = dados.map((o) => ({
      Operador: o.operador,
      Carteira: o.carteira,
      Monitorias: o.volume,
      "Nota Média": o.nota,
      Qualidade: o.qualidade === "alta" ? "Alta" : "Baixa",
      Recebimento: o.recebimento
        ? o.recebimento === "alto"
          ? "Alto"
          : "Baixo"
        : "Pendente",
      Sigla: o.sigla ?? "—",
      Quadrante: o.info?.quadrante ?? "—",
      Classificação: o.info?.nome ?? "Pendente",
    }))
    const ws = XLSX.utils.json_to_sheet(linhas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Quadrante")
    const nome = carteiraFiltro === "todas" ? "todas" : carteiraFiltro
    XLSX.writeFile(wb, `quadrante_${nome}.xlsx`)
  }

  // lista de operadores para o select do dialog
  const operadoresDisponiveis = useMemo(
    () => dados.map((d) => d.operador),
    [dados],
  )

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de ações */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Carteira</Label>
          <Select value={carteiraFiltro} onValueChange={setCarteiraFiltro}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as carteiras</SelectItem>
              {carteiras.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle de visão: Siglas x Nome completo */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Visão da tabela</Label>
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setVisao("sigla")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors",
                visao === "sigla"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Tag className="size-3.5" />
              Siglas
            </button>
            <button
              type="button"
              onClick={() => setVisao("nome")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors",
                visao === "nome"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Type className="size-3.5" />
              Nome completo
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportarExcel} disabled={!dados.length}>
            <Download className="size-4" />
            Exportar Excel
          </Button>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger
              render={
                <Button size="sm" onClick={() => abrirDialog()}>
                  <Plus className="size-4" />
                  Adicionar Recebimento
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Definir Recebimento do Operador</DialogTitle>
                <DialogDescription>
                  O recebimento é definido manualmente. Combinado com a qualidade
                  (calculada pelas notas), gera o quadrante do operador.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-1">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Operador</Label>
                  <Select value={operadorSel} onValueChange={setOperadorSel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadoresDisponiveis.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Posição do Recebimento
                  </Label>
                  <Select
                    value={nivelSel}
                    onValueChange={(v) => setNivelSel(v as NivelRecebimento)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alto">Alto Recebimento (A)</SelectItem>
                      <SelectItem value="baixo">Baixo Recebimento (B)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={salvarRecebimento}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Matriz 2x2 do quadrante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Grid2x2 className="size-4 text-muted-foreground" />
            Matriz de Quadrante · Qualidade x Recebimento
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Eixo vertical = Qualidade (nota média, meta {META_QUALIDADE}) · Eixo
            horizontal = Recebimento (definido manualmente)
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {/* Eixo Y */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                Qualidade
              </span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3">
                {/* Linha superior: Alta Qualidade → AA, AB */}
                <QuadranteCelula
                  sigla="AA"
                  operadores={porQuadrante.AA}
                  visao={visao}
                />
                <QuadranteCelula
                  sigla="AB"
                  operadores={porQuadrante.AB}
                  visao={visao}
                />
                {/* Linha inferior: Baixa Qualidade → BA, BB */}
                <QuadranteCelula
                  sigla="BA"
                  operadores={porQuadrante.BA}
                  visao={visao}
                />
                <QuadranteCelula
                  sigla="BB"
                  operadores={porQuadrante.BB}
                  visao={visao}
                />
              </div>
              {/* Eixo X */}
              <div className="mt-2 grid grid-cols-2 text-center text-xs font-medium text-muted-foreground">
                <span>Alto Recebimento</span>
                <span>Baixo Recebimento</span>
              </div>
              <p className="mt-1 text-center text-xs font-medium text-muted-foreground">
                Recebimento
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado por Operador</CardTitle>
          <p className="text-xs text-muted-foreground">
            Clique no cabeçalho para ordenar · Qualidade calculada pelas notas ·
            Recebimento definido manualmente · Visão:{" "}
            {visao === "sigla" ? "Siglas (AA, AB, BA, BB)" : "Nome completo"}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader
                  label="Operador"
                  sortKey="operador"
                  align="left"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Carteira"
                  sortKey="carteira"
                  align="left"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Monitorias"
                  sortKey="volume"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Nota Média"
                  sortKey="nota"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Qualidade"
                  sortKey="qualidade"
                  align="center"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Recebimento"
                  sortKey="recebimento"
                  align="center"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <SortHeader
                  label="Quadrante"
                  sortKey="quadrante"
                  align="center"
                  activeKey={sortKey}
                  dir={sortDir}
                  onSort={toggleSort}
                />
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosOrdenados.map((o) => (
                <TableRow key={o.operador}>
                  <TableCell className="font-medium">{o.operador}</TableCell>
                  <TableCell className="text-muted-foreground">{o.carteira}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.volume}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {o.nota}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={
                        o.qualidade === "alta"
                          ? "bg-chart-5/15 text-chart-5 border-chart-5/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      }
                    >
                      {o.qualidade === "alta" ? "Alta" : "Baixa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {o.recebimento ? (
                      <Badge
                        variant="outline"
                        className={
                          o.recebimento === "alto"
                            ? "bg-chart-5/15 text-chart-5 border-chart-5/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        }
                      >
                        {o.recebimento === "alto" ? "Alto" : "Baixo"}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Pendente</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {o.sigla ? (
                      <Badge variant="outline" className={siglaClass(o.sigla)}>
                        {rotuloVisao(o, visao)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirDialog(o.operador)}
                    >
                      {o.recebimento ? "Editar" : "Definir"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pendentes.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Inbox className="size-3.5" />
              {pendentes.length} operador(es) sem recebimento definido — clique em
              {" "}&quot;Definir&quot; para classificá-los no quadrante.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SortHeader({
  label,
  sortKey: key,
  align = "right",
  activeKey,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  align?: "left" | "right" | "center"
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = activeKey === key
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : undefined
  const flexClass =
    align === "right"
      ? "flex-row-reverse"
      : align === "center"
        ? "justify-center"
        : ""
  return (
    <TableHead className={alignClass}>
      <button
        type="button"
        onClick={() => onSort(key)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${flexClass} ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  )
}

function QuadranteCelula({
  sigla,
  operadores,
  visao,
}: {
  sigla: SiglaQuadrante
  operadores: OperadorQuadrante[]
  visao: Visao
}) {
  const info = QUADRANTE_MAPA[sigla]
  return (
    <div className={cn("rounded-lg border p-4", siglaClass(sigla))}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">
          {visao === "sigla" ? `${sigla} · ${info.quadrante}` : info.quadrante}
        </span>
        <span className="rounded-full bg-background/40 px-2 py-0.5 text-xs font-medium tabular-nums">
          {operadores.length}
        </span>
      </div>
      <p className="mt-0.5 text-xs opacity-80">
        {visao === "sigla" ? info.quadrante + " · " + info.nome : info.nome}
      </p>
      <ul className="mt-3 flex flex-col gap-1">
        {operadores.length ? (
          operadores.map((o) => (
            <li
              key={o.operador}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="truncate font-medium">{o.operador}</span>
              <span className="shrink-0 tabular-nums opacity-80">{o.nota}</span>
            </li>
          ))
        ) : (
          <li className="text-xs opacity-60">Nenhum operador</li>
        )}
      </ul>
    </div>
  )
}

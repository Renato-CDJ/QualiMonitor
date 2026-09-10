"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Search,
  Trash2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ClipboardList,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CardTitleHint } from "@/components/card-title-hint"
import { useQualityData } from "@/lib/use-quality-data"
import { store } from "@/lib/store"
import { notaColorClass } from "@/lib/analytics"
import type { Monitoria } from "@/lib/types"
import { cn } from "@/lib/utils"

function formatBr(iso: string) {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function contar(m: Monitoria) {
  let conforme = 0
  let inconforme = 0
  let na = 0
  for (const ap of m.apontamentos) {
    if (ap.status === "conforme") conforme++
    else if (ap.status === "inconforme") inconforme++
    else na++
  }
  return { conforme, inconforme, na }
}

export function MinhasMonitorias() {
  const { monitorias, ready } = useQualityData()

  const monitores = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.monitor))).sort(),
    [monitorias],
  )

  const [monitorSelecionado, setMonitorSelecionado] = useState<string>("")
  const [busca, setBusca] = useState("")
  const [alvoExclusao, setAlvoExclusao] = useState<Monitoria | null>(null)

  const minhas = useMemo(() => {
    if (!monitorSelecionado) return []
    const termo = busca.trim().toLowerCase()
    return monitorias
      .filter((m) => m.monitor === monitorSelecionado)
      .filter((m) => {
        if (!termo) return true
        return (
          m.operadorNome.toLowerCase().includes(termo) ||
          m.ecCallId.toLowerCase().includes(termo) ||
          m.carteira.toLowerCase().includes(termo) ||
          m.tabulacao.toLowerCase().includes(termo)
        )
      })
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  }, [monitorias, monitorSelecionado, busca])

  function confirmarExclusao() {
    if (!alvoExclusao) return
    store.removeMonitoria(alvoExclusao.id)
    toast.success("Monitoria excluída.")
    setAlvoExclusao(null)
  }

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitleHint
          icon={<ClipboardList className="size-4 text-primary" />}
          title="Minhas Monitorias"
          description="Busque as monitorias que você realizou, visualize os detalhes e exclua quando necessário"
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Filtros de busca */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Monitor</Label>
            <Select value={monitorSelecionado} onValueChange={setMonitorSelecionado}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione seu nome" />
              </SelectTrigger>
              <SelectContent>
                {monitores.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="mm-busca" className="text-xs text-muted-foreground">
              Buscar
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="mm-busca"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Operador, EC/Call ID, carteira ou tabulação..."
                className="pl-9"
                disabled={!monitorSelecionado}
              />
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {!monitorSelecionado ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <UserCheck className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Selecione um monitor</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Escolha seu nome acima para visualizar as monitorias que você realizou.
            </p>
          </div>
        ) : minhas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-sm font-medium">Nenhuma monitoria encontrada</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Não há monitorias para o filtro informado.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {minhas.length} monitoria{minhas.length > 1 ? "s" : ""} encontrada
              {minhas.length > 1 ? "s" : ""}
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" /> Data
                      </span>
                    </TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Carteira</TableHead>
                    <TableHead>EC / Call ID</TableHead>
                    <TableHead>Tabulação</TableHead>
                    <TableHead className="text-right">Nota</TableHead>
                    <TableHead className="text-center">Conformes</TableHead>
                    <TableHead className="text-center">Inconformes</TableHead>
                    <TableHead className="text-center">N/A</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {minhas.map((m) => {
                    const c = contar(m)
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {formatBr(m.data)}
                          {m.horario && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              {m.horario}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{m.operadorNome}</TableCell>
                        <TableCell className="text-muted-foreground">{m.carteira}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {m.ecCallId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{m.tabulacao}</Badge>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold tabular-nums",
                            notaColorClass(m.nota),
                          )}
                        >
                          {m.nota}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 tabular-nums text-chart-5">
                            <CheckCircle2 className="size-3.5" /> {c.conforme}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 tabular-nums text-destructive">
                            <XCircle className="size-3.5" /> {c.inconforme}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 tabular-nums text-muted-foreground">
                            <MinusCircle className="size-3.5" /> {c.na}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAlvoExclusao(m)}
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-4" /> Excluir
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* Confirmação de exclusão */}
      <Dialog open={Boolean(alvoExclusao)} onOpenChange={(o) => !o && setAlvoExclusao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir monitoria?</DialogTitle>
          </DialogHeader>
          {alvoExclusao && (
            <p className="text-sm text-muted-foreground">
              Esta ação removerá permanentemente a monitoria de{" "}
              <span className="font-medium text-foreground">{alvoExclusao.operadorNome}</span> (
              {alvoExclusao.ecCallId}) realizada em{" "}
              <span className="font-medium text-foreground">{formatBr(alvoExclusao.data)}</span>.
              Não é possível desfazer.
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAlvoExclusao(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarExclusao} className="gap-2">
              <Trash2 className="size-4" /> Excluir agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

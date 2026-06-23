"use client"

import { useMemo, useState } from "react"
import { Wallet, TrendingUp, CheckCircle2, AlertOctagon, ChevronDown, Trophy } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CardTitleHint } from "@/components/card-title-hint"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useQualityData } from "@/lib/use-quality-data"
import { porCarteira, conformidadePorCarteira } from "@/lib/aggregations"
import { CarteiraBarChart, ConformidadeCarteiraChart } from "@/components/dashboard-charts"
import { cn } from "@/lib/utils"

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  tone?: "default" | "good" | "bad"
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tabular-nums",
              tone === "good" && "text-chart-5",
              tone === "bad" && "text-destructive",
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  )
}

function notaTone(n: number) {
  if (n >= 90) return "text-chart-5"
  if (n >= 75) return "text-foreground"
  if (n >= 60) return "text-chart-3"
  return "text-destructive"
}

export function NotasCarteira() {
  const { monitorias, ready } = useQualityData()

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))).sort(),
    [monitorias],
  )

  // Conjunto vazio = todas as carteiras
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())

  const todasSelecionadas = selecionadas.size === 0

  function toggleCarteira(c: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  const filtradas = useMemo(
    () =>
      todasSelecionadas
        ? monitorias
        : monitorias.filter((m) => selecionadas.has(m.carteira)),
    [monitorias, selecionadas, todasSelecionadas],
  )

  const rankNotas = useMemo(() => porCarteira(filtradas), [filtradas])
  const conformidade = useMemo(() => conformidadePorCarteira(filtradas), [filtradas])

  const rankConforme = useMemo(
    () => [...conformidade].sort((a, b) => b.pctConforme - a.pctConforme),
    [conformidade],
  )
  const rankInconforme = useMemo(
    () => [...conformidade].sort((a, b) => b.pctInconforme - a.pctInconforme),
    [conformidade],
  )

  const resumo = useMemo(() => {
    const totalMon = filtradas.length
    const notas = filtradas.map((m) => m.nota)
    const notaMedia = notas.length
      ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10
      : 0
    let conforme = 0
    let inconforme = 0
    for (const m of filtradas) {
      for (const ap of m.apontamentos) {
        if (ap.status === "conforme") conforme++
        else if (ap.status === "inconforme") inconforme++
      }
    }
    const avaliados = conforme + inconforme
    return {
      totalMon,
      notaMedia,
      nCarteiras: rankNotas.length,
      pctConforme: avaliados ? Math.round((conforme / avaliados) * 1000) / 10 : 0,
      pctInconforme: avaliados ? Math.round((inconforme / avaliados) * 1000) / 10 : 0,
    }
  }, [filtradas, rankNotas.length])

  const labelFiltro = todasSelecionadas
    ? "Todas as carteiras"
    : selecionadas.size === 1
      ? Array.from(selecionadas)[0]
      : `${selecionadas.size} carteiras selecionadas`

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filtro de carteiras */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="size-4 text-primary" />
            Filtro de Carteiras
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2">
                  {labelFiltro}
                  <ChevronDown className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Selecionar carteiras</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  setSelecionadas(new Set())
                }}
              >
                <span className={cn(todasSelecionadas && "font-medium text-primary")}>
                  Todas as carteiras
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {carteiras.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={selecionadas.has(c)}
                  onCheckedChange={() => toggleCarteira(c)}
                  closeOnClick={false}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground">
          <span className="inline-flex size-1.5 rounded-full bg-primary" aria-hidden />
          Exibindo:{" "}
          <span className="font-medium text-foreground">{labelFiltro}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Carteiras" value={String(resumo.nCarteiras)} sub={`${resumo.totalMon} monitorias`} />
        <Kpi
          icon={TrendingUp}
          label="Nota média"
          value={String(resumo.notaMedia)}
          tone={resumo.notaMedia >= 75 ? "good" : "bad"}
        />
        <Kpi
          icon={CheckCircle2}
          label="Conformidade"
          value={`${resumo.pctConforme}%`}
          sub="dos itens avaliados"
          tone="good"
        />
        <Kpi
          icon={AlertOctagon}
          label="Inconformidade"
          value={`${resumo.pctInconforme}%`}
          sub="dos itens avaliados"
          tone={resumo.pctInconforme > 0 ? "bad" : "good"}
        />
      </div>

      {/* Gráfico de notas por carteira */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Nota Média por Carteira"
            description="Comparativo das notas das carteiras selecionadas"
          />
        </CardHeader>
        <CardContent>
          {rankNotas.length ? (
            <CarteiraBarChart data={rankNotas} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem dados para as carteiras selecionadas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabela ranking de carteiras */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Ranking de Carteiras por Nota"
            description="Classificação da maior para a menor nota média"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Carteira</TableHead>
                <TableHead className="text-right">Nota média</TableHead>
                <TableHead className="text-right">Monitorias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankNotas.length ? (
                rankNotas.map((r, i) => (
                  <TableRow key={r.carteira}>
                    <TableCell>
                      {i < 3 ? (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Trophy
                            className={cn(
                              "size-4",
                              i === 0 && "text-chart-3",
                              i === 1 && "text-muted-foreground",
                              i === 2 && "text-chart-4",
                            )}
                          />
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.carteira}</TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", notaTone(r.nota))}>
                      {r.nota}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {r.volume}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Sem dados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gráfico de conformidade x inconformidade */}
      <Card>
        <CardHeader>
          <CardTitleHint
            title="Conformidade x Inconformidade por Carteira"
            description="Percentual de itens conformes e inconformes (exclui N.A.)"
          />
        </CardHeader>
        <CardContent>
          {conformidade.length ? (
            <ConformidadeCarteiraChart data={conformidade} />
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sem apontamentos para as carteiras selecionadas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rankings de conformidade e inconformidade */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitleHint
              title="Ranking por Conformidade"
              description="Maior % de itens conformes"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Carteira</TableHead>
                  <TableHead className="text-right">% Conforme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankConforme.length ? (
                  rankConforme.map((r, i) => (
                    <TableRow key={r.carteira}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.carteira}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-chart-5/15 text-chart-5 tabular-nums">
                          {r.pctConforme}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      Sem dados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitleHint
              title="Ranking por Inconformidade"
              description="Maior % de itens inconformes"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Carteira</TableHead>
                  <TableHead className="text-right">% Inconforme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankInconforme.length ? (
                  rankInconforme.map((r, i) => (
                    <TableRow key={r.carteira}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.carteira}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-destructive/15 text-destructive tabular-nums">
                          {r.pctInconforme}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      Sem dados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

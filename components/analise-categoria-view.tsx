"use client"

import { useMemo, useState } from "react"
import { Wallet } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQualityData } from "@/lib/use-quality-data"
import { AnaliseCategoria } from "@/components/analise-categoria"
import { AnalisOperadorComparacao } from "@/components/analise-operador-comparacao"
import { AnalisOperadorDetalhes } from "@/components/analise-operador-detalhes"
import { quadranteOperadores } from "@/lib/aggregations"

export function AnaliseCategoriaView() {
  const { monitorias, checklists, recebimentos } = useQualityData()
  const [carteiraFiltro, setCarteiraFiltro] = useState<string>("todas")
  const [quadranteFiltro, setQuadranteFiltro] = useState<string>("todos")

  const carteiras = useMemo(
    () => Array.from(new Set(monitorias.map((m) => m.carteira))).sort(),
    [monitorias],
  )

  const monitoriasCarteira = useMemo(
    () =>
      carteiraFiltro === "todas"
        ? monitorias
        : monitorias.filter((m) => m.carteira === carteiraFiltro),
    [monitorias, carteiraFiltro],
  )

  const quadrantes = useMemo(
    () => quadranteOperadores(monitoriasCarteira, recebimentos),
    [monitoriasCarteira, recebimentos],
  )

  const filtradas = useMemo(() => {
    if (quadranteFiltro === "todos") return monitoriasCarteira
    const operadoresSelecionados = new Set(
      quadrantes.filter((q) => q.info?.quadrante === quadranteFiltro).map((q) => q.operador),
    )
    return monitoriasCarteira.filter((m) => operadoresSelecionados.has(m.operadorNome))
  }, [monitoriasCarteira, quadrantes, quadranteFiltro])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="carteira-filtro" className="text-xs text-muted-foreground">
            Carteira
          </Label>
          <Select value={carteiraFiltro} onValueChange={setCarteiraFiltro}>
            <SelectTrigger id="carteira-filtro" className="w-56">
              <span className="flex items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Todas as carteiras" />
              </span>
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quadrante-filtro" className="text-xs text-muted-foreground">
            Quadrante
          </Label>
          <Select value={quadranteFiltro} onValueChange={setQuadranteFiltro}>
            <SelectTrigger id="quadrante-filtro" className="w-56">
              <SelectValue placeholder="Todos os quadrantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os quadrantes</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnaliseCategoria monitorias={filtradas} checklists={checklists} carteira={carteiraFiltro} />
      <AnalisOperadorComparacao
        monitorias={filtradas}
        checklists={checklists}
        carteira={carteiraFiltro}
      />
      <AnalisOperadorDetalhes
        monitorias={filtradas}
        checklists={checklists}
        carteira={carteiraFiltro}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronDown,
  Globe,
  HelpCircle,
  Layers,
  MessageSquare,
  MousePointerClick,
  Percent,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useSuperadminGuard } from '@/hooks/useSuperadminGuard'
import { funnelAdminApi } from '@/lib/funnels/admin-api'
import type {
  Funnel,
  FunnelAnalyticsAnswers,
  FunnelAnalyticsOverview,
  FunnelAnalyticsPage,
  FunnelAnalyticsStep,
  FunnelAnalyticsUtm,
} from '@/types/funnels'
import { Spinner } from '@/components/ui/spinner'

type PeriodPreset = '7d' | '30d' | '90d' | 'all'

function getPeriodDates(preset: PeriodPreset): { date_from?: string; date_to?: string } {
  if (preset === 'all') return {}
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const to = new Date().toISOString().split('T')[0]
  return { date_from: from, date_to: to }
}

export default function FunnelResultsPage() {
  const { isChecking } = useSuperadminGuard()
  const params = useParams<{ id: string }>()
  const funnelId = params.id

  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [period, setPeriod] = useState<PeriodPreset>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Analytics states
  const [overview, setOverview] = useState<FunnelAnalyticsOverview | null>(null)
  const [steps, setSteps] = useState<FunnelAnalyticsStep[]>([])
  const [pages, setPages] = useState<FunnelAnalyticsPage[]>([])
  const [utm, setUtm] = useState<FunnelAnalyticsUtm | null>(null)
  const [answers, setAnswers] = useState<FunnelAnalyticsAnswers | null>(null)

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'steps' | 'pages' | 'utm' | 'answers'>('steps')
  const [utmDimension, setUtmDimension] = useState<'source' | 'campaign' | 'content'>('source')

  const loadData = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setIsLoading(true)
    else setIsRefreshing(true)
    setError(null)

    const dateParams = getPeriodDates(period)

    try {
      const [funnelData, overviewData, stepsData, pagesData, utmData, answersData] = await Promise.all([
        funnelAdminApi.get(funnelId),
        funnelAdminApi.getAnalyticsOverview(funnelId, dateParams).catch(() => null),
        funnelAdminApi.getAnalyticsSteps(funnelId, dateParams).catch(() => []),
        funnelAdminApi.getAnalyticsPages(funnelId, dateParams).catch(() => []),
        funnelAdminApi.getAnalyticsUtm(funnelId, dateParams).catch(() => null),
        funnelAdminApi.getAnalyticsAnswers(funnelId, dateParams).catch(() => null),
      ])

      setFunnel(funnelData)
      setOverview(overviewData)
      setSteps(stepsData)
      setPages(pagesData)
      setUtm(utmData)
      setAnswers(answersData)
    } catch (err) {
      console.error('Falha ao carregar métricas do funil', err)
      setError(`Não foi possível carregar as métricas${err instanceof Error ? `: ${err.message}` : ''}`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (isChecking) return
    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, funnelId, period])

  if (isChecking || (isLoading && !funnel)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error && !funnel) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <Link href="/franqueado/funnels" className="mt-4 inline-block text-sm text-pink-400 hover:text-pink-300">
          Voltar para funis
        </Link>
      </div>
    )
  }

  // Identifica a etapa com maior drop-off (perda percentual)
  const maxDropStep = steps.length > 0
    ? steps.reduce((prev, curr) => ((curr.drop_rate || 0) > (prev.drop_rate || 0) ? curr : prev), steps[0])
    : null

  const currentUtmList = utm
    ? utmDimension === 'source'
      ? utm.by_source
      : utmDimension === 'campaign'
      ? utm.by_campaign
      : utm.by_content
    : []

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/franqueado/funnels/${params.id}`}
            className="rounded-lg border border-gray-700 p-2 text-gray-400 transition hover:bg-gray-800 hover:text-white"
            title="Voltar para o editor"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white">{funnel?.name || 'Analytics do Funil'}</h1>
              <span className="rounded-full border border-gray-700 bg-gray-850 px-2 py-0.5 text-xs text-gray-400">
                v{funnel?.version || 1}
              </span>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  funnel?.status === 'published'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                }`}
              >
                {funnel?.status === 'published' ? 'Publicado' : 'Rascunho'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">Métricas de conversão e desempenho em tempo real</p>
          </div>
        </div>

        {/* Filtros de período */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-gray-700 bg-gray-900 p-1 text-xs">
            {(['7d', '30d', '90d', 'all'] as PeriodPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${
                  period === p ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : p === '90d' ? '90 dias' : 'Tudo'}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-gray-800 hover:text-white disabled:opacity-50"
            title="Recarregar dados"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total de Sessões */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Sessões</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{overview?.sessions ?? 0}</p>
          <p className="mt-1 text-xs text-gray-500">Visitas únicas iniciadas</p>
        </div>

        {/* Entradas no Funil */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Inícios do Funil</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{overview?.entries ?? 0}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-purple-400 font-medium">
            <span>{overview?.entry_rate ?? 0}%</span>
            <span className="text-gray-500 font-normal">taxa de início</span>
          </div>
        </div>

        {/* Leads Capturados */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Leads Gerados</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{overview?.leads ?? 0}</p>
          <p className="mt-1 text-xs text-emerald-400 font-medium">Contatos capturados</p>
        </div>

        {/* Taxa de Conversão */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Conversão Geral</span>
            <Percent className="h-4 w-4 text-pink-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-pink-400">{overview?.conversion_rate ?? 0}%</p>
          <p className="mt-1 text-xs text-gray-500">Leads por Sessão</p>
        </div>

        {/* Cliques no WhatsApp */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 transition hover:border-gray-700">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Cliques WhatsApp</span>
            <MousePointerClick className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{overview?.whatsapp_clicks ?? 0}</p>
          <p className="mt-1 text-xs text-gray-500">Redirecionamentos CTA</p>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'steps'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Funil de Etapas ({steps.length})
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'pages'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Globe className="h-4 w-4" />
          Páginas de Origem ({pages.length})
        </button>

        <button
          onClick={() => setActiveTab('utm')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'utm'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          UTMs e Campanhas
        </button>

        <button
          onClick={() => setActiveTab('answers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'answers'
              ? 'border-pink-500 text-pink-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Distribuição de Respostas
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'steps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Retenção e Desistência Etapa por Etapa</h2>
            {maxDropStep && (maxDropStep.drop_rate || 0) > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400">
                <TrendingDown className="h-3.5 w-3.5" />
                Maior perda em: <strong className="font-semibold">{maxDropStep.title || `Etapa ${maxDropStep.position + 1}`}</strong> ({maxDropStep.drop_rate}%)
              </span>
            )}
          </div>

          {steps.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/30 py-12 text-center text-sm text-gray-500">
              Nenhum dado de etapas registrado para este período.
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isFirst = idx === 0
                const isMaxDrop = maxDropStep?.step_id === step.step_id && (step.drop_rate || 0) > 0

                return (
                  <div
                    key={step.step_id || step.tracking_key || idx}
                    className={`rounded-xl border p-4 transition ${
                      isMaxDrop
                        ? 'border-red-500/40 bg-red-950/10'
                        : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-300">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{step.title || '(sem título)'}</p>
                          <p className="text-xs text-gray-500">{step.tracking_key}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <span className="block text-xs text-gray-500">Visualizações</span>
                          <span className="font-semibold text-white">{step.views}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs text-gray-500">Conclusões</span>
                          <span className="font-semibold text-emerald-400">{step.completions}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs text-gray-500">Conversão</span>
                          <span className="font-semibold text-pink-400">{step.conversion_rate}%</span>
                        </div>
                        {!isFirst && (
                          <div className="text-right">
                            <span className="block text-xs text-gray-500">Queda</span>
                            <span className={`font-semibold ${isMaxDrop ? 'text-red-400' : 'text-gray-400'}`}>
                              {step.drop_rate}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra visual de conclusão */}
                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMaxDrop ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, step.conversion_rate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">Desempenho por Página de Origem</h2>
          {pages.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/30 py-12 text-center text-sm text-gray-500">
              Nenhuma página registrada no período.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-gray-800 bg-gray-900 text-xs font-semibold uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Página de Origem</th>
                    <th className="px-4 py-3 text-right">Sessões</th>
                    <th className="px-4 py-3 text-right">Inícios</th>
                    <th className="px-4 py-3 text-right">Taxa de Início</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pages.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-pink-300">
                        {row.source_page || '/ (direto)'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">{row.sessions}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{row.entries}</td>
                      <td className="px-4 py-3 text-right text-purple-400">{row.entry_rate}%</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">{row.leads}</td>
                      <td className="px-4 py-3 text-right font-bold text-pink-400">{row.conversion_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'utm' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-white">Métricas por Parâmetros UTM</h2>
            <div className="flex items-center rounded-lg border border-gray-800 bg-gray-900 p-1 text-xs">
              <button
                onClick={() => setUtmDimension('source')}
                className={`rounded px-3 py-1 transition ${
                  utmDimension === 'source' ? 'bg-pink-500 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Origem (Source)
              </button>
              <button
                onClick={() => setUtmDimension('campaign')}
                className={`rounded px-3 py-1 transition ${
                  utmDimension === 'campaign' ? 'bg-pink-500 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Campanha (Campaign)
              </button>
              <button
                onClick={() => setUtmDimension('content')}
                className={`rounded px-3 py-1 transition ${
                  utmDimension === 'content' ? 'bg-pink-500 text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Criativo (Content)
              </button>
            </div>
          </div>

          {!currentUtmList || currentUtmList.length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/30 py-12 text-center text-sm text-gray-500">
              Nenhum dado de UTM ({utmDimension}) registrado para este período.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="border-b border-gray-800 bg-gray-900 text-xs font-semibold uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3">
                      {utmDimension === 'source' ? 'UTM Source' : utmDimension === 'campaign' ? 'UTM Campaign' : 'UTM Content'}
                    </th>
                    <th className="px-4 py-3 text-right">Sessões</th>
                    <th className="px-4 py-3 text-right">Leads</th>
                    <th className="px-4 py-3 text-right">Taxa de Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {currentUtmList.map((row, idx) => {
                    const value =
                      utmDimension === 'source'
                        ? row.utm_source
                        : utmDimension === 'campaign'
                        ? row.utm_campaign
                        : row.utm_content

                    return (
                      <tr key={idx} className="hover:bg-gray-800/40">
                        <td className="px-4 py-3 font-medium text-white">{value || '(não definido)'}</td>
                        <td className="px-4 py-3 text-right font-medium text-white">{row.sessions}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">{row.leads}</td>
                        <td className="px-4 py-3 text-right font-bold text-pink-400">{row.conversion_rate}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'answers' && (
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-white">Distribuição e Conversão por Resposta</h2>

          {!answers || Object.keys(answers).length === 0 ? (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/30 py-12 text-center text-sm text-gray-500">
              Nenhuma resposta registrada para etapas de múltipla escolha neste período.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(answers).map(([stepKey, optionsList]) => (
                <div key={stepKey} className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <h3 className="text-sm font-semibold text-white">Pergunta ({stepKey})</h3>
                    <span className="text-xs text-gray-500">{optionsList.length} opções com respostas</span>
                  </div>

                  <div className="space-y-3">
                    {optionsList.map((opt, optIdx) => (
                      <div key={optIdx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-200">{opt.label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">{opt.total} respostas ({opt.distribution_rate}%)</span>
                            <span className="font-semibold text-emerald-400">{opt.conversion_rate}% conversão</span>
                          </div>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, opt.distribution_rate))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

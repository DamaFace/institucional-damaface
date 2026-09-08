// lib/funnels/admin-api.ts
// Client isolado das chamadas administrativas do Funnel Center (back-end-funil.md §7).
// Usado só pelo Builder (`app/franqueado/funnels/**`) — nunca importar aqui dentro
// do Runtime público (PDI-front-end-funil.md, Fase 0).

import { apiBackend } from '@/lib/api-backend'
import type {
  Funnel,
  FunnelAsset,
  FunnelStatus,
  FunnelStep,
  FunnelAnalyticsOverview,
  FunnelAnalyticsStep,
  FunnelAnalyticsPage,
  FunnelAnalyticsUtm,
  FunnelAnalyticsAnswers,
} from '@/types/funnels'

export interface CreateFunnelPayload {
  name: string
  slug: string
  description?: string
}

export type UpdateFunnelPayload = Partial<CreateFunnelPayload> & { status?: FunnelStatus }

export type CreateStepPayload = Omit<FunnelStep, 'id'>
export type UpdateStepPayload = Partial<Omit<FunnelStep, 'id'>> & { id?: string | number }

function buildQueryString(params?: Record<string, string | undefined>): string {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  }
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export const funnelAdminApi = {
  /** Rotas reais em `apps/funnels/urls.py` (back-end `api-franqueadora`) — o app é
   * montado em `/funnels/` (core/urls.py) e internamente expõe `admin/funnels/...`,
   * então o caminho completo é sempre `/funnels/admin/funnels/...`. Não confundir com
   * `/admin/` (Django admin site, core/urls.py) — os dois existem e um 404 num não
   * cai silenciosamente no outro. */
  list() {
    return apiBackend.get<Funnel[]>('/funnels/admin/funnels/')
  },

  get(id: string) {
    return apiBackend.get<Funnel & { steps: FunnelStep[] }>(`/funnels/admin/funnels/${id}/`)
  },

  create(payload: CreateFunnelPayload) {
    return apiBackend.post<Funnel>('/funnels/admin/funnels/', payload)
  },

  update(id: string, payload: UpdateFunnelPayload) {
    return apiBackend.patch<Funnel>(`/funnels/admin/funnels/${id}/`, payload)
  },

  remove(id: string) {
    return apiBackend.delete(`/funnels/admin/funnels/${id}/`)
  },

  publish(id: string) {
    return apiBackend.post<Funnel>(`/funnels/admin/funnels/${id}/publish/`)
  },

  createStep(funnelId: string, payload: CreateStepPayload) {
    return apiBackend.post<FunnelStep>(`/funnels/admin/funnels/${funnelId}/steps/`, payload)
  },

  updateStep(funnelId: string, stepId: string, payload: UpdateStepPayload) {
    return apiBackend.patch<FunnelStep>(`/funnels/admin/funnels/${funnelId}/steps/${stepId}/`, payload)
  },

  deleteStep(funnelId: string, stepId: string) {
    return apiBackend.delete(`/funnels/admin/funnels/${funnelId}/steps/${stepId}/`)
  },

  // --- Analytics ---
  getAnalyticsOverview(funnelId: string, params?: { date_from?: string; date_to?: string }) {
    const qs = buildQueryString(params)
    return apiBackend.get<FunnelAnalyticsOverview>(`/funnels/admin/funnels/${funnelId}/analytics/${qs}`)
  },

  getAnalyticsSteps(funnelId: string, params?: { date_from?: string; date_to?: string }) {
    const qs = buildQueryString(params)
    return apiBackend.get<FunnelAnalyticsStep[]>(`/funnels/admin/funnels/${funnelId}/analytics/steps/${qs}`)
  },

  getAnalyticsPages(funnelId: string, params?: { date_from?: string; date_to?: string }) {
    const qs = buildQueryString(params)
    return apiBackend.get<FunnelAnalyticsPage[]>(`/funnels/admin/funnels/${funnelId}/analytics/pages/${qs}`)
  },

  getAnalyticsUtm(funnelId: string, params?: { date_from?: string; date_to?: string; group_by?: string }) {
    const qs = buildQueryString(params)
    return apiBackend.get<FunnelAnalyticsUtm>(`/funnels/admin/funnels/${funnelId}/analytics/utm/${qs}`)
  },

  getAnalyticsAnswers(funnelId: string, params?: { date_from?: string; date_to?: string }) {
    const qs = buildQueryString(params)
    return apiBackend.get<FunnelAnalyticsAnswers>(`/funnels/admin/funnels/${funnelId}/analytics/answers/${qs}`)
  },

  // --- Assets ---
  uploadAsset(file: File, name?: string, procedure?: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name || file.name)
    formData.append('type', 'image')
    if (procedure) formData.append('procedure', procedure)
    return apiBackend.post<FunnelAsset>('/funnels/admin/assets/', formData)
  },
}


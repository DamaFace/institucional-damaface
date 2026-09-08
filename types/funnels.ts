// types/funnels.ts
// Contrato de dados do Funnel Engine (front-end). Espelha o modelo de dados
// proposto em back-end-funil.md §6/§7 — deve ser atualizado assim que o
// back-end confirmar o schema definitivo (ver PDI-front-end-funil.md §6).

export type FunnelBlockType =
  | 'choice'
  | 'image_choice'
  | 'before_after'
  | 'unit_choice'
  | 'text_input'
  | 'phone'
  | 'video'
  | 'testimonial'
  | 'cta'
  | 'result'

export type FunnelStatus = 'draft' | 'published' | 'archived'

export interface FunnelOption {
  id: string
  label: string
  value: string
  asset_id?: string | null
  image_url?: string | null
  next_step_id: string | null
  position: number
}

export interface FunnelBeforeAfterPair {
  id: string
  before_url: string
  after_url: string
  caption?: string
}

export interface FunnelTestimonialItem {
  id: string
  author: string
  content: string
  avatar_url?: string | null
  rating?: number
}

export interface FunnelStep {
  id: string
  type: FunnelBlockType
  title: string
  description?: string
  position: number
  required: boolean
  tracking_key: string
  /** Usado só pelo tipo `choice`/`image_choice`. */
  options?: FunnelOption[]
  /** Usado só pelo tipo `before_after`. */
  pairs?: FunnelBeforeAfterPair[]
  /** Usado só pelo tipo `testimonial`. */
  testimonials?: FunnelTestimonialItem[]
  /** Usado por `video`. */
  video_url?: string
  /** Usado por `text_input`/`phone` — placeholder do campo. */
  placeholder?: string
  /** Usado por `cta`/`result` — texto do botão. */
  cta_label?: string
  /** Próximo step quando o bloco não tem opções (video, cta, text_input, phone, unit_choice). */
  next_step_id?: string | null
}

export interface FunnelConfig {
  id: string
  name: string
  version: number
  /** Step inicial. Se omitido, assume-se `steps[0].id`. */
  entry_step_id?: string
  steps: FunnelStep[]
}

/** Modelo administrativo (Funnel Center) — usado pelo Builder, não pelo Runtime. */
export interface Funnel {
  id: string
  name: string
  slug: string
  description?: string
  status: FunnelStatus
  version: number
  created_by?: string
  created_at: string
  updated_at: string
  published_at?: string | null
}

export interface FunnelAsset {
  id: string
  name: string
  type: 'image' | 'before_after' | 'video' | 'testimonial'
  url: string
  thumbnail_url?: string
  procedure?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export type FunnelEventName =
  | 'funnel_view'
  | 'funnel_start'
  | 'step_view'
  | 'step_answer'
  | 'step_complete'
  | 'lead_started'
  | 'lead_created'
  | 'whatsapp_click'
  | 'funnel_abandon'

export interface FunnelAttribution {
  source_page: string
  source_url: string
  referrer: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
}

export interface FunnelSession {
  id: string
  funnel_id: string
}

export interface FunnelAnalyticsOverview {
  sessions: number
  entries: number
  leads: number
  entry_rate: number
  conversion_rate: number
  whatsapp_clicks: number
  period: {
    from: string | null
    to: string | null
  }
}

export interface FunnelAnalyticsStep {
  step_id: number
  tracking_key: string
  title: string
  position: number
  views: number
  completions: number
  drop_rate: number
  conversion_rate: number
}

export interface FunnelAnalyticsPage {
  source_page: string
  sessions: number
  entries: number
  leads: number
  entry_rate: number
  conversion_rate: number
}

export interface FunnelAnalyticsUtmItem {
  utm_source?: string
  utm_campaign?: string
  utm_content?: string
  sessions: number
  leads: number
  conversion_rate: number
}

export interface FunnelAnalyticsUtm {
  by_source: FunnelAnalyticsUtmItem[]
  by_campaign: FunnelAnalyticsUtmItem[]
  by_content: FunnelAnalyticsUtmItem[]
}

export interface FunnelAnalyticsAnswerOption {
  label: string
  total: number
  distribution_rate: number
  conversion_rate: number
}

export type FunnelAnalyticsAnswers = Record<string, FunnelAnalyticsAnswerOption[]>


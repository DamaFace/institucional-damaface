'use client'

// Página de teste temporária, sem dependência de backend, para validar
// visualmente o Runtime do Funnel Engine em dev. Remover depois da verificação.

import { FunnelLauncher } from '@/components/funnel-runtime/FunnelLauncher'
import { funilExemplo } from '@/lib/funnels/fixtures/funil-exemplo'

export default function DevFunnelPreviewPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <FunnelLauncher
        config={funilExemplo}
        whatsappNumber="5519999999999"
        whatsappMessage="Olá! Quero saber mais."
        ctaLabel="Descubra qual tratamento combina com você"
      />
    </div>
  )
}

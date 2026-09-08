'use client'

// hooks/useFunnelBuilder.ts
// Estado do editor de funil (`app/franqueado/funnels/[id]/page.tsx`), no mesmo
// espírito de `useCourseWizard.ts`: um hook que centraliza o estado local do
// wizard/editor e expõe handlers `handleAddX/handleUpdateX/handleRemoveX`.
//
// Reordenação tem dois caminhos: botões subir/descer (handleMoveStep) e
// drag-and-drop (handleReorderStep, usado pelo @dnd-kit em page.tsx). Ambos
// convergem no mesmo formato de estado — um array com `position` recalculada.

import { useCallback, useState } from 'react'
import type { FunnelBeforeAfterPair, FunnelBlockType, FunnelOption, FunnelStep } from '@/types/funnels'

let localIdCounter = 0
function localId(prefix: string): string {
  localIdCounter += 1
  return `${prefix}_local_${localIdCounter}`
}

const MVP_BLOCK_DEFAULTS: Record<string, Partial<FunnelStep>> = {
  choice: { title: 'Nova pergunta', options: [] },
  image_choice: { title: 'Nova pergunta com imagem', options: [] },
  before_after: {
    title: 'Você busca um resultado parecido?',
    pairs: [{ id: 'pair_local_1', before_url: '', after_url: '', caption: '' }],
  },
  unit_choice: { title: 'Em qual unidade você quer ser atendido(a)?' },
  text_input: { title: 'Como podemos te chamar?', placeholder: 'Seu nome' },
  phone: { title: 'Qual seu WhatsApp?', placeholder: '(19) 99999-9999' },
  cta: { title: 'Seu próximo passo começa aqui.', cta_label: 'Falar com nossa equipe' },
}

export function useFunnelBuilder(initialSteps: FunnelStep[]) {
  const [steps, setSteps] = useState<FunnelStep[]>(initialSteps)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(initialSteps[0]?.id ?? null)

  const handleAddStep = useCallback((type: FunnelBlockType) => {
    const defaults = MVP_BLOCK_DEFAULTS[type] ?? { title: 'Novo step' }
    const newStep: FunnelStep = {
      id: localId('step'),
      type,
      position: 0,
      required: type === 'choice' || type === 'image_choice' || type === 'text_input' || type === 'phone',
      tracking_key: localId('tracking'),
      ...defaults,
    } as FunnelStep

    setSteps((prev) => {
      const next = [...prev, newStep].map((step, index) => ({ ...step, position: index }))
      return next
    })
    setSelectedStepId(newStep.id)
  }, [])

  const handleUpdateStep = useCallback((stepId: string, patch: Partial<FunnelStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...patch } : step)))
  }, [])

  const handleRemoveStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== stepId).map((step, index) => ({ ...step, position: index })))
    setSelectedStepId((current) => (current === stepId ? null : current))
  }, [])

  const handleMoveStep = useCallback((stepId: string, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const index = prev.findIndex((step) => step.id === stepId)
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) return prev

      const next = [...prev]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((step, position) => ({ ...step, position }))
    })
  }, [])

  const handleReorderStep = useCallback((activeId: string, overId: string) => {
    setSteps((prev) => {
      const fromIndex = prev.findIndex((step) => step.id === activeId)
      const toIndex = prev.findIndex((step) => step.id === overId)
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next.map((step, position) => ({ ...step, position }))
    })
  }, [])

  const handleAddOption = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        const options = step.options ?? []
        const newOption: FunnelOption = {
          id: localId('option'),
          label: 'Nova opção',
          value: `opcao_${options.length + 1}`,
          next_step_id: null,
          position: options.length,
        }
        return { ...step, options: [...options, newOption] }
      }),
    )
  }, [])

  const handleUpdateOption = useCallback((stepId: string, optionId: string, patch: Partial<FunnelOption>) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        return { ...step, options: (step.options ?? []).map((option) => (option.id === optionId ? { ...option, ...patch } : option)) }
      }),
    )
  }, [])

  const handleRemoveOption = useCallback((stepId: string, optionId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        return { ...step, options: (step.options ?? []).filter((option) => option.id !== optionId) }
      }),
    )
  }, [])

  // Pairs handlers (para Before / After)
  const handleAddPair = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        const pairs = step.pairs ?? []
        const newPair: FunnelBeforeAfterPair = {
          id: localId('pair'),
          before_url: '',
          after_url: '',
          caption: '',
        }
        return { ...step, pairs: [...pairs, newPair] }
      }),
    )
  }, [])

  const handleUpdatePair = useCallback((stepId: string, pairId: string, patch: Partial<FunnelBeforeAfterPair>) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        return { ...step, pairs: (step.pairs ?? []).map((pair) => (pair.id === pairId ? { ...pair, ...patch } : pair)) }
      }),
    )
  }, [])

  const handleRemovePair = useCallback((stepId: string, pairId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step
        return { ...step, pairs: (step.pairs ?? []).filter((pair) => pair.id !== pairId) }
      }),
    )
  }, [])

  return {
    steps,
    setSteps,
    selectedStepId,
    setSelectedStepId,
    handleAddStep,
    handleUpdateStep,
    handleRemoveStep,
    handleMoveStep,
    handleReorderStep,
    handleAddOption,
    handleUpdateOption,
    handleRemoveOption,
    handleAddPair,
    handleUpdatePair,
    handleRemovePair,
  }
}


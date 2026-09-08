'use client'

import Image from 'next/image'
import type { FunnelBlockProps } from './types'

export function BeforeAfterBlock({ step, onAnswer }: FunnelBlockProps) {
  const pairs = step.pairs && step.pairs.length > 0
    ? step.pairs
    : [{ id: 'default_preview_pair', before_url: '', after_url: '', caption: '' }]

  return (
    <div className="flex flex-col gap-6">
      {pairs.map((pair) => (
        <div key={pair.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2">
            <div className="relative aspect-[3/4] w-full bg-gray-100">
              <Image
                src={pair.before_url || '/placeholder.svg'}
                alt="Antes"
                fill
                unoptimized
                loading="lazy"
                sizes="50vw"
                className="object-cover"
              />
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                Antes
              </span>
            </div>
            <div className="relative aspect-[3/4] w-full bg-gray-100">
              <Image
                src={pair.after_url || '/placeholder.svg'}
                alt="Depois"
                fill
                unoptimized
                loading="lazy"
                sizes="50vw"
                className="object-cover"
              />
              <span className="absolute left-2 top-2 rounded-full bg-brand-pink px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                Depois
              </span>
            </div>
          </div>
          {pair.caption && <p className="px-3 py-2 text-center text-xs font-medium text-gray-600">{pair.caption}</p>}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onAnswer(undefined, 'sim')}
        className="w-full rounded-full bg-brand-pink px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-pink/25 transition hover:-translate-y-0.5 hover:bg-brand-pink/90"
      >
        Quero conhecer minhas opções
      </button>
    </div>
  )
}


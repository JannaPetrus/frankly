import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import { calcPercent } from './dashboard'

describe('calcPercent', () => {
  it('считает процент', () => {
    expect(calcPercent(30, 100)).toBe(30)
    expect(calcPercent(50, 200)).toBe(25)
    expect(calcPercent(1, 3)).toBe(33)
  })

  it('возвращает 0 когда total равен 0', () => {
    expect(calcPercent(0, 0)).toBe(0)
  })
})

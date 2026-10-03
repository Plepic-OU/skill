import { decodeShareCode, encodeShareCode, shareUrl } from '../share'
import type { SkillState } from '../../types/skill-tree'

const STATE: SkillState = { autonomy: 3, parallelExecution: 2, skillUsage: 4, safetyZone: 'normal' }

describe('share code', () => {
  it('encodes the three levels and the stakes in path order', () => {
    expect(encodeShareCode(STATE)).toBe('3-2-4-normal')
  })

  it('round-trips a state', () => {
    expect(decodeShareCode(encodeShareCode(STATE))).toEqual(STATE)
  })

  it('decodes the zero and the maximum level', () => {
    expect(decodeShareCode('0-0-0-sandbox')).toEqual({
      autonomy: 0,
      parallelExecution: 0,
      skillUsage: 0,
      safetyZone: 'sandbox',
    })
    expect(decodeShareCode('6-6-6-impossible')).toEqual({
      autonomy: 6,
      parallelExecution: 6,
      skillUsage: 6,
      safetyZone: 'impossible',
    })
  })

  it.each([
    ['7-2-4-normal', 'a level above the maximum'],
    ['3-2-4-legendary', 'an unknown stakes zone'],
    ['3-2-normal', 'a missing level'],
    ['3-2-4-normal-extra', 'a trailing segment'],
    ['3-2-4-Normal', 'an upper-case zone'],
    ['a-2-4-normal', 'a non-numeric level'],
    ['', 'an empty code'],
  ])('rejects %s (%s)', (code) => {
    expect(decodeShareCode(code)).toBeNull()
  })

  it('builds the share URL under /shared on the given origin', () => {
    expect(shareUrl('https://skill.plepic.com', STATE)).toBe(
      'https://skill.plepic.com/shared/3-2-4-normal',
    )
  })
})

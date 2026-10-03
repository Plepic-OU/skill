import { BOOKING_URL, LEAD_SUBJECT_PREFIX, leadMailto, trainingUrl } from '../links'

describe('leadMailto', () => {
  it('addresses Kaido with a subject that names the skill tree and the class', () => {
    const href = leadMailto(
      'Hardened Operator',
      3,
      'https://skill.plepic.com/shared/3-4-4-hardcore',
    )
    const [address, query] = href.split('?')
    const params = new URLSearchParams(query)
    expect(address).toBe('mailto:kaido@plepic.com')
    expect(params.get('subject')).toBe(`${LEAD_SUBJECT_PREFIX}: Hardened Operator, Lv 3`)
    expect(params.get('body')).toBe(
      'Hi Kaido,\n\nSkill tree result: https://skill.plepic.com/shared/3-4-4-hardcore\n\n',
    )
  })

  it('keeps the lead tag stable', () => {
    expect(LEAD_SUBJECT_PREFIX).toBe('Skill Tree result')
  })
})

describe('trainingUrl', () => {
  it('puts the crest placements on the completion campaign', () => {
    for (const source of [
      'landing_crest',
      'owner_crest',
      'visitor_crest',
      'shared_crest',
    ] as const) {
      const url = new URL(trainingUrl(source))
      expect(url.searchParams.get('utm_campaign')).toBe('skilltree_completion')
      expect(url.searchParams.get('utm_content')).toBe(source)
    }
  })

  it('puts the nav placements on the nav campaign', () => {
    for (const source of ['header_nav', 'footer_nav'] as const) {
      expect(new URL(trainingUrl(source)).searchParams.get('utm_campaign')).toBe('skilltree_nav')
    }
  })
})

describe('BOOKING_URL', () => {
  it('is the Google Calendar booking page', () => {
    expect(BOOKING_URL).toBe('https://calendar.app.google/h5sq5y19e8a11GRQ7')
  })
})

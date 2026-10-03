import { computeProgression } from '../progression'
import { toSkillState } from '../sync'
import fixtureFile from './fixtures/stored-profiles.json'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(),
}))
vi.mock('../../firebase', () => ({ db: {} }))

// Stored profiles keep raw levels: integers per path plus the stakes zone.
// Every PR must leave their meaning intact, so each fixture carries the level
// and class the code on main computed when the fixture was recorded.
describe('stored-profile fixtures', () => {
  it.each(fixtureFile.fixtures.map((f) => [f.name, f] as const))(
    'a localStorage profile keeps its level and class: %s',
    (_name, fixture) => {
      const state = fixture.localStorage as Parameters<typeof computeProgression>[0]
      const result = computeProgression(state)
      expect({
        unifiedLevel: result.unifiedLevel,
        classIndex: result.classInfo.index,
        className: result.classInfo.name,
        title: result.title,
        completedSkills: result.completedSkills,
      }).toEqual(fixture.expected)
    },
  )

  it.each(fixtureFile.fixtures.map((f) => [f.name, f] as const))(
    'a Firestore profile keeps its level and class: %s',
    (_name, fixture) => {
      const state = toSkillState(fixture.firestore as Parameters<typeof toSkillState>[0])
      const result = computeProgression(state)
      expect({
        unifiedLevel: result.unifiedLevel,
        classIndex: result.classInfo.index,
        className: result.classInfo.name,
        title: result.title,
        completedSkills: result.completedSkills,
      }).toEqual(fixture.expected)
    },
  )
})

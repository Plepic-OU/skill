import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import SharedResultPage from '../SharedResultPage'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/shared/:code" element={<SharedResultPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SharedResultPage', () => {
  it('renders the result from the levels in the URL, with no name', () => {
    renderAt('/shared/3-4-4-hardcore')
    expect(
      screen.getByRole('heading', { level: 1, name: 'A shared skill map' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Class: Operator' })).toBeInTheDocument()
    expect(screen.getByText('Hardened')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'This is me' })).not.toBeInTheDocument()
  })

  it('addresses the team lead and offers the own assessment', () => {
    renderAt('/shared/3-4-4-hardcore')
    expect(screen.getByText(/for team leads/i)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Assess your own skills' }).length).toBeGreaterThan(
      0,
    )
  })

  it('shows not-found for a code that is not a result', () => {
    renderAt('/shared/9-9-9-nope')
    expect(screen.getByRole('heading', { name: 'Result not found' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Assess your own skills' }).length).toBeGreaterThan(
      0,
    )
  })
})

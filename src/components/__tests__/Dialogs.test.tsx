import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from '../ConfirmDialog'
import SignInModal from '../SignInModal'

const signInWithGoogle = vi.hoisted(() => vi.fn())
vi.mock('../../data/auth', () => ({ signInWithGoogle }))
vi.mock('../../firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({ signInWithEmailAndPassword: vi.fn() }))

// jsdom has no showModal; opening the dialog makes its contents visible to name computation.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
})

describe('dialogs are named and described', () => {
  it('ConfirmDialog is named by its title and described by its message', () => {
    render(
      <ConfirmDialog
        open
        title="Sign out?"
        message="Your progress stays saved."
        confirmLabel="Sign out"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Sign out?' })
    expect(dialog).toHaveAccessibleDescription('Your progress stays saved.')
  })

  it('SignInModal is named by its title and described by its subtitle', () => {
    render(<SignInModal open onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Sign in' })
    expect(dialog).toHaveAccessibleDescription(/save your progress across devices/i)
  })

  it('SignInModal announces a sign-in error', async () => {
    signInWithGoogle.mockRejectedValue({ code: 'auth/internal-error' })
    render(<SignInModal open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Sign-in failed')
  })
})

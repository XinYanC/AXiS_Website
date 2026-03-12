import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import Login from '../Login.jsx'

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Login page', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    expect(container).toMatchSnapshot()
  })
})

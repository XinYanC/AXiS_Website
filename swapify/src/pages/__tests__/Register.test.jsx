import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import Register from '../Register.jsx'

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('../../api', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    createUser: vi.fn(),
    getSystemDropdownOptions: vi.fn().mockResolvedValue({ options: [] }),
  }
})

describe('Register page', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    )

    expect(container).toMatchSnapshot()
  })
})

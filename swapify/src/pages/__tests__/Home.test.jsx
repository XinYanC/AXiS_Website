import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import Home from '../Home.jsx'

describe('Home page', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    expect(container).toMatchSnapshot()
  })
})


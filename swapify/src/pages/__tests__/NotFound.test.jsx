import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import NotFound from '../NotFound.jsx'

describe('NotFound page', () => {
  it('matches snapshot', () => {
    const { container } = render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(container).toMatchSnapshot()
  })
})

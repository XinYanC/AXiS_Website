import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import * as listingsApi from '../../api/listings'
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


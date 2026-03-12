import { describe, it, expect } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import App from '../App.jsx'

describe('App routing', () => {
  it('renders Home at root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: /swapify/i })).toBeInTheDocument()
  })

  it('renders NotFound for unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/some/unknown/path']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText(/404/i)).toBeInTheDocument()
  })
})


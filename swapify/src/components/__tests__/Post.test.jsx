import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import Post from '../post.jsx'

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const baseProps = {
  id: '123',
  title: 'Test Item',
  description: 'Nice description',
  imageUrl: null,
  location: 'NYC',
  transactionType: 'pickup',
  price: 10,
  owner: 'alice',
}

describe('Post component', () => {
  it('renders title and location', () => {
    render(
      <MemoryRouter>
        <Post {...baseProps} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Test Item')).toBeInTheDocument()
    expect(screen.getByText('NYC')).toBeInTheDocument()
  })

})


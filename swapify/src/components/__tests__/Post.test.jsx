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

  it('shows image arrows and cycles through images', () => {
    render(
      <MemoryRouter>
        <Post
          {...baseProps}
          imageUrls={[
            'https://res.cloudinary.com/demo/image/upload/v1/sample-1.jpg',
            'https://res.cloudinary.com/demo/image/upload/v1/sample-2.jpg',
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /previous image/i })).toBeInTheDocument()
    const nextImageButton = screen.getByRole('button', { name: /next image/i })

    expect(screen.getByAltText('Test Item - image 1')).toBeInTheDocument()
    fireEvent.click(nextImageButton)
    expect(screen.getByAltText('Test Item - image 2')).toBeInTheDocument()
  })

})


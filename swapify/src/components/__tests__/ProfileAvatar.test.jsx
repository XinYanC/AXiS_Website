import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfileAvatar from '../ProfileAvatar'

describe('ProfileAvatar', () => {
  it('renders one letter for a name value', () => {
    render(<ProfileAvatar value="Alice" className="avatar-test" />)

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('uses the email local part when value is an email', () => {
    render(<ProfileAvatar value="bob@example.com" className="avatar-test" />)

    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('falls back to question mark for empty values', () => {
    render(<ProfileAvatar value="" className="avatar-test" />)

    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
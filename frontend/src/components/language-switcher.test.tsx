import { render, screen, fireEvent } from '@testing-library/react'
import { LanguageSwitcher } from '@/components/language-switcher'

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `lang-${key}`,
}))

describe('components/language-switcher', () => {
  beforeEach(() => {
    document.cookie = 'locale=;path=/;max-age=0'
  })

  it('should render both locale buttons', () => {
    render(<LanguageSwitcher />)

    expect(screen.getByRole('button', { name: 'lang-vi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'lang-en' })).toBeInTheDocument()
  })

  it('should set locale cookie when clicking vi', () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'lang-vi' }))

    expect(document.cookie).toContain('locale=vi')
  })

  it('should set locale cookie when clicking en', () => {
    render(<LanguageSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'lang-en' }))

    expect(document.cookie).toContain('locale=en')
  })
})

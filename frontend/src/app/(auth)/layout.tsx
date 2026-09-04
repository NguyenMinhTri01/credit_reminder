import Image from 'next/image'
import loginBackground from '@/assets/images/login_background.png'

/**
 * Layout for all auth pages: login, register (same page), forgot & reset password.
 * Renders the warm-tone illustration as a full-bleed background and centers
 * the per-page form card (children) on top of it.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background illustration */}
      <Image src={loginBackground} alt="" priority fill sizes="100vw" className="object-cover" />
      {/* Soft overlay to keep text legible regardless of background area */}
      <div className="bg-background/40 absolute inset-0" aria-hidden />

      {/* Form area */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-8">
        {children}
      </div>
    </main>
  )
}

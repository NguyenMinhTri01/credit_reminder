import Image from 'next/image'
import walletIcon from '@/assets/images/wallet.png'

/**
 * Frosted card shell shared by Login, Register, Forgot & Reset Password pages.
 * - Renders wallet logo, title and optional subtitle (per design spec).
 * - Children render below the heading inside the same card.
 */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-card/95 border-border/60 w-full max-w-md rounded-2xl border p-6 shadow-xl backdrop-blur sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="bg-secondary/60 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Image src={walletIcon} alt="Credit Reminder" width={48} height={48} priority />
        </div>
        <h1 className="text-foreground text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p> : null}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  )
}

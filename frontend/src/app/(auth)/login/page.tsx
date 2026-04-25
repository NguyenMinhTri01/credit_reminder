'use client'

import * as React from 'react'
import Link from 'next/link'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuthCard } from '@/components/auth/auth-card'
import { GoogleButton } from '@/components/auth/google-button'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'

/**
 * Combined Login + Register page (matches the design with a tab switcher).
 * Both tabs share the divider + Google OAuth + footer block at the bottom.
 */
export default function LoginPage() {
  const [tab, setTab] = React.useState<'login' | 'register'>('login')

  return (
    <AuthCard
      title={tab === 'login' ? 'Welcome back!' : 'Create your account'}
      subtitle={
        tab === 'login'
          ? 'Manage your finances, smarter every day.'
          : 'Start tracking your credit reminders in seconds.'
      }
    >
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="login"
            className="data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none border-b-2 border-transparent bg-transparent py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Login
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="data-[state=active]:border-primary data-[state=active]:text-foreground rounded-none border-b-2 border-transparent bg-transparent py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Register
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <LoginForm />
        </TabsContent>

        <TabsContent value="register" className="mt-6">
          <RegisterForm />
        </TabsContent>
      </Tabs>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or continue with</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <GoogleButton />

      <p className="text-muted-foreground mt-6 text-center text-xs leading-relaxed">
        By continuing, you agree to our{' '}
        <Link href="#" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthCard>
  )
}

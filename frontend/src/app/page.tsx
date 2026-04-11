import { useTranslations } from 'next-intl';
import { CreditCard, Bell, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{t('common.appName')}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Hero */}
      <main className="container py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('home.welcome')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t('home.description')}
          </p>
          <div className="mt-8">
            <Button size="lg">{t('reminders.createNew')}</Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg">{t('reminders.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg">{t('reminders.amount')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.description')}
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary" />
              <CardTitle className="text-lg">{t('reminders.status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('home.description')}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

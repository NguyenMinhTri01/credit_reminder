import { Bell, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { IDashboardReminder } from '@/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { formatCalendarDate, formatVnd } from '@/lib/dashboard-formatters'

export function UpcomingReminders({ reminders }: { reminders: IDashboardReminder[] }) {
  const locale = useLocale()
  const dashboard = useTranslations('dashboard')
  const navigation = useTranslations('navigation')
  const visibleReminders = reminders.slice(0, 5)

  return (
    <section aria-labelledby="upcoming-reminders-title">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle id="upcoming-reminders-title">{dashboard('upcomingReminders')}</CardTitle>
            <CardDescription>{dashboard('remindersDescription')}</CardDescription>
          </div>
          <Button disabled title={navigation('comingSoon')}>
            <Plus data-icon="inline-start" />
            {dashboard('createReminder')}
            <span className="sr-only">— {navigation('comingSoon')}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {visibleReminders.length ? (
            <ul className="flex flex-col" aria-label={dashboard('upcomingReminders')}>
              {visibleReminders.map((reminder, index) => (
                <li key={reminder.id}>
                  {index ? <Separator /> : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{reminder.title}</span>
                      <span className="text-muted-foreground text-sm">
                        {formatCalendarDate(reminder.nextTriggerDate, locale)}
                      </span>
                    </div>
                    <Badge variant="secondary">{formatVnd(reminder.amount, locale)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Bell />
                </EmptyMedia>
                <EmptyTitle>{dashboard('noRemindersTitle')}</EmptyTitle>
                <EmptyDescription>{dashboard('noRemindersDescription')}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button disabled title={navigation('comingSoon')}>
                  <Plus data-icon="inline-start" />
                  {dashboard('createReminder')}
                  <span className="sr-only">— {navigation('comingSoon')}</span>
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
        <CardFooter />
      </Card>
    </section>
  )
}

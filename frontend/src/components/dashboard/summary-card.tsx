import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface SummaryCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  progress?: number
  progressLabel?: string
  warning?: string
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  progress,
  progressLabel,
  warning,
}: SummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        </div>
        <Badge variant="secondary" aria-hidden="true">
          <Icon />
        </Badge>
      </CardHeader>
      <CardContent>
        {progress === undefined ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <Progress value={progress} aria-valuenow={progress} aria-label={progressLabel} />
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>{warning ? <Badge variant="outline">{warning}</Badge> : null}</CardFooter>
    </Card>
  )
}

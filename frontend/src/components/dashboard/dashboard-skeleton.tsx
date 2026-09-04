import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-6 w-1/3" />
      </CardFooter>
    </Card>
  )
}

export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div
      className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="summary-skeleton">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="cards-skeleton">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
      <div data-testid="reminders-skeleton">
        <SkeletonCard />
      </div>
    </div>
  )
}

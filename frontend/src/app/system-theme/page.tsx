'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@/components/ui/button-group'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLOR_TOKENS = [
  { name: 'background', var: '--background', textClass: 'text-foreground' },
  { name: 'foreground', var: '--foreground', textClass: 'text-background' },
  { name: 'card', var: '--card', textClass: 'text-card-foreground' },
  {
    name: 'card-foreground',
    var: '--card-foreground',
    textClass: 'text-background',
  },
  { name: 'popover', var: '--popover', textClass: 'text-popover-foreground' },
  { name: 'primary', var: '--primary', textClass: 'text-primary-foreground' },
  {
    name: 'primary-foreground',
    var: '--primary-foreground',
    textClass: 'text-primary',
  },
  {
    name: 'secondary',
    var: '--secondary',
    textClass: 'text-secondary-foreground',
  },
  {
    name: 'secondary-foreground',
    var: '--secondary-foreground',
    textClass: 'text-background',
  },
  { name: 'muted', var: '--muted', textClass: 'text-muted-foreground' },
  {
    name: 'muted-foreground',
    var: '--muted-foreground',
    textClass: 'text-background',
  },
  { name: 'accent', var: '--accent', textClass: 'text-accent-foreground' },
  {
    name: 'destructive',
    var: '--destructive',
    textClass: 'text-destructive-foreground',
  },
  { name: 'border', var: '--border', textClass: 'text-foreground' },
  { name: 'input', var: '--input', textClass: 'text-foreground' },
  { name: 'ring', var: '--ring', textClass: 'text-background' },
]

const CHART_TOKENS = [
  { name: 'chart-1', var: '--chart-1', textClass: 'text-background' },
  { name: 'chart-2', var: '--chart-2', textClass: 'text-foreground' },
  { name: 'chart-3', var: '--chart-3', textClass: 'text-foreground' },
  { name: 'chart-4', var: '--chart-4', textClass: 'text-foreground' },
  { name: 'chart-5', var: '--chart-5', textClass: 'text-background' },
]

const SIDEBAR_TOKENS = [
  { name: 'sidebar', var: '--sidebar', textClass: 'text-sidebar-foreground' },
  {
    name: 'sidebar-foreground',
    var: '--sidebar-foreground',
    textClass: 'text-sidebar',
  },
  {
    name: 'sidebar-primary',
    var: '--sidebar-primary',
    textClass: 'text-sidebar-primary-foreground',
  },
  {
    name: 'sidebar-primary-foreground',
    var: '--sidebar-primary-foreground',
    textClass: 'text-sidebar-primary',
  },
  {
    name: 'sidebar-accent',
    var: '--sidebar-accent',
    textClass: 'text-sidebar-accent-foreground',
  },
  {
    name: 'sidebar-accent-foreground',
    var: '--sidebar-accent-foreground',
    textClass: 'text-sidebar-accent',
  },
  {
    name: 'sidebar-border',
    var: '--sidebar-border',
    textClass: 'text-sidebar-foreground',
  },
  {
    name: 'sidebar-ring',
    var: '--sidebar-ring',
    textClass: 'text-sidebar-foreground',
  },
]

const SHADOW_TOKENS = [
  { name: 'shadow-2xs', cls: '[box-shadow:var(--shadow-2xs)]' },
  { name: 'shadow-xs', cls: '[box-shadow:var(--shadow-xs)]' },
  { name: 'shadow-sm', cls: '[box-shadow:var(--shadow-sm)]' },
  { name: 'shadow', cls: '[box-shadow:var(--shadow)]' },
  { name: 'shadow-md', cls: '[box-shadow:var(--shadow-md)]' },
  { name: 'shadow-lg', cls: '[box-shadow:var(--shadow-lg)]' },
  { name: 'shadow-xl', cls: '[box-shadow:var(--shadow-xl)]' },
  { name: 'shadow-2xl', cls: '[box-shadow:var(--shadow-2xl)]' },
]

const BUTTON_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const
const BUTTON_SIZES = ['sm', 'default', 'lg'] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-border border-b pb-2 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function TokenSwatch({
  name,
  cssVar,
  textClass,
}: {
  name: string
  cssVar: string
  textClass?: string
}) {
  return (
    <div
      className={`border-border flex flex-col gap-1 rounded-md border p-3 ${textClass ?? 'text-foreground'}`}
      style={{ backgroundColor: `var(${cssVar})` }}
    >
      <span className="font-mono text-xs font-semibold">{name}</span>
      <span className="font-mono text-xs opacity-70">{cssVar}</span>
    </div>
  )
}

export default function SystemThemePage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
        <div>
          <h1 className="text-3xl font-bold">System Theme</h1>
          <p className="text-muted-foreground mt-1">
            Reference for all design tokens and components in the system.
          </p>
        </div>

        {/* Colors */}
        <Section title="Color Tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {COLOR_TOKENS.map((t) => (
              <TokenSwatch key={t.name} name={t.name} cssVar={t.var} textClass={t.textClass} />
            ))}
          </div>
        </Section>

        {/* Chart Colors */}
        <Section title="Chart Colors">
          <div className="grid grid-cols-5 gap-3">
            {CHART_TOKENS.map((t) => (
              <TokenSwatch key={t.name} name={t.name} cssVar={t.var} textClass={t.textClass} />
            ))}
          </div>
        </Section>

        {/* Sidebar Colors */}
        <Section title="Sidebar Colors">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SIDEBAR_TOKENS.map((t) => (
              <TokenSwatch key={t.name} name={t.name} cssVar={t.var} textClass={t.textClass} />
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-4xl font-bold</p>
              <p className="text-4xl font-bold">The largest heading</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-3xl font-bold</p>
              <p className="text-3xl font-bold">Heading h1</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-2xl font-semibold</p>
              <p className="text-2xl font-semibold">Heading h2</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-xl font-semibold</p>
              <p className="text-xl font-semibold">Heading h3</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-lg font-medium</p>
              <p className="text-lg font-medium">Heading h4</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-base (body)</p>
              <p className="text-base">
                Regular body text. Credit Reminder helps you manage your credit payment reminders.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-sm</p>
              <p className="text-sm">Small text — used for descriptions, labels.</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-xs</p>
              <p className="text-xs">Extra small text — used for metadata, timestamps.</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-sm text-muted-foreground</p>
              <p className="text-muted-foreground text-sm">
                Muted text — secondary descriptions, placeholder hints.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-sm text-primary</p>
              <p className="text-primary text-sm">Primary text — link, action text.</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">text-sm text-destructive</p>
              <p className="text-destructive text-sm">
                Destructive text — errors, danger warnings.
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5 text-xs">font-mono text-sm</p>
              <p className="font-mono text-sm">Monospace — code snippet, token values.</p>
            </div>
          </div>
        </Section>

        {/* Border Radius */}
        <Section title="Border Radius">
          <div className="flex flex-wrap items-end gap-4">
            {[
              { label: 'rounded-sm', cls: 'rounded-sm' },
              { label: 'rounded-md', cls: 'rounded-md' },
              { label: 'rounded-lg', cls: 'rounded-lg' },
              { label: 'rounded-xl', cls: 'rounded-xl' },
              { label: 'rounded-full', cls: 'rounded-full' },
            ].map((r) => (
              <div key={r.label} className="flex flex-col items-center gap-2">
                <div className={`bg-primary h-16 w-16 ${r.cls}`} />
                <span className="text-muted-foreground font-mono text-xs">{r.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadows */}
        <Section title="Shadows">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {SHADOW_TOKENS.map((s) => (
              <div key={s.name} className="flex flex-col items-center gap-3">
                <div className={`bg-card h-16 w-full rounded-lg ${s.cls}`} />
                <span className="text-muted-foreground font-mono text-xs">{s.name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Alert */}
        <Section title="Alert">
          <div className="space-y-3">
            <Alert>
              <AlertTitle>Default alert</AlertTitle>
              <AlertDescription>
                This is a default informational alert message for the system.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Destructive alert</AlertTitle>
              <AlertDescription>
                Payment is overdue. Please settle your credit reminder immediately.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        {/* Alert Dialog */}
        <Section title="Alert Dialog">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Open Alert Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the reminder and remove
                  the data from the server.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">With image</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar>
                <AvatarFallback>NM</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">Fallback only</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">XS</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">h-6 w-6</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-14 w-14">
                <AvatarFallback>LG</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground text-xs">h-14 w-14</span>
            </div>
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge">
          <div className="flex flex-wrap gap-3">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="destructive">destructive</Badge>
            <Badge variant="outline">outline</Badge>
          </div>
        </Section>

        {/* Breadcrumb */}
        <Section title="Breadcrumb">
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Basic</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Reminders</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Credit Card</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs">With ellipsis</p>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Detail</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Button — Variants">
          <div className="flex flex-wrap gap-3">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} variant={v} disabled>
                {v} disabled
              </Button>
            ))}
          </div>
        </Section>

        <Section title="Button — Sizes">
          <div className="flex flex-wrap items-center gap-3">
            {BUTTON_SIZES.map((s) => (
              <Button key={s} size={s}>
                size={s}
              </Button>
            ))}
            <Button size="icon" aria-label="icon button">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
        </Section>

        {/* Button Group */}
        <Section title="Button Group">
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Horizontal (default)</p>
              <ButtonGroup>
                <Button variant="outline">Previous</Button>
                <Button variant="outline">Page 1</Button>
                <Button variant="outline">Next</Button>
              </ButtonGroup>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs">With text label</p>
              <ButtonGroup>
                <ButtonGroupText>https://</ButtonGroupText>
                <Button variant="outline">example.com</Button>
              </ButtonGroup>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs">With separator</p>
              <ButtonGroup>
                <Button variant="outline">Save</Button>
                <ButtonGroupSeparator />
                <Button variant="outline">Save & Exit</Button>
              </ButtonGroup>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Vertical</p>
              <ButtonGroup orientation="vertical">
                <Button variant="outline">Top</Button>
                <Button variant="outline">Middle</Button>
                <Button variant="outline">Bottom</Button>
              </ButtonGroup>
            </div>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic card</CardTitle>
                <CardDescription>A short description of this card.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Content inside a card. Can contain text, forms, or any other element.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with footer</CardTitle>
                <CardDescription>Card with an action area at the bottom.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Card content. Track your credit payment reminders and stay on schedule.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Confirm</Button>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error / warning card</CardTitle>
                <CardDescription>
                  Use when highlighting a dangerous or critical state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-sm">This transaction is overdue for payment.</p>
              </CardContent>
            </Card>

            <Card className="bg-muted">
              <CardHeader>
                <CardTitle>Card with muted background</CardTitle>
                <CardDescription>Used to visually separate secondary sections.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Secondary content, less emphasis than the primary card.
                </p>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* Checkbox */}
        <Section title="Checkbox">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox id="chk1" defaultChecked />
              <label htmlFor="chk1" className="cursor-pointer text-sm">
                Paid (checked)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="chk2" />
              <label htmlFor="chk2" className="cursor-pointer text-sm">
                Unpaid (unchecked)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="chk3" defaultChecked disabled />
              <label htmlFor="chk3" className="text-muted-foreground cursor-not-allowed text-sm">
                Checked + disabled
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="chk4" disabled />
              <label htmlFor="chk4" className="text-muted-foreground cursor-not-allowed text-sm">
                Disabled
              </label>
            </div>
          </div>
        </Section>

        {/* Separator */}
        <Section title="Separator">
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Horizontal</p>
              <div className="space-y-2">
                <p className="text-sm">Above separator</p>
                <Separator />
                <p className="text-sm">Below separator</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs">Vertical</p>
              <div className="flex h-6 items-center gap-3">
                <span className="text-sm">Left</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Middle</span>
                <Separator orientation="vertical" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Table */}
        <Section title="Table">
          <Table>
            <TableCaption>A list of recent credit reminders.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Credit Card A</TableCell>
                <TableCell>2024-02-01</TableCell>
                <TableCell>$500.00</TableCell>
                <TableCell>
                  <Badge variant="secondary">Pending</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Credit Card B</TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell>$1,200.00</TableCell>
                <TableCell>
                  <Badge variant="destructive">Overdue</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Loan Payment</TableCell>
                <TableCell>2024-02-28</TableCell>
                <TableCell>$300.00</TableCell>
                <TableCell>
                  <Badge>Paid</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell>$2,000.00</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </Section>

        {/* Form Elements — Input */}
        <Section title="Input">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default</label>
              <input
                type="text"
                placeholder="Enter content..."
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Disabled</label>
              <input
                type="text"
                placeholder="Cannot type here..."
                disabled
                className="border-input bg-background placeholder:text-muted-foreground flex h-9 w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Error state</label>
              <input
                type="text"
                defaultValue="Invalid value"
                className="border-destructive bg-background focus-visible:ring-destructive flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
              />
              <p className="text-destructive text-xs">This field is invalid.</p>
            </div>
          </div>
        </Section>

        {/* Spacing reference */}
        <Section title="Spacing Scale (Tailwind)">
          <div className="flex flex-wrap items-end gap-2">
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div className="bg-primary" style={{ width: `${n * 4}px`, height: '24px' }} />
                <span className="text-muted-foreground font-mono text-xs">{n}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">1 unit = 4px</p>
        </Section>
      </div>
    </div>
  )
}

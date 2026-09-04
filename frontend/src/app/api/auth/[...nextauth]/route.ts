// Next.js App Router catch-all handler for Auth.js (next-auth v5).
// Re-exports the GET/POST handlers produced by the central NextAuth() call.
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers

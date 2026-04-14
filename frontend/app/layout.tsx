import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Duty Scheduler',
  description: 'Radiology duty roster management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'antialiased')}>
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),rgba(15,23,42,0))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(192,132,252,0.16),rgba(15,23,42,0))]" />
            <div className="absolute left-1/2 top-[-35%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.25),rgba(15,23,42,0))] blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.18),rgba(15,23,42,0))] blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.22),rgba(15,23,42,0))] blur-3xl" />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col text-foreground">
            {children}
            <Toaster />
          </div>
        </div>
      </body>
    </html>
  )
}

'use client'

import { useTransition } from 'react'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/atoms/button'

export function LogoutButton({ className, ...props }) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={isPending}
      onClick={handleLogout}
      className={className}
      {...props}
    >
      Sign out
    </Button>
  )
}

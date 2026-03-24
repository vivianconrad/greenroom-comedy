'use client'

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login, loginAsDemo } from '@/lib/actions/auth'
// import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidEmail } from '@/lib/utils'

function CheckEmailMessage() {
  const searchParams = useSearchParams()
  if (searchParams.get('message') !== 'check-email') return null
  return (
    <p className="mb-5 text-sm text-green font-body bg-green/10 rounded-md px-4 py-3">
      Account created! Check your email to confirm your address, then sign in.
    </p>
  )
}

export default function LoginPage() {
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()
    // const [oauthPending, setOauthPending] = useState(false)
  const [demoPending, setDemoPending] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')

    if (!isValidEmail(email)) {
      setErrors({ email: 'Please enter a valid email address.' })
      return
    }
    if (!formData.get('password')) {
      setErrors({ password: 'Password is required.' })
      return
    }

    setErrors({})
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) setErrors({ form: result.error })
    })
  }
  
  // async function handleGoogle() {
  //   setOauthPending(true)
  //   const supabase = createClient()
  //   const { error } = await supabase.auth.signInWithOAuth({
  //     provider: 'google',
  //     options: {
  //       redirectTo: `${window.location.origin}/auth/callback`,
  //     },
  //   })
  //   if (error) {
  //     setErrors({ form: error.message })
  //     setOauthPending(false)
  //   }
  // }

  async function handleDemo() {
    setDemoPending(true)
    const result = await loginAsDemo()
    if (result?.error) {
      setErrors({ form: result.error })
      setDemoPending(false)
    }
  }

  return (
    <div className="bg-white rounded-card-lg border border-peach shadow-sm px-8 py-10">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-semibold text-deep">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-soft font-body">
          Sign in to your Greenroom account
        </p>
      </div>

      <Suspense>
        <CheckEmailMessage />
      </Suspense>

      {/* TODO: Re-enable Google OAuth once the provider is configured in Supabase */}
      {/* <Button
        type="button"
        variant="secondary"
        size="md"
        className="w-full gap-2.5"
        loading={oauthPending}
        onClick={handleGoogle}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-peach" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-soft font-body">or</span>
        </div>
      </div> */}

      {/* Email / password form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password}
          required
        />

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-1">
            {errors.form}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-1"
          loading={isPending}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-soft font-body">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-coral hover:underline font-medium">
          Sign up
        </Link>
      </p>

      {/* Demo mode */}
      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-peach" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-soft font-body">or</span>
        </div>
      </div>

      <div className="mt-5 text-center">
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full"
          loading={demoPending}
          onClick={handleDemo}
        >
          Try Demo Mode
        </Button>
        <p className="mt-2 text-xs text-soft font-body">
          Explore with sample data — no signup needed
        </p>
      </div>
    </div>
  )
}

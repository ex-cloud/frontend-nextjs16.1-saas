'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OTPInput } from '@/components/ui/otp-input'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'

export default function OTPLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Failed to send OTP')
        return
      }

      toast.success('OTP sent to your email')
      if (data.debug_otp) {
        toast.info(`Development OTP: ${data.debug_otp}`)
      }
      setStep('verify')
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || 'Invalid OTP')
        return
      }

      toast.success('Login successful')
      
      // Use the token from backend to create session
      await signIn('credentials', {
        email: data.data.user.email,
        redirect: false,
      })

      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('OTP resent successfully')
        if (data.debug_otp) {
          toast.info(`Development OTP: ${data.debug_otp}`)
        }
      }
    } catch {
      toast.error('Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/assets/213213.png" alt="Logo" width={200} height={60} priority />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'email' ? 'Login with OTP' : 'Verify OTP'}
          </CardTitle>
          <CardDescription>
            {step === 'email'
              ? 'Enter your email to receive a one-time password'
              : `Enter the 6-digit code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-4">
                <Label className="text-center block">Enter OTP Code</Label>
                <OTPInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isLoading}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Didn&apos;t receive code? Resend
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                }}
                className="w-full"
              >
                Change email
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

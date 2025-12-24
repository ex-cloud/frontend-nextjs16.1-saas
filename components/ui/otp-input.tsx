'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  length?: number
  onChange?: (value: string) => void
  value?: string
}

export function OTPInput({
  length = 6,
  onChange,
  value = '',
  className,
  ...props
}: OTPInputProps) {
  const [otp, setOtp] = React.useState<string[]>(Array(length).fill(''))
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => {
    if (value) {
      setOtp(value.split('').concat(Array(length).fill('')).slice(0, length))
    }
  }, [value, length])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return

    const newOtp = [...otp]
    newOtp[index] = digit.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onChange callback
    onChange?.(newOtp.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, length)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = pastedData.split('').concat(Array(length).fill('')).slice(0, length)
    setOtp(newOtp)
    onChange?.(newOtp.join(''))

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[lastIndex]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            'w-12 h-12 text-center text-2xl font-semibold',
            'border-2 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            'transition-all',
            digit ? 'border-primary' : 'border-input',
            className
          )}
          {...props}
        />
      ))}
    </div>
  )
}

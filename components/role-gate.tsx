"use client"

import { useSession } from "next-auth/react"

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

/**
 * Component untuk menampilkan/menyembunyikan UI berdasarkan role user
 * Digunakan untuk hide/show menu, button, atau section tertentu
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { data: session } = useSession()

  if (!session?.user?.roles) {
    return <>{fallback}</>
  }

  const userRoles = session.user.roles
  const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role))

  if (!hasAllowedRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await response.json()

          if (!response.ok || !data.success) {
            return null
          }

          // Extract role names from roles array
          const roleNames = data.data.user.roles?.map((role: { name: string }) => role.name) || []
          const permissionNames = data.data.user.permissions?.map((perm: { name: string }) => perm.name) || []

          return {
            id: data.data.user.id.toString(),
            email: data.data.user.email,
            name: data.data.user.name,
            accessToken: data.data.token,
            roles: roleNames,
            permissions: permissionNames,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken
        token.roles = user.roles
        token.permissions = user.permissions
        token.provider = account?.provider
        token.isActive = true // Assume active on initial login
      }

      // Handle social login
      if (account?.provider && account.provider !== 'credentials') {
        try {
          // Exchange social token for backend token
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/${account.provider}/callback?code=${account.access_token}`
          )
          const data = await response.json()
          
          if (data.access_token) {
            token.accessToken = data.access_token
            token.roles = data.user.roles
            token.permissions = data.user.permissions
          }
        } catch (error) {
          console.error('Social auth token exchange error:', error)
        }
      }

      // Validate user is still active on every request (except initial login)
      if (token.accessToken && !user) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/me`,
            {
              headers: {
                'Authorization': `Bearer ${token.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )

          if (!response.ok) {
            // Token invalid or user deactivated - force logout
            console.error('User validation failed:', response.status)
            return null // This will trigger logout
          }

          const data = await response.json()
          
          // Check if user is still active
          if (!data.data.is_active) {
            console.error('User account deactivated')
            return null // Force logout
          }

          // Update token with fresh data
          token.roles = data.data.roles?.map((r: { name: string }) => r.name) || []
          token.permissions = data.data.permissions?.map((p: { name: string }) => p.name) || []
          token.isActive = data.data.is_active
          
        } catch (error) {
          console.error('Token validation error:', error)
          // On error, allow the request to proceed but log it
          // This prevents logout on network issues
        }
      }

      return token
    },
    async session({ session, token }) {
      // If token is null (user deactivated), return null to trigger logout
      if (!token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return null as any
      }

      session.user.accessToken = token.accessToken as string
      session.user.roles = token.roles as string[]
      session.user.permissions = token.permissions as string[]
      session.user.provider = token.provider as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 60 minutes (match backend)
  },
})

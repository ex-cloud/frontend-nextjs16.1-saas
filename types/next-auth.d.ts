import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      accessToken?: string
      roles?: string[]
      permissions?: string[]
      provider?: string
    } & DefaultSession["user"]
  }

  interface User {
    accessToken?: string
    roles?: string[]
    permissions?: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    roles?: string[]
    permissions?: string[]
    provider?: string
  }
}

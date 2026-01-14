import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

interface BackendUser {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  roles?: { name: string }[];
  permissions?: { name: string }[];
}

declare global {
  var lastValidationMap: Map<string, number> | undefined;
  var pendingValidations: Map<string, Promise<BackendUser | null>> | undefined;
}

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
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            }/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok || !data.success) {
            return null;
          }

          // Extract role names from roles array
          const roleNames =
            data.data.user.roles?.map((role: { name: string }) => role.name) ||
            [];
          const permissionNames =
            data.data.user.permissions?.map(
              (perm: { name: string }) => perm.name
            ) || [];

          return {
            id: data.data.user.id.toString(),
            email: data.data.user.email,
            name: data.data.user.name,
            accessToken: data.data.token,
            roles: roleNames,
            permissions: permissionNames,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.provider = account?.provider;
        token.isActive = true; // Assume active on initial login
      }

      // Handle social login
      if (account?.provider && account.provider !== "credentials") {
        try {
          // Exchange social token for backend token
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            }/api/v1/auth/${account.provider}/callback?code=${
              account.access_token
            }`
          );
          const data = await response.json();

          if (data.access_token) {
            token.accessToken = data.access_token;
            token.roles = data.user.roles;
            token.permissions = data.user.permissions;
          }
        } catch (error) {
          console.error("Social auth token exchange error:", error);
        }
      }

      // Server-side cache to prevent concurrent redundant validations (Thundering Herd)
      const lastValidationMap =
        global.lastValidationMap || new Map<string, number>();
      const pendingValidations =
        global.pendingValidations ||
        new Map<string, Promise<BackendUser | null>>();
      if (!global.lastValidationMap)
        global.lastValidationMap = lastValidationMap;
      if (!global.pendingValidations)
        global.pendingValidations = pendingValidations;

      const userId = token.sub as string;
      const now = Date.now();
      const lastCheck =
        lastValidationMap.get(userId) || (token.lastValidatedAt as number) || 0;
      const shouldValidate = now - lastCheck > 60000;

      if (token.accessToken && !user && shouldValidate) {
        // If there's already a validation in progress for this user, wait for it
        if (pendingValidations.has(userId)) {
          try {
            const data = await pendingValidations.get(userId);
            if (data) {
              token.roles =
                data.roles?.map((r: { name: string }) => r.name) || [];
              token.permissions =
                data.permissions?.map((p: { name: string }) => p.name) || [];
              token.isActive = data.is_active;
              token.lastValidatedAt = Date.now();
              return token;
            }
          } catch {
            // Fallback to normal flow if pending fails
          }
        }

        // Start new validation and cache the promise
        const validationPromise = (async () => {
          try {
            const response = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
              }/api/v1/auth/me`,
              {
                headers: {
                  Authorization: `Bearer ${token.accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) return null;
            const resData = (await response.json()) as { data: BackendUser };
            return resData.data;
          } catch (error) {
            console.error("Validation fetch error:", error);
            return null;
          }
        })();

        pendingValidations.set(userId, validationPromise);

        try {
          const data = await validationPromise;
          pendingValidations.delete(userId);

          if (!data) return null; // Force logout

          // Check if user is still active
          if (!data.is_active) {
            console.error("User account deactivated");
            return null;
          }

          // Update token with fresh data
          token.roles = data.roles?.map((r: { name: string }) => r.name) || [];
          token.permissions =
            data.permissions?.map((p: { name: string }) => p.name) || [];
          token.isActive = data.is_active;
          token.lastValidatedAt = Date.now();
          lastValidationMap.set(userId, Date.now());
        } catch (error) {
          pendingValidations.delete(userId);
          console.error("Token validation error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // If token is null (user deactivated), return session as is (middlewares will handle redirect)
      if (!token) {
        return session;
      }

      session.user.id = token.sub as string;
      session.user.accessToken = token.accessToken as string;
      session.user.roles = token.roles as string[];
      session.user.permissions = token.permissions as string[];
      session.user.provider = token.provider as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 60 minutes (match backend)
  },
});

import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || (() => { throw new Error("GITHUB_CLIENT_ID is not defined") })(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET || (() => { throw new Error("GITHUB_CLIENT_SECRET is not defined") })(),
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    })
    
  ],
  callbacks: {
    async jwt({ token, account }) {
      // First time login: store GitHub access token
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "default-id";
        // Expose GitHub access token in session
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || (() => { throw new Error("GITHUB_CLIENT_ID is not defined") })(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET || (() => { throw new Error("GITHUB_CLIENT_SECRET is not defined") })(),
    }),
  ],
  pages: {
    signIn: "/login", // Optional: use custom login page
  },
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Ensure the redirect works for both dashboard and navbar
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl + "/dashboard";
    },
  },
};

export { handler as GET, handler as POST }

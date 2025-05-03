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
  }
}

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || (() => { throw new Error("GITHUB_CLIENT_ID is not defined") })(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET || (() => { throw new Error("GITHUB_CLIENT_SECRET is not defined") })()
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "default-id"
      }
      return session
    }
  }
})

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login", // Optional: use custom login page
  },
  callbacks: {
    async redirect({ baseUrl }: { url: string; baseUrl: string }) {
      return baseUrl + "/dashboard";
    },
  },
};

export { handler as GET, handler as POST }

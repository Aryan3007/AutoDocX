import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import { supabaseAdmin } from "@/lib/supabase-admin"

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
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user repo" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // This runs when user signs in
      if (account && user) {
        // Store the GitHub access token
        token.accessToken = account.access_token;
        
        // Make sure user data is complete
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      
      // Only try to save the user if we have a user ID and it's a GitHub sign-in
      if (token?.sub && account?.provider === "github") {
        try {
          // Save user to Supabase
          await supabaseAdmin.from("Users").upsert({
            id: token.sub,
            name: token.name,
            email: token.email,
            avatar_url: token.picture || "", // GitHub profile image is stored in token.picture
            github_id: token.sub,
            github_token: account.access_token, // Store GitHub access token
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });
          
          console.log("User saved to Supabase successfully");
        } catch (error) {
          console.error("Error saving user to Supabase:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.accessToken = token.accessToken as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle sign-out redirects explicitly
      if (url.includes("/api/auth/signout") || url.includes("/login")) {
        return baseUrl + "/login";
      }
      
      // For other redirects, use the normal logic
      return url.startsWith(baseUrl) ? url : baseUrl + "/dashboard";
    },
  },
});

export { handler as GET, handler as POST }
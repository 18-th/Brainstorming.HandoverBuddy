import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubLogin = (profile as { login: string }).login;
        token.githubId = String((profile as unknown as { id: number }).id);
        token.avatarUrl = (profile as { avatar_url: string }).avatar_url;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.githubLogin = token.githubLogin as string;
      session.user.githubId = token.githubId as string;
      session.user.avatarUrl = token.avatarUrl as string;
      return session;
    },
  },
});

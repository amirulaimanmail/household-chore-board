import CredentialsProvider from "next-auth/providers/credentials";

// OBJECTIVE: Implementing authentication with NextAuth.js
//
// DEMO ONLY: add hardcoded users here. In a real app, authorize()
// would look users up in a database and compare HASHED passwords.
const DEMO_USERS = [
  {
    id: "1",
    name: "Amirul",
    email: "amirul@gmail.com",
    password: "123",
  }
];

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = DEMO_USERS.find(
          (demoUser) =>
            credentials?.email === demoUser.email &&
            credentials?.password === demoUser.password
        );

        if (!user) return null; // null = failed login
        return { id: user.id, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    // The default session callback copies fields from the token onto
    // session.user as an explicit `undefined` for anything not set —
    // rebuilding it here keeps the session object predictable.
    async session({ session, token }) {
      session.user = { id: token.sub, name: token.name ?? null };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

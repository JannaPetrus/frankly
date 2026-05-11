import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { defaultCategories } from "@/lib/default-categories";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: { email: user.email, name: user.name, image: user.image },
        });

        await prisma.category.createMany({
          data: defaultCategories.map((cat) => ({
            ...cat,
            isDefault: true,
            userId: newUser.id,
          })),
        });
      } else {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { name: user.name, image: user.image },
        });
      }

      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
        }
      }
      return session;
    },
  },
});

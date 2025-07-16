//src/app/admin/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    // Admin değilse, veya giriş yapmamışsa ana sayfaya yönlendir.
    // Veya bir "Yetkiniz Yok" sayfası gösterilebilir.
    redirect("/");
  }

  return <>{children}</>;
}
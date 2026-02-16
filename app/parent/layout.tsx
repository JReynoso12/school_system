import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar variant="parent" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

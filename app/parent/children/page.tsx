import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ParentChildrenPage() {
  const session = await getSession();
  if (!session || session.role !== "PARENT") {
    redirect("/login");
  }
  redirect("/parent");
}

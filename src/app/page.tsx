import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { ensureBootstrap } from "@/lib/bootstrap";
import { getServerAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await connectToDatabase();
  await ensureBootstrap();

  const user = await getServerAuthUser();
  if (user) {
    redirect("/select-day");
  }

  redirect("/login");
}

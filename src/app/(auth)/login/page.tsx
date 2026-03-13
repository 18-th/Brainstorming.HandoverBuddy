import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignInButton from "@/components/sign-in-button";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Sign in to Handover Buddy</h1>
          <p className="mt-2 text-gray-600">Connect your GitHub account to get started.</p>
        </div>
        <SignInButton />
      </div>
    </main>
  );
}

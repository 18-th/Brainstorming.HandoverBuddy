"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface Props {
  user: {
    name?: string | null;
    githubLogin: string;
    avatarUrl?: string;
  };
}

export default function NavBar({ user }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-primary">
          Handover Buddy
        </Link>
        <div className="flex items-center gap-3">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.githubLogin}
              className="w-7 h-7 rounded-full"
            />
          )}
          <span className="text-sm text-gray-600">@{user.githubLogin}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-gray-500 hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

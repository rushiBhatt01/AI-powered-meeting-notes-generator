import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";

export default async function SettingsPage() {
  const user = await currentUser();

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">
        Settings
      </h1>

      {/* Profile Card */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-100">
          Profile Information
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <span className="text-sm text-zinc-400">Full Name</span>
            <span className="text-sm font-medium text-zinc-100">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm font-medium text-zinc-100">
              {user?.emailAddresses[0]?.emailAddress ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <span className="text-sm text-zinc-400">User ID</span>
            <span className="text-xs font-mono text-zinc-500">{user?.id}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-zinc-400">Joined</span>
            <span className="text-sm font-medium text-zinc-100">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Account Management Card */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-100">
          Account Management
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Sign out of your account. Your data will remain stored securely.
        </p>
        <SignOutButton>
          <button className="rounded-md bg-red-600/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 cursor-pointer">
            Sign Out
          </button>
        </SignOutButton>
      </section>
    </>
  );
}

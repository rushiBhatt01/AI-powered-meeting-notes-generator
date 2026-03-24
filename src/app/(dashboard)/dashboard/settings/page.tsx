import { getUserSettings } from "@/app/actions/user";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const settings = await getUserSettings().catch(() => ({ piiRedactionEnabled: false }));

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Preferences & Security
        </h1>
        <p className="mt-2 text-zinc-400">
          Manage your AI processing rules and account data.
        </p>
      </div>

      <SettingsClient initialPiiStatus={settings.piiRedactionEnabled} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { togglePiiRedaction, exportUserData, nuclearWipe } from "@/app/actions/user";
import ConfirmModal from "@/components/ui/confirm-modal";

export default function SettingsClient({
  initialPiiStatus,
}: {
  initialPiiStatus: boolean;
}) {
  const [piiEnabled, setPiiEnabled] = useState(initialPiiStatus);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const handleTogglePii = async () => {
    const newValue = !piiEnabled;
    setPiiEnabled(newValue);
    try {
      await togglePiiRedaction(newValue);
    } catch {
      setPiiEnabled(!newValue); // revert on failure
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportUserData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNuclearWipe = async () => {
    if (deleteConfirmationText !== "DELETE") return;
    try {
      await nuclearWipe();
      // user will naturally be redirected by Clerk's session loss,
      // but we can force it just in case:
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("Nuclear wipe failed. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Safe Mode Toggle (Story 5.3) */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Safe Mode (PII Redaction)</h2>
            <p className="mt-1 text-sm text-zinc-400 max-w-md">
              Automatically scrub personally identifiable information (emails, phone numbers, API keys) from your meeting intelligence before storing.
            </p>
          </div>
          <button
            onClick={handleTogglePii}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
              piiEnabled ? "bg-indigo-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                piiEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Data Export (Story 5.2) */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h2 className="text-lg font-semibold text-white">Data Export</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Download all your meetings, transcripts, and intelligence in a machine-readable JSON format.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="mt-4 rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {isExporting ? "Compiling Export..." : "Download Complete Export"}
        </button>
      </section>

      {/* Danger Zone (Story 5.4) */}
      <section className="rounded-xl border border-red-900/40 bg-red-950/10 p-6">
        <h2 className="text-lg font-semibold text-red-500">Danger Zone</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Permanently delete your account and wipe all your data from our servers. This action is irreversible.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="mt-4 rounded-md bg-red-600/90 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500"
        >
          Nuclear Delete Account
        </button>
      </section>

      {/* Nuclear Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-red-900/40 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-red-500">Nuclear Delete</h3>
            <p className="mt-2 text-sm text-zinc-300">
              This will permanently delete your user profile, all authentication records, 
              meeting transcripts, and extracted intelligence.
            </p>
            <p className="mt-4 text-sm font-semibold text-zinc-100">
              Type <span className="bg-zinc-800 px-1 py-0.5 rounded text-red-400">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                }}
                className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleNuclearWipe}
                disabled={deleteConfirmationText !== "DELETE"}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                Wipe All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

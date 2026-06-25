"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function DeleteAccountPage() {
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: requestType }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit request.");
      }
      
      setIsSuccess(true);
      setEmail("");
    } catch (err: any) {
      setErrorMsg("An error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6 sm:py-20">
      <header className="flex flex-col gap-3 border-b border-[color:var(--sage-soft)]/50 pb-8">
        <h1 className="heading-serif text-3xl font-semibold tracking-tight text-[#3F3A33]">
          Account Deletion Request
        </h1>
        <p className="text-[0.95rem] leading-relaxed text-[#6F685E]">
          How to permanently delete your account and all associated data from The Choice.
        </p>
      </header>

      <section className="flex flex-col gap-4 py-4">
        <h2 className="heading-serif text-xl font-medium text-[#3F3A33]">
          How to Delete Your Account
        </h2>
        <p className="text-[0.9rem] leading-relaxed text-[#6F685E]">
          You can instantly and permanently delete your account directly within the app.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-[0.9rem] text-[#6F685E]">
          <li>Open <strong>The Choice</strong> app on your device.</li>
          <li>Tap on the <strong>Settings</strong> icon.</li>
          <li>Scroll to the very bottom to the <strong>Danger Zone</strong> section.</li>
          <li>Tap <strong>Delete my account</strong>.</li>
          <li>Confirm your choice. This will instantly and permanently destroy your account and all associated data (both cloud and local) from our systems.</li>
        </ol>
      </section>

      <section className="flex flex-col gap-4 py-4 border-t border-[color:var(--sage-soft)]/30">
        <h2 className="heading-serif text-xl font-medium text-[#3F3A33]">
          Option 2: Web Request
        </h2>
        <p className="text-[0.9rem] leading-relaxed text-[#6F685E]">
          If you have already uninstalled the app and wish to delete your account, you can submit a deletion request below using the email address associated with your account.
        </p>
        
        {isSuccess ? (
          <div className="mt-2 rounded-xl bg-green-50 border border-green-200 p-5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">Request Received</p>
              <p className="text-sm text-green-700 leading-relaxed">
                We have received your {requestType === 'account' ? 'account deletion' : 'data deletion'} request. It will be manually processed within 14 days.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4 max-w-sm">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-[#3F3A33] uppercase tracking-wide">
                Account Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="rounded-xl border border-[#E0D7C7] bg-white px-4 py-2.5 text-[0.95rem] text-[#3F3A33] outline-none focus:border-[#8A9A5B] disabled:opacity-50"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="type" className="text-xs font-medium text-[#3F3A33] uppercase tracking-wide">
                What would you like to delete?
              </label>
              <select
                id="type"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                disabled={isLoading}
                className="rounded-xl border border-[#E0D7C7] bg-white px-4 py-2.5 text-[0.95rem] text-[#3F3A33] outline-none focus:border-[#8A9A5B] disabled:opacity-50 appearance-none"
              >
                <option value="account">Delete Entire Account & All Data</option>
                <option value="data">Delete All Data (Keep Account)</option>
              </select>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#8A9A5B] px-4 py-3 text-[0.95rem] font-medium text-white transition-colors hover:bg-[#7A8A4B] active:bg-[#6A7A3B] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Deletion Request"
              )}
            </button>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-xl bg-[#FBF7EE] p-5 text-[0.85rem] text-[#8C8275] border border-[#E6DFD2]">
        <p>
          <strong>Note regarding data retention:</strong> Once your account is deleted, 
          all of your personal data, including your email address, check-in history, and journal notes, are completely 
          purged from our active database. We do not retain any of your personal data.
        </p>
      </section>
    </main>
  );
}

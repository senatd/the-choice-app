export default function DeleteAccountPage() {
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
          Option 1: Delete via the App (Recommended)
        </h2>
        <p className="text-[0.9rem] leading-relaxed text-[#6F685E]">
          The fastest and easiest way to delete your account is directly within the app itself.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-[0.9rem] text-[#6F685E]">
          <li>Open <strong>The Choice</strong> app on your device.</li>
          <li>Tap on the <strong>Settings</strong> icon.</li>
          <li>Scroll down to the Storage section and tap <strong>Downgrade to Local Only</strong>.</li>
          <li>Confirm your choice. This will instantly and permanently destroy your cloud account, deleting your email, password, and all associated journal entries from our servers.</li>
        </ol>
      </section>

      <section className="flex flex-col gap-4 py-4 border-t border-[color:var(--sage-soft)]/30">
        <h2 className="heading-serif text-xl font-medium text-[#3F3A33]">
          Option 2: Email Request
        </h2>
        <p className="text-[0.9rem] leading-relaxed text-[#6F685E]">
          If you no longer have access to the app and wish to delete your account, you can submit an email request.
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-[0.9rem] text-[#6F685E]">
          <li>Send an email to <strong>senaozkanca0@gmail.com</strong>.</li>
          <li>You <strong>must</strong> send the email from the exact address you used to create your account.</li>
          <li>Use the subject line: <strong>Account Deletion Request</strong>.</li>
          <li>Your account and all associated data will be manually deleted within 14 days of receiving your request.</li>
        </ol>
      </section>
      
      <section className="mt-8 rounded-xl bg-[#FBF7EE] p-5 text-[0.85rem] text-[#8C8275] border border-[#E6DFD2]">
        <p>
          <strong>Note regarding data retention:</strong> Once your account is deleted using either method above, 
          all of your personal data, including your email address, check-in history, and journal notes, are completely 
          purged from our active database. We do not retain any of your personal data after deletion.
        </p>
      </section>
    </main>
  );
}

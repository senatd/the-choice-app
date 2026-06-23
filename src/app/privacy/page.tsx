"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] px-6 py-12 sm:px-12 pb-32">
      <div className="mx-auto max-w-2xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[#8A9A5B] hover:text-[#6F685E] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        
        <h1 className="heading-serif text-3xl font-semibold text-[#3F3A33] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#9A9184] mb-8">Last updated: June 2026</p>

        <div className="space-y-8 text-[#6F685E] text-sm leading-relaxed">
          <section>
            <h2 className="heading-serif text-xl text-[#3F3A33] mb-3">1. Information We Collect</h2>
            <p>
              When you create an account with the Choice, we collect your email address. This is strictly used to authenticate your account and ensure your daily reflections are securely synced and backed up. Your reflection data (check-ins, decisions, and private notes) is stored securely.
            </p>
          </section>

          <section>
            <h2 className="heading-serif text-xl text-[#3F3A33] mb-3">2. How We Use Your Data</h2>
            <p>
              Your data is used solely to provide the core functionality of the app—allowing you to track your feelings and view your historical insights. <strong>We do not sell, rent, or share your personal data or private reflections with any third parties or advertisers.</strong>
            </p>
          </section>

          <section>
            <h2 className="heading-serif text-xl text-[#3F3A33] mb-3">3. Data Security</h2>
            <p>
              We implement strict, industry-standard security measures to protect your information. Your private reflections are protected by database Row Level Security (RLS), ensuring that only your authenticated account can access your personal data.
            </p>
          </section>

          <section>
            <h2 className="heading-serif text-xl text-[#3F3A33] mb-3">4. Deleting Your Data</h2>
            <p>
              You have the absolute right to delete your personal information at any time. You can permanently delete your account and all associated reflection data directly within the app by navigating to <strong>Settings &gt; Delete my account</strong>. Once deleted, this data cannot be recovered.
            </p>
          </section>

          <section>
            <h2 className="heading-serif text-xl text-[#3F3A33] mb-3">5. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact us at <a href="mailto:hello@thechoice.app" className="text-[#8A9A5B] underline hover:text-[#6F685E]">hello@thechoice.app</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

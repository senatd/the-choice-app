"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { StorageService } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [showLocalWarning, setShowLocalWarning] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.replace("/");
      }
    };
    void checkSession();
  }, [router]);

  const confirmLocalEntry = () => {
    StorageService.setMode("local");
    toast.success("Using App Offline");
    router.replace("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (resetError) throw resetError;
        setResetSent(true);
        return;
      }

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        toast.success("Welcome back", {
          description: "You’re back in your space.",
        });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName || null,
            },
          },
        });
        if (signUpError) throw signUpError;

        // If email confirmation is enabled, session will be null
        if (data.user && !data.session) {
          setNeedsEmailVerification(true);
          return; // Don't redirect, show the verification message
        }

        toast.success("Account created", {
          description: "We’ve set aside a space just for you.",
        });
      }

      router.replace("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast.error("Something felt off", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === "login" ? "Welcome back"
      : mode === "signup" ? "Create your space"
        : "Reset your password";
  const subtitle =
    mode === "login"
      ? "Enter your details to step back into your reflections."
      : mode === "signup"
        ? "A quiet account for a question that doesn’t need quick answers."
        : "Enter your email and we'll send you a reset link.";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--sage-soft)] bg-white/70 px-3 py-1 text-[0.7rem] font-medium text-[#6F685E]">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--sage)]" />
            The Choice
          </p>
          <h1 className="heading-serif text-2xl font-semibold text-[#3F3A33]">
            {title}
          </h1>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-[#6F685E]">
            {subtitle}
          </p>
        </div>

        <Card className="bg-white/90">
          <CardHeader className="pb-3">
            <CardTitle className="heading-serif text-base">
              {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Forgot password"}
            </CardTitle>
            <CardDescription className="text-[0.8rem]">
              {mode === "forgot"
                ? "We'll send a reset link to your inbox."
                : "Welcome to the Choice. Use your email and password to log in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ── Reset sent confirmation ── */}
            {resetSent ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/30">
                  <span className="text-2xl">📬</span>
                </div>
                <p className="heading-serif text-[#3F3A33]">Check your inbox</p>
                <p className="text-xs text-[#6F685E] leading-relaxed">
                  We sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetSent(false); }}
                  className="text-xs font-medium text-[#8A9A5B] underline-offset-2 hover:underline"
                >
                  Back to log in
                </button>
              </div>
            ) : needsEmailVerification ? (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--sage-soft)]/30">
                  <span className="text-2xl">✉️</span>
                </div>
                <p className="heading-serif text-[#3F3A33]">Verify your email</p>
                <p className="text-xs text-[#6F685E] leading-relaxed">
                  We just sent a confirmation link to <strong>{email}</strong>. Click the link in the email to activate your account.
                </p>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setNeedsEmailVerification(false); }}
                  className="text-xs font-medium text-[#8A9A5B] underline-offset-2 hover:underline mt-2"
                >
                  I verified my email, log me in
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="first-name" className="text-xs font-medium text-[#3F3A33]">
                      First name
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--sage-soft)] bg-[#FDFBF7] px-3 py-2 text-sm text-[#3F3A33] outline-none transition focus:border-[color:var(--sage)]"
                    />
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="text-xs font-medium text-[#3F3A33]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-[color:var(--sage-soft)] bg-[#FDFBF7] px-3 py-2 text-sm text-[#3F3A33] outline-none transition focus:border-[color:var(--sage)]"
                  />
                </div>

                {mode !== "forgot" && (
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-xs font-medium text-[#3F3A33]">
                        Password
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-[0.72rem] text-[#9A9184] underline-offset-2 hover:underline hover:text-[#6F685E]"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-[color:var(--sage-soft)] bg-[#FDFBF7] px-3 py-2 text-sm text-[#3F3A33] outline-none transition focus:border-[color:var(--sage)]"
                    />
                  </div>
                )}

                {error && <p className="text-xs text-[#C46A4A]">{error}</p>}

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 h-11 w-full justify-center rounded-full text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? mode === "login" ? "Logging in…"
                      : mode === "forgot" ? "Sending…"
                        : "Creating account…"
                    : mode === "login" ? "Log in"
                      : mode === "forgot" ? "Send reset link"
                        : "Sign up"}
                </Button>
              </form>
            )}

            {!resetSent && !needsEmailVerification && (
              <div className="mt-4 flex items-center justify-between text-[0.78rem] text-[#6F685E]">
                <span>
                  {mode === "login" ? "New here?"
                    : mode === "signup" ? "Already have an account?"
                      : "Remember it?"}
                </span>
                <button
                  type="button"
                  onClick={() => { setMode(mode === "signup" ? "login" : mode === "forgot" ? "login" : "signup"); setError(null); }}
                  className="font-medium text-[#3F3A33] underline-offset-2 hover:underline"
                >
                  {mode === "login" ? "Create one" : "Log in"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Local Mode Entry ── */}
        {!showLocalWarning && (
          <div className="text-center pt-4 border-t border-[color:var(--sage-soft)]/50 mt-6">
            <p className="text-[0.78rem] text-[#6F685E] mb-3">Prefer absolute privacy?</p>
            <button
              onClick={() => setShowLocalWarning(true)}
              className="text-xs font-medium text-[#3F3A33] px-4 py-2 rounded-full border border-[#D9D2C5] bg-[#F5F0E8] hover:bg-[#EDE8DF] transition-colors"
            >
              Use App Offline / Local Only
            </button>
          </div>
        )}
      </div>

      {showLocalWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFBF7]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/5 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-[#3F3A33]">Use Local Only?</h2>
            <p className="mt-2 text-sm text-[#6F685E] leading-relaxed">
              In Local Mode, your data never leaves this device. <strong>However, if you delete the app, you will lose all the data permanently.</strong>
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setShowLocalWarning(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#3F3A33] hover:bg-[#F0EBE0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLocalEntry}
                className="rounded-full bg-[#8A9A5B] px-4 py-2 text-sm font-medium text-white hover:bg-[#788849] transition-colors"
              >
                Proceed Offline
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}






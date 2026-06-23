"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabaseClient";

export type Profile = {
  id: string;
  display_name: string | null;
  is_premium: boolean;
  custom_tags: string[];
};

type UseProfileReturn = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("id, display_name, is_premium, custom_tags")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        // If no profile row exists yet (e.g. trigger hasn't fired), create one
        if (fetchError.code === "PGRST116") {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({ id: user.id })
            .select("id, display_name, is_premium, custom_tags")
            .single();

          if (insertError) throw insertError;
          setProfile(newProfile);
        } else {
          throw fetchError;
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}

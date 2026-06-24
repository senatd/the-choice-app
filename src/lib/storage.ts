import { supabase } from "@/lib/supabaseClient";

export type StorageMode = "local" | "cloud";

export type CheckIn = {
  id: string;
  created_at: string;
  decision: "yes" | "no" | "undecided";
  tags: string[];
  notes?: string | null;
  user_id?: string;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  custom_tags: string[] | null;
  is_premium: boolean;
};

export const StorageService = {
  getMode(): StorageMode {
    if (typeof window === "undefined") return "cloud";
    return (localStorage.getItem("storage_mode") as StorageMode) || "cloud";
  },

  setMode(mode: StorageMode) {
    if (typeof window !== "undefined") {
      localStorage.setItem("storage_mode", mode);
    }
  },

  async getCheckIns(): Promise<CheckIn[]> {
    if (this.getMode() === "local") {
      const stored = localStorage.getItem("local_checkins");
      return stored ? JSON.parse(stored) : [];
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return error ? [] : (data as CheckIn[]);
    }
  },

  async saveCheckIn(checkIn: Partial<CheckIn>, isUpdate: boolean): Promise<CheckIn | null> {
    if (this.getMode() === "local") {
      const all = await this.getCheckIns();
      if (isUpdate && checkIn.id) {
        const index = all.findIndex(c => c.id === checkIn.id);
        if (index !== -1) {
          all[index] = { ...all[index], ...checkIn };
          localStorage.setItem("local_checkins", JSON.stringify(all));
          return all[index];
        }
        return null;
      } else {
        const newEntry = {
          ...checkIn,
          id: checkIn.id || "local-" + Date.now().toString(),
          created_at: checkIn.created_at || new Date().toISOString(),
        } as CheckIn;
        all.unshift(newEntry);
        all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        localStorage.setItem("local_checkins", JSON.stringify(all));
        return newEntry;
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const payload = {
        decision: checkIn.decision,
        tags: checkIn.tags,
        notes: checkIn.notes,
        ...(checkIn.created_at && { created_at: checkIn.created_at })
      };

      if (isUpdate && checkIn.id) {
        const { data, error } = await supabase
          .from("daily_checkins")
          .update(payload)
          .eq("id", checkIn.id)
          .select()
          .single();
        if (error) throw error;
        return data as CheckIn;
      } else {
        const { data, error } = await supabase
          .from("daily_checkins")
          .insert({ user_id: user.id, ...payload })
          .select()
          .single();
        if (error) throw error;
        return data as CheckIn;
      }
    }
  },

  async getProfile(): Promise<UserProfile | null> {
    if (this.getMode() === "local") {
      const stored = localStorage.getItem("local_profile");
      return stored ? JSON.parse(stored) : { id: "local-user", display_name: null, custom_tags: [], is_premium: false };
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, custom_tags, is_premium")
        .eq("id", user.id)
        .single();
      return data as UserProfile;
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (this.getMode() === "local") {
      const current = await this.getProfile();
      const newProfile = { ...current, ...updates };
      localStorage.setItem("local_profile", JSON.stringify(newProfile));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
    }
  },

  async deleteData(): Promise<void> {
    if (this.getMode() === "local") {
      localStorage.removeItem("local_checkins");
      localStorage.removeItem("local_profile");
    } else {
      await supabase.rpc('delete_user');
      await supabase.auth.signOut();
    }
  },

  async uploadLocalDataToCloud(userId: string): Promise<void> {
    const localCheckInsStr = localStorage.getItem("local_checkins");
    if (localCheckInsStr) {
      const checkIns = JSON.parse(localCheckInsStr) as CheckIn[];
      for (const c of checkIns) {
        // For local IDs that might be like 'local-123', we can let Supabase generate a UUID
        // But if they are UUIDs, upsert is fine. The safest is to insert without ID so Postgres handles UUID.
        await supabase.from("daily_checkins").insert({ 
          user_id: userId,
          decision: c.decision, 
          tags: c.tags, 
          notes: c.notes,
          created_at: c.created_at
        });
      }
    }
    const localProfileStr = localStorage.getItem("local_profile");
    if (localProfileStr) {
      const profile = JSON.parse(localProfileStr);
      await supabase.from("profiles").update({
        display_name: profile.display_name,
        custom_tags: profile.custom_tags
      }).eq("id", userId);
    }
    // Clear local data after migration
    localStorage.removeItem("local_checkins");
    localStorage.removeItem("local_profile");
  }
};

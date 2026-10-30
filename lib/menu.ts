import { SEED_MENU } from "./menu-seed.ts";
import { publicClient, supabaseConfigured } from "./supabase.ts";
import type { MenuItem } from "./types.ts";

export async function getMenu(): Promise<{ menu: MenuItem[]; live: boolean }> {
  if (!supabaseConfigured) return { menu: SEED_MENU, live: false };
  const { data, error } = await publicClient().from("menu_items").select("*").order("sort");
  if (error) {
    console.error("menu fetch failed", error);
    return { menu: SEED_MENU, live: false };
  }
  return { menu: data as MenuItem[], live: true };
}

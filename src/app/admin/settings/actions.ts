"use server";

import { revalidatePath } from "next/cache";
import { OPTION_DEFAULTS, setOptions, type OptionKey } from "@/lib/options";
import { requireAdmin } from "@/lib/session";

export type SettingsState = { saved?: boolean; savedAt?: number };

/** Saves the options named in the form's `fields` list. Unchecked checkboxes are saved as "0". */
export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await requireAdmin();
  const fields = String(form.get("fields") ?? "").split(",").filter((f) => f in OPTION_DEFAULTS) as OptionKey[];
  const values: Partial<Record<OptionKey, string>> = {};
  for (const key of fields) {
    const v = form.get(key);
    values[key] = v === null ? "0" : String(v).trim();
  }
  await setOptions(values);
  revalidatePath("/", "layout");
  return { saved: true, savedAt: Date.now() };
}

"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "../settings/actions";

export function SettingsForm({ fields, children }: { fields: string[]; children: React.ReactNode }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  return (
    <form action={action}>
      {state.saved && (
        <div className="wp-notice" role="status"><p><strong>Settings saved.</strong></p></div>
      )}
      <input type="hidden" name="fields" value={fields.join(",")} />
      <table className="form-table" role="presentation">
        <tbody>{children}</tbody>
      </table>
      <p style={{ marginTop: 20 }}>
        <button className="wp-btn wp-btn-primary" disabled={pending}>{pending ? "Saving…" : "Save Changes"}</button>
      </p>
    </form>
  );
}

export function Row({ label, htmlFor, children, description }: { label: string; htmlFor?: string; children: React.ReactNode; description?: React.ReactNode }) {
  return (
    <tr>
      <th scope="row">{htmlFor ? <label htmlFor={htmlFor}>{label}</label> : label}</th>
      <td>
        {children}
        {description && <p className="description">{description}</p>}
      </td>
    </tr>
  );
}

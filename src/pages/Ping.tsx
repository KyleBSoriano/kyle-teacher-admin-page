// src/pages/Ping.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function Ping() {
  const [envOk, setEnvOk] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [profileOk, setProfileOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setEnvOk(!!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON);

    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? null);
    });

    (async () => {
      try {
        const s = await supabase.from("schools").select("*").limit(5);
        if (s.error) throw s.error;
        setSchools(s.data ?? []);

        const p = await supabase.from("profiles").select("*").single();
        if (p.error) throw p.error;
        setProfileOk(!!p.data);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Diagnostics</h2>
      <ul>
        <li>Env: {envOk ? "✅" : "❌"}</li>
        <li>Auth session: {email ? `✅ ${email}` : "❌"}</li>
        <li>DB read (schools): {schools.length ? `✅ (${schools.length})` : "❌"}</li>
        <li>RLS read own profile: {profileOk ? "✅" : "❌"}</li>
      </ul>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
    </div>
  );
}

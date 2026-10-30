"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient, supabaseConfigured } from "@/lib/supabase";
import OrdersPanel from "./OrdersPanel";
import MenuPanel from "./MenuPanel";

type Tab = "orders" | "menu";

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("orders");

  useEffect(() => {
    if (!supabaseConfigured) return setReady(true);
    const sb = browserClient();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    browserClient()
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [session]);

  let body: React.ReactNode;
  if (!supabaseConfigured) {
    body = <div className="notice">还没连上 Supabase。按 README 设置好环境变量后再来。</div>;
  } else if (!ready) {
    body = <p className="empty">加载中…</p>;
  } else if (!session) {
    body = <Login />;
  } else if (isAdmin === null) {
    body = <p className="empty">检查权限…</p>;
  } else if (!isAdmin) {
    body = (
      <div className="notice">
        <p>{session.user.email} 还不是管理员。在 Supabase 的 SQL Editor 运行下面这句，再刷新页面：</p>
        <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>insert into public.admins (user_id) values (&apos;{session.user.id}&apos;);</pre>
      </div>
    );
  } else {
    body = (
      <>
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === "orders"} onClick={() => setTab("orders")}>订单</button>
          <button className="tab" role="tab" aria-selected={tab === "menu"} onClick={() => setTab("menu")}>菜单</button>
        </div>
        {tab === "orders" ? <OrdersPanel /> : <MenuPanel />}
      </>
    );
  }

  return (
    <div className="admin">
      <header className="bar">
        <div className="wrap">
          <a className="name" href="/">天才港点</a>
          <span>后台</span>
          <span className="spacer" />
          {session && (
            <button className="btn small ghost" onClick={() => browserClient().auth.signOut()}>退出</button>
          )}
        </div>
      </header>
      <main className="wrap">{body}</main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.signInWithPassword({ email, password });
    if (error) setError("邮箱或密码不对。");
    setBusy(false);
  }

  return (
    <form className="order-card login" onSubmit={submit}>
      <h3>登录后台</h3>
      <div className="field">
        <label htmlFor="a-email">邮箱</label>
        <input id="a-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="a-pass">密码</label>
        <input id="a-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn red" type="submit" disabled={busy}>{busy ? "登录中…" : "登录"}</button>
    </form>
  );
}

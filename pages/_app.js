// pages/_app.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function isPublicPath(pathname) {
  return pathname === "/login";
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  async function checkAuth(pathname) {
    if (isPublicPath(pathname)) {
      setChecking(false);
      setAuthed(false);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        setAuthed(true);
        setChecking(false);
        return;
      }
      setAuthed(false);
      setChecking(false);
      const next = encodeURIComponent(router.asPath || "/");
      router.replace(`/login?next=${next}`);
    } catch {
      setAuthed(false);
      setChecking(false);
      const next = encodeURIComponent(router.asPath || "/");
      router.replace(`/login?next=${next}`);
    }
  }

  useEffect(() => {
    checkAuth(router.pathname);
    const handle = (url) => checkAuth(url.split("?")[0]);
    router.events.on("routeChangeComplete", handle);
    return () => router.events.off("routeChangeComplete", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setAuthed(false);
      router.replace("/login");
    }
  }

  const showNav = router.pathname !== "/login";

  return (
    <>
      {showNav && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Link href="/" style={{ fontWeight: 700 }}>IAS</Link>
            <Link href="/leads">Leads</Link>
            <Link href="/tasks">Tasks</Link>
          </div>
          {authed ? (
            <button onClick={logout} style={{ padding: "8px 10px" }}>Logout</button>
          ) : null}
        </div>
      )}

      {checking && !isPublicPath(router.pathname) ? (
        <div style={{ padding: 24 }}>Checking session…</div>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}

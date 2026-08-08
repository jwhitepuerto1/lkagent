// pages/members/account.js
//
// Reference pattern for gating future member-facing pages (data room, capital
// raise, investment accounts): resolve the member server-side and redirect
// before any content is sent to the client, rather than the admin app's
// client-side-only check.
import { getMemberFromReq } from "../../lib/memberAuth.js";

export async function getServerSideProps({ req, resolvedUrl }) {
  const member = await getMemberFromReq(req);

  if (!member) {
    const next = encodeURIComponent(resolvedUrl || "/members/account");
    return { redirect: { destination: `/members/login?next=${next}`, permanent: false } };
  }

  return {
    props: {
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        entitlements: member.entitlements.map((e) => ({ module: e.module, status: e.status })),
      },
    },
  };
}

export default function MemberAccountPage({ member }) {
  async function logout() {
    await fetch("/api/members/logout", { method: "POST", credentials: "include" });
    window.location.href = "/members/login";
  }

  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ marginTop: 0 }}>
        Welcome, {member.firstName} {member.lastName}
      </h1>
      <div style={{ marginBottom: 16 }}>{member.email}</div>

      <h2 style={{ fontSize: 16 }}>Module access</h2>
      <ul>
        {member.entitlements.map((e) => (
          <li key={e.module}>
            {e.module}: {e.status}
          </li>
        ))}
      </ul>

      <button onClick={logout} style={{ padding: "8px 10px", marginTop: 16 }}>
        Logout
      </button>
    </div>
  );
}

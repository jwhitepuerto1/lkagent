// pages/leads/index.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function LeadsIndexPage() {
  const [leads, setLeads] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [stage, setStage] = useState("");
  const [owner, setOwner] = useState("");

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  async function loadLeads(opts = {}) {
    setApiError("");
    setLoading(true);

    const next = {
      page: opts.page ?? pageInfo.page ?? 1,
      pageSize: opts.pageSize ?? pageInfo.pageSize ?? 25,
      q: opts.q ?? q,
      status: opts.status ?? status,
      stage: opts.stage ?? stage,
      owner: opts.owner ?? owner,
    };

    try {
      const params = new URLSearchParams();
      params.set("v", "2");
      params.set("page", String(next.page));
      params.set("pageSize", String(next.pageSize));
      if (next.q) params.set("q", next.q);
      if (next.status) params.set("status", next.status);
      if (next.stage) params.set("stage", next.stage);
      if (next.owner) params.set("owner", next.owner);

      const res = await fetch(`/api/leads?${params.toString()}`, { cache: "no-store" });

      if (!res.ok) {
        let msg = `API error (${res.status})`;
        try {
          const body = await res.json();
          msg = body?.message || body?.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const data = await res.json();

      // Support:
      // - V2: { data: [...], pageInfo: {...} }
      // - V1 array: [...]
      // - V1 object: { leads: [...] }
      const list = Array.isArray(data) ? data : (data?.data ?? data?.leads ?? []);
      setLeads(Array.isArray(list) ? list : []);

      const pi = data?.pageInfo;
      if (pi && typeof pi === "object") {
        setPageInfo({
          page: Number(pi.page) || next.page,
          pageSize: Number(pi.pageSize) || next.pageSize,
          total: Number(pi.total) || 0,
          totalPages: Number(pi.totalPages) || 0,
        });
      } else {
        // fallback if server isn't returning pageInfo
        setPageInfo((p) => ({ ...p, page: next.page, pageSize: next.pageSize }));
      }
    } catch (err) {
      setApiError(err?.message || "API error");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedLeads = useMemo(() => [...leads], [leads]);

  const canPrev = (pageInfo.page || 1) > 1;
  const canNext = pageInfo.totalPages ? pageInfo.page < pageInfo.totalPages : sortedLeads.length === pageInfo.pageSize;

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Leads</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => loadLeads()} style={{ padding: "8px 12px" }}>
            Refresh
          </button>

          <Link href="/leads/new" style={{ padding: "8px 12px", border: "1px solid #333", borderRadius: 6 }}>
            + New Lead
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (id or name)…"
          style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadLeads({ page: 1, q });
          }}
        />
        <input
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="Status"
          style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          onKeyDown={(e) => e.key === "Enter" && loadLeads({ page: 1, status })}
        />
        <input
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          placeholder="Stage"
          style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          onKeyDown={(e) => e.key === "Enter" && loadLeads({ page: 1, stage })}
        />
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Owner"
          style={{ padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6 }}
          onKeyDown={(e) => e.key === "Enter" && loadLeads({ page: 1, owner })}
        />
        <button onClick={() => loadLeads({ page: 1 })} style={{ padding: "8px 12px" }}>
          Apply
        </button>
      </div>

      {/* Paging */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Page {pageInfo.page}
          {pageInfo.totalPages ? ` of ${pageInfo.totalPages}` : ""} • Total {pageInfo.total}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={!canPrev || loading} onClick={() => loadLeads({ page: pageInfo.page - 1 })} style={{ padding: "6px 10px" }}>
            Prev
          </button>
          <button disabled={!canNext || loading} onClick={() => loadLeads({ page: pageInfo.page + 1 })} style={{ padding: "6px 10px" }}>
            Next
          </button>
        </div>
      </div>

      {apiError ? <p style={{ color: "crimson", marginTop: 8 }}>API error: {apiError}</p> : null}

      {loading ? (
        <p style={{ marginTop: 16 }}>Loading…</p>
      ) : sortedLeads.length === 0 ? (
        <p style={{ marginTop: 16 }}>No leads yet.</p>
      ) : (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          {sortedLeads.map((l) => (
            <div
              key={l.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>
                  <Link href={`/leads/${l.id}`}>{l.name || l.id}</Link>
                </div>

                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                  <span>Id: {l.id}</span>{" "}
                  {l.segment ? <>• Segment: {l.segment}</> : null}{" "}
                  {l.stage ? <>• Stage: {l.stage}</> : null}{" "}
                  {l.status ? <>• Status: {l.status}</> : null}
                </div>
              </div>

              <div style={{ textAlign: "right", fontSize: 13, opacity: 0.85 }}>
                {l.owner ? <div>Owner: {l.owner}</div> : null}
                {l.priority ? <div>Priority: {l.priority}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
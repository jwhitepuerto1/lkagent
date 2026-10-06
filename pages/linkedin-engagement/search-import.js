// pages/linkedin-engagement/search-import.js
// One-off tool: run a LinkedIn people search, select results across as many
// searches as needed, then export everything selected as one CSV in the
// ias_cre_agent format. Nothing here is written to the database - selections
// live only in this page's state until exported (see search.js /
// search-export.js). Not part of the daily pipeline; John's use case is a
// handful of one-time keyword searches (e.g. "real estate sponsor"), not a
// recurring sync.
//
// Connection-degree defaults to 1st-only (the original scope) - broadening
// to 2nd/3rd is a deliberate opt-in, confirmed useful (2026-08-27) after a
// 1st-degree-only search on a narrow keyword legitimately returned as few as
// 16 real matches (Unipile's own paging.total_count confirmed it wasn't
// truncated). 2nd/3rd-degree results need an invite before they can be
// DMed - 1st-degree ones don't - so each result's degree is shown.
import { useState } from "react";
import Layout from "../../components/Layout";

const btn = { padding: "8px 14px", marginRight: 8 };

export default function SearchImportPage() {
  const [mode, setMode] = useState("keyword"); // "keyword" | "list"
  const [keywords, setKeywords] = useState("");
  const [api, setApi] = useState("sales_navigator");
  const [degrees, setDegrees] = useState({ 1: true, 2: false, 3: false });
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Map()); // linkedinUrn -> profile, across all searches
  const [searching, setSearching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const [connFilter, setConnFilter] = useState("");
  const [connNote, setConnNote] = useState("");
  const [listQuery, setListQuery] = useState("");
  const [listMatches, setListMatches] = useState([]);
  const [selectedList, setSelectedList] = useState(null); // { id, title }
  const [findingList, setFindingList] = useState(false);

  async function findLists(e) {
    e.preventDefault();
    setFindingList(true);
    setError("");
    setSelectedList(null);
    try {
      const res = await fetch("/api/linkedin-engagement/search-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: listQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "List lookup failed");
      setListMatches(data.lists);
    } catch (e) {
      setError(e.message);
    } finally {
      setFindingList(false);
    }
  }

  async function loadConnections() {
    setSearching(true);
    setError("");
    setConnNote("");
    try {
      const res = await fetch("/api/linkedin-engagement/connections", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to load connections");
      setResults(data.items);
      setConnFilter("");
      setConnNote(
        data.truncated
          ? `Loaded ${data.items.length} - stopped at the page cap, so this may not be your full network.`
          : `Loaded all ${data.items.length} connections.`
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  const CONN_VISIBLE_MAX = 200;
  const connMatches =
    mode === "connections"
      ? results.filter((p) => {
          const q = connFilter.trim().toLowerCase();
          if (!q) return true;
          return `${p.fullName || ""} ${p.headline || ""}`.toLowerCase().includes(q);
        })
      : [];

  function selectAllMatching() {
    setSelected((prev) => {
      const next = new Map(prev);
      connMatches.forEach((p) => next.set(p.linkedinUrn, p));
      return next;
    });
  }

  async function runSearch(e) {
    e.preventDefault();
    if (mode === "keyword" && !keywords.trim()) return;
    if (mode === "list" && !selectedList) return;
    setSearching(true);
    setError("");
    try {
      const networkDistance = Object.entries(degrees)
        .filter(([, checked]) => checked)
        .map(([degree]) => Number(degree));
      const body =
        mode === "list"
          ? { leadListId: selectedList.id, limit: 100, networkDistance }
          : { keywords: keywords.trim(), limit: 20, api, networkDistance };
      const res = await fetch("/api/linkedin-engagement/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Search failed");
      setResults(data.items);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }

  function toggle(profile) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(profile.linkedinUrn)) next.delete(profile.linkedinUrn);
      else next.set(profile.linkedinUrn, profile);
      return next;
    });
  }

  function removeSelected(urn) {
    setSelected((prev) => {
      const next = new Map(prev);
      next.delete(urn);
      return next;
    });
  }

  async function downloadCsv() {
    if (selected.size === 0) return;
    setExporting(true);
    setError("");
    try {
      const res = await fetch("/api/linkedin-engagement/search-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles: [...selected.values()] }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const fileName = match ? match[1] : "linkedin-search-export.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout>
      <h1>Search Import</h1>
      <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 720 }}>
        Two ways to build a list here: run a fresh keyword search, or pull the members of a list
        you already built in Sales Navigator. Either way it&apos;s one-off - not a daily sync, and
        nothing here is saved to the database until you download the CSV. Run as many
        searches/lists as you need; selections carry over between them, so you can build one CSV
        across all of them. Sales Navigator caps a single keyword search at 2,500 results
        (Classic caps at 1,000) - LinkedIn&apos;s own per-query limit, not a daily one - so keep
        each keyword search narrow rather than one broad query, per Unipile&apos;s own guidance.
      </p>
      <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 720 }}>
        Defaults to 1st-degree connections only. Widening to 2nd/3rd-degree searches beyond your
        existing network - normal for Sales Navigator prospecting - but those people need a
        connection invite before you can DM them; 1st-degree ones don&apos;t. Each result below
        shows its degree so you know which applies.
      </p>

      <div style={{ margin: "16px 0 6px", fontSize: 13 }}>
        <label style={{ marginRight: 16 }}>
          <input type="radio" checked={mode === "keyword"} onChange={() => { if (mode === "connections") setResults([]); setMode("keyword"); }} /> Keyword search
        </label>
        <label style={{ marginRight: 16 }}>
          <input type="radio" checked={mode === "list"} onChange={() => { if (mode === "connections") setResults([]); setMode("list"); }} /> Export a saved Sales Navigator list
        </label>
        <label>
          <input
            type="radio"
            checked={mode === "connections"}
            onChange={() => {
              setMode("connections");
              setResults([]);
              setConnNote("");
            }}
          />{" "}
          Export my connections
        </label>
      </div>

      {mode === "connections" ? (
        <div style={{ margin: "10px 0" }}>
          <button style={btn} onClick={loadConnections} disabled={searching}>
            {searching ? "Loading (can take ~20s)…" : "Load my connections"}
          </button>
          <span style={{ fontSize: 13, opacity: 0.75 }}>
            Pulls your 1st-degree connections (name, headline, profile URL; no company). Manual only -
            Unipile asks for careful use of this call, so don&apos;t hammer it.
          </span>
          {connNote ? <p style={{ fontSize: 13, margin: "8px 0" }}>{connNote}</p> : null}
          {results.length > 0 ? (
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={connFilter}
                onChange={(e) => setConnFilter(e.target.value)}
                placeholder="Filter by name or headline"
                style={{ padding: 8, width: 320, marginRight: 8 }}
              />
              <button style={btn} onClick={selectAllMatching} disabled={connMatches.length === 0}>
                Select all matching ({connMatches.length})
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "list" ? (
        <form onSubmit={findLists} style={{ margin: "10px 0" }}>
          <input
            type="text"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="List name (leave blank to see all your lists)"
            style={{ padding: 8, width: 320, marginRight: 8 }}
          />
          <button type="submit" style={btn} disabled={findingList}>
            {findingList ? "Looking…" : "Find list"}
          </button>

          {listMatches.length > 0 ? (
            <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
              {listMatches.map((l) => (
                <label key={l.id} style={{ fontSize: 13 }}>
                  <input
                    type="radio"
                    name="selectedList"
                    checked={selectedList?.id === l.id}
                    onChange={() => setSelectedList(l)}
                  />{" "}
                  {l.title}
                </label>
              ))}
            </div>
          ) : null}
        </form>
      ) : null}

      <form onSubmit={runSearch} style={{ margin: "10px 0", display: mode === "connections" ? "none" : "block" }}>
        {mode === "keyword" ? (
          <>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. real estate sponsor"
              style={{ padding: 8, width: 320, marginRight: 8 }}
            />
            <select value={api} onChange={(e) => setApi(e.target.value)} style={{ padding: 8, marginRight: 8 }}>
              <option value="sales_navigator">Sales Navigator</option>
              <option value="classic">Classic</option>
            </select>
          </>
        ) : (
          <span style={{ fontSize: 13, opacity: 0.75, marginRight: 8 }}>
            {selectedList ? `Ready to pull: ${selectedList.title}` : "Find and select a list above first."}
          </span>
        )}
        <button
          type="submit"
          style={btn}
          disabled={searching || (mode === "keyword" ? !keywords.trim() : !selectedList)}
        >
          {searching ? "Searching…" : mode === "list" ? "Export this list" : "Search"}
        </button>

        <div style={{ marginTop: 10, fontSize: 13 }}>
          <span style={{ opacity: 0.75, marginRight: 8 }}>Connection degree:</span>
          {[1, 2, 3].map((degree) => (
            <label key={degree} style={{ marginRight: 14 }}>
              <input
                type="checkbox"
                checked={degrees[degree]}
                onChange={(e) => setDegrees((prev) => ({ ...prev, [degree]: e.target.checked }))}
              />{" "}
              {degree === 1 ? "1st" : degree === 2 ? "2nd" : "3rd"}
            </label>
          ))}
        </div>
      </form>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      <div style={{ margin: "10px 0" }}>
        <button style={btn} disabled={exporting || selected.size === 0} onClick={downloadCsv}>
          {exporting ? "Preparing…" : `Download CSV (${selected.size} selected)`}
        </button>
      </div>

      {results.length > 0 ? (
        <>
          <h3>
            {mode === "connections"
              ? `Your connections (showing ${Math.min(connMatches.length, CONN_VISIBLE_MAX)} of ${connMatches.length})`
              : mode === "list"
                ? `Members of "${selectedList?.title}"`
                : `Results for "${keywords}"`}
          </h3>
          {mode === "connections" && connMatches.length > CONN_VISIBLE_MAX ? (
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Only the first {CONN_VISIBLE_MAX} are listed - use the filter to narrow, or &quot;Select all
              matching&quot; to take every match.
            </p>
          ) : null}
          <div style={{ display: "grid", gap: 6, marginBottom: 20 }}>
            {(mode === "connections" ? connMatches.slice(0, CONN_VISIBLE_MAX) : results).map((p) => (
              <label
                key={p.linkedinUrn}
                style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #eee", borderRadius: 6, padding: 8 }}
              >
                <input type="checkbox" checked={selected.has(p.linkedinUrn)} onChange={() => toggle(p)} />
                <div>
                  <strong>{p.fullName || p.linkedinUrn}</strong>{" "}
                  {p.networkDistance ? (
                    <span style={{ fontSize: 11, opacity: 0.6, border: "1px solid #ccc", borderRadius: 4, padding: "1px 5px" }}>
                      {p.networkDistance}
                    </span>
                  ) : null}
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {p.headline} {p.location ? `• ${p.location}` : ""}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </>
      ) : null}

      {selected.size > 0 ? (
        <>
          <h3>Selected so far ({selected.size})</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {[...selected.values()].map((p) => (
              <div
                key={p.linkedinUrn}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee", borderRadius: 6, padding: 8 }}
              >
                <div>
                  <strong>{p.fullName || p.linkedinUrn}</strong>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>{p.headline}</div>
                </div>
                <button style={{ padding: "4px 8px" }} onClick={() => removeSelected(p.linkedinUrn)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </Layout>
  );
}

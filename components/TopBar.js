import { useRouter } from "next/router";

const TITLE_BY_PATH = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/campaigns": "Campaigns",
  "/analytics": "Analytics",
};

export default function TopBar() {
  const router = useRouter();
  const title = TITLE_BY_PATH[router.pathname] || "IAS";

  return (
    <header
      style={{
        height: "56px",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <strong>{title}</strong>

      <span style={{ fontSize: "12px", color: "#6b7280" }}>
        {router.pathname}
      </span>
    </header>
  );
}

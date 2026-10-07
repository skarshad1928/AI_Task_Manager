export function PageTitle({ kicker, title, subtitle, action }) {
  return <div className="page-title"><div><div className="kicker">{kicker}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

export function Alert({ children, type = "error" }) {
  if (!children) return null;
  return <div className={`alert ${type}`} role={type === "error" ? "alert" : "status"}>{children}</div>;
}

export function Loading({ label = "Loading your information…" }) {
  return <div className="loading"><span className="spinner" />{label}</div>;
}

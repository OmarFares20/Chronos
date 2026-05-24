// Shared shimmer skeleton styles — used across all loading.tsx files
export const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -800px 0; }
    100% { background-position:  800px 0; }
  }
`;

export function SkeletonBlock({ h = "1rem", w = "100%", radius = "6px", mb = "0" }: {
  h?: string; w?: string; radius?: string; mb?: string;
}) {
  return (
    <div style={{
      height: h, width: w, borderRadius: radius, marginBottom: mb,
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)",
      backgroundSize: "800px 100%",
      animation: "shimmer 1.6s infinite linear",
    }} />
  );
}

export function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "16px",
      padding: "1.5rem",
    }}>
      {children}
    </div>
  );
}

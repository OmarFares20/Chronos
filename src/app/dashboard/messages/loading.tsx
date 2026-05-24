import { SkeletonBlock } from "@/components/Skeleton";

export default function MessagesLoading() {
  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", gap: 0, overflow: "hidden", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
      {/* Sidebar */}
      <div style={{ width: "280px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "1rem" }}>
        <SkeletonBlock h="2rem" mb="1rem" radius="8px" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.75rem 0" }}>
            <SkeletonBlock h="2.5rem" w="2.5rem" radius="50%" />
            <div style={{ flex: 1 }}>
              <SkeletonBlock h="0.75rem" w="70%" mb="0.35rem" />
              <SkeletonBlock h="0.6rem" w="90%" />
            </div>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.5rem", gap: "1rem" }}>
        {/* Incoming */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <SkeletonBlock h="2rem" w="2rem" radius="50%" />
          <SkeletonBlock h="3.5rem" w="55%" radius="12px" />
        </div>
        {/* Outgoing */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", justifyContent: "flex-end" }}>
          <SkeletonBlock h="2.5rem" w="40%" radius="12px" />
        </div>
        {/* Incoming */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <SkeletonBlock h="2rem" w="2rem" radius="50%" />
          <SkeletonBlock h="2.5rem" w="45%" radius="12px" />
        </div>
        <div style={{ marginTop: "auto" }}>
          <SkeletonBlock h="2.75rem" radius="8px" />
        </div>
      </div>
    </div>
  );
}

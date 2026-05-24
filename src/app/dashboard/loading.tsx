import { SkeletonBlock, SkeletonCard } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div style={{ padding: "0 0.5rem" }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonBlock h="0.75rem" w="60%" mb="0.75rem" />
            <SkeletonBlock h="2rem" w="80%" mb="0.5rem" />
            <SkeletonBlock h="0.65rem" w="50%" />
          </SkeletonCard>
        ))}
      </div>

      {/* Body grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <SkeletonCard>
          <SkeletonBlock h="1rem" w="40%" mb="1.25rem" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
              <SkeletonBlock h="3rem" w="3rem" radius="50%" />
              <div style={{ flex: 1 }}>
                <SkeletonBlock h="0.75rem" w="70%" mb="0.4rem" />
                <SkeletonBlock h="0.65rem" w="50%" />
              </div>
            </div>
          ))}
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonBlock h="1rem" w="40%" mb="1.25rem" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
              <SkeletonBlock h="2.5rem" w="2.5rem" radius="8px" />
              <div style={{ flex: 1 }}>
                <SkeletonBlock h="0.75rem" w="60%" mb="0.4rem" />
                <SkeletonBlock h="0.65rem" w="40%" />
              </div>
              <SkeletonBlock h="1.5rem" w="5rem" radius="20px" />
            </div>
          ))}
        </SkeletonCard>
      </div>
    </div>
  );
}

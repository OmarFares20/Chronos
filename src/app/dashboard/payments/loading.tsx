import { SkeletonBlock, SkeletonCard } from "@/components/Skeleton";

export default function PaymentsLoading() {
  return (
    <div style={{ padding: "0 0.5rem" }}>
      <SkeletonBlock h="1.5rem" w="180px" mb="1.5rem" radius="8px" />
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonBlock h="0.7rem" w="60%" mb="0.75rem" />
            <SkeletonBlock h="1.75rem" w="70%" />
          </SkeletonCard>
        ))}
      </div>
      {/* Transactions */}
      <SkeletonCard>
        <SkeletonBlock h="0.9rem" w="150px" mb="1.25rem" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <SkeletonBlock h="2rem" w="2rem" radius="8px" />
            <div style={{ flex: 1 }}>
              <SkeletonBlock h="0.75rem" w="50%" mb="0.35rem" />
              <SkeletonBlock h="0.6rem" w="35%" />
            </div>
            <SkeletonBlock h="0.75rem" w="70px" />
            <SkeletonBlock h="1.5rem" w="80px" radius="20px" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

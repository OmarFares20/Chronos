import { SkeletonBlock, SkeletonCard } from "@/components/Skeleton";

export default function BookingsLoading() {
  return (
    <div style={{ padding: "0 0.5rem" }}>
      <SkeletonBlock h="1.5rem" w="200px" mb="1.5rem" radius="8px" />
      <SkeletonCard>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <SkeletonBlock h="2.5rem" w="2.5rem" radius="50%" />
            <div style={{ flex: 1 }}>
              <SkeletonBlock h="0.8rem" w="55%" mb="0.45rem" />
              <SkeletonBlock h="0.65rem" w="35%" />
            </div>
            <SkeletonBlock h="0.8rem" w="80px" />
            <SkeletonBlock h="1.5rem" w="90px" radius="20px" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

import { SkeletonBlock, SkeletonCard } from "@/components/Skeleton";

export default function EventsLoading() {
  return (
    <div style={{ padding: "0 0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <SkeletonBlock h="1.5rem" w="160px" radius="8px" />
        <SkeletonBlock h="2.25rem" w="140px" radius="8px" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i}>
            <SkeletonBlock h="0.7rem" w="50%" mb="0.75rem" radius="4px" />
            <SkeletonBlock h="1.1rem" w="80%" mb="0.5rem" />
            <SkeletonBlock h="0.7rem" w="60%" mb="1rem" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonBlock h="1.5rem" w="90px" radius="20px" />
              <SkeletonBlock h="2rem" w="80px" radius="8px" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

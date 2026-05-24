"use client";
import { useAuth } from "@/components/AuthProvider";
import DisputeSystem from "@/components/DisputeSystem";
import styles from "../page.module.css";

export default function DisputesPage() {
  const { user } = useAuth();
  return (
    <div className={styles.page}>
      <DisputeSystem userRole={user?.role || "CUSTOMER"} />
    </div>
  );
}

"use client";
import dashStyles from "../../page.module.css";
import styles from "./availability.module.css";
import { useEffect, useState, useMemo } from "react";

interface BlockedDate {
  id: string;
  date: string;
  note?: string | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function ProviderAvailabilityPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blocked, setBlocked]   = useState<BlockedDate[]>([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<string | null>(null); // date string
  const [noteText, setNoteText]   = useState("");

  const load = () => {
    fetch("/api/provider/availability")
      .then((r) => r.ok ? r.json() : { availability: [] })
      .then((d) => setBlocked(d.availability || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Build calendar days for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    // pad to complete week
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const toDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const isBlocked = (day: number) => {
    const str = toDateStr(day);
    return blocked.some((b) => b.date.startsWith(str));
  };

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isPast = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0,0,0,0);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const toggleDay = async (day: number) => {
    if (isPast(day)) return;
    const dateStr = toDateStr(day);
    if (!isBlocked(day)) {
      // ask for optional note
      setNoteModal(dateStr);
      return;
    }
    // unblock immediately
    setToggling(dateStr);
    await fetch("/api/provider/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    });
    load();
    setToggling(null);
  };

  const confirmBlock = async () => {
    if (!noteModal) return;
    setToggling(noteModal);
    await fetch("/api/provider/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: noteModal, note: noteText || undefined }),
    });
    setNoteModal(null);
    setNoteText("");
    load();
    setToggling(null);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const blockedThisMonth = blocked.filter((b) => {
    const d = new Date(b.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className={dashStyles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={dashStyles.sectionTitle}>Availability Calendar</h2>
          <p className={styles.subtitle}>Click any future date to mark it as unavailable. Click again to unblock it.</p>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}><span className={styles.legendDot} /> Available</span>
        <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendBlocked}`} /> Blocked / Unavailable</span>
        <span className={styles.legendItem}><span className={`${styles.legendDot} ${styles.legendToday}`} /> Today</span>
      </div>

      {/* Calendar */}
      <div className={styles.calendarCard}>
        {/* Month nav */}
        <div className={styles.calNav}>
          <button className={styles.navBtn} onClick={prevMonth} id="cal-prev" aria-label="Previous month">‹</button>
          <h3 className={styles.monthLabel}>{MONTHS[month]} {year}</h3>
          <button className={styles.navBtn} onClick={nextMonth} id="cal-next" aria-label="Next month">›</button>
        </div>

        {/* Day labels */}
        <div className={styles.calGrid}>
          {DAYS.map((d) => (
            <div key={d} className={styles.dayLabel}>{d}</div>
          ))}
          {/* Day cells */}
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className={styles.dayEmpty} />;
            const dateStr = toDateStr(day);
            const blocked_ = isBlocked(day);
            const today_   = isToday(day);
            const past_    = isPast(day);
            const loading_ = toggling === dateStr;
            return (
              <button
                key={dateStr}
                id={`cal-day-${dateStr}`}
                className={`${styles.dayCell}
                  ${blocked_  ? styles.dayCellBlocked  : ""}
                  ${today_    ? styles.dayCellToday    : ""}
                  ${past_     ? styles.dayCellPast     : ""}
                  ${loading_  ? styles.dayCellLoading  : ""}
                `}
                onClick={() => toggleDay(day)}
                disabled={past_ || !!loading_}
                aria-label={`${dateStr} — ${blocked_ ? "blocked" : "available"}`}
                aria-pressed={blocked_}
              >
                <span className={styles.dayNumber}>{day}</span>
                {blocked_ && <span className={styles.blockedIcon}>✕</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note modal */}
      {noteModal && (
        <div className={styles.modalOverlay} onClick={() => setNoteModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h4 className={styles.modalTitle}>Block {noteModal}</h4>
            <p className={styles.modalDesc}>Add an optional note (visible only to you)</p>
            <textarea
              className={styles.modalTextarea}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              placeholder="e.g. Holiday, Private event..."
              id="block-note-input"
            />
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setNoteModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={confirmBlock} id="confirm-block-btn">Block Date</button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked list */}
      {blockedThisMonth.length > 0 && (
        <section className={styles.blockedList}>
          <h3 className={styles.blockedListTitle}>Blocked this month ({blockedThisMonth.length})</h3>
          <div className={styles.blockedItems}>
            {blockedThisMonth.map((b) => (
              <div key={b.id} className={styles.blockedItem}>
                <span className={styles.blockedDate}>{new Date(b.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                {b.note && <span className={styles.blockedNote}>{b.note}</span>}
                <button
                  className={styles.unblockBtn}
                  onClick={async () => {
                    await fetch("/api/provider/availability", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ date: b.date }),
                    });
                    load();
                  }}
                  id={`unblock-${b.id}`}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

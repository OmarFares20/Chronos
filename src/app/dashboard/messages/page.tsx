"use client";
import styles from "./messages.module.css";
import dashStyles from "../page.module.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { notifyBadgesUpdated } from "@/components/BadgeContext";
import { MessageSquare, ArrowUp } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?:   { id: string; name: string };
  receiver?: { id: string; name: string };
}

interface Conversation {
  userId: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

// ── Group flat message list into per-partner conversations ──────────────────
function groupConversations(messages: Message[], currentUserId: string): Conversation[] {
  const map = new Map<string, Conversation>();
  for (const m of messages) {
    const partnerId   = m.senderId === currentUserId ? m.receiverId : m.senderId;
    const partnerName = m.senderId === currentUserId
      ? (m.receiver?.name || "Unknown")
      : (m.sender?.name   || "Unknown");

    if (!map.has(partnerId)) {
      map.set(partnerId, {
        userId: partnerId, name: partnerName,
        lastMessage: m.content, lastTime: m.createdAt,
        unread: 0,
        messages: [],
      });
    }
    const conv = map.get(partnerId)!;
    conv.messages.push(m);
    // Track latest message for preview
    if (new Date(m.createdAt) > new Date(conv.lastTime)) {
      conv.lastMessage = m.content;
      conv.lastTime    = m.createdAt;
    }
    // Only count messages sent TO current user that are unread (once per message)
    if (!m.isRead && m.receiverId === currentUserId) conv.unread++;
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
  );
}

// ── Merge delta messages into existing conversations without duplicates ──────
function mergeMessages(convs: Conversation[], newMsgs: Message[], currentUserId: string): Conversation[] {
  const updated = convs.map((c) => ({ ...c, messages: [...c.messages] }));
  for (const msg of newMsgs) {
    const partnerId   = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
    const partnerName = msg.senderId === currentUserId
      ? (msg.receiver?.name || "Unknown")
      : (msg.sender?.name   || "Unknown");

    const idx = updated.findIndex((c) => c.userId === partnerId);
    if (idx === -1) {
      updated.unshift({
        userId: partnerId, name: partnerName,
        lastMessage: msg.content, lastTime: msg.createdAt,
        unread: msg.receiverId === currentUserId && !msg.isRead ? 1 : 0,
        messages: [msg],
      });
    } else {
      const conv = updated[idx];
      // Skip duplicates
      if (!conv.messages.find((m) => m.id === msg.id)) {
        conv.messages.push(msg);
        conv.lastMessage = msg.content;
        conv.lastTime    = msg.createdAt;
        if (msg.receiverId === currentUserId && !msg.isRead) conv.unread++;
      }
    }
  }
  return updated.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const { user }  = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [newMessage, setNewMessage]       = useState("");
  const [sending, setSending]             = useState(false);
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [liveStatus, setLiveStatus]       = useState<"connecting" | "live" | "polling">("connecting");
  const [isTyping, setIsTyping]           = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const sseRef       = useRef<EventSource | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Full fetch (initial load + polling fallback) ────────────────────────
  const fetchMessages = useCallback(() => {
    if (!user) return;
    fetch("/api/messages")
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => {
        const convs = groupConversations(data.messages || [], user.id);
        setConversations(convs);
        if (convs.length > 0) setActiveConvId((prev) => prev || convs[0].userId);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Mark conversation as read on the server and notify badge context
  const markAsRead = useCallback((withUserId: string) => {
    fetch(`/api/messages?withUserId=${withUserId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.messages || !user) return;
        setConversations((prev) =>
          prev.map((c) =>
            c.userId === withUserId
              ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, isRead: m.receiverId === user.id ? true : m.isRead })) }
              : c
          )
        );
        // Let the dashboard layout know badges need to refresh
        notifyBadgesUpdated();
      })
      .catch(() => {});
  }, [user]);

  // ── SSE connection ──────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (!user || typeof EventSource === "undefined") {
      setLiveStatus("polling");
      return false;
    }
    sseRef.current?.close();

    const es = new EventSource("/api/messages/stream");
    sseRef.current = es;

    es.addEventListener("connected", () => {
      setLiveStatus("live");
      setLoading(false);
    });

    es.addEventListener("messages", (e) => {
      try {
        const { messages: newMsgs } = JSON.parse((e as MessageEvent).data) as { messages: Message[] };
        if (newMsgs?.length > 0) {
          setConversations((prev) => mergeMessages(prev, newMsgs, user.id));
          setActiveConvId((prev) => prev || (
            newMsgs[0].senderId === user.id ? newMsgs[0].receiverId : newMsgs[0].senderId
          ));
          setIsTyping(false);
        }
      } catch { /* ignore */ }
    });

    es.addEventListener("typing", () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    });

    es.onerror = () => {
      es.close();
      sseRef.current = null;
      setLiveStatus("polling");
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchMessages, 5000);
      }
    };

    return true;
  }, [user, fetchMessages]);

  // ── Mount: load data then start SSE ────────────────────────────────────
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!user) return;
    const ok = connectSSE();
    if (!ok) pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      sseRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, connectSSE, fetchMessages]);

  // ── Mark as read whenever active conversation changes ──────────────────
  useEffect(() => {
    if (activeConvId) markAsRead(activeConvId);
  }, [activeConvId, markAsRead]);

  // ── Auto-scroll to bottom ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, conversations]);

  // ── Auto-grow textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [newMessage]);

  // ── Derived state ───────────────────────────────────────────────────────
  const activeConv  = conversations.find((c) => c.userId === activeConvId);
  const filtered    = conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvId || !user) return;
    setSending(true);
    const optimisticMsg: Message = {
      id:         `tmp-${Date.now()}`,
      senderId:   user.id,
      receiverId: activeConvId,
      content:    newMessage.trim(),
      isRead:     false,
      createdAt:  new Date().toISOString(),
      sender:     { id: user.id, name: user.name },
    };
    // Optimistic update
    setConversations((prev) =>
      prev.map((c) =>
        c.userId === activeConvId
          ? { ...c, messages: [...c.messages, optimisticMsg], lastMessage: optimisticMsg.content, lastTime: optimisticMsg.createdAt }
          : c
      )
    );
    setNewMessage("");
    try {
      const res = await fetch("/api/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ receiverId: activeConvId, content: optimisticMsg.content }),
      });
      if (res.ok) {
        const { message: saved } = await res.json();
        setConversations((prev) =>
          prev.map((c) =>
            c.userId === activeConvId
              ? { ...c, messages: c.messages.map((m) => m.id === optimisticMsg.id ? saved : m) }
              : c
          )
        );
      }
    } catch { /* optimistic message stays */ }
    finally { setSending(false); }
  };

  // ── Keyboard handler — Enter to send, Shift+Enter for newline ──────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't intercept Enter during IME composition (e.g. Arabic, Chinese input)
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Typing indicator ────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (activeConvId && user) {
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeConvId }),
      }).catch(() => {});
    }
  };

  // ── Select conversation ─────────────────────────────────────────────────
  const selectConversation = (convUserId: string) => {
    setActiveConvId(convUserId);
    // Zero badge immediately in UI; server mark-as-read fires via the useEffect
    setConversations((prev) =>
      prev.map((c) => c.userId === convUserId ? { ...c, unread: 0 } : c)
    );
  };

  // ── Live status ─────────────────────────────────────────────────────────
  const statusDotColor = liveStatus === "live" ? "#50c878" : liveStatus === "polling" ? "var(--color-gold)" : "var(--color-text-muted)";
  const statusLabel    = liveStatus === "live" ? "Live" : liveStatus === "polling" ? "Polling" : "Connecting…";

  return (
    <div className={dashStyles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 className={dashStyles.sectionTitle}>Messages</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Live status */}
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusDotColor, display: "inline-block", boxShadow: liveStatus === "live" ? `0 0 6px ${statusDotColor}` : "none" }} />
            {statusLabel}
          </span>
          {totalUnread > 0 && (
            <span style={{ background: "rgba(196,164,82,0.15)", border: "1px solid rgba(196,164,82,0.3)", color: "var(--color-gold)", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.78rem" }}>
              {totalUnread} unread
            </span>
          )}
        </div>
      </div>

      <div className={styles.messagesShell}>
        {/* ── Left: Conversation List ── */}
        <div className={styles.convPanel}>
          <div className={styles.convHeader}>
            <p className={styles.convTitle}>Conversations</p>
            <div className={styles.convSearch}>
              <input
                className={styles.convSearchInput}
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="messages-search"
              />
            </div>
          </div>

          <div className={styles.convList}>
            {loading ? (
              <p className={styles.convEmpty}>Connecting…</p>
            ) : filtered.length === 0 ? (
              <p className={styles.convEmpty}>
                {search ? "No conversations found." : "No messages yet. Book a provider to start chatting!"}
              </p>
            ) : (
              filtered.map((conv) => (
                <div
                  key={conv.userId}
                  className={`${styles.convItem} ${activeConvId === conv.userId ? styles.convItemActive : ""}`}
                  onClick={() => selectConversation(conv.userId)}
                  id={`conv-${conv.userId}`}
                >
                  <div className={styles.convAvatar}>{conv.name.charAt(0).toUpperCase()}</div>
                  <div className={styles.convInfo}>
                    <p className={styles.convName}>{conv.name}</p>
                    <p className={styles.convPreview}>{conv.lastMessage}</p>
                  </div>
                  <div className={styles.convMeta}>
                    <span className={styles.convTime}>{timeLabel(conv.lastTime)}</span>
                    {conv.unread > 0 && (
                      <span className={styles.convBadge}>{conv.unread > 9 ? "9+" : conv.unread}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Chat Thread ── */}
        {activeConv ? (
          <div className={styles.chatPanel}>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderAvatar}>{activeConv.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className={styles.chatHeaderName}>
                  {activeConv.name}
                  <span className={styles.chatOnline} style={{ background: statusDotColor }} />
                </p>
                <p className={styles.chatHeaderSub}>
                  {isTyping
                    ? <span style={{ color: "var(--color-gold)", fontStyle: "italic" }}>typing…</span>
                    : statusLabel}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.chatMessages}>
              {activeConv.messages.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", textAlign: "center", margin: "auto", fontSize: "0.88rem" }}>
                  No messages yet. Say hello!
                </p>
              ) : (
                activeConv.messages.map((msg, i) => {
                  const isSelf   = msg.senderId === user?.id;
                  const prevMsg  = activeConv.messages[i - 1];
                  const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className={styles.dateDivider}>
                          {new Date(msg.createdAt).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                        </div>
                      )}
                      <div className={`${styles.messageBubble} ${isSelf ? styles.messageBubbleSelf : ""}`}>
                        <div className={styles.bubbleAvatar}>
                          {isSelf ? (user?.name?.charAt(0) || "?") : activeConv.name.charAt(0)}
                        </div>
                        <div className={styles.bubbleContent}>
                          <div className={styles.bubbleText}>{msg.content}</div>
                          <span className={styles.bubbleTime}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {isSelf && (
                              <span style={{
                                marginLeft: "0.35rem",
                                color: msg.id.startsWith("tmp-") ? "var(--color-text-muted)" : msg.isRead ? "#50c878" : "var(--color-gold)",
                                fontSize: "0.65rem",
                              }}>
                                {msg.id.startsWith("tmp-") ? "sending…" : msg.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Typing indicator bubble */}
            {isTyping && (
              <div className={styles.typingBubble} aria-live="polite">
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}

            {/* Input */}
            <div className={styles.chatInputBar}>
              <textarea
                ref={textareaRef}
                className={styles.chatInput}
                placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                id="message-input"
              />
              <button
                className={styles.chatSendBtn}
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                id="send-message-btn"
                aria-label="Send message"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.chatPanel}>
            <div className={styles.chatEmpty}>
              <div className={styles.chatEmptyIcon} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={48} strokeWidth={1} /></div>
              <p className={styles.chatEmptyText}>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

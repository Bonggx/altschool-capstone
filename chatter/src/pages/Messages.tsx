import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../lib/utils";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

export default function Messages() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const receiverId = searchParams.get("to");

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (receiverId && conversations.length > 0) {
      const convo = conversations.find(
        (c) => c.other_user?.id === receiverId
      );
      if (convo) setActiveConvo(convo);
    }
  }, [receiverId, conversations]);

  useEffect(() => {
    if (activeConvo) fetchMessages(activeConvo.other_user.id);
  }, [activeConvo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    setLoading(true);

    // Get all unique people the current user has messaged with
    const { data: sent } = await supabase
      .from("messages")
      .select(`*, receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)`)
      .eq("sender_id", user!.id)
      .order("created_at", { ascending: false });

    const { data: received } = await supabase
      .from("messages")
      .select(`*, sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)`)
      .eq("receiver_id", user!.id)
      .order("created_at", { ascending: false });

    // Build a list of unique conversations
    const convoMap = new Map();

    sent?.forEach((m) => {
      const key = m.receiver_id;
      if (!convoMap.has(key)) {
        convoMap.set(key, { other_user: m.receiver, last_message: m.content, last_time: m.created_at, unread: 0 });
      }
    });

    received?.forEach((m) => {
      const key = m.sender_id;
      if (!convoMap.has(key)) {
        convoMap.set(key, { other_user: m.sender, last_message: m.content, last_time: m.created_at, unread: 0 });
      }
      if (!m.read) {
        const existing = convoMap.get(key);
        if (existing) existing.unread++;
      }
    });

    setConversations(Array.from(convoMap.values()));

    // If a receiverId was passed in the URL, load that conversation
    if (receiverId) {
      const { data: receiverProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", receiverId)
        .single();
      if (receiverProfile) {
        setActiveConvo({ other_user: receiverProfile, last_message: "", unread: 0 });
      }
    }

    setLoading(false);
  }

  async function fetchMessages(otherId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user!.id})`)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);

    // Mark received messages as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", otherId)
      .eq("receiver_id", user!.id)
      .eq("read", false);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConvo || !user) return;
    setSending(true);

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: activeConvo.other_user.id,
      content: newMessage.trim(),
    });

    setNewMessage("");
    setSending(false);
    fetchMessages(activeConvo.other_user.id);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Messages</h1>

      <div className="flex gap-4 h-[600px]">

        {/* Conversations list */}
        <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-200 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 && !activeConvo ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-300 mt-1">Follow a user and visit their profile to message them</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.other_user.id}
                onClick={() => setActiveConvo(convo)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${activeConvo?.other_user?.id === convo.other_user.id ? "bg-brand-50" : ""}`}
              >
                <Avatar src={convo.other_user.avatar_url} name={convo.other_user.full_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{convo.other_user.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{convo.last_message}</p>
                </div>
                {convo.unread > 0 && (
                  <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                    {convo.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Message thread */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          {activeConvo ? (
            <>
              {/* Conversation header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                <Avatar src={activeConvo.other_user.avatar_url} name={activeConvo.other_user.full_name} size="sm" />
                <Link to={`/profile/${activeConvo.other_user.username}`} className="font-semibold text-gray-900 hover:text-brand-600 text-sm">
                  {activeConvo.other_user.full_name}
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user!.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${isMine ? "bg-brand-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-brand-200" : "text-gray-400"}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button size="sm" loading={sending} onClick={sendMessage}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center px-6">
              <div>
                <p className="text-gray-400 text-sm">Select a conversation</p>
                <p className="text-gray-300 text-xs mt-1">or visit a profile to start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

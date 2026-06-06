import { useState } from "react";
import { Hospital } from "./HospitalCard";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  searchQuery?: string;
}

export default function ShareModal({ isOpen, onClose, hospitals, searchQuery }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(hospitals.map((h) => h.id)));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  function toggleHospital(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Copies current page URL as a shareable link
  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function sendEmail() {
    if (!email) { setError("Enter a recipient email address."); return; }
    setError(null);
    setSending(true);

    const chosenHospitals = hospitals.filter((h) => selected.has(h.id));

    // Builds a plain-text hospital list for the email body
    const hospitalList = chosenHospitals
      .map((h, i) => `${i + 1}. ${h.name} — ${h.address}, ${h.city}, ${h.state}`)
      .join("\n");

    // Calls a Supabase Edge Function that sends the email via Resend
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-hospital-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: email,
          subject: `Hospital list${searchQuery ? ` for "${searchQuery}"` : ""} from Carefinder`,
          hospitalList,
          shareUrl: window.location.href,
        }),
      }
    );

    if (response.ok) setSent(true);
    else setError("Failed to send email. Please try again.");

    setSending(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Hospital List">

      {sent ? (
        // Success state
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">Email sent!</p>
          <p className="text-xs text-gray-400 mb-4">The hospital list was sent to {email}.</p>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      ) : (
        <>
          {/* Copy link row */}
          <div className="flex items-center gap-2 mb-5 p-3 bg-brand-50 rounded-xl border border-brand-100">
            <p className="text-xs text-gray-500 flex-1 truncate">{window.location.href}</p>
            <button
              onClick={copyLink}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex-shrink-0 transition-colors"
            >
              {linkCopied ? "Copied!" : "Copy link"}
            </button>
          </div>

          {/* Hospital selection checkboxes */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Select hospitals to include
          </p>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto mb-5 pr-1">
            {hospitals.map((h) => (
              <label key={h.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.has(h.id)}
                  onChange={() => toggleHospital(h.id)}
                  className="accent-brand-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">
                  {h.name} — {h.city}
                </span>
              </label>
            ))}
          </div>

          {/* Email input */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Send via email
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="recipient@email.com"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <Button size="sm" loading={sending} onClick={sendEmail} disabled={selected.size === 0}>
              Send
            </Button>
          </div>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </>
      )}
    </Modal>
  );
}
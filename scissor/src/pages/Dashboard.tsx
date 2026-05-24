import { useState } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import QRCode from "react-qr-code";
import { formatDate, formatNumber, copyToClipboard, getBaseUrl } from "../lib/utils";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const DEVICE_COLORS = ["#0ea5e9", "#6366f1", "#f59e0b"];

function LinkRow({ link, onDelete, onViewStats, onShowQR }: { link: any; onDelete: (id: Id<"links">) => void; onViewStats: (id: Id<"links">) => void; onShowQR: (url: string) => void; }) {
  const [copied, setCopied] = useState(false);
  const shortUrl = `${getBaseUrl()}/${link.slug}`;
  const isExpired = link.expiresAt && Date.now() > link.expiresAt;
  const status = !link.isActive ? "Inactive" : isExpired ? "Expired" : "Active";
  const badgeVariant = status === "Active" ? "green" : status === "Expired" ? "yellow" : "red";
  const handleCopy = async () => {
    await copyToClipboard(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={link.originalUrl}>{link.originalUrl}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(link.createdAt)}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline font-medium">/{link.slug}</a>
          <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{copied ? "✓" : "Copy"}</button>
        </div>
      </td>
      <td className="py-3 px-4"><span className="text-sm font-semibold text-gray-900">{formatNumber(link.clicks)}</span></td>
      <td className="py-3 px-4"><Badge label={status} variant={badgeVariant} /></td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onViewStats(link._id)}>Stats</Button>
          <Button size="sm" variant="ghost" onClick={() => onShowQR(shortUrl)}>QR</Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(link._id)}>Delete</Button>
        </div>
      </td>
    </tr>
  );
}

function StatsPanel({ linkId, userId }: { linkId: Id<"links">; userId: string }) {
  const stats = useQuery(api.links.getLinkStats, { linkId, userId });
  if (!stats) return <div className="flex items-center justify-center py-10"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  const clicksData = Object.entries(stats.clicksOverTime).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, clicks: count }));
  const deviceData = Object.entries(stats.deviceBreakdown).map(([name, value]) => ({ name, value }));
  const referrerData = Object.entries(stats.referrerBreakdown).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, count]) => ({ name, count }));
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-brand-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-brand-700">{formatNumber(stats.link.clicks)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total clicks</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-gray-800">{formatDate(stats.link.createdAt)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Created</p>
        </div>
      </div>
      {clicksData.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Clicks — last 7 days</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={clicksData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {deviceData.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Device breakdown</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {deviceData.map((_, i) => <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {referrerData.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Top referrers</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={referrerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [statsLinkId, setStatsLinkId] = useState<Id<"links"> | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Id<"links"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const links = useQuery(api.links.getUserLinks, isSignedIn ? { userId: user!.id } : "skip");
  const deleteLink = useMutation(api.links.deleteLink);
  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    await deleteLink({ linkId: deleteTarget, userId: user.id });
    setDeleteTarget(null);
  };
  const filteredLinks = (links ?? []).filter((link) => {
    const matchesSearch = link.slug.includes(searchQuery.toLowerCase()) || link.originalUrl.toLowerCase().includes(searchQuery.toLowerCase());
    const isExpired = link.expiresAt && Date.now() > link.expiresAt;
    const matchesFilter = filterStatus === "all" || (filterStatus === "active" && link.isActive && !isExpired) || (filterStatus === "expired" && isExpired);
    return matchesSearch && matchesFilter;
  });
  if (!isLoaded) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isSignedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to see your links</h2>
      <p className="text-gray-500 mb-6">Your dashboard is waiting — create an account to track your links.</p>
      <SignInButton mode="modal"><Button size="lg">Sign in</Button></SignInButton>
    </div>
  );
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Your links</h1>
        <p className="text-gray-500 text-sm mt-1">Manage, track, and share all your shortened URLs.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search by slug or URL..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="all">All links</option>
          <option value="active">Active only</option>
          <option value="expired">Expired only</option>
        </select>
      </div>
      {filteredLinks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">No links yet. Go shorten something!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Original URL</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Short link</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clicks</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => (
                  <LinkRow key={link._id} link={link} onDelete={(id) => setDeleteTarget(id)} onViewStats={(id) => setStatsLinkId(id)} onShowQR={(url) => setQrUrl(url)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal isOpen={!!statsLinkId} onClose={() => setStatsLinkId(null)} title="Link analytics">
        {statsLinkId && user && <StatsPanel linkId={statsLinkId} userId={user.id} />}
      </Modal>
      <Modal isOpen={!!qrUrl} onClose={() => setQrUrl(null)} title="QR Code">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 border border-gray-200 rounded-xl bg-white">
            {qrUrl && <QRCode value={qrUrl} size={200} />}
          </div>
          <Button className="w-full" onClick={() => { const svg = document.querySelector<SVGSVGElement>("svg"); if (!svg) return; const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "scissor-qr.svg"; a.click(); }}>Download SVG</Button>
        </div>
      </Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete this link?">
        <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The short link will stop working immediately.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </main>
  );
}

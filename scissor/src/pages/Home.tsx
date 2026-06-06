import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { QRCode } from "react-qr-code";
import { api } from "../../convex/_generated/api";
import { shortenFormSchema, ShortenFormData } from "../lib/validations";
import { copyToClipboard, getBaseUrl } from "../lib/utils";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

function SuccessCard({ shortUrl, onClose, onShowQR }: { shortUrl: string; onClose: () => void; onShowQR: () => void; }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await copyToClipboard(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
      <p className="text-sm font-medium text-green-800 mb-2">Your link is ready!</p>
      <div className="flex items-center gap-2 flex-wrap">
        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-medium text-sm hover:underline break-all">{shortUrl}</a>
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="secondary" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
          <Button size="sm" variant="ghost" onClick={onShowQR}>QR Code</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>Dismiss</Button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isSignedIn } = useUser();
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrFgColor, setQrFgColor] = useState("#db2777");
  const [qrBgColor, setQrBgColor] = useState("#ffffff");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createLink = useMutation(api.links.createLink);
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<ShortenFormData>({
    resolver: zodResolver(shortenFormSchema),
  });
  const customSlugValue = watch("customSlug");
  const slugCheck = useQuery(
    api.links.checkSlugAvailability,
    customSlugValue && customSlugValue.length >= 3 ? { slug: customSlugValue } : "skip"
  );
  const onSubmit = useCallback(async (data: ShortenFormData) => {
    setSubmitError(null);
    try {
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : undefined;
      const result = await createLink({
        originalUrl: data.originalUrl,
        customSlug: data.customSlug || undefined,
        expiresAt,
        userId: user?.id ?? "guest",
      });
      const full = `${getBaseUrl()}/${result.slug}`;
      setShortUrl(full);
      reset();
    } catch (err: any) {
      setSubmitError(err.message ?? "Something went wrong. Please try again.");
    }
  }, [createLink, user, reset]);

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scissor-qr.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 leading-tight">
          Short links, <span className="text-brand-600">big impact.</span>
        </h1>
        <p className="text-gray-500 text-lg">
          Paste a long URL and get a clean short link in under a second — with analytics, QR codes, and custom slugs.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Your long URL" placeholder="https://example.com/very/long/url" error={errors.originalUrl?.message} {...register("originalUrl")} />
          {isSignedIn ? (
            <div className="flex flex-col gap-1.5">
              <Input label="Custom slug (optional)" placeholder="my-brand" hint="Letters, numbers, and hyphens only. Min 3 characters." error={errors.customSlug?.message} {...register("customSlug")} />
              {customSlugValue && customSlugValue.length >= 3 && !errors.customSlug && (
                <p className={`text-xs font-medium ${slugCheck?.available ? "text-green-600" : "text-red-500"}`}>
                  {slugCheck === undefined ? "Checking..." : slugCheck.available ? "✓ This slug is available" : "✗ This slug is already taken"}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Custom slugs require an account</p>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-brand-600 hover:underline">Sign in</button>
              </SignInButton>
            </div>
          )}
          {isSignedIn && (
            <Input label="Expiry date (optional)" type="date" hint="Leave blank for a permanent link." error={errors.expiresAt?.message} {...register("expiresAt")} />
          )}
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
          )}
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">Shorten URL</Button>
        </form>
        {shortUrl && <SuccessCard shortUrl={shortUrl} onClose={() => setShortUrl(null)} onShowQR={() => setShowQR(true)} />}
      </div>
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { step: "1", title: "Paste your URL", desc: "Drop any long link into the box above." },
          { step: "2", title: "Get a short link", desc: "We generate a clean, shareable link instantly." },
          { step: "3", title: "Track your clicks", desc: "See who clicked, from where, and on what device." },
        ].map((item) => (
          <div key={item.step} className="text-center">
            <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">{item.step}</div>
            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Your QR Code">
        <div className="flex flex-col items-center gap-5">
          {/* QR code rendered inside a white box so it's always visible */}
          <div style={{ background: qrBgColor, padding: "16px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            {shortUrl && (
              <QRCode
                id="qr-code-svg"
                value={shortUrl}
                size={200}
                fgColor={qrFgColor}
                bgColor={qrBgColor}
                style={{ display: "block" }}
              />
            )}
          </div>
          {/* Color pickers for foreground and background */}
          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-gray-600">Foreground color</label>
              <input type="color" value={qrFgColor} onChange={(e) => setQrFgColor(e.target.value)} className="w-full h-9 rounded border border-gray-300 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium text-gray-600">Background color</label>
              <input type="color" value={qrBgColor} onChange={(e) => setQrBgColor(e.target.value)} className="w-full h-9 rounded border border-gray-300 cursor-pointer" />
            </div>
          </div>
          <Button onClick={downloadQR} className="w-full">Download SVG</Button>
        </div>
      </Modal>
    </main>
  );
}

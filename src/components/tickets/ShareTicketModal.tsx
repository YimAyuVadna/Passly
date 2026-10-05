import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  MessageCircle,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Ticket } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface ShareTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  passNumber?: number;
  totalPasses?: number;
}

export const ShareTicketModal: React.FC<ShareTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  passNumber = 1,
  totalPasses = 1,
}) => {
  const { markTicketAsShared } = useTicketContext();
  const [copied, setCopied] = useState(false);
  const [recipientName, setRecipientName] = useState(ticket.sharedToName || '');
  const [shareSuccessMessage, setShareSuccessMessage] = useState<string | null>(null);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const cleanRecipient = recipientName.trim();

  // Build compact payload for seamless cross-device opening
  let compactPayload = '';
  try {
    const payloadObj = {
      id: ticket.id,
      tkt: ticket.ticketNumber,
      ord: ticket.orderNumber,
      ev: ticket.eventId,
      evName: ticket.eventName,
      date: ticket.eventDate,
      time: ticket.eventTime,
      loc: ticket.eventLocation,
      cust: ticket.customerName,
      type: ticket.ticketTypeName,
      price: ticket.price,
      qr: ticket.qrToken,
      to: cleanRecipient || undefined,
    };
    compactPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payloadObj))));
  } catch (err) {
    compactPayload = '';
  }

  // Build the dedicated single-ticket share URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const toQuery = cleanRecipient ? `&to=${encodeURIComponent(cleanRecipient)}` : '';
  const tdataQuery = compactPayload ? `&tdata=${encodeURIComponent(compactPayload)}` : '';
  const shareUrl = `${origin}${pathname}?ticketId=${encodeURIComponent(ticket.id)}&shared=1${toQuery}${tdataQuery}`;

  const shareText = cleanRecipient
    ? `Hi ${cleanRecipient}, here is your admission pass for ${ticket.eventName} on ${ticket.eventDate} (${ticket.eventTime}). Scan at gate checkpoint:`
    : `Here is your admission pass for ${ticket.eventName} on ${ticket.eventDate} (${ticket.eventTime}). Scan at gate checkpoint:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    markTicketAsShared(ticket.id, cleanRecipient || undefined);
    setShareSuccessMessage('Pass link copied to clipboard.');
    setTimeout(() => {
      setCopied(false);
      setShareSuccessMessage(null);
    }, 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Admission Pass: ${ticket.eventName}`,
          text: shareText,
          url: shareUrl,
        });
        markTicketAsShared(ticket.id, cleanRecipient || undefined);
        setShareSuccessMessage('Shared via device sheet.');
        setTimeout(() => setShareSuccessMessage(null), 3000);
      } catch (err) {
        // User cancelled share dialog
      }
    } else {
      handleCopy();
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'telegram' | 'twitter' | 'facebook') => {
    markTicketAsShared(ticket.id, cleanRecipient || undefined);
    let targetUrl = '';

    switch (platform) {
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        break;
      case 'telegram':
        targetUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        targetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setShareSuccessMessage(`Opened ${platform} to share pass.`);
      setTimeout(() => setShareSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-md double-bezel-tray-lg shadow-[0_24px_50px_rgba(0,0,0,0.25)] my-8 p-2">
        <div className="double-bezel-core-lg overflow-hidden bg-white text-[#111111]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#C5A059]/15 bg-[#FAF8F5]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#0B0F17] text-[#D4AF37] border border-[#C5A059]/30 flex items-center justify-center">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-[#111111]">Share Admission Pass</h3>
                <p className="text-[10px] font-mono text-[#8F681B]">
                  Pass #{passNumber} of {totalPasses}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full text-zinc-400 hover:text-[#0B0F17] hover:bg-[#C5A059]/10 transition flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Ticket Info Card */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#C5A059]/20 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#B88B2A]">
                  {ticket.ticketTypeName}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {ticket.ticketNumber}
                </span>
              </div>
              <h4 className="font-serif text-sm font-medium text-[#111111] leading-snug">
                {ticket.eventName}
              </h4>
              <p className="text-[11px] font-mono text-[#8F681B]">
                {ticket.eventDate} • {ticket.eventTime}
              </p>

              {/* Live Preview of Designated Getter */}
              {cleanRecipient && (
                <div className="pt-2 border-t border-[#C5A059]/15 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Designated Pass Holder:</span>
                  <span className="font-semibold text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                    {cleanRecipient}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#C5A059]/15 flex items-center gap-1.5 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#065F46] shrink-0" />
                <span>Only this specific ticket is shared. Other passes in your order remain private.</span>
              </div>
            </div>

            {/* Recipient Name Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-700">
                Recipient / Getter Name (Appears on Pass)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Alex or Sarah"
                className="w-full px-3 py-1.5 bg-white border border-[#C5A059]/25 rounded-lg text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/30 transition"
              />
              <p className="text-[10px] text-zinc-500">
                Their name will be marked on the digital pass, personalized in the share message, and logged for gate staff.
              </p>
            </div>

            {/* Direct Link Copy Bar */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-600">
                Direct Ticket Access Link
              </label>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-zinc-200 rounded-lg text-[11px] font-mono text-zinc-600 truncate select-all">
                  {shareUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-[#0B0F17] hover:bg-[#222222] text-[#FAF8F5] text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#A7F3D0]" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* 1-Click Social Media Platforms */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-medium text-zinc-600">
                Share via Social Media
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={() => handleSocialShare('whatsapp')}
                  className="px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] rounded-lg transition flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => handleSocialShare('telegram')}
                  className="px-3 py-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] rounded-lg transition flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#0088cc]" />
                  <span>Telegram</span>
                </button>

                {/* X / Twitter */}
                <button
                  type="button"
                  onClick={() => handleSocialShare('twitter')}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-800 rounded-lg transition flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <span className="font-bold text-xs font-mono">𝕏</span>
                  <span>Twitter / X</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleSocialShare('facebook')}
                  className="px-3 py-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] rounded-lg transition flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Facebook</span>
                </button>
              </div>
            </div>

            {/* Native Device Share Sheet */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2 bg-[#FAF8F5] hover:bg-[#F4EFE6] border border-[#C5A059]/30 text-[#8F681B] rounded-lg transition flex items-center justify-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#B88B2A]" />
                <span>More Share Options (Device Sheet)</span>
              </button>
            )}

            {/* Status message */}
            {shareSuccessMessage && (
              <div className="p-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-[11px] text-[#065F46] font-mono text-center">
                {shareSuccessMessage}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#C5A059]/15 flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-500">
              Passly Direct Link
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-[#0B0F17] hover:bg-[#222222] text-white text-xs font-medium rounded-full transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

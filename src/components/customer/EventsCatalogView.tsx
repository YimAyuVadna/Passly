import React, { useState } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Edit3,
  Sliders,
  Plus,
  ShieldCheck,
  Zap,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { EventItem } from '../../types';
import { EventCard } from './EventCard';
import { useTicketContext } from '../../context/TicketContext';
import { HeroBannerModal } from '../admin/HeroBannerModal';
import { CategoryManageModal } from '../admin/CategoryManageModal';
import { EventFormModal } from '../admin/EventFormModal';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface EventsCatalogViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onOpenOnlineBooking?: () => void;
}

export const EventsCatalogView: React.FC<EventsCatalogViewProps> = ({
  events,
  onSelectEvent,
  onOpenOnlineBooking,
}) => {
  const { heroBanner, categories, currentUser, isLoggedIn, createEvent } = useTicketContext();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);

  // Lock background scrolling when any storefront modal is open
  useBodyScrollLock(isHeroModalOpen || isCategoryModalOpen || isCreateEventModalOpen);

  // Check if current user is an Admin or Senior Staff member
  const canManageStorefront =
    isLoggedIn &&
    (currentUser.role === 'ADMIN' ||
      currentUser.staffRole === 'SUPER_ADMIN' ||
      currentUser.staffRole === 'SENIOR_STAFF');

  const filteredEvents = events.filter((ev) => {
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : ev.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Find linked event for hero CTA, or fallback to first active event
  const linkedHeroEvent = heroBanner.eventId
    ? events.find((e) => e.id === heroBanner.eventId)
    : events[0];

  const handleHeroAction = () => {
    if (linkedHeroEvent) {
      onSelectEvent(linkedHeroEvent);
    } else if (events.length > 0) {
      onSelectEvent(events[0]);
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 max-w-6xl mx-auto">
      {/* Editorial Spotlight Card (Double-Bezel Bento Focus) */}
      {heroBanner.enabled && (
        <section className="double-bezel-tray-lg shadow-[0_16px_40px_rgba(0,0,0,0.03)]">
          <div className="double-bezel-core-lg p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="flex-1 space-y-5 max-w-xl">
              <div className="flex items-center justify-between">
                <span className="eyebrow-pill bg-[#111111]/[0.04] text-zinc-600 border border-[#111111]/[0.06]">
                  Curated Spotlight
                </span>
                {canManageStorefront && (
                  <button
                    type="button"
                    onClick={() => setIsHeroModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 text-zinc-500 hover:text-[#111111] border border-[#111111]/[0.08] rounded-full text-xs font-medium transition cursor-pointer hover:bg-[#F7F6F3]"
                    title="Admin / Senior Staff: Edit Hero Banner"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Spotlight</span>
                  </button>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#111111] leading-[1.12]">
                {heroBanner.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#787774] line-clamp-2 leading-relaxed">
                {heroBanner.description}
              </p>

              <div className="flex items-center gap-2.5 text-xs text-[#787774] font-medium font-mono">
                {heroBanner.date && <span>{heroBanner.date}</span>}
                {heroBanner.date && heroBanner.location && <span className="text-zinc-300">•</span>}
                {heroBanner.location && <span>{heroBanner.location}</span>}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleHeroAction}
                  className="group inline-flex items-center justify-between gap-4 pl-6 pr-2 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-full text-xs font-medium active:scale-[0.98] transition-spring shadow-[0_4px_16px_rgba(0,0,0,0.12)] cursor-pointer select-none"
                >
                  <span>{heroBanner.buttonText || 'Reserve Passes'}</span>
                  <span className="btn-nested-icon w-7 h-7 rounded-full bg-white/15 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-80 lg:w-96 aspect-[16/10] rounded-2xl overflow-hidden p-1.5 bg-[#111111]/[0.025] border border-[#111111]/[0.06] shrink-0">
              <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-[#F7F6F3]">
                <img
                  src={heroBanner.image}
                  alt={heroBanner.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Notice if Hero Banner is disabled (Visible to Admin & Senior Staff only) */}
      {!heroBanner.enabled && canManageStorefront && (
        <div className="p-4 rounded-2xl border border-dashed border-[#111111]/[0.1] bg-white flex items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span>Storefront hero spotlight is currently hidden from attendees.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsHeroModalOpen(true)}
            className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full font-medium text-xs transition cursor-pointer shrink-0 active:scale-[0.98]"
          >
            Enable & Customize
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-b border-[#111111]/[0.06] pb-4">
        {/* Category Tabs & Manage Trigger */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-spring shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#111111] text-white font-medium shadow-xs'
                    : 'text-zinc-500 hover:text-[#111111] hover:bg-[#111111]/[0.04]'
                }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Admin & Senior Staff Controls */}
          {canManageStorefront && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-[#111111]/[0.08]">
              <button
                type="button"
                onClick={() => setIsCreateEventModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#111111]/[0.04] hover:bg-[#111111]/[0.08] text-zinc-800 transition cursor-pointer flex items-center gap-1"
                title="Admin / Senior Staff: Create New Event"
              >
                <Plus className="w-3 h-3" />
                <span>New Event</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#111111]/[0.04] hover:bg-[#111111]/[0.08] text-zinc-800 transition cursor-pointer"
                title="Admin / Senior Staff: Edit Category List"
              >
                <span>Edit Categories</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimalist Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#111111]/[0.08] rounded-full text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] transition shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* Gapless Bento Events Grid (AIDA: Interest) */}
      <section className="space-y-6">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 [grid-auto-flow:dense]">
            {filteredEvents.map((event, idx) => {
              const isLeadFeatured = idx === 0 && filteredEvents.length > 1;
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={onSelectEvent}
                  isFeatured={isLeadFeatured}
                />
              );
            })}
          </div>
        ) : (
          <div className="double-bezel-tray p-12 text-center space-y-3">
            <div className="double-bezel-core p-8 space-y-3">
              <h4 className="font-serif text-base font-medium text-[#111111]">No Events Found</h4>
              <p className="text-xs text-[#787774] max-w-sm mx-auto">
                No matching events found. Try searching with different terms or selecting another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium rounded-full transition cursor-pointer active:scale-[0.98]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Gate Infrastructure & Live Verification Showcase (AIDA: Desire) */}
      <section className="double-bezel-tray-lg shadow-[0_16px_40px_rgba(0,0,0,0.02)]">
        <div className="double-bezel-core-lg p-6 sm:p-8 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#111111]/[0.06]">
            <div className="space-y-3 max-w-xl">
              <span className="eyebrow-pill bg-[#111111]/[0.04] text-zinc-600 border border-[#111111]/[0.06]">
                Gate Infrastructure
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] leading-tight">
                Sub-Second Admission Throughput
              </h2>
              <p className="text-xs sm:text-sm text-[#787774] leading-relaxed">
                Cryptographically signed single-use admission tokens verified in real time, with zero network latency dependency.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-1.5 rounded-full bg-[#111111]/[0.04] border border-[#111111]/[0.06] flex items-center gap-2 text-xs font-mono text-zinc-700">
                <span className="w-2 h-2 rounded-full bg-[#346538] animate-pulse" />
                <span>Camera Scanner Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#111111]/[0.06] space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-[#111111]/[0.04] flex items-center justify-center text-[#111111]">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-medium text-[#111111]">0.3s Turnaround</h3>
              <p className="text-xs text-[#787774] leading-relaxed">
                High-speed client optical recognition delivers immediate auditory and visual gate clearance signals.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#111111]/[0.06] space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-[#111111]/[0.04] flex items-center justify-center text-[#111111]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-medium text-[#111111]">HMAC SHA-256 Tokens</h3>
              <p className="text-xs text-[#787774] leading-relaxed">
                Tamper-proof single-use tokens prevent duplicate entry and pass sharing across all turnstile zones.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#111111]/[0.06] space-y-2.5">
              <div className="w-8 h-8 rounded-full bg-[#111111]/[0.04] flex items-center justify-center text-[#111111]">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-medium text-[#111111]">Multi-Channel Sync</h3>
              <p className="text-xs text-[#787774] leading-relaxed">
                Unified gate ledger automatically detects online digital wallet passes and box-office physical counter tickets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Admission CTA (AIDA: Action) */}
      <section className="p-2 sm:p-2.5 rounded-3xl bg-[#111111] border border-black shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="rounded-2xl bg-[#18181B] border border-white/10 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-white relative overflow-hidden">
          {/* Subtle ambient light gradient */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-xl relative z-10">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
              Direct Venue Admission. Instantly Issued.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md">
              Select any curated production above or initiate a direct online pass reservation with instantaneous QR generation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto relative z-10">
            <button
              type="button"
              onClick={onOpenOnlineBooking || handleHeroAction}
              className="group inline-flex items-center justify-between gap-4 pl-6 pr-2 py-2.5 bg-white text-[#111111] hover:bg-zinc-100 rounded-full text-xs font-semibold active:scale-[0.98] transition-spring cursor-pointer select-none shadow-md"
            >
              <span>Instant Pass Booking</span>
              <span className="btn-nested-icon w-7 h-7 rounded-full bg-[#111111] text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white hover:bg-white/10 text-xs font-medium transition cursor-pointer text-center"
            >
              Back to Spotlight
            </button>
          </div>
        </div>
      </section>

      {/* Modals for Hero Banner, Category Management, and Event Creation */}
      <HeroBannerModal isOpen={isHeroModalOpen} onClose={() => setIsHeroModalOpen(false)} />
      <CategoryManageModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
      {canManageStorefront && (
        <EventFormModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onSave={(eventData) => {
            createEvent(eventData);
            setIsCreateEventModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

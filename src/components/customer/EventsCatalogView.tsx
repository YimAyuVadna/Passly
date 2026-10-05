import React, { useState, useRef, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
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

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateCategoryScroll = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  };

  useEffect(() => {
    updateCategoryScroll();
    const el = categoryScrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateCategoryScroll, { passive: true });
      window.addEventListener('resize', updateCategoryScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateCategoryScroll);
      window.removeEventListener('resize', updateCategoryScroll);
    };
  }, [categories]);

  const handleScrollCategories = (direction: 'left' | 'right') => {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth',
    });
  };

  const handleCategoryClick = (cat: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedCategory(cat);
    // Smoothly scroll clicked tab into center so next filters are shown and onward
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  };

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

  // Helper to give hero title the Screenshot 2 gold gradient shimmer
  const renderHeroTitle = (title: string) => {
    const words = title.trim().split(' ');
    if (words.length <= 2) {
      return (
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6E6C2] via-[#E5CA8F] to-[#D4AF37]">
          {title}
        </span>
      );
    }
    const mid = Math.ceil(words.length / 2);
    const firstPart = words.slice(0, mid).join(' ');
    const secondPart = words.slice(mid).join(' ');
    return (
      <>
        <span className="text-white">{firstPart} </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6E6C2] via-[#E5CA8F] to-[#D4AF37]">
          {secondPart}
        </span>
      </>
    );
  };

  return (
    <div className="space-y-12 sm:space-y-16 max-w-6xl mx-auto">
      {/* Editorial Spotlight Card (Screenshot 2 Obsidian & Glowing Gold Theme) */}
      {heroBanner.enabled && (
        <section className="p-2 sm:p-2.5 rounded-3xl bg-[#0B0F17] border border-[#C5A059]/30 shadow-[0_24px_60px_rgba(11,15,23,0.35)]">
          <div className="rounded-2xl bg-gradient-to-br from-[#111625] via-[#141A29] to-[#0D121F] border border-[#C5A059]/20 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12 text-white relative overflow-hidden">
            {/* Subtle ambient light gradient from Screenshot 2 */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C5A059]/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#C5A059]/[0.05] blur-3xl pointer-events-none" />

            <div className="flex-1 space-y-5 max-w-xl relative z-10 w-full">
              <div className="flex items-center justify-between gap-3">
                <span className="eyebrow-pill bg-[#C5A059]/15 text-[#E5CA8F] border border-[#C5A059]/30">
                  Curated Spotlight
                </span>
                {canManageStorefront && (
                  <button
                    type="button"
                    onClick={() => setIsHeroModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 text-[#E5CA8F] hover:text-white border border-[#C5A059]/30 rounded-full text-xs font-medium transition cursor-pointer hover:bg-[#C5A059]/15"
                    title="Admin / Senior Staff: Edit Hero Banner"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Spotlight</span>
                  </button>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.12]">
                {renderHeroTitle(heroBanner.title)}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                {heroBanner.description}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#E5CA8F] font-medium font-mono">
                {heroBanner.date && <span>{heroBanner.date}</span>}
                {heroBanner.date && heroBanner.location && <span className="text-[#C5A059]/60">•</span>}
                {heroBanner.location && <span>{heroBanner.location}</span>}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleHeroAction}
                  className="group inline-flex items-center justify-between gap-4 pl-6 pr-2 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] rounded-full text-xs font-semibold active:scale-[0.98] transition-spring cursor-pointer select-none shadow-[0_4px_20px_rgba(212,175,55,0.25)] w-full sm:w-auto"
                >
                  <span>{heroBanner.buttonText || 'Reserve Passes'}</span>
                  <span className="btn-nested-icon w-7 h-7 rounded-full bg-[#0B0F17] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
                  </span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-80 lg:w-96 aspect-[16/10] rounded-2xl overflow-hidden p-1.5 bg-[#0B0F17] border border-[#C5A059]/35 shrink-0 shadow-[0_12px_32px_rgba(0,0,0,0.4)] relative z-10">
              <div className="w-full h-full rounded-xl overflow-hidden shadow-inner bg-[#111625] border border-[#C5A059]/15">
                <img
                  src={heroBanner.image}
                  alt={heroBanner.title}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = 'https://images.unsplash.com/photo-1779419183221-df0bb6fdad1d?w=1600&auto=format&fit=crop&q=80';
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
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
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-b border-[#C5A059]/15 pb-4">
        {/* Category Tabs with Navigation Controls */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              aria-label="Scroll categories left"
              className="absolute left-0 z-10 w-6 h-6 rounded-full bg-white/95 backdrop-blur-xs border border-[#C5A059]/30 text-[#8F681B] hover:text-[#0B0F17] hover:bg-[#FDF8EE] flex items-center justify-center shadow-xs transition-colors shrink-0 -translate-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <div
            ref={categoryScrollRef}
            data-hide-scrollbar
            onWheel={(e) => {
              if (e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0 w-full"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={(e) => handleCategoryClick(cat, e)}
                  className={`px-3.5 py-1.5 rounded-full text-xs shrink-0 cursor-pointer select-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#0B0F17] text-[#FAF8F5] border border-[#C5A059]/40 font-medium shadow-xs'
                      : 'border border-transparent text-zinc-600 hover:text-[#0B0F17] hover:bg-[#C5A059]/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}

            {/* Admin & Senior Staff Controls */}
            {canManageStorefront && (
              <div className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-[#C5A059]/20">
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FDF8EE] hover:bg-[#F8EED8] text-[#8F681B] border border-[#C5A059]/25 transition-colors cursor-pointer flex items-center gap-1 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 select-none shrink-0"
                  title="Admin / Senior Staff: Create New Event"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#FDF8EE] hover:bg-[#F8EED8] text-[#8F681B] border border-[#C5A059]/25 transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 select-none shrink-0"
                  title="Admin / Senior Staff: Edit Category List"
                >
                  <span>Edit Categories</span>
                </button>
              </div>
            )}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              aria-label="Scroll categories right"
              className="absolute right-0 z-10 w-6 h-6 rounded-full bg-white/95 backdrop-blur-xs border border-[#C5A059]/30 text-[#8F681B] hover:text-[#0B0F17] hover:bg-[#FDF8EE] flex items-center justify-center shadow-xs transition-colors shrink-0 translate-x-1 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Minimalist Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#B88B2A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#C5A059]/25 rounded-full text-xs text-[#111111] placeholder:text-zinc-400 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/25 transition shadow-2xs"
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

      {/* Gate Infrastructure & Live Verification Showcase (Screenshot 2 Obsidian & Gold Theme) */}
      <section className="p-2 sm:p-2.5 rounded-3xl bg-[#0B0F17] border border-[#C5A059]/30 shadow-[0_24px_60px_rgba(11,15,23,0.35)]">
        <div className="rounded-2xl bg-gradient-to-br from-[#111625] via-[#141A29] to-[#0D121F] border border-[#C5A059]/20 p-6 sm:p-8 md:p-10 space-y-8 text-white relative overflow-hidden">
          {/* Subtle ambient light gradient */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#C5A059]/[0.06] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#C5A059]/[0.05] blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#C5A059]/20 relative z-10">
            <div className="space-y-3 max-w-xl">
              <span className="eyebrow-pill bg-[#059669]/15 text-[#6EE7B7] border border-[#059669]/40">
                Gate Infrastructure
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-white leading-tight">
                Sub-Second Admission <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6E6C2] via-[#E5CA8F] to-[#D4AF37]">Throughput</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Cryptographically signed single-use admission tokens verified in real time, with zero network latency dependency.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-1.5 rounded-full bg-[#059669]/15 border border-[#059669]/40 flex items-center gap-2 text-xs font-mono text-[#6EE7B7]">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span>Camera Scanner Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
            <div className="p-4 sm:p-5 rounded-xl bg-[#0B0F17]/80 border border-[#C5A059]/20 hover:border-[#C5A059]/50 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all space-y-2.5 group">
              <div className="w-9 h-9 rounded-full bg-[#1E3A8A]/50 border border-[#3B82F6]/50 flex items-center justify-center text-[#93C5FD]">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-medium text-white group-hover:text-[#F6E6C2] transition-colors">0.3s Turnaround</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                High-speed optical recognition delivers immediate auditory and visual gate clearance signals.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#0B0F17]/80 border border-[#C5A059]/20 hover:border-[#C5A059]/50 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all space-y-2.5 group">
              <div className="w-9 h-9 rounded-full bg-[#064E3B]/50 border border-[#10B981]/50 flex items-center justify-center text-[#6EE7B7]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-medium text-white group-hover:text-[#F6E6C2] transition-colors">HMAC SHA-256 Tokens</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Tamper-proof single-use tokens prevent duplicate entry and pass sharing across all turnstile zones.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#0B0F17]/80 border border-[#C5A059]/20 hover:border-[#C5A059]/50 hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] transition-all space-y-2.5 group">
              <div className="w-9 h-9 rounded-full bg-[#581C87]/50 border border-[#A855F7]/50 flex items-center justify-center text-[#D8B4FE]">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-sm sm:text-base font-medium text-white group-hover:text-[#F6E6C2] transition-colors">Multi-Channel Sync</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Unified gate ledger automatically detects online digital wallet passes and box-office physical counter tickets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Admission CTA (AIDA: Action) */}
      <section className="p-2 sm:p-2.5 rounded-3xl bg-[#0B0F17] border border-[#C5A059]/30 shadow-[0_24px_60px_rgba(11,15,23,0.35)]">
        <div className="rounded-2xl bg-gradient-to-br from-[#111625] via-[#141A29] to-[#0D121F] border border-[#C5A059]/20 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-white relative overflow-hidden">
          {/* Subtle ambient light gradient */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C5A059]/[0.08] blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-xl relative z-10">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
              Direct Venue Admission. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F6E6C2] via-[#E5CA8F] to-[#D4AF37]">Instantly Issued.</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md">
              Select any curated production above or initiate a direct online pass reservation with instantaneous QR generation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto relative z-10">
            <button
              type="button"
              onClick={onOpenOnlineBooking || handleHeroAction}
              className="group inline-flex items-center justify-between gap-4 pl-6 pr-2 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#DFC04E] hover:to-[#B88B2A] text-[#0B0F17] rounded-full text-xs font-semibold active:scale-[0.98] transition-spring cursor-pointer select-none shadow-[0_4px_20px_rgba(212,175,55,0.25)] w-full sm:w-auto"
            >
              <span>Instant Pass Booking</span>
              <span className="btn-nested-icon w-7 h-7 rounded-full bg-[#0B0F17] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 transition-transform">
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-full border border-[#C5A059]/40 text-[#F6E6C2] hover:bg-[#C5A059]/10 text-xs font-medium transition cursor-pointer text-center w-full sm:w-auto"
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

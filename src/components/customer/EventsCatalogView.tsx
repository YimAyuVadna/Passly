import React, { useState } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Edit3,
  Sliders,
  Plus,
  Tag,
} from 'lucide-react';
import { EventItem } from '../../types';
import { EventCard } from './EventCard';
import { useTicketContext } from '../../context/TicketContext';
import { HeroBannerModal } from '../admin/HeroBannerModal';
import { CategoryManageModal } from '../admin/CategoryManageModal';
import { EventFormModal } from '../admin/EventFormModal';

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
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Editorial Spotlight Card */}
      {heroBanner.enabled && !searchQuery && selectedCategory === 'All' && (
        <section className="relative rounded-3xl overflow-hidden bg-zinc-950 text-white shadow-lg border border-zinc-800/80 group">
          <div className="absolute inset-0">
            <img
              src={heroBanner.image}
              alt={heroBanner.title}
              className="w-full h-full object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          </div>

          {/* Admin & Senior Staff Floating Edit Pill */}
          {canManageStorefront && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
              <button
                type="button"
                onClick={() => setIsHeroModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/25 text-white rounded-full text-xs font-semibold shadow-md transition cursor-pointer hover:scale-105"
                title="Admin / Senior Staff: Edit Hero Banner"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Banner</span>
              </button>
            </div>
          )}

          <div className="relative p-6 sm:p-10 lg:p-12 max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold rounded-full uppercase tracking-wider">
                {heroBanner.tag || 'Featured Experience'}
              </span>
              {heroBanner.category && (
                <span className="text-xs text-zinc-300 font-medium">{heroBanner.category}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
              {heroBanner.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300/90 line-clamp-2 leading-relaxed">
              {heroBanner.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-zinc-300 pt-1 flex-wrap font-medium">
              {heroBanner.date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {heroBanner.date}
                </span>
              )}
              {heroBanner.startTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {heroBanner.startTime}
                </span>
              )}
              {heroBanner.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {heroBanner.location}
                </span>
              )}
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleHeroAction}
                className="px-5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-full transition-all shadow-sm flex items-center gap-2 text-xs cursor-pointer"
              >
                <span>{heroBanner.buttonText || 'Reserve Tickets'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Notice if Hero Banner is disabled (Visible to Admin & Senior Staff only) */}
      {!heroBanner.enabled && canManageStorefront && !searchQuery && selectedCategory === 'All' && (
        <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span>Storefront Hero Banner is currently hidden from attendees.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsHeroModalOpen(true)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-semibold transition cursor-pointer shrink-0"
          >
            Enable & Customize
          </button>
        </div>
      )}

      {/* Interactive Simulation Banner: Online Client Pass & QR Generation */}
      {onOpenOnlineBooking && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-950 p-5 sm:p-6 text-white shadow-lg border border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/25 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Online Client Simulator
              </span>
              <span className="text-xs text-blue-200/80 font-medium">Decision Tree Pass Intelligence</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
              Simulate Online Client Pass Purchase & Instant QR Generation
            </h3>
            <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
              Experience the end-to-end client flow: submit an online booking with ABA KHQR / Card, auto-generate a secure QR admission pass, download the image, and test gate checkpoint scanning.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenOnlineBooking}
            className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition cursor-pointer shrink-0 self-start md:self-center hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulate Online Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        {/* Category Pills & Manage Trigger */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200/80'
                }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Admin & Senior Staff Controls: Create Event & Manage Categories */}
          {canManageStorefront && (
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              <button
                type="button"
                onClick={() => setIsCreateEventModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white transition cursor-pointer flex items-center gap-1 shadow-xs"
                title="Admin / Senior Staff: Create New Event"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Event</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300/80 transition cursor-pointer flex items-center gap-1"
                title="Admin / Senior Staff: Edit Category List"
              >
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                <span>Categories</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimal Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, venues..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-zinc-200/80 rounded-full text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-2xs"
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

      {/* Events Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">
            {selectedCategory === 'All' ? 'Curated Events' : `${selectedCategory}`}
          </h2>
          <span className="text-xs text-zinc-400 font-medium">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-12 text-center space-y-3">
            <h4 className="font-semibold text-sm text-zinc-800">No Events Found</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No matching events found for your search. Try resetting filters or searching with different terms.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-full transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Customer Assurance Card */}
      <section className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-zinc-900">
              Verified Digital Passes
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 max-w-xl">
              All tickets are issued with secure QR admission tokens and stored directly in your digital wallet for instant gate entry.
            </p>
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

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
      {heroBanner.enabled && (
        <section className="relative rounded-xl bg-white border border-zinc-200/90 p-6 sm:p-8 md:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex-1 space-y-4 max-w-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Featured
              </span>
              {canManageStorefront && (
                <button
                  type="button"
                  onClick={() => setIsHeroModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-md text-xs font-medium transition cursor-pointer"
                  title="Admin / Senior Staff: Edit Hero Banner"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-950 leading-snug">
              {heroBanner.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-500 line-clamp-2 leading-relaxed">
              {heroBanner.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
              {heroBanner.date && <span>{heroBanner.date}</span>}
              {heroBanner.date && heroBanner.location && <span>•</span>}
              {heroBanner.location && <span>{heroBanner.location}</span>}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleHeroAction}
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-md transition-colors text-xs cursor-pointer shadow-xs"
              >
                <span>{heroBanner.buttonText || 'Reserve Tickets'}</span>
              </button>
            </div>
          </div>

          <div className="w-full md:w-80 lg:w-96 aspect-[16/10] rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/80 shrink-0">
            <img
              src={heroBanner.image}
              alt={heroBanner.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>
      )}

      {/* Notice if Hero Banner is disabled (Visible to Admin & Senior Staff only) */}
      {!heroBanner.enabled && canManageStorefront && (
        <div className="p-4 rounded-xl border border-dashed border-zinc-300 bg-white flex items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <span>Storefront Hero Banner is currently hidden from attendees.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsHeroModalOpen(true)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium text-xs transition cursor-pointer shrink-0"
          >
            Enable & Customize
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Tabs & Manage Trigger */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-950 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                {cat}
              </button>
            );
          })}

          {/* Admin & Senior Staff Controls */}
          {canManageStorefront && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2 pl-2 border-l border-zinc-200">
              <button
                type="button"
                onClick={() => setIsCreateEventModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer flex items-center gap-1"
                title="Admin / Senior Staff: Create New Event"
              >
                <Plus className="w-3 h-3" />
                <span>New Event</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer"
                title="Admin / Senior Staff: Edit Category List"
              >
                <span>Edit Categories</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimal Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-8 pr-4 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* Events Grid */}
      <section className="space-y-4">
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200/80 p-12 text-center space-y-3 bg-white">
            <h4 className="font-medium text-sm text-zinc-900">No Events Found</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No matching events found. Try searching with different terms.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-md transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
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

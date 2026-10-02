import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import { EventItem, TicketType, EventStatus } from '../../types';
import { useTicketContext } from '../../context/TicketContext';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<EventItem, 'id' | 'createdAt'>) => void;
  initialEvent?: EventItem | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
}) => {
  const { categories } = useTicketContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialEvent?.name || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [category, setCategory] = useState<string>(initialEvent?.category || 'Concert');
  const [image, setImage] = useState(
    initialEvent?.image ||
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
  );
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [date, setDate] = useState(initialEvent?.date || '2026-11-25');
  const [startTime, setStartTime] = useState(initialEvent?.startTime || '19:00');
  const [endTime, setEndTime] = useState(initialEvent?.endTime || '22:30');
  const [location, setLocation] = useState(initialEvent?.location || '');
  const [address, setAddress] = useState(initialEvent?.address || '');
  const [organizer, setOrganizer] = useState(initialEvent?.organizer || '');
  const [capacity, setCapacity] = useState(initialEvent?.capacity || 1000);
  const [status, setStatus] = useState<EventStatus>(initialEvent?.status || 'ACTIVE');

  // Ticket types management
  const [ticketTypes, setTicketTypes] = useState<
    Omit<TicketType, 'id' | 'eventId' | 'sold'>[]
  >(
    initialEvent?.ticketTypes.map((tt) => ({
      name: tt.name,
      description: tt.description,
      price: tt.price,
      quantity: tt.quantity,
      status: tt.status,
    })) || [
      {
        name: 'Standard Admission',
        description: 'General floor access',
        price: 15,
        quantity: 500,
        status: 'AVAILABLE',
      },
      {
        name: 'VIP Experience',
        description: 'Premium front row access with drinks',
        price: 45,
        quantity: 100,
        status: 'AVAILABLE',
      },
    ]
  );

  if (!isOpen) return null;

  const handleAddTicketTier = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        name: 'New Tier',
        description: 'Tier description',
        price: 25,
        quantity: 100,
        status: 'AVAILABLE',
      },
    ]);
  };

  const handleRemoveTicketTier = (index: number) => {
    setTicketTypes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateTicketTier = (
    index: number,
    field: keyof Omit<TicketType, 'id' | 'eventId' | 'sold'>,
    value: any
  ) => {
    setTicketTypes((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const availableCategories = Array.from(
    new Set([
      ...categories.filter((c) => c.toLowerCase() !== 'all'),
      'Concert',
      'Conference',
      'Festival',
      'Sports',
      'Theater',
      'Exhibition',
      category,
    ])
  ).filter(Boolean);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setImageUploadError('Image size exceeds 3MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.onerror = () => {
      setImageUploadError('Failed to load image file. Please try another image.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || ticketTypes.length === 0) return;

    // Convert ticket types with generated IDs
    const preparedTypes: TicketType[] = ticketTypes.map((tt, idx) => ({
      ...tt,
      id: `tt-${Date.now()}-${idx}`,
      eventId: initialEvent ? initialEvent.id : '',
      sold: 0,
    }));

    onSave({
      name,
      description,
      category,
      image,
      date,
      startTime,
      endTime,
      location,
      address,
      organizer,
      capacity,
      status,
      rules: [
        'Must present valid digital ticket QR code at entry.',
        'Age requirement: 16+ unless accompanied by an adult.',
        'No outside beverages or professional recording devices.',
      ],
      ticketTypes: preparedTypes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200/90 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
          <div>
            <h3 className="font-semibold text-sm text-zinc-950">
              {initialEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <p className="text-xs text-zinc-400">Configure event details, schedule, and ticket inventory tiers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Event Details
            </h4>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Neon Horizon Festival 2026"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                >
                  <option value="ACTIVE">ACTIVE (On Sale)</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="SOLD_OUT">SOLD OUT</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Total Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm font-mono text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700">Banner Image</label>
                <span className="text-[11px] text-zinc-400">URL or direct photo upload</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageFileSelect}
                accept="image/*"
                className="hidden"
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={image.startsWith('data:') ? `Local Image (${Math.round(image.length / 1024)} KB)` : image}
                    onChange={(e) => {
                      if (!image.startsWith('data:')) {
                        setImage(e.target.value);
                      }
                    }}
                    disabled={image.startsWith('data:')}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition disabled:opacity-75"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-md text-xs font-medium transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Upload</span>
                  </button>

                  {image.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() =>
                        setImage(
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-2 py-2 text-zinc-400 hover:text-rose-600 rounded-md text-xs transition cursor-pointer"
                      title="Reset image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {imageUploadError && (
                  <p className="text-xs text-rose-600 font-medium">{imageUploadError}</p>
                )}

                {image && (
                  <div className="relative h-28 w-full rounded-lg overflow-hidden border border-zinc-200/80 bg-zinc-100">
                    <img
                      src={image}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-zinc-950/80 backdrop-blur-xs rounded text-[10px] text-white font-mono flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Preview</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event, artist lineup, schedule highlights..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
              />
            </div>
          </div>

          {/* Schedule & Venue */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Schedule & Venue
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Venue Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Diamond Island Hall A"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Organizer
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="e.g. Sonic Entertainment"
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition"
              />
            </div>
          </div>

          {/* Ticket Types Inventory */}
          <div className="space-y-3 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-500" />
                Ticket Tiers
              </h4>
              <button
                type="button"
                onClick={handleAddTicketTier}
                className="text-xs font-medium text-zinc-950 hover:text-zinc-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {ticketTypes.map((tt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-zinc-50/60 rounded-lg border border-zinc-200/90 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={tt.name}
                      onChange={(e) => handleUpdateTicketTier(idx, 'name', e.target.value)}
                      placeholder="Tier Name (e.g. VIP Pass)"
                      className="font-medium text-xs sm:text-sm bg-white px-3 py-1.5 border border-zinc-200 rounded-md flex-1 text-zinc-900 focus:outline-none focus:border-zinc-950"
                    />

                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTicketTier(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-medium mb-0.5">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={tt.price}
                        onChange={(e) =>
                          handleUpdateTicketTier(idx, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-mono font-medium text-zinc-900 focus:outline-none focus:border-zinc-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 font-medium mb-0.5">
                        Capacity Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tt.quantity}
                        onChange={(e) =>
                          handleUpdateTicketTier(idx, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-mono font-medium text-zinc-900 focus:outline-none focus:border-zinc-950"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={tt.description}
                    onChange={(e) => handleUpdateTicketTier(idx, 'description', e.target.value)}
                    placeholder="Short tier perks (e.g. includes drinks & priority gate access)"
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium rounded-md text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-md text-xs transition shadow-xs cursor-pointer"
            >
              {initialEvent ? 'Save Changes' : 'Create & Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

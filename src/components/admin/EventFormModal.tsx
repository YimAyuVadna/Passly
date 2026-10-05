import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Tag, Upload, Image as ImageIcon } from 'lucide-react';
import { EventItem, TicketType, EventStatus } from '../../types';
import { useTicketContext } from '../../context/TicketContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

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

  // Lock background scrolling when event form modal is open
  useBodyScrollLock(isOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialEvent?.name || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [category, setCategory] = useState<string>(initialEvent?.category || 'Concert');
  const [image, setImage] = useState(
    initialEvent?.image ||
      'https://images.unsplash.com/photo-1779419183221-df0bb6fdad1d?w=800&auto=format&fit=crop&q=80'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/40 backdrop-blur-xs p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-[8px] overflow-hidden text-[#111111] border border-[#EAEAEA] my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA] bg-[#FFFFFF]">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#111111]">
              {initialEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <p className="text-xs text-[#787774]">Configure event details, schedule, and ticket inventory tiers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#787774] hover:text-[#111111] hover:bg-[#F4F4F2] rounded-[4px] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
              Event Details
            </h4>

            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1">
                Event Title <span className="text-[#9F2F2D]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Neon Horizon Festival 2026"
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition"
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
                <label className="block text-xs font-medium text-[#111111] mb-1">Total Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm font-mono text-[#111111] focus:outline-none focus:border-[#111111] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#111111]">Banner Image</label>
                <span className="text-[11px] text-[#787774]">URL or direct photo upload</span>
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
                    className="flex-1 px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition disabled:opacity-75"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-[#F4F4F2] hover:bg-[#EAEAEA] text-[#111111] border border-[#EAEAEA] rounded-[6px] text-xs font-medium transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#787774]" />
                    <span>Upload</span>
                  </button>

                  {image.startsWith('data:') && (
                    <button
                      type="button"
                      onClick={() =>
                        setImage(
                          'https://images.unsplash.com/photo-1779419183221-df0bb6fdad1d?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-2 py-2 text-[#787774] hover:text-[#9F2F2D] rounded-[4px] text-xs transition cursor-pointer"
                      title="Reset image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {imageUploadError && (
                  <p className="text-xs text-[#9F2F2D] font-medium">{imageUploadError}</p>
                )}

                {image && (
                  <div className="relative h-28 w-full rounded-[6px] overflow-hidden border border-[#EAEAEA] bg-[#F4F4F2]">
                    <img
                      src={image}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#111111]/80 backdrop-blur-xs rounded-[4px] text-[10px] text-[#FFFFFF] font-mono flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Preview</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event, artist lineup, schedule highlights..."
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
              />
            </div>
          </div>

          {/* Schedule & Venue */}
          <div className="space-y-3 pt-2 border-t border-[#EAEAEA]">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
              Schedule & Venue
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:border-[#111111] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">
                  Venue Name <span className="text-[#9F2F2D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Diamond Island Hall A"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111111] mb-1">
                  Organizer
                </label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Sonic Entertainment"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city..."
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs sm:text-sm text-[#111111] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111] transition"
              />
            </div>
          </div>

          {/* Ticket Types Inventory */}
          <div className="space-y-3 pt-2 border-t border-[#EAEAEA]">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#787774]" />
                Ticket Tiers
              </h4>
              <button
                type="button"
                onClick={handleAddTicketTier}
                className="text-xs font-medium text-[#111111] hover:text-[#555452] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-3">
              {ticketTypes.map((tt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#FBFBFA] rounded-[6px] border border-[#EAEAEA] space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={tt.name}
                      onChange={(e) => handleUpdateTicketTier(idx, 'name', e.target.value)}
                      placeholder="Tier Name (VIP Pass)"
                      className="font-medium text-xs sm:text-sm bg-[#FFFFFF] px-3 py-1.5 border border-[#EAEAEA] rounded-[6px] flex-1 text-[#111111] focus:outline-none focus:border-[#111111]"
                    />

                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTicketTier(idx)}
                        className="p-1.5 text-[#787774] hover:text-[#9F2F2D] hover:bg-[#FDEBEC] rounded-[4px] transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#787774] font-medium mb-0.5">
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
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs font-mono font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#787774] font-medium mb-0.5">
                        Capacity Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tt.quantity}
                        onChange={(e) =>
                          handleUpdateTicketTier(idx, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs font-mono font-medium text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={tt.description}
                    onChange={(e) => handleUpdateTicketTier(idx, 'description', e.target.value)}
                    placeholder="Short tier perks (includes drinks & priority gate access)"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs text-[#555452] placeholder:text-[#A1A19E] focus:outline-none focus:border-[#111111]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-[#EAEAEA] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3.5 bg-[#FFFFFF] hover:bg-[#F4F4F2] text-[#111111] border border-[#EAEAEA] font-medium rounded-[6px] text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-1.5 px-4 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] font-medium rounded-[6px] text-xs transition cursor-pointer"
            >
              {initialEvent ? 'Save Changes' : 'Create & Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

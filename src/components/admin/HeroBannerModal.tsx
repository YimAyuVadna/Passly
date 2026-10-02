import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { useTicketContext } from '../../context/TicketContext';

interface HeroBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HeroBannerModal: React.FC<HeroBannerModalProps> = ({ isOpen, onClose }) => {
  const { heroBanner, updateHeroBanner, resetHeroBanner, events } = useTicketContext();

  const [enabled, setEnabled] = useState(heroBanner.enabled);
  const [tag, setTag] = useState(heroBanner.tag);
  const [category, setCategory] = useState(heroBanner.category || 'Concert');
  const [title, setTitle] = useState(heroBanner.title);
  const [description, setDescription] = useState(heroBanner.description);
  const [date, setDate] = useState(heroBanner.date || '');
  const [startTime, setStartTime] = useState(heroBanner.startTime || '');
  const [location, setLocation] = useState(heroBanner.location || '');
  const [image, setImage] = useState(heroBanner.image);
  const [buttonText, setButtonText] = useState(heroBanner.buttonText || 'Reserve Tickets');
  const [selectedEventId, setSelectedEventId] = useState(heroBanner.eventId || '');

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with context when opened
  useEffect(() => {
    if (isOpen) {
      setEnabled(heroBanner.enabled);
      setTag(heroBanner.tag);
      setCategory(heroBanner.category || 'Concert');
      setTitle(heroBanner.title);
      setDescription(heroBanner.description);
      setDate(heroBanner.date || '');
      setStartTime(heroBanner.startTime || '');
      setLocation(heroBanner.location || '');
      setImage(heroBanner.image);
      setButtonText(heroBanner.buttonText || 'Reserve Tickets');
      setSelectedEventId(heroBanner.eventId || '');
      setUploadError(null);
      setIsSaved(false);
    }
  }, [isOpen, heroBanner]);

  if (!isOpen) return null;

  // Handle choosing a linked event to autofill
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    const ev = events.find((e) => e.id === eventId);
    if (ev) {
      setTitle(ev.name);
      setDescription(ev.description);
      setCategory(ev.category);
      setDate(ev.date);
      setStartTime(ev.startTime);
      setLocation(ev.location);
      if (ev.image) {
        setImage(ev.image);
      }
    }
  };

  // Image file upload & conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image exceeds 3MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateHeroBanner({
      enabled,
      tag: tag.trim() || 'Featured Experience',
      category: category.trim() || 'Concert',
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      startTime: startTime.trim(),
      location: location.trim(),
      image: image.trim(),
      buttonText: buttonText.trim() || 'Reserve Tickets',
      eventId: selectedEventId || undefined,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 700);
  };

  const handleReset = () => {
    if (window.confirm('Reset the storefront hero banner back to default configuration?')) {
      resetHeroBanner();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden text-zinc-900 border border-zinc-200/90 my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-950">Hero Banner Editor</h3>
              <p className="text-xs text-zinc-400">Manage headline, featured event, and backdrop media</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Visibility Switch */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium text-xs text-zinc-900">Display Hero Banner</h4>
              <p className="text-[11px] text-zinc-500">
                When enabled, this editorial spotlight appears at the top of the event catalog
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                enabled ? 'bg-zinc-950' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                  enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quick Autofill from Existing Event */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700">
              Link to Existing Event (Autofills details)
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventSelect(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 cursor-pointer"
            >
              <option value="">-- Custom Standalone Banner (No Event Link) --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.category} • {ev.date})
                </option>
              ))}
            </select>
          </div>

          {/* Live Mini Preview - Editorial Style */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                Live Preview
              </span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Editorial Layout</span>
            </div>

            <div className="rounded-lg bg-zinc-50/50 border border-zinc-200/90 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    {tag || 'Featured'}
                  </span>
                  <span className="text-[11px] text-zinc-400">•</span>
                  <span className="text-[11px] text-zinc-600 font-medium">{category}</span>
                </div>
                <h4 className="text-sm font-semibold tracking-tight text-zinc-950 truncate">
                  {title || 'Headline Event Title'}
                </h4>
                <p className="text-[11px] text-zinc-500 line-clamp-1 leading-relaxed">
                  {description || 'Event description and highlights preview will appear here.'}
                </p>
                <div className="flex items-center gap-2.5 text-[10px] text-zinc-400 font-medium">
                  {date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      {date}
                    </span>
                  )}
                  {startTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {startTime}
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      {location}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-28 sm:w-36 aspect-[16/10] rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                {image ? (
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <ImageIcon className="w-5 h-5 opacity-40" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Badge / Tag Text <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Featured Experience"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Category Label <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Concert, Conference"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Headline Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Neon Pulse EDM Night 2026"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs font-semibold text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Description & Highlights <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A compelling description for the hero card..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">Event Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">Location / Venue</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Diamond Island Exhibition Center"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">Action Button Text</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g. Reserve Tickets"
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />
            </div>
          </div>

          {/* Image Upload & URL input */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-medium text-zinc-700">
              Hero Banner Image (URL or Upload) <span className="text-rose-500">*</span>
            </label>

            <div className="space-y-2">
              <input
                type="url"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-lg border border-dashed text-center transition cursor-pointer ${
                  isDragging
                    ? 'border-zinc-950 bg-zinc-50'
                    : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-700">
                  <Upload className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Upload local image file</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Drag & drop or click to browse (PNG, JPG, WebP max 3MB)
                </p>
              </div>

              {uploadError && (
                <div className="flex items-center gap-1.5 p-2.5 bg-rose-50 text-rose-700 rounded-md text-xs border border-rose-200/80">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 px-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved}
              className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 disabled:bg-emerald-600 text-white font-medium rounded-md text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Banner</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

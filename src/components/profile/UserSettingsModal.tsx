import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Check,
  User as UserIcon,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useTicketContext } from '../../context/TicketContext';
import { useBodyScrollLock } from '../../utils/scrollLock';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, orders, tickets } = useTicketContext();

  // Lock background scrolling when settings modal is open
  useBodyScrollLock(isOpen);

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setPhone(currentUser.phone);
      setAvatar(currentUser.avatar || '');
      setUploadError(null);
      setIsSaved(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle local image file upload & conversion to base64 Data URL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, or SVG).');
      return;
    }

    // Validate size (max 2MB for localStorage capacity)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size exceeds 2MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
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

  const handleRemoveAvatar = () => {
    setAvatar('');
    setUploadError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      return;
    }

    updateUser(currentUser.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar.trim() || undefined,
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 700);
  };

  // Account statistics
  const userOrdersCount = orders.filter(
    (o) =>
      o.customerId === currentUser.id ||
      o.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
  ).length;

  const userTicketsCount = tickets.filter(
    (t) =>
      t.customerId === currentUser.id ||
      t.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#EAEAEA] overflow-hidden text-[#111111] my-8 shadow-2xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
          <div>
            <h3 className="font-semibold text-base text-[#111111]">Account Settings</h3>
            <p className="text-xs text-[#787774]">Profile avatar and personal details</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-[#111111] hover:bg-[#F4F4F2] rounded-[6px] transition cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#EAEAEA] px-6 pt-2 gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2 border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#111111] text-[#111111] font-semibold'
                : 'border-transparent text-zinc-400 hover:text-[#111111]'
            }`}
          >
            Profile & Photo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-2 border-b-2 transition cursor-pointer ${
              activeTab === 'account'
                ? 'border-[#111111] text-[#111111] font-semibold'
                : 'border-transparent text-zinc-400 hover:text-[#111111]'
            }`}
          >
            Account Details
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* TAB 1: PROFILE & PHOTO */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Picture Upload Section */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-medium">
                    Profile Picture
                  </span>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Avatar Preview */}
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden border border-[#EAEAEA] bg-[#F7F6F3] flex items-center justify-center">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#111111] text-white flex items-center justify-center font-bold text-2xl font-mono">
                            {name ? name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 p-1.5 bg-[#111111] hover:bg-[#222222] text-white rounded-full border border-white transition cursor-pointer"
                        title="Upload new photo"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Upload Dropzone & Controls */}
                    <div className="flex-1 w-full space-y-2">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3.5 rounded-lg border border-dashed text-center transition cursor-pointer ${
                          isDragging
                            ? 'border-[#111111] bg-[#F7F6F3]'
                            : 'border-[#EAEAEA] hover:border-zinc-400 bg-[#FBFBFA]'
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
                          <span>Click to upload or drag image file here</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">PNG, JPG, SVG or WebP (max 2MB)</p>
                      </div>

                      {uploadError && (
                        <div className="flex items-center gap-1.5 p-2 bg-[#FDEBEC] text-[#9F2F2D] rounded-[6px] text-xs border border-[#F8D7DA]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-[11px] font-medium text-[#787774] hover:text-[#9F2F2D] transition cursor-pointer"
                        >
                          Remove custom photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#EAEAEA]" />

                {/* Personal Information Inputs */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-medium">
                    Personal Information
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Chan Dara"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="chandara@gmail.com"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs text-[#111111] focus:outline-none focus:border-[#111111] transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="012 345 678"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ACCOUNT DETAILS */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block font-medium">
                  Account Identity & Privileges
                </span>

                <div className="p-4 rounded-lg border border-[#EAEAEA] bg-[#FBFBFA] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#787774]">Access Tier</span>
                    <span className="px-2 py-0.5 bg-[#111111] text-white rounded-[4px] text-[10px] font-mono font-medium">
                      {currentUser.staffRole || currentUser.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#787774]">Account ID</span>
                    <span className="font-mono text-[#111111]"><kbd>{currentUser.id}</kbd></span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#787774]">Member Since</span>
                    <span className="text-[#111111] font-mono">
                      {new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="h-px bg-[#EAEAEA] my-2" />

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-2.5 bg-white rounded-md border border-[#EAEAEA]">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                        Orders
                      </span>
                      <span className="text-lg font-semibold text-[#111111] font-mono">
                        {userOrdersCount}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-md border border-[#EAEAEA]">
                      <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                        Passes Held
                      </span>
                      <span className="text-lg font-semibold text-[#111111] font-mono">
                        {userTicketsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 px-6 bg-[#FBFBFA] border-t border-[#EAEAEA] flex items-center justify-between gap-3">
            {isSaved ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#346538]">
                <Check className="w-3.5 h-3.5" />
                <span>Saved successfully</span>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-400 font-mono">Updates persist immediately</span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F7F6F3] text-zinc-700 border border-[#EAEAEA] rounded-[6px] text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaved}
                className="px-4 py-1.5 bg-[#111111] hover:bg-[#222222] disabled:bg-[#346538] text-white font-medium rounded-[6px] text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

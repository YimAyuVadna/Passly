import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  Check,
  AlertTriangle,
  XCircle,
  Keyboard,
  Sparkles,
  RefreshCw,
  ShieldAlert,
  Volume2,
  VolumeX,
  UploadCloud,
  FlipHorizontal,
  Image as ImageIcon,
  Bot,
  Zap,
} from 'lucide-react';
import { useTicketContext, ValidationResponse } from '../../context/TicketContext';
import { MLPredictionResult, MLTicketType, Ticket, OrderItem } from '../../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTokenToScan?: string | null;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  initialTokenToScan,
}) => {
  const { validateTicketByQr, tickets, currentUser, getOrderByTicketId, recordMLScan } = useTicketContext();

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'demo'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isDecodingPhoto, setIsDecodingPhoto] = useState<boolean>(false);

  // Machine Learning Phase 4 state
  const [mlResult, setMlResult] = useState<MLPredictionResult | null>(null);
  const [isMLLoading, setIsMLLoading] = useState<boolean>(false);
  const [mlError, setMlError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play auditory feedback chime
  const playFeedbackSound = (type: 'valid' | 'invalid') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'valid') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // AudioContext unavailable or suppressed
    }
  };

  // Start / Stop camera lifecycle
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera' || validationResult !== null) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, validationResult, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    // Check mediaDevices support (requires secure context localhost or https)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera API is not supported in this browser environment or requires HTTPS / localhost. You can use the "Upload Image" or "Manual ID" options to scan.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Try requesting preferred facingMode with standard resolution
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err) {
        // Fallback to basic video without constraints if environment camera fails
        console.warn('Fallback to basic video constraints:', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch((e) => console.log('Video play error:', e));
        setCameraActive(true);
        animFrameIdRef.current = requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please connect a webcam or switch to Upload Image.');
      } else {
        setCameraError(`Camera unavailable: ${err.message || 'Check camera connection and permissions.'}`);
      }
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Machine Learning Phase 4: Predict DIGITAL vs PHYSICAL pass format
  const fetchMLPrediction = async (ticket: Ticket, order?: OrderItem) => {
    setIsMLLoading(true);
    setMlError(null);
    setMlResult(null);

    const purchasedDate = order ? new Date(order.createdAt) : new Date(ticket.createdAt);
    const eventDateStr = ticket.eventDate + 'T' + (ticket.eventTime.length === 5 ? ticket.eventTime + ':00' : ticket.eventTime);
    const eventDateTime = new Date(eventDateStr).getTime();
    const rawLeadTime = (eventDateTime - purchasedDate.getTime()) / (1000 * 3600);
    const leadTimeHours = Math.max(0.5, Math.round(rawLeadTime * 10) / 10);

    const isVip = ticket.ticketTypeName.toUpperCase().includes('VIP') || ticket.ticketTypeName.toUpperCase().includes('PREMIUM');
    const isEarly = ticket.ticketTypeName.toUpperCase().includes('EARLY');
    const tierCode = isVip ? 'VIP' : isEarly ? 'EARLY_BIRD' : 'GA';

    const payload = {
      payment_method: order ? order.paymentMethod : 'ONLINE',
      unit_price: order ? order.unitPrice : ticket.price,
      quantity: order ? order.quantity : 1,
      total_amount: order ? order.totalAmount : ticket.price,
      hour_of_purchase: purchasedDate.getHours(),
      day_of_week: purchasedDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase(),
      has_notes: Boolean(order?.notes && order.notes.trim().length > 0),
      ticket_tier: tierCode,
      time_since_purchase_hours: leadTimeHours || 24.0,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const host = window.location.hostname;
      let res: Response;
      try {
        res = await fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch {
        res = await fetch(`http://${host}:5000/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      const ticketType: MLTicketType = json.ticket_type === 'PHYSICAL' ? 'PHYSICAL' : 'DIGITAL';
      const confidenceVal = typeof json.confidence === 'number' ? json.confidence : 0.95;

      const predictionResult: MLPredictionResult = {
        status: 'success',
        ticketType,
        predictionCode: json.prediction_code !== undefined ? json.prediction_code : (ticketType === 'DIGITAL' ? 0 : 1),
        confidence: confidenceVal,
        inputFeatures: {
          paymentMethod: String(payload.payment_method),
          unitPrice: payload.unit_price,
          quantity: payload.quantity,
          totalAmount: payload.total_amount,
          hourOfPurchase: payload.hour_of_purchase,
          dayOfWeek: purchasedDate.getDay(),
          hasNotes: payload.has_notes,
          ticketTier: payload.ticket_tier,
          timeSincePurchaseHours: payload.time_since_purchase_hours,
        },
        explanation:
          ticketType === 'DIGITAL'
            ? `Classified as DIGITAL (Online Pass) via ${payload.payment_method} channel with ${payload.time_since_purchase_hours}h advance purchase lead time.`
            : `Classified as PHYSICAL (Counter Pass) via ${payload.payment_method} channel and same-day walk-in lead time.`,
      };

      setMlResult(predictionResult);
      recordMLScan(ticketType);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('ML Prediction Service offline:', err);
      setMlError('ML Service Offline — Core QR validation approved entry. (Start python app.py on port 5000)');
    } finally {
      setIsMLLoading(false);
    }
  };

  const handleDetectedCode = (code: string, force: boolean = false) => {
    if (isProcessing || (validationResult && !force)) return;
    setIsProcessing(true);
    stopCamera();

    const res = validateTicketByQr(code, currentUser);
    setValidationResult(res);

    if (res.status === 'VALID' && res.ticket) {
      playFeedbackSound('valid');
      const order = getOrderByTicketId(res.ticket.id);
      fetchMLPrediction(res.ticket, order);
    } else {
      playFeedbackSound('invalid');
    }

    setIsProcessing(false);
  };

  // If opened with an initial token from the Online Booking test flow, automatically trigger scan
  useEffect(() => {
    if (isOpen && initialTokenToScan) {
      setActiveTab('demo');
      handleDetectedCode(initialTokenToScan, true);
    }
  }, [isOpen, initialTokenToScan]);

  // Continuous frame scanner loop
  const tickScan = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      videoRef.current.videoWidth > 0 &&
      videoRef.current.videoHeight > 0
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (qrCode && qrCode.data) {
            handleDetectedCode(qrCode.data);
            return;
          }
        }
      }
    }

    if (!validationResult && isOpen && activeTab === 'camera') {
      animFrameIdRef.current = requestAnimationFrame(tickScan);
    }
  };

  // Optimized high-performance image QR decoder (prevents browser freezing on Galaxy J7 Prime / 13MP cameras)
  const processImageFile = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsDecodingPhoto(true);

    // Yield control briefly so mobile browser can render the decoding spinner
    await new Promise((resolve) => setTimeout(resolve, 60));

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        // Fast path 1: Native hardware-accelerated BarcodeDetector (Chrome Android / modern browsers)
        if ('BarcodeDetector' in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await barcodeDetector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              URL.revokeObjectURL(objectUrl);
              setIsDecodingPhoto(false);
              handleDetectedCode(barcodes[0].rawValue);
              return;
            }
          } catch (e) {
            console.warn('Native BarcodeDetector pass skipped, falling back to downscaled canvas:', e);
          }
        }

        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        let detectedCode: string | null = null;

        // Pass 2: High-clarity 1400px downscale (preserves fine QR finder pattern ratios)
        const maxDim = 1400;
        const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
        canvas.width = Math.round(naturalW * scale);
        canvas.height = Math.round(naturalH * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let res = jsQR(imgData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
        if (res?.data) {
          detectedCode = res.data;
        }

        // Pass 3: Center-Crop (middle 65% of photo) - zooms in directly on the laptop screen
        if (!detectedCode) {
          const cropW = Math.round(naturalW * 0.65);
          const cropH = Math.round(naturalH * 0.65);
          const cropX = Math.round((naturalW - cropW) / 2);
          const cropY = Math.round((naturalH - cropH) / 2);

          const cropScale = Math.min(1, 1200 / Math.max(cropW, cropH));
          canvas.width = Math.round(cropW * cropScale);
          canvas.height = Math.round(cropH * cropScale);
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

          imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          res = jsQR(imgData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
          if (res?.data) {
            detectedCode = res.data;
          }
        }

        // Pass 4: Screen Glare Removal & Contrast Binarization on the Center Crop
        // Laptop screens have strong backlight reflections that wash out dark modules to gray.
        if (!detectedCode) {
          const d = imgData.data;
          let minL = 255;
          let maxL = 0;
          for (let i = 0; i < d.length; i += 16) {
            const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
            if (l < minL) minL = l;
            if (l > maxL) maxL = l;
          }
          const thresh = minL + (maxL - minL) * 0.45;
          for (let i = 0; i < d.length; i += 4) {
            const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
            const v = l > thresh ? 255 : 0;
            d[i] = v;
            d[i + 1] = v;
            d[i + 2] = v;
          }
          res = jsQR(d, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
          if (res?.data) {
            detectedCode = res.data;
          }
        }

        URL.revokeObjectURL(objectUrl);
        setIsDecodingPhoto(false);

        if (detectedCode) {
          handleDetectedCode(detectedCode);
        } else {
          setUploadError('No QR code detected in this photo. Please hold your phone steady about 20-30 cm from the screen, making sure the QR pass is sharp and fills the camera view.');
        }
      } catch (err: any) {
        URL.revokeObjectURL(objectUrl);
        setIsDecodingPhoto(false);
        console.error('Photo decode error:', err);
        setUploadError(`Failed to process photo: ${err.message || 'Error decoding image'}`);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsDecodingPhoto(false);
      setUploadError('Could not render image file from camera. Please try again.');
    };

    img.src = objectUrl;
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset file input so user can pick the same file again if desired
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
  };

  const handleResetScan = () => {
    setValidationResult(null);
    setManualCode('');
    setUploadError(null);
    setMlResult(null);
    setIsMLLoading(false);
    setMlError(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
        {/* Hidden file input for photo upload across all tabs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Entrance Checkpoint Scanner</h3>
              <p className="text-[11px] text-zinc-500">Live optical QR validation</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-300" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {!validationResult && (
          <div className="flex border-b border-zinc-800/80 px-4 pt-2.5 gap-2 bg-zinc-950/70 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('camera')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'camera'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual ID</span>
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'demo'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Quick Test</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {validationResult ? (
            /* VALIDATION RESULT VIEW */
            <div className="space-y-4">
              {/* Status Banner */}
              {validationResult.status === 'VALID' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] font-mono uppercase tracking-wider rounded-md">
                    Admitted
                  </span>
                  <h4 className="text-xl font-bold text-emerald-400">VALID PASS</h4>
                  <p className="text-xs text-emerald-200/80">
                    Checked in successfully. Attendee allowed entry.
                  </p>
                </div>
              )}

              {validationResult.status === 'ALREADY_USED' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-semibold text-[10px] font-mono uppercase tracking-wider rounded-md">
                    Duplicate Scanned
                  </span>
                  <h4 className="text-xl font-bold text-amber-400">ALREADY USED</h4>
                  <p className="text-xs text-amber-200/80">{validationResult.message}</p>
                  {validationResult.alreadyUsedInfo && (
                    <div className="mt-2 p-2.5 bg-zinc-900/80 rounded-xl text-[11px] text-left border border-zinc-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">First Scanned At:</span>
                        <span className="text-zinc-300 font-mono">
                          {new Date(validationResult.alreadyUsedInfo.usedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Verified By:</span>
                        <span className="text-zinc-300">{validationResult.alreadyUsedInfo.usedBy}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {validationResult.status === 'CANCELLED' && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <XCircle className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 bg-rose-500/20 text-rose-300 font-semibold text-[10px] font-mono uppercase tracking-wider rounded-md">
                    Entry Denied
                  </span>
                  <h4 className="text-xl font-bold text-rose-400">CANCELLED TICKET</h4>
                  <p className="text-xs text-rose-200/80">{validationResult.message}</p>
                </div>
              )}

              {validationResult.status === 'INVALID' && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 bg-rose-500/20 text-rose-300 font-semibold text-[10px] font-mono uppercase tracking-wider rounded-md">
                    Invalid Code
                  </span>
                  <h4 className="text-xl font-bold text-rose-400">UNRECOGNIZED PASS</h4>
                  <p className="text-xs text-rose-200/80">{validationResult.message}</p>
                </div>
              )}

              {/* Ticket Details Box */}
              {validationResult.ticket && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-2.5">
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                        {validationResult.ticket.ticketNumber}
                      </span>
                      <h5 className="font-semibold text-sm text-white mt-0.5">
                        {validationResult.ticket.eventName}
                      </h5>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-zinc-800 text-zinc-300">
                      {validationResult.ticket.ticketTypeName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 text-[11px]">Attendee</span>
                      <p className="font-medium text-white">{validationResult.ticket.customerName}</p>
                      <p className="text-zinc-400 text-[11px] font-mono">{validationResult.ticket.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[11px]">Event Schedule</span>
                      <p className="font-medium text-white">{validationResult.ticket.eventDate}</p>
                      <p className="text-zinc-400 text-[11px] font-mono">{validationResult.ticket.eventTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed ML Inspector Card (Shown for VALID tickets) */}
              {validationResult.status === 'VALID' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">AI Classification Inspector</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                      Decision Tree ML #1
                    </span>
                  </div>

                  {isMLLoading && (
                    <div className="py-4 flex items-center justify-center gap-2.5 text-xs text-zinc-400">
                      <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <span>Extracting order features & evaluating Decision Tree...</span>
                    </div>
                  )}

                  {mlError && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-2.5 text-[11px] text-amber-300">
                      <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{mlError}</span>
                    </div>
                  )}

                  {mlResult && (
                    <div className="space-y-3">
                      {/* Prediction Badge Banner */}
                      <div className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/90">
                        <div className="flex items-center gap-2.5">
                          {mlResult.ticketType === 'DIGITAL' ? (
                            <span className="px-3 py-1 bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(14,165,233,0.3)]">
                              <span>🖥️</span>
                              <span>DIGITAL PASS</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                              <span>🎫</span>
                              <span>PHYSICAL PASS</span>
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-400">
                            {mlResult.ticketType === 'DIGITAL' ? 'Online / Advance Booking' : 'Walk-in Box Office Counter'}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                          {Math.round(mlResult.confidence * 100)}% Confidence
                        </span>
                      </div>

                      {/* 4 Feature Inspection Pills */}
                      {mlResult.inputFeatures && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                            <span className="text-zinc-500 block text-[10px]">Payment Channel</span>
                            <span className="font-semibold text-zinc-200">{mlResult.inputFeatures.paymentMethod}</span>
                          </div>
                          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                            <span className="text-zinc-500 block text-[10px]">Advance Lead Time</span>
                            <span className="font-semibold text-zinc-200">{mlResult.inputFeatures.timeSincePurchaseHours}h prior</span>
                          </div>
                          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                            <span className="text-zinc-500 block text-[10px]">Tier Category</span>
                            <span className="font-semibold text-zinc-200">{mlResult.inputFeatures.ticketTier}</span>
                          </div>
                          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                            <span className="text-zinc-500 block text-[10px]">Order Notes</span>
                            <span className="font-semibold text-zinc-200">{mlResult.inputFeatures.hasNotes ? 'Attached' : 'None'}</span>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      <p className="text-[11px] text-zinc-400 leading-relaxed italic bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
                        "{mlResult.explanation}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2.5">
                <button
                  onClick={handleResetScan}
                  className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Next Pass</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl transition text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* SCANNER MODES */
            <div>
              {/* CAMERA SCANNER TAB */}
              {activeTab === 'camera' && (
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-center space-y-3">
                      <Camera className="w-8 h-8 text-zinc-500 mx-auto" />
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition cursor-pointer"
                        >
                          Upload Image
                        </button>
                        <button
                          onClick={() => setActiveTab('manual')}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition cursor-pointer"
                        >
                          Manual ID
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative aspect-square max-w-xs mx-auto bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-inner">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Optical Target Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-2/3 h-2/3 border border-white/20 rounded-2xl relative">
                            {/* Corner bracket reticle */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-lg" />

                            {/* Laser sweep animation */}
                            <div className="absolute inset-x-0 h-0.5 bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce" />
                          </div>
                        </div>

                        {/* Camera Flip Button */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={toggleFacingMode}
                            title="Switch Camera (Front / Back)"
                            className="p-2 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-full backdrop-blur-md border border-zinc-700/80 transition cursor-pointer"
                          >
                            <FlipHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status chip */}
                        <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                          <span className="bg-zinc-900/85 backdrop-blur-md text-zinc-300 text-[10px] px-3 py-1 rounded-full border border-zinc-700 font-medium">
                            {cameraActive ? 'Scanning... Align QR within frame' : 'Connecting to camera...'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <span>Aim camera at digital ticket QR code.</span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Upload photo instead</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* UPLOAD IMAGE SCANNER TAB */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  {isDecodingPhoto ? (
                    <div className="border border-zinc-800 bg-zinc-900/60 rounded-3xl p-8 text-center space-y-3 animate-pulse">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center mx-auto">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Analyzing Ticket Photo...</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          Downscaling camera image & decoding QR admission pass...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          processImageFile(file);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center space-y-3 cursor-pointer transition ${
                        isDraggingFile
                          ? 'border-white bg-zinc-800/80 scale-[1.01]'
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white">Select Ticket Image or Screenshot</h4>
                        <p className="text-xs text-zinc-400 mt-1">
                          Upload a photo, screenshot, or digital pass file containing a QR code
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-block px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        Choose File or Snap Photo
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processImageFile(file);
                          }
                          // Reset input so taking another photo triggers onChange
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-500 text-center">
                    The QR code inside the image will be decoded directly using the built-in optical scanner engine.
                  </p>
                </div>
              )}

              {/* MANUAL ID ENTRY TAB */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Pass Number or QR Token
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="e.g. TKT-2026-000928"
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-white transition"
                      autoFocus
                    />
                    <p className="text-[11px] text-zinc-500">
                      Enter the 14-character Ticket ID code printed on attendee passes.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full py-2.5 px-4 bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-950 font-semibold rounded-xl transition text-xs shadow-xs cursor-pointer"
                  >
                    Validate Code
                  </button>
                </form>
              )}

              {/* QUICK DEMO TEST TAB */}
              {activeTab === 'demo' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-zinc-400">
                    Test the validation engine instantly with pre-configured sample passes:
                  </p>

                  <div className="space-y-2">
                    {/* Sample: Valid Ticket */}
                    {tickets.find((t) => t.status === 'VALID') && (
                      <button
                        onClick={() => {
                          const t = tickets.find((tk) => tk.status === 'VALID');
                          if (t) handleDetectedCode(t.qrToken);
                        }}
                        className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Valid Admission Pass
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {tickets.find((t) => t.status === 'VALID')?.ticketNumber} (
                            {tickets.find((t) => t.status === 'VALID')?.customerName})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30">
                          Test Valid
                        </span>
                      </button>
                    )}

                    {/* Sample: Used Ticket */}
                    {tickets.find((t) => t.status === 'USED') && (
                      <button
                        onClick={() => {
                          const t = tickets.find((tk) => tk.status === 'USED');
                          if (t) handleDetectedCode(t.qrToken);
                        }}
                        className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Already Used Pass (Duplicate Entry)
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {tickets.find((t) => t.status === 'USED')?.ticketNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                          Test Duplicate
                        </span>
                      </button>
                    )}

                    {/* Sample: Cancelled */}
                    {tickets.find((t) => t.status === 'CANCELLED') && (
                      <button
                        onClick={() => {
                          const t = tickets.find((tk) => tk.status === 'CANCELLED');
                          if (t) handleDetectedCode(t.qrToken);
                        }}
                        className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Cancelled / Voided Pass
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {tickets.find((t) => t.status === 'CANCELLED')?.ticketNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
                          Test Cancelled
                        </span>
                      </button>
                    )}

                    {/* Sample: Invalid Code */}
                    <button
                      onClick={() => handleDetectedCode('UNKNOWN-RANDOM-FAKE-QR-TOKEN-999')}
                      className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          Unrecognized / Counterfeit QR
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">UNKNOWN-RANDOM-FAKE-QR</span>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
                        Test Invalid
                      </span>
                    </button>

                    {/* DEDICATED ML DECISION TREE SCENARIO BUTTONS */}
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                          ⚡ 1-Click ML Decision Tree Scenarios
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">Binary Classifier</span>
                      </div>

                      {/* Demo 1: Digital Online Pass */}
                      <button
                        onClick={() => handleDetectedCode('TKT-2026-000928-SECURE-NEONVIP1')}
                        className="w-full p-3 bg-sky-950/20 hover:bg-sky-950/40 border border-sky-800/40 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-sky-200 group-hover:text-white transition">
                              Demo Digital Ticket (Chan Dara)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-500/20 text-sky-300 font-mono">
                              VIP
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Online ABA E-Wallet • 48h Advance Purchase
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded-md border border-sky-500/30 shrink-0">
                          Classify DIGITAL
                        </span>
                      </button>

                      {/* Demo 2: Physical Counter Pass */}
                      <button
                        onClick={() => handleDetectedCode('TKT-2026-000932-SECURE-WALKIN-CASH')}
                        className="w-full p-3 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 rounded-xl text-left transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-amber-200 group-hover:text-white transition">
                              Demo Physical Ticket (Sokha Dara)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 font-mono">
                              Standard
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Cash Box Office • Walk-in Counter Sale
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30 shrink-0">
                          Classify PHYSICAL
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            Staff: <strong className="text-zinc-300 font-medium">{currentUser.name}</strong>
          </span>
          <span className="font-mono">{currentUser.staffRole || currentUser.role}</span>
        </div>
      </div>
    </div>
  );
};

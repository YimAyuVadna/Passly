import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  Check,
  AlertTriangle,
  XCircle,
  Keyboard,
  RefreshCw,
  ShieldAlert,
  Volume2,
  VolumeX,
  UploadCloud,
  FlipHorizontal,
  Image as ImageIcon,
  Zap,
  Ticket as TicketIcon,
  Calendar,
  Repeat,
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

  // Booth Standby Mode: continuous auto-looping for kiosk / booth self-scanning
  const [isStandbyMode, setIsStandbyMode] = useState<boolean>(false);
  const [standbySecondsLeft, setStandbySecondsLeft] = useState<number>(3);

  // Machine Learning Phase 4 state
  const [mlResult, setMlResult] = useState<MLPredictionResult | null>(null);
  const [isMLLoading, setIsMLLoading] = useState<boolean>(false);
  const [mlError, setMlError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live state refs to guarantee RAF loops never suffer from stale closures
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const validationResultRef = useRef(validationResult);
  validationResultRef.current = validationResult;

  // Offscreen canvas and scan throttling for smooth 60 FPS video
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScanningFrameRef = useRef<boolean>(false);
  const lastScanTimestampRef = useRef<number>(0);

  // Native hardware-accelerated BarcodeDetector (Chrome/Edge/Android)
  const barcodeDetectorRef = useRef<any>(null);
  useEffect(() => {
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('BarcodeDetector initialization skipped:', e);
      }
    }
  }, []);

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

  // Standby Booth Auto-Loop: automatically reset and loop back to camera to scan next ticket
  useEffect(() => {
    if (!isStandbyMode || !validationResult) {
      setStandbySecondsLeft(3);
      return;
    }

    setStandbySecondsLeft(3);
    const interval = setInterval(() => {
      setStandbySecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleResetScan();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStandbyMode, validationResult]);

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
    validationResultRef.current = res;
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

  // Continuous frame scanner loop: multi-pass hardware-accelerated QR decoder
  const tickScan = async () => {
    // Check live state via refs to prevent closure staleness
    if (!isOpenRef.current || activeTabRef.current !== 'camera' || validationResultRef.current !== null) {
      return;
    }

    const video = videoRef.current;

    if (
      video &&
      !video.paused &&
      !video.ended &&
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      !isScanningFrameRef.current
    ) {
      const now = performance.now();
      // Throttle scanning to ~15 scans/sec (every 65ms). Keeps video playback 60 FPS silky smooth
      if (now - lastScanTimestampRef.current >= 65) {
        lastScanTimestampRef.current = now;
        isScanningFrameRef.current = true;

        try {
          let detectedCode: string | null = null;

          // PASS 1: Native hardware-accelerated BarcodeDetector (Chrome/Edge/Chromium/Android)
          // Scans directly from the live video element with extreme precision in 1-2ms
          if (barcodeDetectorRef.current) {
            try {
              const barcodes = await barcodeDetectorRef.current.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch {
              // Fall through to jsQR
            }
          }

          // PASS 2: Multi-Pass jsQR (fallback if BarcodeDetector is unavailable or didn't detect)
          if (!detectedCode) {
            if (!scanCanvasRef.current) {
              scanCanvasRef.current = document.createElement('canvas');
            }

            const canvas = scanCanvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
              const vw = video.videoWidth;
              const vh = video.videoHeight;

              // Step 2A: CENTER RETICLE CROP (Middle 65% of camera feed)
              // Attendees aim the QR code directly into the center reticle.
              // Cropping the center eliminates background noise and zooms directly in on the QR pattern!
              const cropW = Math.round(vw * 0.65);
              const cropH = Math.round(vh * 0.65);
              const cropX = Math.round((vw - cropW) / 2);
              const cropY = Math.round((vh - cropH) / 2);

              // Downscale to max 480px for ultra-fast 3ms decoding
              const cropTarget = 480;
              const scale = Math.min(1, cropTarget / Math.max(cropW, cropH));
              canvas.width = Math.round(cropW * scale);
              canvas.height = Math.round(cropH * scale);

              ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
              let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              let qr = jsQR(imgData.data, canvas.width, canvas.height, {
                inversionAttempts: 'attemptBoth',
              });

              if (qr?.data) {
                detectedCode = qr.data;
              }

              // Step 2B: Full Frame Downscaled (if QR code is held near the edges)
              if (!detectedCode) {
                const fullTarget = 640;
                const fullScale = Math.min(1, fullTarget / Math.max(vw, vh));
                canvas.width = Math.round(vw * fullScale);
                canvas.height = Math.round(vh * fullScale);

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                qr = jsQR(imgData.data, canvas.width, canvas.height, {
                  inversionAttempts: 'attemptBoth',
                });

                if (qr?.data) {
                  detectedCode = qr.data;
                }
              }

              // Step 2C: Contrast Glare Thresholding (handles bright smartphone screens with backlight reflections)
              if (!detectedCode) {
                const d = imgData.data;
                let minL = 255;
                let maxL = 0;
                for (let i = 0; i < d.length; i += 16) {
                  const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
                  if (l < minL) minL = l;
                  if (l > maxL) maxL = l;
                }
                if (maxL - minL > 40) {
                  const thresh = minL + (maxL - minL) * 0.45;
                  for (let i = 0; i < d.length; i += 4) {
                    const l = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
                    const v = l > thresh ? 255 : 0;
                    d[i] = v;
                    d[i + 1] = v;
                    d[i + 2] = v;
                  }
                  qr = jsQR(d, canvas.width, canvas.height, {
                    inversionAttempts: 'dontInvert',
                  });
                  if (qr?.data) {
                    detectedCode = qr.data;
                  }
                }
              }
            }
          }

          if (detectedCode) {
            handleDetectedCode(detectedCode);
            isScanningFrameRef.current = false;
            return;
          }
        } catch (err) {
          console.warn('Frame scan error:', err);
        } finally {
          isScanningFrameRef.current = false;
        }
      }
    }

    // Schedule next frame check using live ref check (immune to closure staleness)
    if (isOpenRef.current && activeTabRef.current === 'camera' && !validationResultRef.current) {
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
    validationResultRef.current = null;
    setValidationResult(null);
    setManualCode('');
    setUploadError(null);
    setMlResult(null);
    setIsMLLoading(false);
    setMlError(null);
    setStandbySecondsLeft(3);
    if (activeTab !== 'camera') {
      setActiveTab('camera');
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
        {/* Hidden file input for photo upload across all tabs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Checkpoint Scanner</h3>
              <p className="text-[11px] text-zinc-400">Gate ticket validation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Booth Standby Loop Mode Toggle */}
            <button
              onClick={() => {
                const next = !isStandbyMode;
                setIsStandbyMode(next);
                if (next && activeTab !== 'camera') {
                  setActiveTab('camera');
                }
              }}
              title={isStandbyMode ? 'Disable Booth Standby Mode' : 'Enable Booth Standby Mode (Auto-Loop Scans for Self-Check-in)'}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                isStandbyMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Repeat
                className={`w-3 h-3 ${isStandbyMode ? 'text-emerald-400 animate-spin' : 'text-zinc-400'}`}
                style={isStandbyMode ? { animationDuration: '6s' } : undefined}
              />
              <span className="text-[11px] font-mono">Booth Loop</span>
              {isStandbyMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-300" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {!validationResult && (
          <div className="flex border-b border-zinc-800 px-4 pt-2 gap-1 bg-zinc-950 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('camera')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'camera'
                  ? 'border-white text-white font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-white text-white font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-white text-white font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual ID</span>
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'demo'
                  ? 'border-white text-white font-medium'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <TicketIcon className="w-3.5 h-3.5" />
              <span>Test Tokens</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {validationResult ? (
            /* VALIDATION RESULT VIEW */
            <div className="space-y-4">
              {/* Standby Booth Auto-Loop Banner */}
              {isStandbyMode && (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <span className="text-emerald-300 font-semibold block text-xs">
                        Booth Mode: Next scan starting automatically
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Resuming camera in <strong className="font-mono text-white text-sm font-bold">{standbySecondsLeft}s</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="px-2.5 py-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold rounded-md text-[11px] transition cursor-pointer"
                    >
                      Scan Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStandbyMode(false)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md text-[11px] transition cursor-pointer border border-zinc-800"
                    >
                      Pause
                    </button>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {validationResult.status === 'VALID' && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-emerald-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-400">VALID PASS</h4>
                  <p className="text-xs text-zinc-400">
                    Admission confirmed. Attendee admitted.
                  </p>
                </div>
              )}

              {validationResult.status === 'ALREADY_USED' && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-amber-400">TICKET ALREADY USED</h4>
                  <p className="text-xs text-zinc-400">{validationResult.message}</p>
                  {validationResult.alreadyUsedInfo && (
                    <div className="mt-2 p-2.5 bg-zinc-900 rounded-lg text-xs text-left border border-zinc-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">First Scanned:</span>
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

              {validationResult.status === 'EXPIRED' && (
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-rose-400">TICKET EXPIRED</h4>
                  <p className="text-xs text-zinc-400">{validationResult.message}</p>
                </div>
              )}

              {validationResult.status === 'CANCELLED' && (
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-rose-400">PASS CANCELLED</h4>
                  <p className="text-xs text-zinc-400">{validationResult.message}</p>
                </div>
              )}

              {validationResult.status === 'INVALID' && (
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-rose-400">INVALID PASS</h4>
                  <p className="text-xs text-zinc-400">{validationResult.message}</p>
                </div>
              )}

              {/* Ticket Details Box */}
              {validationResult.ticket && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-start justify-between border-b border-zinc-800 pb-2.5">
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {validationResult.ticket.ticketNumber}
                      </span>
                      <h5 className="font-semibold text-sm text-white mt-0.5">
                        {validationResult.ticket.eventName}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300">
                        {validationResult.ticket.ticketTypeName}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded ${
                          validationResult.status === 'VALID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : validationResult.status === 'ALREADY_USED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {validationResult.status === 'VALID'
                          ? 'VALID'
                          : validationResult.status === 'ALREADY_USED'
                          ? 'USED'
                          : validationResult.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Attendee</span>
                      <p className="font-medium text-white">{validationResult.ticket.customerName}</p>
                      <p className="text-zinc-400 text-[11px] font-mono">{validationResult.ticket.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Schedule</span>
                      <p className="font-medium text-white">{validationResult.ticket.eventDate}</p>
                      <p className="text-zinc-400 text-[11px] font-mono">{validationResult.ticket.eventTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ML Pass Classification telemetry */}
              {validationResult.status === 'VALID' && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-medium text-zinc-300">Format Verification</span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Telemetry Classifier
                    </span>
                  </div>

                  {isMLLoading && (
                    <div className="py-2 flex items-center gap-2 text-xs text-zinc-400">
                      <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying pass format...</span>
                    </div>
                  )}

                  {mlError && (
                    <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400">
                      <span>{mlError}</span>
                    </div>
                  )}

                  {mlResult && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                        <span className="text-xs font-semibold text-white">
                          {mlResult.ticketType === 'DIGITAL' ? 'Digital Pass (Online)' : 'Physical Pass (Box Office)'}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                          {Math.round(mlResult.confidence * 100)}% Match
                        </span>
                      </div>

                      {mlResult.inputFeatures && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px]">Channel</span>
                            <span className="text-zinc-200">{mlResult.inputFeatures.paymentMethod}</span>
                          </div>
                          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px]">Lead Time</span>
                            <span className="text-zinc-200">{mlResult.inputFeatures.timeSincePurchaseHours}h</span>
                          </div>
                          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px]">Tier</span>
                            <span className="text-zinc-200">{mlResult.inputFeatures.ticketTier}</span>
                          </div>
                          <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px]">Notes</span>
                            <span className="text-zinc-200">{mlResult.inputFeatures.hasNotes ? 'Yes' : 'None'}</span>
                          </div>
                        </div>
                      )}
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
                  <span>Scan Next Pass {isStandbyMode ? `(${standbySecondsLeft}s)` : ''}</span>
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
                    <div className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-lg text-center space-y-3">
                      <Camera className="w-7 h-7 text-zinc-500 mx-auto" />
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={startCamera}
                          className="px-3.5 py-1.5 bg-white text-zinc-950 text-xs font-medium rounded-md transition cursor-pointer"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md transition cursor-pointer"
                        >
                          Upload Image
                        </button>
                        <button
                          onClick={() => setActiveTab('manual')}
                          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md transition cursor-pointer"
                        >
                          Manual ID
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative aspect-square max-w-xs mx-auto bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          onLoadedMetadata={() => {
                            setCameraActive(true);
                            if (!animFrameIdRef.current) {
                              animFrameIdRef.current = requestAnimationFrame(tickScan);
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Optical Target Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-2/3 h-2/3 border border-white/20 rounded-lg relative overflow-hidden">
                            {/* Corner bracket reticle */}
                            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white rounded-tl z-10" />
                            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white rounded-tr z-10" />
                            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white rounded-bl z-10" />
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white rounded-br z-10" />

                            {/* Laser sweep animation: smooth sweeping green beam with emerald glow */}
                            <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981,0_0_4px_#34d399] animate-laser">
                              <div className="w-full h-8 bg-gradient-to-b from-emerald-500/25 to-transparent -translate-y-full pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Booth Standby loop indicator badge on viewport */}
                        {isStandbyMode && (
                          <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950/85 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 backdrop-blur-md">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              BOOTH STANDBY LOOP
                            </span>
                          </div>
                        )}

                        {/* Camera Flip Button */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            onClick={toggleFacingMode}
                            title="Switch Camera (Front / Back)"
                            className="p-1.5 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-md backdrop-blur-md border border-zinc-700/80 transition cursor-pointer"
                          >
                            <FlipHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status chip */}
                        <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                          <span className="bg-zinc-900/85 backdrop-blur-md text-zinc-300 text-[10px] px-2.5 py-0.5 rounded border border-zinc-700 font-mono">
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

                      {/* Standby Booth Mode Callout */}
                      <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isStandbyMode
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            <Repeat className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              Standby Booth Mode
                            </span>
                            <span className="text-[11px] text-zinc-400 block leading-tight">
                              {isStandbyMode
                                ? 'Continuous loop active: Camera auto-resets after each scan for self-service.'
                                : 'Place device in a booth for attendees to self-scan tickets in continuous loops.'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !isStandbyMode;
                            setIsStandbyMode(next);
                            if (next && activeTab !== 'camera') {
                              setActiveTab('camera');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                            isStandbyMode
                              ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-xs'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                          }`}
                        >
                          {isStandbyMode ? 'Active (Looping)' : 'Enable Booth Mode'}
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
                    <div className="border border-zinc-800 bg-zinc-900/60 rounded-xl p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center mx-auto">
                        <RefreshCw className="w-5 h-5 animate-spin text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-white">Analyzing Ticket Photo...</h4>
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
                      className={`border border-dashed rounded-xl p-8 text-center space-y-3 cursor-pointer transition ${
                        isDraggingFile
                          ? 'border-white bg-zinc-900'
                          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-white">Select Ticket Image or Screenshot</h4>
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
                        className="inline-block px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-medium rounded-md shadow-xs transition cursor-pointer"
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
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-md text-red-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
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
                  <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-2">
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Pass Number or QR Token
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="e.g. TKT-2026-000928"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white font-mono text-xs focus:outline-none focus:border-zinc-500 transition"
                      autoFocus
                    />
                    <p className="text-[11px] text-zinc-500">
                      Enter the 14-character Ticket ID code printed on attendee passes.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full py-2 px-4 bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-950 font-medium rounded-md transition text-xs shadow-xs cursor-pointer"
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

                    {/* Sample: Expired (Past Event Date) */}
                    {tickets.find((t) => t.status === 'EXPIRED') && (
                      <button
                        onClick={() => {
                          const t = tickets.find((tk) => tk.status === 'EXPIRED');
                          if (t) handleDetectedCode(t.qrToken);
                        }}
                        className="w-full p-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            Expired Pass (Past Event Date)
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {tickets.find((t) => t.status === 'EXPIRED')?.ticketNumber} • Event Date:{' '}
                            {tickets.find((t) => t.status === 'EXPIRED')?.eventDate}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md border border-rose-500/30">
                          Test Expired
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
                    <div className="pt-3 border-t border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            Telemetry Classification Scenarios
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-500">Binary ML Model</span>
                      </div>

                      {/* Demo 1: Digital Online Pass */}
                      <button
                        onClick={() => handleDetectedCode('TKT-2026-000928-SECURE-NEONVIP1')}
                        className="w-full p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white group-hover:text-zinc-200 transition">
                              Digital Pass Sample (Chan Dara)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                              VIP
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Online ABA E-Wallet • 48h Advance
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 shrink-0">
                          Classify DIGITAL
                        </span>
                      </button>

                      {/* Demo 2: Physical Counter Pass */}
                      <button
                        onClick={() => handleDetectedCode('TKT-2026-000932-SECURE-WALKIN-CASH')}
                        className="w-full p-2.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white group-hover:text-zinc-200 transition">
                              Physical Pass Sample (Sokha Dara)
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                              GA
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Cash Box Office • Walk-in Counter
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-zinc-700 shrink-0">
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

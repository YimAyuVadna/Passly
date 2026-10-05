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
import { useBodyScrollLock } from '../../utils/scrollLock';

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

  // Lock background scrolling when scanner is open
  useBodyScrollLock(isOpen);

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
      setMlError('ML Service Offline: Core QR validation approved entry. (Start python app.py on port 5000)');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/40 backdrop-blur-xs p-4 overflow-y-auto overscroll-contain">
      <div className="relative w-full max-w-lg sm:max-w-xl bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] overflow-hidden text-[#111111] flex flex-col max-h-[92vh]">
        {/* Hidden file input for photo upload across all tabs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileUpload}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EAEAEA] bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[#111111] text-[#FFFFFF] flex items-center justify-center">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#111111]">Checkpoint Scanner</h3>
              <p className="text-[11px] text-[#787774]">Gate ticket validation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              className="p-1.5 text-[#787774] hover:text-[#111111] rounded-[4px] hover:bg-[#F4F4F2] transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#111111]" /> : <VolumeX className="w-4 h-4 text-[#A1A19E]" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 text-[#787774] hover:text-[#111111] rounded-[4px] hover:bg-[#F4F4F2] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        {!validationResult && (
          <div className="flex border-b border-[#EAEAEA] px-4 pt-2 gap-1 bg-[#FFFFFF] text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('camera')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'camera'
                  ? 'border-[#111111] text-[#111111] font-medium'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#111111] text-[#111111] font-medium'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'manual'
                  ? 'border-[#111111] text-[#111111] font-medium'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Manual ID</span>
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`pb-2 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'demo'
                  ? 'border-[#111111] text-[#111111] font-medium'
                  : 'border-transparent text-[#787774] hover:text-[#111111]'
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
                <div className="bg-[#EDF3EC] border border-[#D5E3D3] rounded-[6px] p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#346538] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#346538]"></span>
                    </span>
                    <div>
                      <span className="text-[#346538] font-semibold block text-xs">
                        Booth Mode: Next scan starting automatically
                      </span>
                      <span className="text-[11px] text-[#787774]">
                        Resuming camera in <strong className="font-mono text-[#111111] text-sm font-bold">{standbySecondsLeft}s</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="px-2.5 py-1 bg-[#111111] text-[#FFFFFF] hover:bg-[#222222] font-medium rounded-[4px] text-[11px] transition cursor-pointer"
                    >
                      Scan Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsStandbyMode(false)}
                      className="px-2 py-1 bg-[#FFFFFF] hover:bg-[#F4F4F2] text-[#787774] hover:text-[#111111] rounded-[4px] text-[11px] transition cursor-pointer border border-[#EAEAEA]"
                    >
                      Pause
                    </button>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {validationResult.status === 'VALID' && (
                <div className="bg-[#EDF3EC] border border-[#D5E3D3] rounded-[8px] p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-[#346538] text-[#FFFFFF] rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#346538]">VALID ADMISSION PASS</h4>
                  <p className="text-xs text-[#555452]">
                    Admission confirmed. Attendee admitted.
                  </p>
                </div>
              )}

              {validationResult.status === 'ALREADY_USED' && (
                <div className="bg-[#FBF3DB] border border-[#F5E5B8] rounded-[8px] p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-[#956400] text-[#FFFFFF] rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#956400]">TICKET ALREADY USED</h4>
                  <p className="text-xs text-[#555452]">{validationResult.message}</p>
                  {validationResult.alreadyUsedInfo && (
                    <div className="mt-2 p-2.5 bg-[#FFFFFF] rounded-[6px] text-xs text-left border border-[#F5E5B8] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#787774]">First Scanned:</span>
                        <span className="text-[#111111] font-mono">
                          {new Date(validationResult.alreadyUsedInfo.usedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#787774]">Verified By:</span>
                        <span className="text-[#111111] font-medium">{validationResult.alreadyUsedInfo.usedBy}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {validationResult.status === 'EXPIRED' && (
                <div className="bg-[#FDEBEC] border border-[#F9D4D6] rounded-[8px] p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-[#9F2F2D] text-[#FFFFFF] rounded-full flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#9F2F2D]">TICKET EXPIRED</h4>
                  <p className="text-xs text-[#555452]">{validationResult.message}</p>
                </div>
              )}

              {validationResult.status === 'CANCELLED' && (
                <div className="bg-[#FDEBEC] border border-[#F9D4D6] rounded-[8px] p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-[#9F2F2D] text-[#FFFFFF] rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#9F2F2D]">PASS CANCELLED</h4>
                  <p className="text-xs text-[#555452]">{validationResult.message}</p>
                </div>
              )}

              {validationResult.status === 'INVALID' && (
                <div className="bg-[#FDEBEC] border border-[#F9D4D6] rounded-[8px] p-5 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-[#9F2F2D] text-[#FFFFFF] rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif text-lg font-medium text-[#9F2F2D]">INVALID PASS</h4>
                  <p className="text-xs text-[#555452]">{validationResult.message}</p>
                </div>
              )}

              {/* Ticket Details Box */}
              {validationResult.ticket && (
                <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] p-4 space-y-2.5">
                  <div className="flex items-start justify-between border-b border-[#EAEAEA] pb-2.5">
                    <div>
                      <span className="text-[11px] font-mono text-[#787774]">
                        {validationResult.ticket.ticketNumber}
                      </span>
                      <h5 className="font-serif text-base font-medium text-[#111111] mt-0.5">
                        {validationResult.ticket.eventName}
                      </h5>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#F4F4F2] text-[#111111] border border-[#EAEAEA]">
                        {validationResult.ticket.ticketTypeName}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-full ${
                          validationResult.status === 'VALID'
                            ? 'bg-[#EDF3EC] text-[#346538] border border-[#D5E3D3]'
                            : validationResult.status === 'ALREADY_USED'
                            ? 'bg-[#FBF3DB] text-[#956400] border border-[#F5E5B8]'
                            : 'bg-[#FDEBEC] text-[#9F2F2D] border border-[#F9D4D6]'
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
                      <span className="text-[#787774] text-[10px] uppercase font-mono block">
                        {validationResult.ticket.sharedToName ? 'Guest / Pass Holder' : 'Attendee'}
                      </span>
                      <p className="font-medium text-[#111111]">
                        {validationResult.ticket.sharedToName || validationResult.ticket.customerName}
                      </p>
                      {validationResult.ticket.sharedToName ? (
                        <p className="text-[#8F681B] text-[11px] font-mono">
                          Shared by {validationResult.ticket.customerName}
                        </p>
                      ) : (
                        <p className="text-[#787774] text-[11px] font-mono">{validationResult.ticket.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[#787774] text-[10px] uppercase font-mono block">Schedule</span>
                      <p className="font-medium text-[#111111]">{validationResult.ticket.eventDate}</p>
                      <p className="text-[#787774] text-[11px] font-mono">{validationResult.ticket.eventTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ML Pass Classification telemetry */}
              {validationResult.status === 'VALID' && (
                <div className="bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2">
                    <span className="text-xs font-medium text-[#111111]">Format Verification</span>
                    <span className="text-[10px] font-mono text-[#787774]">
                      Telemetry Classifier
                    </span>
                  </div>

                  {isMLLoading && (
                    <div className="py-2 flex items-center gap-2 text-xs text-[#787774]">
                      <div className="w-3.5 h-3.5 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                      <span>Verifying pass format...</span>
                    </div>
                  )}

                  {mlError && (
                    <div className="p-2.5 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-xs text-[#787774]">
                      <span>{mlError}</span>
                    </div>
                  )}

                  {mlResult && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between bg-[#FFFFFF] p-2.5 rounded-[6px] border border-[#EAEAEA]">
                        <span className="text-xs font-medium text-[#111111]">
                          {mlResult.ticketType === 'DIGITAL' ? 'Digital Pass (Online)' : 'Physical Pass (Box Office)'}
                        </span>
                        <span className="text-xs font-mono text-[#787774]">
                          {Math.round(mlResult.confidence * 100)}% Match
                        </span>
                      </div>

                      {mlResult.inputFeatures && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2 bg-[#FFFFFF] rounded-[6px] border border-[#EAEAEA]">
                            <span className="text-[#787774] block text-[10px] font-mono">Channel</span>
                            <span className="text-[#111111] font-medium">{mlResult.inputFeatures.paymentMethod}</span>
                          </div>
                          <div className="p-2 bg-[#FFFFFF] rounded-[6px] border border-[#EAEAEA]">
                            <span className="text-[#787774] block text-[10px] font-mono">Lead Time</span>
                            <span className="text-[#111111] font-mono">{mlResult.inputFeatures.timeSincePurchaseHours}h</span>
                          </div>
                          <div className="p-2 bg-[#FFFFFF] rounded-[6px] border border-[#EAEAEA]">
                            <span className="text-[#787774] block text-[10px] font-mono">Tier</span>
                            <span className="text-[#111111] font-mono">{mlResult.inputFeatures.ticketTier}</span>
                          </div>
                          <div className="p-2 bg-[#FFFFFF] rounded-[6px] border border-[#EAEAEA]">
                            <span className="text-[#787774] block text-[10px] font-mono">Notes</span>
                            <span className="text-[#111111]">{mlResult.inputFeatures.hasNotes ? 'Yes' : 'None'}</span>
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
                  className="flex-1 py-2 px-4 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] font-medium rounded-[6px] transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Next Pass {isStandbyMode ? `(${standbySecondsLeft}s)` : ''}</span>
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="py-2 px-4 bg-[#FFFFFF] hover:bg-[#F4F4F2] text-[#111111] border border-[#EAEAEA] font-medium rounded-[6px] transition text-xs cursor-pointer"
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
                    <div className="p-6 bg-[#FDEBEC] border border-[#F9D4D6] rounded-[8px] text-center space-y-3">
                      <Camera className="w-7 h-7 text-[#9F2F2D] mx-auto" />
                      <p className="text-xs text-[#9F2F2D] max-w-sm mx-auto leading-relaxed">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <button
                          onClick={startCamera}
                          className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] text-xs font-medium rounded-[6px] transition cursor-pointer"
                        >
                          Retry Camera
                        </button>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F4F4F2] text-[#111111] border border-[#EAEAEA] text-xs font-medium rounded-[6px] transition cursor-pointer"
                        >
                          Upload Image
                        </button>
                        <button
                          onClick={() => setActiveTab('manual')}
                          className="px-3.5 py-1.5 bg-[#FFFFFF] hover:bg-[#F4F4F2] text-[#111111] border border-[#EAEAEA] text-xs font-medium rounded-[6px] transition cursor-pointer"
                        >
                          Manual ID
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative aspect-square w-full max-w-sm sm:max-w-md mx-auto bg-[#111111] rounded-[8px] overflow-hidden border border-[#EAEAEA]">
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
                          <div className="w-2/3 h-2/3 border border-white/20 rounded-[6px] relative overflow-hidden">
                            {/* Corner bracket reticle */}
                            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-white z-10" />
                            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-white z-10" />
                            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-white z-10" />
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-white z-10" />

                            {/* Clean laser scan line */}
                            <div className="absolute inset-x-0 h-0.5 bg-white/80 animate-laser" />
                          </div>
                        </div>

                        {/* Booth Standby loop indicator badge on viewport */}
                        {isStandbyMode && (
                          <div className="absolute top-3 left-3 z-10 pointer-events-none">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#111111]/85 border border-white/20 text-[10px] font-mono text-white backdrop-blur-md">
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
                            className="p-1.5 bg-[#111111]/80 hover:bg-[#111111] text-white rounded-[4px] backdrop-blur-md border border-white/20 transition cursor-pointer"
                          >
                            <FlipHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status chip */}
                        <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
                          <span className="bg-[#111111]/85 backdrop-blur-md text-white/90 text-[10px] px-2.5 py-0.5 rounded-[4px] border border-white/20 font-mono">
                            {cameraActive ? 'Scanning... Align QR within frame' : 'Connecting to camera...'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#787774] pt-1">
                        <span>Aim camera at digital ticket QR code.</span>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[#111111] hover:text-[#555452] flex items-center gap-1 cursor-pointer transition font-medium"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-[#787774]" />
                          <span>Upload photo instead</span>
                        </button>
                      </div>

                      {/* Standby Booth Mode Callout */}
                      <div className="p-3 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[8px] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-[4px] flex items-center justify-center shrink-0 border ${
                              isStandbyMode
                                ? 'bg-[#EDF3EC] text-[#346538] border-[#D5E3D3]'
                                : 'bg-[#F4F4F2] text-[#787774] border-[#EAEAEA]'
                            }`}
                          >
                            <Repeat className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-[#111111] block">
                              Standby Booth Mode
                            </span>
                            <span className="text-[11px] text-[#787774] block leading-tight">
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
                          className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition cursor-pointer shrink-0 border ${
                            isStandbyMode
                              ? 'bg-[#EDF3EC] text-[#346538] border-[#D5E3D3]'
                              : 'bg-[#FFFFFF] hover:bg-[#F4F4F2] text-[#111111] border-[#EAEAEA]'
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
                    <div className="border border-[#EAEAEA] bg-[#FBFBFA] rounded-[8px] p-8 text-center space-y-3">
                      <div className="w-10 h-10 rounded-[6px] bg-[#FFFFFF] text-[#111111] border border-[#EAEAEA] flex items-center justify-center mx-auto">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#111111]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-medium text-[#111111]">Analyzing Ticket Photo...</h4>
                        <p className="text-xs text-[#787774] mt-1">
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
                      className={`border border-dashed rounded-[8px] p-8 text-center space-y-3 cursor-pointer transition ${
                        isDraggingFile
                          ? 'border-[#111111] bg-[#FBFBFA]'
                          : 'border-[#EAEAEA] hover:border-[#A1A19E] bg-[#FBFBFA]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-[6px] bg-[#FFFFFF] border border-[#EAEAEA] text-[#787774] flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-base font-medium text-[#111111]">Select Ticket Image or Screenshot</h4>
                        <p className="text-xs text-[#787774] mt-1">
                          Upload a photo, screenshot, or digital pass file containing a QR code
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="inline-block px-3.5 py-1.5 bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] text-xs font-medium rounded-[6px] transition cursor-pointer"
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
                    <div className="p-3 bg-[#FDEBEC] border border-[#F9D4D6] rounded-[6px] text-[#9F2F2D] text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#9F2F2D]" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-[#787774] text-center">
                    The QR code inside the image will be decoded directly using the built-in optical scanner engine.
                  </p>
                </div>
              )}

              {/* MANUAL ID ENTRY TAB */}
              {activeTab === 'manual' && (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="p-4 bg-[#FBFBFA] border border-[#EAEAEA] rounded-[6px] space-y-2">
                    <label className="block text-[11px] font-mono text-[#787774] uppercase tracking-wider">
                      Pass Number or QR Token
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="TKT-2026-000928"
                      className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[6px] text-[#111111] font-mono text-xs focus:outline-none focus:border-[#111111] transition"
                      autoFocus
                    />
                    <p className="text-[11px] text-[#787774]">
                      Enter the 14-character Ticket ID code printed on attendee passes.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="w-full py-2 px-4 bg-[#111111] hover:bg-[#222222] disabled:opacity-40 text-[#FFFFFF] font-medium rounded-[6px] transition text-xs cursor-pointer"
                  >
                    Validate Code
                  </button>
                </form>
              )}

              {/* QUICK DEMO TEST TAB */}
              {activeTab === 'demo' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-[#787774]">
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
                        className="w-full p-3 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-[#111111] block">
                            Valid Admission Pass
                          </span>
                          <span className="text-[11px] text-[#787774] font-mono">
                            {tickets.find((t) => t.status === 'VALID')?.ticketNumber} (
                            {tickets.find((t) => t.status === 'VALID')?.customerName})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#EDF3EC] text-[#346538] rounded-full border border-[#D5E3D3]">
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
                        className="w-full p-3 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-[#111111] block">
                            Already Used Pass (Duplicate Entry)
                          </span>
                          <span className="text-[11px] text-[#787774] font-mono">
                            {tickets.find((t) => t.status === 'USED')?.ticketNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#FBF3DB] text-[#956400] rounded-full border border-[#F5E5B8]">
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
                        className="w-full p-3 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-[#111111] block">
                            Expired Pass (Past Event Date)
                          </span>
                          <span className="text-[11px] text-[#787774] font-mono">
                            {tickets.find((t) => t.status === 'EXPIRED')?.ticketNumber} • Event Date:{' '}
                            {tickets.find((t) => t.status === 'EXPIRED')?.eventDate}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#FDEBEC] text-[#9F2F2D] rounded-full border border-[#F9D4D6]">
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
                        className="w-full p-3 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-semibold text-[#111111] block">
                            Cancelled / Voided Pass
                          </span>
                          <span className="text-[11px] text-[#787774] font-mono">
                            {tickets.find((t) => t.status === 'CANCELLED')?.ticketNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#FDEBEC] text-[#9F2F2D] rounded-full border border-[#F9D4D6]">
                          Test Cancelled
                        </span>
                      </button>
                    )}

                    {/* Sample: Invalid Code */}
                    <button
                      onClick={() => handleDetectedCode('UNKNOWN-RANDOM-FAKE-QR-TOKEN-999')}
                      className="w-full p-3 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-semibold text-[#111111] block">
                          Unrecognized / Counterfeit QR
                        </span>
                        <span className="text-[11px] text-[#787774] font-mono">UNKNOWN-RANDOM-FAKE-QR</span>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#FDEBEC] text-[#9F2F2D] rounded-full border border-[#F9D4D6]">
                        Test Invalid
                      </span>
                    </button>

                    {/* DEDICATED ML DECISION TREE SCENARIO BUTTONS */}
                    <div className="pt-3 border-t border-[#EAEAEA] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-[#787774]" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
                            Telemetry Classification Scenarios
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#787774]">Binary ML Model</span>
                      </div>

                      {/* Demo 1: Digital Online Pass */}
                      <button
                        onClick={() => handleDetectedCode('TKT-2026-000928-SECURE-NEONVIP1')}
                        className="w-full p-2.5 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#111111] group-hover:text-[#555452] transition">
                              Digital Pass Sample (Chan Dara)
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#FFFFFF] text-[#787774] font-mono border border-[#EAEAEA]">
                              VIP
                            </span>
                          </div>
                          <span className="text-[10px] text-[#787774] font-mono">
                            Online ABA E-Wallet • 48h Advance
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#FFFFFF] text-[#111111] rounded-full border border-[#EAEAEA] shrink-0">
                          Classify DIGITAL
                        </span>
                      </button>

                      {/* Demo 2: Physical Counter Pass */}
                      <button
                        onClick={() => handleDetectedCode('TKT-2026-000932-SECURE-WALKIN-CASH')}
                        className="w-full p-2.5 bg-[#FBFBFA] hover:bg-[#F4F4F2] border border-[#EAEAEA] rounded-[6px] text-left transition flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-[#111111] group-hover:text-[#555452] transition">
                              Physical Pass Sample (Sokha Dara)
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#FFFFFF] text-[#787774] font-mono border border-[#EAEAEA]">
                              GA
                            </span>
                          </div>
                          <span className="text-[10px] text-[#787774] font-mono">
                            Cash Box Office • Walk-in Counter
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#FFFFFF] text-[#111111] rounded-full border border-[#EAEAEA] shrink-0">
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
        <div className="px-5 py-2.5 bg-[#FBFBFA] border-t border-[#EAEAEA] flex items-center justify-between text-[11px] text-[#787774]">
          <span>
            Staff: <strong className="text-[#111111] font-medium">{currentUser.name}</strong>
          </span>
          <span className="font-mono">{currentUser.staffRole || currentUser.role}</span>
        </div>
      </div>
    </div>
  );
};

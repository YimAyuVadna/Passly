import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 180,
  className = '',
  includeMargin = true,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for sharp retina displays
      margin: includeMargin ? 2 : 0,
      color: {
        dark: '#09090b', // Zinc 950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setDataUrl(url);
        setError(null);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      });
  }, [value, size, includeMargin]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-zinc-400 text-xs rounded-lg p-4 text-center ${className}`}
        style={{ width: size, height: size }}
      >
        QR Error
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-50 rounded-lg border border-zinc-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block bg-white p-2.5 rounded-lg border border-zinc-200/90 shadow-xs ${className}`}
    >
      <img
        src={dataUrl}
        alt="Admission QR Code"
        width={size}
        height={size}
        className="block rounded-md"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};


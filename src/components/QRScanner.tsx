// ============================================================
// QRScanner Component — Live Camera & Image File Scanner using html5-qrcode
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, AlertCircle, CheckCircle, RefreshCw, X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  language?: 'bn' | 'en';
}

export default function QRScanner({ onScanSuccess, language = 'bn' }: QRScannerProps) {
  const isBn = language === 'bn';
  const [scannerMode, setScannerMode] = useState<'camera' | 'file'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-container';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera scanner
  const startCamera = async () => {
    setErrorMsg(null);
    setScannedResult(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setScannedResult(decodedText);
          stopCamera();
          onScanSuccess(decodedText);
        },
        () => {
          // Frame scan error - ignore to avoid spamming
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setErrorMsg(
        isBn
          ? 'ক্যামেরা চালু করা যায়নি। অনুগ্রহ করে ক্যামেরা পারমিশন পরীক্ষা করুন অথবা কিউআর ছবি আপলোড করুন।'
          : 'Unable to start camera. Please check camera permissions or upload a QR image.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    setCameraActive(false);
  };

  // Clean up scanner on unmount or mode switch
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.warn);
      }
    };
  }, []);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessingFile(true);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      setScannedResult(decodedText);
      onScanSuccess(decodedText);
    } catch (err) {
      console.warn('File QR scan error:', err);
      setErrorMsg(
        isBn
          ? 'ছবিটিতে কোনো বৈধ QR কোড সনাক্ত করা যায়নি। অন্য ছবি নির্বাচন করুন।'
          : 'No valid QR code found in the image. Please try another image.'
      );
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <div className="qr-scanner-box">
      <div className="qr-scanner-toggle-bar">
        <button
          type="button"
          className={`btn ${scannerMode === 'camera' ? 'btn-primary-sm' : 'btn-outline-sm'}`}
          onClick={() => {
            stopCamera();
            setScannerMode('camera');
            setErrorMsg(null);
          }}
        >
          <Camera size={15} />
          <span>{isBn ? 'লাইভ ক্যামেরা' : 'Live Camera'}</span>
        </button>
        <button
          type="button"
          className={`btn ${scannerMode === 'file' ? 'btn-primary-sm' : 'btn-outline-sm'}`}
          onClick={() => {
            stopCamera();
            setScannerMode('file');
            setErrorMsg(null);
          }}
        >
          <Upload size={15} />
          <span>{isBn ? 'QR ছবি আপলোড' : 'Upload QR Image'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="alert alert-danger mt-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {scannedResult && (
        <div className="alert alert-success mt-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <div>
            <strong>{isBn ? 'QR স্ক্যান সফল!' : 'QR Scan Successful!'}</strong>
            <p style={{ margin: '0.25rem 0 0', wordBreak: 'break-all' }}>{scannedResult}</p>
          </div>
        </div>
      )}

      <div className="qr-viewport-wrapper mt-3">
        <div id={qrRegionId} className="qr-video-container" />

        {scannerMode === 'camera' && !cameraActive && !scannedResult && (
          <div className="qr-camera-prompt text-center p-4">
            <Camera size={44} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
            <h4>{isBn ? 'ক্যামেরা স্ক্যানার' : 'Camera QR Scanner'}</h4>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              {isBn
                ? 'দলিল বা প্রাপ্তিস্বীকার পত্রের QR কোড স্ক্যান করতে ক্যামেরা চালু করুন।'
                : 'Click below to start camera and scan QR from document or receipt.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={startCamera}>
              <Camera size={16} />
              <span>{isBn ? 'ক্যামেরা চালু করুন' : 'Start Camera'}</span>
            </button>
          </div>
        )}

        {scannerMode === 'camera' && cameraActive && (
          <div className="text-center mt-2">
            <button type="button" className="btn btn-outline-sm" onClick={stopCamera}>
              <X size={14} />
              <span>{isBn ? 'ক্যামেরা বন্ধ করুন' : 'Stop Camera'}</span>
            </button>
          </div>
        )}

        {scannerMode === 'file' && (
          <div className="qr-file-upload-box text-center p-4">
            <Upload size={44} style={{ color: 'var(--color-primary)', margin: '0 auto 0.75rem' }} />
            <h4>{isBn ? 'QR কোড ছবি আপলোড' : 'Upload QR Image'}</h4>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              {isBn
                ? 'আপনার ডিভাইসে সংরক্ষিত দলিলের QR কোডের ছবি বা স্ক্রিনশট নির্বাচন করুন।'
                : 'Select an image or screenshot of the deed QR code.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingFile}
            >
              <Upload size={16} />
              <span>{isProcessingFile ? (isBn ? 'প্রক্রিয়াকরণ...' : 'Processing...') : (isBn ? 'ছবি নির্বাচন করুন' : 'Choose Image')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileScan}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

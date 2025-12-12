import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanFailure }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Unique ID for the container
    const elementId = "reader";
    
    // Prevent double initialization
    if (scannerRef.current) {
        return;
    }

    try {
        const scanner = new Html5QrcodeScanner(
            elementId,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0 
            },
            false
        );
        
        scanner.render(
            (decodedText) => {
                scanner.clear();
                setIsScanning(false);
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                if (onScanFailure) onScanFailure(errorMessage);
            }
        );

        scannerRef.current = scanner;
    } catch (err) {
        console.error("Failed to init scanner", err);
    }

    return () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
        }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 border-2 border-dashed border-blue-300">
      {isScanning ? (
         <div id="reader" className="w-full max-w-sm"></div>
      ) : (
          <div className="text-green-600 font-bold p-4 flex flex-col items-center">
              <i className="fas fa-check-circle text-4xl mb-2"></i>
              <span>QR Code Scanned</span>
          </div>
      )}
    </div>
  );
};

export default QRScanner;
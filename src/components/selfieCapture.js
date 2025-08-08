import React, { useState, useRef, useEffect } from 'react';
import CompanyLogo from '../images/flowswitch-icon.png';

const SelfieCapture = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Function to start the camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Use front-facing camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Failed to access camera. Please ensure camera permissions are enabled.');
    }
  };

  // Function to stop the camera stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera when modal opens or when retaking, stop when modal closes
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    // Cleanup: Stop camera stream when modal closes or component unmounts
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  // Capture photo from video feed
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    stopCamera(); // Stop stream after capturing
  };

  // Confirm captured photo and pass to parent
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera(); // Ensure stream is stopped
      onClose();
    }
  };

  // Retake photo (clear captured image and restart camera)
  const handleRetake = () => {
    stopCamera(); // Stop any existing stream
    setCapturedImage(null);
    startCamera(); // Restart the camera stream
  };

  // Handle modal close
  const handleClose = () => {
    stopCamera(); // Ensure stream is stopped
    setCapturedImage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-md shadow-lg max-w-sm w-full relative text-center">
        <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
        <h2 className="text-xl font-semibold mb-4">Capture Your Selfie</h2>

        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              className="w-full h-64 bg-black rounded-md mb-4"
            />
            <button
              onClick={capturePhoto}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-2"
            >
              Capture Photo
            </button>
          </>
        ) : (
          <>
            <img
              src={capturedImage}
              alt="Captured Selfie"
              className="w-full max-h-48 object-cover rounded-xl border border-lime-400 mb-4"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleConfirm}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Use Photo
              </button>
              <button
                onClick={handleRetake}
                className="bg-gray-600 text-black border px-4 py-2 rounded hover:bg-gray-700"
              >
                Retake
              </button>
            </div>
          </>
        )}

        <button
          onClick={handleClose}
          className="bg-gray-600 text-black border px-4 py-2 rounded hover:bg-gray-700 mt-4 ml-4"
        >
          Cancel
        </button>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default SelfieCapture;
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useItemFieldsUpdaterMutation, useFileUploaderMutation, useItemRegistrerMutation } from './backend/api/sharedCrud';
import CompanyLogo from './images/flowswitch-icon.png';
import locationPin from './images/flowswitch-homebase-prompt-icon-light.png';
import ProfileImageInput from './components/profilePhotoInput';
import SelfieCapture from './components/selfieCapture';

const UserLocationContext = createContext();

export const UserLocationProvider = ({ children, user }) => {
  const [userDetails, setUserDetails] = useState(user || null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isStep2, setIsStep2] = useState(false);
  const [preview, setPreview] = useState(null);
  const [photoLabel, setPhotoLabel] = useState('Take Photo');
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [activeVerificationSchedule, setActiveVerificationSchedule] = useState({})
  const [verifyLocation, { isLoading: isVerifying, isError, error }] = useItemFieldsUpdaterMutation();
  const [uploadNewImage, {
    data: fileUploadSuccessResponse,
    isLoading: fileUploadProcessing,
    isSuccess: fileUploadSucceeded,
    isError: fileUploadFailed,
    error: fileUploadError,
  }] = useFileUploaderMutation();
  const { Data: { url: locationPhotoUploadUrl, guid } = {} } = fileUploadSuccessResponse || {};

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
            const data = await response.json();
            const locationName = data.display_name || 'Unknown location';
            resolve({
              latitude,
              longitude,
              locationName,
            });
          } catch (error) {
            console.error('Error fetching location name:', error);
            // Fallback to coordinates only if reverse geocoding fails
            resolve({
              latitude,
              longitude,
              locationName: 'Unknown location',
            });
          }
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const isDateTodayOrEarlier = (dateString) => {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate instanceof Date && !isNaN(inputDate) && inputDate <= today;
  };
  const openScheduledPrompt = (verificationSchedule) => {
    if(verificationSchedule?.dueDate){
      setActiveVerificationSchedule(verificationSchedule);
      setShowLocationPrompt(true);
    }
  }
  const closeScheduledPrompt = () => {
    setActiveVerificationSchedule({});
    setShowLocationPrompt(false);
  }
  const verficationsCount = (user?.agentGuid?.verifications || []).length;
  const verficationSchedulesDue = (user?.agentGuid?.verificationSchedules || []).filter(verificationSchedule => (!verificationSchedule.verified && isDateTodayOrEarlier(verificationSchedule.dueDate)));
  const verficationSchedulesCount = verficationSchedulesDue.length;
  const [previousVerficationSchedulesCount, setPreviousVerficationSchedulesCount] = useState(-1)
  const [previousAgentGuid, setPreviousAgentGuid] = useState("xxxx")
  useEffect(() => {
    if(verficationSchedulesCount && (previousVerficationSchedulesCount !== verficationSchedulesCount)){
      if ((user?.agentGuid?._id || user?.agentGuid?.guid) && (previousAgentGuid !== (user?.agentGuid?._id || user?.agentGuid?.guid))) {
        if (!user || hasPrompted || !user?.agentGuid) return;
        const timer = setTimeout(() => {
          if (verficationSchedulesCount) {
            openScheduledPrompt(verficationSchedulesDue[0]);
          }
        }, 1 * 60 * 100);
        setPreviousAgentGuid(user?.agentGuid?.guid || user?.agentGuid?._id)
        return () => clearTimeout(timer);
      }
      setPreviousVerficationSchedulesCount(verficationSchedulesCount)
    }
  }, [user, hasPrompted, verficationSchedulesCount]);

  const triggerHomeVerificationPrompt = () => {
    try {
      if (verficationSchedulesCount) {
        openScheduledPrompt(verficationSchedulesDue[0]);
      }
    }catch(err){
      console.log("Eror while defining triggerHomeVerificationPrompt function ->", err)
    }
  }

  const handleConfirmLocation = async (e) => {
    if (!preview) {
      alert('Please upload or capture a photo before verifying.');
      return;
    }
    try {
      const { guid: verificationScheduleGuid } = activeVerificationSchedule;
      const { latitude, longitude, locationName } = await getUserLocation();
      await verifyLocation({
        entity: 'agent',
        guid: user?.agentGuid?.guid || user?.agentGuid?._id,
        data: {
          latitude,
          longitude,
          locationPhoto: locationPhotoUploadUrl,
          locationVerified: true,
          verificationScheduleGuid,
          locationName,
        },
      }).unwrap();
      setUserDetails((prev) => ({
        ...prev,
        agentGuid: {
          ...prev?.agentGuid,
          locationVerified: true,
          homeLocation: { latitude, longitude, locationName },
        },
      }));
      closeScheduledPrompt();
      setHasPrompted(true);
      setPreview(null);
      setPhotoLabel('Take Photo');
    } catch (err) {
      console.error('Error during location verification:', err);
      alert(`Failed to verify location: ${err?.data?.message || 'Please try again later.'}`);
    }
  };

  const handleCancelLocation = () => {
    closeScheduledPrompt();
    setHasPrompted(true);
    setIsStep2(false);
    setPreview(null);
    setPhotoLabel('Take Photo');
  };

  const handlePhotoChange = ({ file, formData }) => {
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setPhotoLabel('Verify');
      const fData = new FormData();
      fData.set('file', file);
      uploadNewImage({
        entity: "fileupload",
        data: fData,
      });
    } else {
      setPreview(null);
      setPhotoLabel('Take Photo');
    }
  };

  const handleSelfieCapture = (imageData) => {
    setPreview(imageData);
    setPhotoLabel('Verify');
    setIsSelfieModalOpen(false);
    const blob = dataURLtoBlob(imageData);
    const fData = new FormData();
    fData.set('file', blob, 'selfie.jpg');
    uploadNewImage({
      entity: "fileupload",
      data: fData,
    });
  };

  // Convert base64 to Blob for FormData
  const dataURLtoBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <UserLocationContext.Provider value={{ userDetails: user, setUserDetails, isVerifying, isError, error, triggerHomeVerificationPrompt }}>
      {children}
      {showLocationPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-md shadow-lg max-w-sm w-full relative text-center">
            <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
            {!isStep2 ? (
              <>
                <h2 className="text-3xl font-semibold mb-4"> <a href={user?.agentGuid?.merchantGuid?.website || "#"}>{user?.agentGuid?.merchantGuid?.name || "FlowSwitch"}</a> wants to know your home base </h2>
                <p className="text-gray-600 mb-4">Verify your home location</p>
                <div className="w-full items-center text-center my-4">
                  <img src={locationPin} className="w-[100px] h-[100px] mx-auto" style={{ alignSelf: 'center' }} />
                </div>
                <p className="text-gray-600 mb-4 font-bold text-xl">Are you at home now? </p>
                <div className="flex justify-between gap-4">
                  <button
                    onClick={handleCancelLocation}
                    className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border"
                  >
                    No
                  </button>
                  <button
                    onClick={() => setIsStep2(true)}
                    className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${isVerifying ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    Yes
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4 font-bold text-xl">Let's verify it's really you - at your home base </p>
                <p className="text-gray-600 mb-4">
                  Snap a quick selfie in front of your home or landmark.
                  This helps us keep the network secure and trusted
                </p>
                {preview ? (
                  <div>
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-xl border border-lime-400"
                    />
                  </div>
                ) : (
                  <div className="min-h-[120px] w-full my-2">
                    <ProfileImageInput
                      uploadImageFn={({ file, formData }) => handlePhotoChange({ file, formData })}
                      uploadButtonLabel={photoLabel}
                      maxFiles={1}
                      maxFileSize={10}
                      acceptedTypes={['image/*']}
                      uploadImmediately={true}
                      hideSelectFileButton={true}
                      hideUploadIcon={true}
                    />
                  </div>
                )}
                {fileUploadFailed && (
                  <div className="text-red-600 text-sm mb-4">
                    {fileUploadError?.data?.message || 'Failed to upload photo. Please try again.'}
                  </div>
                )}
                {isError && (
                  <div className="text-red-600 text-sm mb-4">
                    {error?.data?.message || 'Failed to verify location. Please try again.'}
                  </div>
                )}
                <SelfieCapture
                  isOpen={isSelfieModalOpen}
                  onClose={() => setIsSelfieModalOpen(false)}
                  onCapture={handleSelfieCapture}
                />
                <div className="flex justify-between gap-4">
                  <button
                    onClick={handleCancelLocation}
                    className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      if (photoLabel === 'Take Photo') {
                        setIsSelfieModalOpen(true);
                      } else {
                        handleConfirmLocation(e);
                      }
                    }}
                    disabled={isVerifying || fileUploadProcessing}
                    className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${(isVerifying || fileUploadProcessing) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isVerifying ? 'Verifying...' : photoLabel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </UserLocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(UserLocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a UserLocationProvider');
  }
  return context;
};
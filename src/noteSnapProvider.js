import React, { createContext, useState, useEffect, useContext } from 'react';
import { useFileUploaderMutation, useItemRegistrerMutation, useItemsListReadrMutation } from './backend/api/sharedCrud';
import CompanyLogo from './images/flowswitch-icon.png';
import Webcam from 'react-webcam';

const NoteSnapContext = createContext();

export const NoteSnapProvider = ({ children, user }) => {
  const [userDetails, setUserDetails] = useState(user || null);
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const [notesToVerify, setNotesToVerify] = useState([]); // Array for logged notes
  const [currentImage, setCurrentImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [agentUssdCode, setAgentUssdCode] = useState(''); // State for agent ID
  const [agentInputError, setAgentInputError] = useState(''); // State for input validation
  const [isAgentValidated, setIsAgentValidated] = useState(false); // Track if agent is validated
  const webcamRef = React.useRef(null);

  const [fetchAgentDetailsByCode, {
    data: agentDetailsResponse,
    isLoading: agentDetailsLoading, 
    isError: agentDetailsLoadingFailed, 
    error: agentDetailsError,
  }] = useItemsListReadrMutation();
  const { Data: arrayWithSingleAgentRecord } = agentDetailsResponse || {};

  const [createNewCashNoteVerification, { 
    isLoading: newVerificationProcessing, 
    isError: logError, 
    error: logErrorDetails 
  }] = useItemRegistrerMutation();

  const [uploadImage, {
    data: uploadResponse,
    isLoading: uploadProcessing,
    isSuccess: uploadSucceeded,
    isError: uploadFailed,
    error: uploadError,
  }] = useFileUploaderMutation();
  const { Data: { url: notePhotoUrl, serialNumber: cashNoteSerialNumber, denomination, currency } = {} } = uploadResponse || {};

  console.log("iiiiiiiiiiiiiii-notePhotoUrl = ", notePhotoUrl);
  console.log("iiiiiiiiiiiiiii-cashNoteSerialNumber = ", cashNoteSerialNumber);
  console.log("iiiiiiiiiiiiiii-denomination = ", denomination);
  console.log("iiiiiiiiiiiiiii-currency = ", currency);
  console.log("iiiiiiiiiiiiiii-uploadResponse = ", uploadResponse);

  // Function to validate agent ID via backend
  const validateAgent = async () => {
    if (!agentUssdCode || agentUssdCode.length < 1) {
      setAgentInputError('Please enter a valid Agent ID.');
      setIsAgentValidated(false);
      return false;
    }
    try {
      const response = await fetchAgentDetailsByCode({
        entity: "agent",
        filters: { ussdCode: agentUssdCode }
      }).unwrap();
      if (response?.Data?.length > 0) {
        setAgentInputError('');
        setIsAgentValidated(true);
        return true;
      } else {
        setAgentInputError('Agent not found. Please check the Agent ID.');
        setIsAgentValidated(false);
        return false;
      }
    } catch (err) {
      setAgentInputError('Error validating Agent ID: ' + (err?.data?.message || 'Please try again.'));
      setIsAgentValidated(false);
      return false;
    }
  };

  // Function to start verification
  const startNoteVerification = async ({ totalAmount, agentUssdCode: providedAgentUssdCode } = {}) => {
    setShowNotePrompt(true);
    setNotesToVerify([]); // Reset for next session
    setAgentInputError('');
    setCurrentImage(null);
    setIsAgentValidated(false);

    if (providedAgentUssdCode && providedAgentUssdCode.length >= 1) {
      setAgentUssdCode(providedAgentUssdCode);
      const isValid = await validateAgent();
      if (isValid) {
        setIsCameraOpen(true); // Skip input prompt if valid
      } else {
        setIsCameraOpen(false); // Show input prompt with error
      }
    } else {
      setAgentUssdCode(''); // Reset agent ID
      setIsCameraOpen(false); // Show input prompt
      if (providedAgentUssdCode) {
        setAgentInputError('Provided Agent ID is invalid.');
      }
    }
  };

  // Function to handle CHECK button click
  const handleCheckAgent = async (e) => {
    e.preventDefault(); // Prevent form submission
    await validateAgent();
  };

  // Function to validate and proceed after entering ussdCode
  const handleProceedWithAgent = async (e) => {
    e.preventDefault(); // Prevent form submission
    if (isAgentValidated) {
      setAgentInputError('');
      setIsCameraOpen(true); // Proceed to camera
      return;
    }
    // If not validated, trigger validation
    const isValid = await validateAgent();
    if (isValid) {
      setIsCameraOpen(true);
    }
  };

  const captureNote = () => {
    const image = webcamRef.current.getScreenshot();
    setCurrentImage(image);
  };

  const handleConfirmNote = async () => {
    if (!currentImage || !agentUssdCode || !isAgentValidated) {
      setAgentInputError('Agent ID not validated or image missing.');
      return;
    }
    try {
      // Upload image
      const blob = dataURLtoBlob(currentImage);
      const formData = new FormData();
      formData.set('file', blob, 'cashnote.jpg');
      formData.append("isCashNote", true);
      await uploadImage({ entity: "fileupload", data: formData }).unwrap();

      // Only proceed if uploadResponse contains required fields
      if (!notePhotoUrl || !cashNoteSerialNumber || !denomination || !currency) {
        throw new Error('Missing required fields from upload response.');
      }

      const retrievedAgentDetails = (arrayWithSingleAgentRecord || [{}])[0];
      console.log("_____________________________________________");
      console.log(">>>>>>>retrievedAgentDetails = ", retrievedAgentDetails);
      console.log(">>>>>>>cashNoteSerialNumber = ", cashNoteSerialNumber);
      console.log(">>>>>>>user?.agentGuid = ", user?.agentGuid);
      console.log(">ooooooooooooocashNoteSerialNumber, noteValue, notePhotoUrl, agentUssdCode = ", cashNoteSerialNumber, denomination, notePhotoUrl, agentUssdCode);

      setNotesToVerify((prev) => [...prev, {
        serialNumber: cashNoteSerialNumber,
        noteValue: denomination,
        notePhoto: notePhotoUrl,
        agentUssdCode,
        currency
      }]);
      setTimeout(() => {}, 500);

      await createNewCashNoteVerification({
        entity: "cashnoteverification",
        data: {
          serialNumber: cashNoteSerialNumber,
          noteValue: denomination,
          notePhoto: notePhotoUrl,
          payerEntity: "Agent",
          payerGuid: retrievedAgentDetails?.guid || "6889415b6ab4cd35fd1a79e5",
          payerId: retrievedAgentDetails?.ussdCode || agentUssdCode,
          verifierEntity: "Agent",
          verifierGuid: user?.agentGuid?.guid || "6889415b6ab4cd35fd1a79e5",
          verifierId: user?.agentGuid?.ussdCode || agentUssdCode,
          currency,
          amount: denomination
        },
      }).unwrap();

      console.log("====22");
      resetCurrentNote();
      console.log("====33");
      console.log("_______|_________________________________");
    } catch (err) {
      console.log("Error while uploading cash note file =", err);
      setAgentInputError(err?.data?.message || 'Failed to process cash note. Please try again.');
    }
  };

  const resetCurrentNote = () => {
    setCurrentImage(null);
    setIsCameraOpen(true); // Ready for next note
  };

  const handleFinishSession = () => {
    setShowNotePrompt(false);
    setIsCameraOpen(false);
    setAgentUssdCode('');
    setAgentInputError('');
    setIsAgentValidated(false);
    setCurrentImage(null);
  };

  const handleCancel = () => {
    setShowNotePrompt(false);
    setIsCameraOpen(false);
    setAgentUssdCode('');
    setNotesToVerify([]);
    setAgentInputError('');
    setIsAgentValidated(false);
    setCurrentImage(null);
  };

  // Convert base64 to Blob
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
    <NoteSnapContext.Provider value={{ startNoteVerification, userDetails, setUserDetails, newVerificationProcessing, logError, logErrorDetails }}>
      {children}
      {showNotePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full relative text-center">
            <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
            <h2 className="text-2xl font-semibold mb-4">Cash Notes Verification</h2>
            {!isCameraOpen ? (
              <>
                <p className="text-gray-600 mb-4">Enter the unique identifier of the agent providing the notes.</p>
                <form onSubmit={handleProceedWithAgent}>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Enter Agent ID (ussdCode)"
                      value={agentUssdCode}
                      onChange={(e) => {
                        setAgentUssdCode(e.target.value);
                        setAgentInputError('');
                        setIsAgentValidated(false); // Reset validation on input change
                      }}
                      className="w-full p-2 border rounded"
                    />
                    <button
                      type="button"
                      onClick={handleCheckAgent}
                      disabled={agentDetailsLoading || agentUssdCode.length < 1}
                      className={`px-4 py-2 border border-blue-700 rounded ${agentDetailsLoading || agentUssdCode.length < 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      {agentDetailsLoading ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                  {agentInputError && <p className="text-red-600 text-sm mb-4">❌ {agentInputError}</p>}
                  {isAgentValidated && <p className="text-green-600 text-sm mb-4">✅ Agent found</p>}
                  <button
                    type="submit"
                    disabled={agentDetailsLoading || !isAgentValidated}
                    className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${agentDetailsLoading || !isAgentValidated ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {agentDetailsLoading ? 'Processing...' : 'Proceed to Snap Notes'}
                  </button>
                </form>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 mt-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">Photograph notes one at a time, showing the full front with serial number visible</p>
                <p className="text-gray-600 mb-4">Paying agent ID: {agentUssdCode}</p>
                {!currentImage ? (
                  <>
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full max-h-48 object-cover rounded-xl" />
                    <button onClick={captureNote} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4">
                      📸 Take {notesToVerify.length ? "another" : ""} picture of note
                    </button>
                    {notesToVerify.length > 0 && (
                      <div className="text-sm mt-2">
                        Last taken: (Serial-number = {notesToVerify[notesToVerify.length - 1].serialNumber}, Denomination = {notesToVerify[notesToVerify.length - 1].noteValue} - {notesToVerify[notesToVerify.length - 1].currency || 'Unknown'})
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <img src={currentImage} alt="Captured note" className="w-full max-h-48 object-cover rounded-xl border border-lime-400" />
                    {uploadProcessing ? <p>Processing...</p> : (
                      <>
                        {uploadSucceeded && (
                          <>
                            <p>Serial Number: {cashNoteSerialNumber || 'Not detected'}</p>
                            <p>Denomination: {denomination || 'Not detected'} {currency || ''}</p>
                          </>
                        )}
                        <button
                          onClick={handleConfirmNote}
                          disabled={uploadProcessing || newVerificationProcessing}
                          className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4 ${ (uploadProcessing || newVerificationProcessing) ? 'opacity-60 cursor-not-allowed' : '' }`}
                        >
                          {uploadProcessing || newVerificationProcessing ? 'Please wait...' : 'Verify cash note'}
                        </button>
                        <button onClick={resetCurrentNote} className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 mt-2 border ml-3">
                          Retake
                        </button>
                      </>
                    )}
                  </div>
                )}

                {uploadFailed && (
                  <div className="text-red-600 text-sm mb-4">
                    {uploadError?.data?.message || 'Failed to read serial number. Please try again.'}
                  </div>
                )}
                {logError && (
                  <div className="text-red-600 text-sm mb-4">
                    {logErrorDetails?.data?.message || 'Failed to record cash note. Please try again.'}
                  </div>
                )}

                <div className="flex justify-between gap-4 mt-4">
                  <button onClick={handleCancel} className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border">
                    Cancel
                  </button>
                  {notesToVerify.length > 0 && (
                    <button onClick={handleFinishSession} className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-green-700">
                      Finish Session
                    </button>
                  )}
                </div>
                <div className="w-full text-right p-2"> {notesToVerify.length} cash notes captured </div>
              </>
            )}
          </div>
        </div>
      )}
    </NoteSnapContext.Provider>
  );
};

export const useNoteSnap = () => {
  const context = useContext(NoteSnapContext);
  if (!context) {
    throw new Error('useNoteSnap must be used within a NoteSnapProvider');
  }
  return context;
};
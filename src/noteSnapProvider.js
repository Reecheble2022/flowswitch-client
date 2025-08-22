import React, { createContext, useState, useEffect, useContext } from 'react';
import Tesseract from 'tesseract.js';
import { useFileUploaderMutation, useItemRegistrerMutation, useItemsListReadrMutation } from './backend/api/sharedCrud';
import CompanyLogo from './images/flowswitch-icon.png';
import Webcam from 'react-webcam';

const NoteSnapContext = createContext();

export const NoteSnapProvider = ({ children, user }) => {
  const [userDetails, setUserDetails] = useState(user || null);
  const [showNotePrompt, setShowNotePrompt] = useState(false);
  const [notesToVerify, setNotesToVerify] = useState([]); // Array for logged notes
  const [currentImage, setCurrentImage] = useState(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
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
    isLoading: isLogging, 
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

  // Function to validate agent ID via backend
  const validateAgent = async () => {
    if (!agentUssdCode || agentUssdCode.length < 1) {
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
    setSerialNumber('');
    setNoteValue('');
    setIsAgentValidated(false);

    if (providedAgentUssdCode && providedAgentUssdCode.length >= 6) {
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
        setAgentInputError('Provided Agent ID is invalid (minimum 6 characters).');
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
    processOCR(image);
  };

  const processOCR = async (image) => {
    setOcrLoading(true);
    try {
      const { data: { text } } = await Tesseract.recognize(image, 'eng');
      // Extract serial: Customize regex for your currency (e.g., alphanumeric 10-12 chars)
      const serialMatch = text.match(/[A-Z0-9]{10,12}/);
      setSerialNumber(serialMatch ? serialMatch[0] : 'Not detected');
      
      // Extract value: Customize for denominations (e.g., '100', '50 USD')
      const valueMatch = text.match(/\b(100|50|20|10|5|1)\b/);
      setNoteValue(valueMatch ? `${valueMatch[0]} USD` : 'Not detected'); // Adjust currency
    } catch (error) {
      console.error('OCR error:', error);
    }
    setOcrLoading(false);
  };

  const handleConfirmNote = async () => {
    if (!currentImage || !agentUssdCode || !isAgentValidated) return;
    try {
      const blob = dataURLtoBlob(currentImage);
      const formData = new FormData();
      formData.set('file', blob, 'cashnote.jpg');
      formData.append("isCashNote", true);
      await uploadImage({ entity: "fileupload", data: formData }).unwrap();
      const retrievedAgentDetails = (arrayWithSingleAgentRecord || [{}])[0];
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
          verifierId: user?.agentGuid?.ussdCode  || agentUssdCode,
          currency,
          amount: noteValue
        },
      }).unwrap();
      setNotesToVerify((prev) => [...prev, { serialNumber: cashNoteSerialNumber, noteValue, notePhoto: notePhotoUrl, agentUssdCode }]);
      resetCurrentNote();
    } catch(err) {
      console.log("Error while uploading cash note file =", err)
    }
  };

  const resetCurrentNote = () => {
    setCurrentImage(null);
    setSerialNumber('');
    setNoteValue('');
    setIsCameraOpen(true); // Ready for next note
  };

  const handleFinishSession = () => {
    setShowNotePrompt(false);
    setIsCameraOpen(false);
    setAgentUssdCode('');
    setAgentInputError('');
    setIsAgentValidated(false);
  };

  const handleCancel = () => {
    setShowNotePrompt(false);
    setIsCameraOpen(false);
    setAgentUssdCode('');
    setNotesToVerify([]);
    setAgentInputError('');
    setIsAgentValidated(false);
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
    <NoteSnapContext.Provider value={{ startNoteVerification, userDetails, setUserDetails, isLogging, logError, logErrorDetails }}>
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
                      📸 Take {notesToVerify.length?"another":""} picture of note
                    </button>
                    <div className="text-sm">
                      Last taken: (Serial-number = {cashNoteSerialNumber}, Denomination = {denomination} - {currency})
                    </div>
                  </>
                ) : (
                  <div>
                    <img src={currentImage} alt="Captured note" className="w-full max-h-48 object-cover rounded-xl border border-lime-400" />
                    {ocrLoading ? <p>Processing...</p> : (
                      <>
                        <button onClick={handleConfirmNote} disabled={isLogging || uploadProcessing} className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-4 ${ (isLogging || uploadProcessing) ? 'opacity-60 cursor-not-allowed' : '' }`}>
                          {isLogging ? 'Logging...' : 'Confirm & Log'}
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
                    {uploadError?.data?.message || 'Failed read serial number. Please try again'}
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
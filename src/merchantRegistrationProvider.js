import React, { createContext, useState, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import MerchantRegistrationForm from './components/merchantRegistrationForm';
import CompanyLogo from './images/flowswitch-icon.png';

const MerchantRegistrationContext = createContext();

export const MerchantRegistrationProvider = ({ children }) => {
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);

  // Function to trigger the merchant registration form prompt
  const triggerMerchantRegistrationPrompt = useCallback(() => {
    try {
      setShowRegistrationPrompt(true);
    } catch (err) {
      console.error("Error while triggering merchant registration prompt:", err);
    }
  }, []);

  // Function to close the registration form
  const handleCloseRegistration = useCallback(() => {
    setShowRegistrationPrompt(false);
  }, []);

  return (
    <MerchantRegistrationContext.Provider value={{ triggerMerchantRegistrationPrompt }}>
      {children}
      {showRegistrationPrompt &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-md shadow-lg w-full md:max-w-[80%] lg:max-w-[60%] 3xl:max-w-[40%] max-h-[90vh] overflow-y-auto relative bg-gradient-to-t from-lime-200">
              <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
              <h2 className="text-3xl font-semibold mb-4 text-center">Merchant Signup</h2>
              <p className="text-gray-600 mb-4 text-center">
                Complete the form to signup as a merchant
              </p>
              <MerchantRegistrationForm />
              <div className="flex justify-between mt-4">
                <button
                  onClick={handleCloseRegistration}
                  className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseRegistration}
                  className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border bg-white"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </MerchantRegistrationContext.Provider>
  );
};

// Hook to access the trigger function
export const useMerchantRegistration = () => {
  const context = useContext(MerchantRegistrationContext);
  if (!context) {
    throw new Error('useMerchantRegistration must be used within a MerchantRegistrationProvider');
  }
  return context;
};
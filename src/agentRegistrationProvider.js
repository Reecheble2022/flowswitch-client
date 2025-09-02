import React, { createContext, useState, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AgentsRegistrationForm from './components/agentsRegistrationForm';
import AgentsRegistrationUpload from './components/agentsRegistrationUpload';
import CompanyLogo from './images/flowswitch-icon.png';

const AgentRegistrationContext = createContext();

export const AgentRegistrationProvider = ({ children }) => {
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);

  // Function to trigger the registration form prompt
  const triggerAgentRegistrationPrompt = useCallback(() => {
    try {
      setShowRegistrationPrompt(true);
    } catch (err) {
      console.error("Error while triggering agent registration prompt:", err);
    }
  }, []);

  // Function to close the registration form
  const handleCloseRegistration = useCallback(() => {
    setShowRegistrationPrompt(false);
  }, []);

  return (
    <AgentRegistrationContext.Provider value={{ triggerAgentRegistrationPrompt }}>
      {children}
      {showRegistrationPrompt &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-md shadow-lg max-w-[80%] w-full max-h-[90vh] overflow-y-auto relative bg-gradient-to-t from-lime-200">
              <img src={CompanyLogo} alt="Company Logo" className="mx-auto mb-4 h-16" />
              <h2 className="text-3xl font-semibold mb-4 text-center">Agent Registration</h2>
              <p className="text-gray-600 mb-4 text-center">
                Complete the form to create a single agent or upload multiple agents in an Excel file
              </p>
              <div className="flex flex-col lg:flex-row gap-4">
                <AgentsRegistrationForm formLabel={"Single agent details"} />
                <AgentsRegistrationUpload />
              </div>
              
              <div className="flex justify-start mt-4">
                <button
                  onClick={handleCloseRegistration}
                  className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </AgentRegistrationContext.Provider>
  );
};

// Hook to access the trigger function
export const useAgentRegistration = () => {
  const context = useContext(AgentRegistrationContext);
  if (!context) {
    throw new Error('useAgentRegistration must be used within an AgentRegistrationProvider');
  }
  return context;
};
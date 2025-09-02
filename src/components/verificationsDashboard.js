import React, { useState, useEffect } from 'react';
import { useItemsListReadrMutation } from '../backend/api/sharedCrud';
import { useNoteSnap } from '../noteSnapProvider';
import { useUserLocation } from "../userLocationProvider";
import { useAgentRegistration } from "../agentRegistrationProvider";
import { useAgentVerificationScheduling } from "../agentVerificationScheduleProvider";

// Heroicons SVG components
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TicketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const VerificationsDashboard = ({ className }) => {
  const { startNoteVerification } = useNoteSnap();
  const { triggerHomeVerificationPrompt } = useUserLocation();
  const { triggerAgentRegistrationPrompt } = useAgentRegistration();
  const { scheduleAgentVerificationForOneAgent, scheduleAgentVerificationForAllAgents } = useAgentVerificationScheduling();
  const [activeTab, setActiveTab] = useState('location');
  const [selectedAgentToPrompt, setSelectedAgentToPrompt] = useState({});
  
  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {};
  const [fetchCashNotes, { data: cashNotesResponse, isLoading: cashNotesLoading }] = useItemsListReadrMutation();
  const { Data: cashNotesVerificationsList, totalPages, currentPage } = cashNotesResponse || {};

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        fetchAgents({ entity: 'agent', filters: { page: 1 } });
      } catch (err) {
        console.log("Error =", err);
      }
    };
    fetchRecords();
  }, [fetchAgents]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        fetchCashNotes({ entity: 'cashnoteverification', filters: { page: 1 } });
      } catch (err) {
        console.log("Error =", err);
      }
    };
    fetchRecords();
  }, [fetchCashNotes]);

  return (
    <div className={`p-6 bg-gray-100 bg-white rounded-lg ${className}`}>
      <h1 className="text-3xl font-bold mb-6 text-center"> Dashboard </h1>
      
      {/* Horizontal Tabs Bar */}
      <div className="flex flex-col lg:flex-row gap-2 justify-between mb-4 space-x-2 pr-4">
        <div className="flex justify-start space-x-2">
          <button
            onClick={() => setActiveTab('location')}
            className={`px-2 py-1 font-semibold transition-colors ${
              activeTab === 'location' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            Verifiable agents
          </button>
          <button
            onClick={() => setActiveTab('cash')}
            className={`px-2 py-1 font-semibold transition-colors ${
              activeTab === 'cash' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            Verified cash notes
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-2 py-1 font-semibold transition-colors ${
              activeTab === 'tools' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            Tools
          </button>
        </div>
        <div className="flex justify-end space-x-4">
          <div className="space-x-2">
            <span
              className="py-1 cursor-pointer"
              onClick={() => {
                if (activeTab === 'cash') {
                  startNoteVerification({});
                } else {
                  triggerAgentRegistrationPrompt();
                }
              }}
            > 
              {activeTab === 'cash' ? "TakeCash" : "Add verifiable agent(s)"}
            </span>
            <button 
              onClick={() => {
                if (activeTab === 'cash') {
                  startNoteVerification({});
                } else {
                  triggerAgentRegistrationPrompt();
                }
              }}
              className={`px-3 py-1 font-semibold transition-colors bg-white text-blue-600 border border-blue-600 rounded-sm`}
            >
              +
            </button>
          </div>
          <button 
            onClick={() => {
              if (selectedAgentToPrompt.lastName) {
                scheduleAgentVerificationForOneAgent(selectedAgentToPrompt);
              } else {
                scheduleAgentVerificationForAllAgents({ merchantGuid: "urury487784893984" });
              }
            }}
            className={`px-3 py-1 font-semibold transition-colors bg-white text-blue-600 border border-blue-600 rounded-sm`}
          >
            Verify {selectedAgentToPrompt.lastName || "all"}
          </button>
        </div>
      </div>

      <div className="max-h-screen max-w-full overflow-scroll">
        {/* Location Verifications Table */}
        {activeTab === 'location' && (
          <div className="bg-white shadow-md">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Agent Name</th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">GPS Coordinates</th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b"> Dates of verification </th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Number of prompts</th>
                </tr>
              </thead>
              <tbody>
                {agentsLoading ? (
                  <tr>
                    <td colSpan="4" className="px-1 py-2 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : (agentList || []).filter((a) => a.verifications?.length > 0).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-1 py-2 text-center text-gray-500">
                      No location verifications found.
                    </td>
                  </tr>
                ) : (
                  (agentList || [])
                    .filter((a) => a.verifications?.length > 0)
                    .map((agent) => (
                      <tr key={agent?.guid || agent?._id} className="hover:bg-gray-50"
                        onClick={() => {
                          setSelectedAgentToPrompt(agent);
                        }}
                      >
                        <td className="px-1 py-2 border-b text-sm text-gray-900">
                          {agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.ussdCode || 'Unknown'}
                        </td>
                        <td className="px-1 py-2 border-b text-sm text-gray-900">
                          {agent.verifications?.map((v) => `[${v.latitude.toFixed(6)} : ${v.longitude.toFixed(6)}]`).join(', ') || 'N/A'}
                        </td>
                        <td className="px-1 py-2 border-b text-sm text-gray-900">
                          {agent.verifications
                            ?.map((v) => new Date(v.date || v.createdAt).toLocaleDateString())
                            .join(', ') || 'N/A'}
                        </td>
                        <td className="px-1 py-2 border-b text-sm text-gray-900">{agent.verifications?.length || 0}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Cash Note Verifications Table */}
        {activeTab === 'cash' && (
          <div className="bg-white shadow-md rounded-lg">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Note Photo</th>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Serial Number</th>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Amount</th>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Currency</th>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Payer ID</th>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Verifier ID</th>
                  <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Verification Date</th>
                </tr>
              </thead>
              <tbody>
                {cashNotesLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : (cashNotesVerificationsList || []).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No cash note verifications found.
                    </td>
                  </tr>
                ) : (
                  (cashNotesVerificationsList || []).map((note) => (
                    <tr key={note.guid || note._id || note.serialNumber} 
                      className="hover:bg-gray-50"
                      onClick={() => {
                        //TODO: implement
                      }}
                    >
                      <td className="px-1 py-4 border-b text-sm text-gray-900">
                        {note.notePhoto ? (
                          <img
                            src={note.notePhoto}
                            alt="Cash Note"
                            className="w-20 h-12 object-cover rounded border border-gray-300"
                          />
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-1 py-4 border-b text-sm text-gray-900">{note.serialNumber || 'N/A'}</td>
                      <td className="px-1 py-4 border-b text-sm text-gray-900">{note.amount || note.noteValue || 'N/A'}</td>
                      <td className="px-1 py-4 border-b text-sm text-gray-900">{note.currency || 'N/A'}</td>
                      <td className="px-1 py-4 border-b text-sm text-gray-900">{note.payerId || note.payerGuid || 'N/A'}</td>
                      <td className="px-1 py-4 border-b text-sm text-gray-900">{note.verifierId || note.verifierGuid || 'N/A'}</td>
                      <td className="px-1 py-4 border-b text-sm text-gray-900">
                        {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tools list */}
        {activeTab === 'tools' && (
          <div className="flex flex-col lg:flex-row gap-4 bg-white shadow-md rounded-lg py-20 px-4">
            <div 
              className="border bg-lime-200 shadow-md rounded-lg min-h-[100px] min-w-[100px] p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-lime-300"
              onClick={() => {
                if (selectedAgentToPrompt.lastName) {
                  scheduleAgentVerificationForOneAgent(selectedAgentToPrompt);
                } else {
                  scheduleAgentVerificationForAllAgents({ merchantGuid: "urury487784893984" });
                }
              }}
            >
              <HomeIcon />
              <span className="mt-2 text-gray-700 font-semibold">Homebase Verification</span>
            </div>
            <div 
              className="border bg-lime-200 shadow-md rounded-lg min-h-[100px] min-w-[100px] p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-lime-300"
              onClick={() => startNoteVerification({})}
            >
              <CameraIcon />
              <span className="mt-2 text-gray-700 font-semibold">TakeCash</span>
            </div>
            <div 
              className="border bg-lime-200 shadow-md rounded-lg min-h-[100px] min-w-[100px] p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-lime-300"
              onClick={() => {
                // TODO: Implement voucher redemption logic
              }}
            >
              <TicketIcon />
              <span className="mt-2 text-gray-700 font-semibold">Redeem Voucher</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationsDashboard;
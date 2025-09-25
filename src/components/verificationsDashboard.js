import React, { useState, useEffect, useRef } from 'react';
import { useItemsListReadrMutation, useItemDetailsViewrMutation,  } from '../backend/api/sharedCrud';
import { useNoteSnap } from '../noteSnapProvider';
import { useAgentRegistration } from "../agentRegistrationProvider";
import { useAgentVerificationScheduling } from "../agentVerificationScheduleProvider";
import AgentLocationAnalysis from './agentLocationAnalysis';

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
  const { triggerAgentRegistrationPrompt } = useAgentRegistration();
  const { scheduleAgentVerificationForOneAgent, scheduleAgentVerificationForAllAgents } = useAgentVerificationScheduling();
  const [activeTab, setActiveTab] = useState('location');
  const [selectedAgentToPrompt, setSelectedAgentToPrompt] = useState({});
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentDetails, setAgentDetails] = useState({});
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const textareaRef = useRef(null);

  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {};
  const [fetchCashNotes, { data: cashNotesResponse, isLoading: cashNotesLoading }] = useItemsListReadrMutation();
  const { Data: cashNotesVerificationsList } = cashNotesResponse || {};
  const [fetchAgentDetails, { data: singleAgentResponse, isLoading: agentDetailsLoading }] = useItemDetailsViewrMutation();
  const [fetchAIFollowUpOnAgent, { data: aiFollowUpResponse }] = useItemDetailsViewrMutation();

  useEffect(() => {
    fetchAgents({ entity: 'agent', filters: { page: 1 } }).catch(err => console.log("Error =", err));
  }, [fetchAgents]);

  useEffect(() => {
    fetchCashNotes({ entity: 'cashnoteverification', filters: { page: 1 } }).catch(err => console.log("Error =", err));
  }, [fetchCashNotes]);

  useEffect(() => {
    if (singleAgentResponse?.Data) {
      setAgentDetails(prev => ({
        ...prev,
        [singleAgentResponse.Data.guid || singleAgentResponse.Data._id]: singleAgentResponse.Data
      }));
    }
  }, [singleAgentResponse]);

  useEffect(() => {
    if (aiFollowUpResponse?.Data) {
      const agentId = aiFollowUpResponse.Data.guid || aiFollowUpResponse.Data._id;
      setAgentDetails(prev => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          locationAnalysis: {
            ...prev[agentId]?.locationAnalysis,
            aiReport: `${prev[agentId]?.locationAnalysis?.aiReport || ''}\n\n### Follow-Up Response\n${aiFollowUpResponse.Data.locationAnalysis?.aiReport || ''}`
          }
        }
      }));
      setIsSubmittingQuestion(false);
      setFollowUpQuestion('');
    }
  }, [aiFollowUpResponse]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
    }
  }, [followUpQuestion]);

  const handleAgentClick = (agent) => {
    const agentId = agent.guid || agent._id;
    setSelectedAgentToPrompt(agent);
    setExpandedAgentId(expandedAgentId === agentId ? null : agentId);
    if (expandedAgentId !== agentId) {
      fetchAgentDetails({ entity: "agent", guid: agentId });
    }
  };

  const handleSubmitQuestion = (agentId) => {
    if (!followUpQuestion.trim()) return;
    setIsSubmittingQuestion(true);
    const lastQuestion = agentDetails[agentId]?.locationAnalysis?.question
    const lastAIReport = agentDetails[agentId]?.locationAnalysis?.aiReport || '';
    fetchAIFollowUpOnAgent({
      entity: "agent",
      guid: agentId,
      httpMethod: "POST",
      data: {
        lastQuestion, 
        lastResponse: lastAIReport,
        followUpQuestion, 
      }
    });
  };

  return (
    <div className={`p-6 bg-gray-100 rounded-lg ${className}`}>
      <h1 className="text-3xl font-bold mb-6 text-center">Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex flex-col lg:flex-row gap-2 justify-between mb-4 space-x-2 pr-4">
        <div className="flex space-x-2">
          {['location', 'cash', 'tools'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 font-semibold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'}`}
            >
              {tab === 'location' ? 'Verifiable agents' : tab === 'cash' ? 'Verified cash notes' : 'Tools'}
            </button>
          ))}
        </div>
        <div className="flex space-x-4">
          <div className="space-x-2">
            <span
              className="py-1 cursor-pointer"
              onClick={() => activeTab === 'cash' ? startNoteVerification({}) : triggerAgentRegistrationPrompt()}
            >
              {activeTab === 'cash' ? "TakeCash" : "Add verifiable agent(s)"}
            </span>
            <button
              onClick={() => activeTab === 'cash' ? startNoteVerification({}) : triggerAgentRegistrationPrompt()}
              className="px-3 py-1 font-semibold bg-white text-blue-600 border border-blue-600 rounded-sm"
            >
              +
            </button>
          </div>
          <button
            onClick={() => selectedAgentToPrompt.lastName ? scheduleAgentVerificationForOneAgent(selectedAgentToPrompt) : scheduleAgentVerificationForAllAgents({ merchantGuid: "urury487784893984" })}
            className="px-3 py-1 font-semibold bg-white text-blue-600 border border-blue-600 rounded-sm"
          >
            Verify {selectedAgentToPrompt.lastName || "all"}
          </button>
        </div>
      </div>

      <div className="max-h-screen overflow-scroll">
        {/* Location Verifications Table */}
        {activeTab === 'location' && (
          <div className="bg-white shadow-md">
            <table className="min-w-full border-collapse">
              <thead className="bg-zinc-200">
                <tr>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Agent Name</th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">GPS Coordinates</th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Dates of verification</th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Verified prompts</th>
                  <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Pending prompts</th>
                </tr>
              </thead>
              <tbody>
                {agentsLoading ? (
                  <tr><td colSpan="5" className="px-1 py-2 text-center text-gray-500">Loading...</td></tr>
                ) : !agentList?.length ? (
                  <tr><td colSpan="5" className="px-1 py-2 text-center text-gray-500">No location verifications found.</td></tr>
                ) : (
                  agentList.map(agent => (
                    <React.Fragment key={agent.guid || agent._id}>
                      <tr
                        className={`${selectedAgentToPrompt?.guid === agent?.guid ? "bg-lime-50" : ""} cursor-pointer hover:bg-gray-100`}
                        onClick={() => handleAgentClick(agent)}
                      >
                        <td className="px-1 py-2 border-t text-sm text-gray-900">
                          {agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.ussdCode || 'Unknown'}
                        </td>
                        <td className="px-1 py-2 border-t text-sm text-gray-900">
                          {(agent.verifications || []).map(v => `[${v.latitude.toFixed(6)} : ${v.longitude.toFixed(6)}] - ${v.locationName || ""}`).join(', ') || '__'}
                        </td>
                        <td className="px-1 py-2 border-t text-sm text-gray-900">
                          {(agent.verifications || []).map(v => new Date(v.date || v.createdAt).toLocaleDateString()).join(', ') || '__'}
                        </td>
                        <td className="px-1 py-2 border-t text-sm text-gray-900">{(agent.verifications || []).length || 0}</td>
                        <td className="px-1 py-2 border-t text-sm text-gray-900">{(agent.verificationSchedules || []).filter(vsch => !vsch.verified).length || 0}</td>
                      </tr>
                      {expandedAgentId === (agent.guid || agent._id) && (
                        <tr>
                          <td colSpan="5" className="px-1 py-2 bg-gray-50">
                            {agentDetailsLoading && (
                              <div className="flex justify-center items-center py-4">
                                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                            {!agentDetailsLoading && agentDetails[agent.guid || agent._id] && (
                              <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                  Agent Homebase Analysis ({agentDetails[agent.guid || agent._id].firstName} {agentDetails[agent.guid || agent._id].lastName})
                                </h3>
                                <div className="text-sm text-gray-600">
                                  {followUpQuestion && 
                                    <p className="mb-4">
                                      <strong>Question:</strong> {agentDetails[agent.guid || agent._id].locationAnalysis?.followUpQuestion || 'N/A'}
                                    </p>
                                  }
                                  <AgentLocationAnalysis aiReport={agentDetails[agent.guid || agent._id].locationAnalysis?.aiReport} />
                                  <div className="mt-4">
                                    <div className="flex items-baseline space-x-2 bg-zinc-100 p-4 rounded-md">
                                      <textarea
                                        id="followUpQuestion"
                                        ref={textareaRef}
                                        value={followUpQuestion}
                                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                                        placeholder="Ask a Follow-Up Question"
                                        className="flex-1 p-2 rounded-md focus:outline-none resize-y min-h-[60px] bg-zinc-100"
                                        disabled={isSubmittingQuestion}
                                        onInput={(e) => {
                                          e.target.style.height = 'auto';
                                          e.target.style.height = `${e.target.scrollHeight}px`;
                                        }}
                                      />
                                      <button
                                        onClick={() => handleSubmitQuestion(agent.guid || agent._id)}
                                        className={`px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2 align-middle`}
                                        disabled={isSubmittingQuestion || !followUpQuestion.trim()}
                                      >
                                        {isSubmittingQuestion ? (
                                          <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>processing...</span>
                                          </>
                                        ) : (
                                          <span>Send</span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                  <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : !cashNotesVerificationsList?.length ? (
                  <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">No cash note verifications found.</td></tr>
                ) : (
                  cashNotesVerificationsList.map(note => (
                    <tr key={note.guid || note._id || note.serialNumber} className="hover:bg-gray-50">
                      <td className="px-1 py-4 border-b text-sm text-gray-900">
                        {note.notePhoto ? (
                          <img src={note.notePhoto} alt="Cash Note" className="w-20 h-12 object-cover rounded border border-gray-300" />
                        ) : 'N/A'}
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
              onClick={() => selectedAgentToPrompt.lastName ? scheduleAgentVerificationForOneAgent(selectedAgentToPrompt) : scheduleAgentVerificationForAllAgents({ merchantGuid: "urury487784893984" })}
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
              onClick={() => { /* TODO: Implement voucher redemption logic */ }}
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
import React, { useState, useEffect } from 'react';
import { useItemsListReadrMutation } from '../backend/api/sharedCrud';
import { useNoteSnap } from '../noteSnapProvider';
import { useUserLocation } from "../userLocationProvider"

const VerificationsDashboard = () => {
  const { startNoteVerification } = useNoteSnap();
  const { triggerHomeVerificationPrompt } = useUserLocation()
  const [activeTab, setActiveTab] = useState('location');
  
  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {}
  const [fetchCashNotes, { data: cashNotesResponse, isLoading: cashNotesLoading }] = useItemsListReadrMutation();
  const { Data: cashNotesVerificationsList, totalPages, currentPage } = cashNotesResponse || {}

  useEffect(() => {
    const fetchRecords = async () => {
      try{
        fetchAgents({ entity: 'agent', filters: { page:1 } });
      }catch(err){
        console.log("Error =", err)
      }
    }
    fetchRecords();
  }, [fetchAgents]);

  useEffect(() => {
    const fetchRecords = async () => {
      try{
        fetchCashNotes({ entity: 'cashnoteverification', filters: { page: 1 } });
      }catch(err){
        console.log("Error =", err)
      }
    }
    fetchRecords();
  }, [fetchCashNotes]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen w-full bg-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center"> Verifications </h1>
      
      {/* Horizontal Tabs Bar */}
      <div className="flex justify-between mb-4 space-x-2">
        <div className="flex justify-start space-x-2">
          <button
            onClick={() => setActiveTab('location')}
            className={`px-2 py-1 font-semibold transition-colors ${
              activeTab === 'location' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            Home base Verification
          </button>
          <button
            onClick={() => setActiveTab('cash')}
            className={`px-2 py-1 font-semibold transition-colors ${
              activeTab === 'cash' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600'
            }`}
          >
            Cash Notes Verification
          </button>
        </div>
        <button onClick={() => {
          if(activeTab === 'cash'){
            startNoteVerification({})
          }else{
            triggerHomeVerificationPrompt()
          }
        }}
          className={`px-3 py-1 font-semibold transition-colors bg-white text-blue-600 border border-blue-600 rounded-sm`}
        >
          +
        </button>
      </div>

      <div className="max-h-screen max-w-full max-w-full overflow-scroll">
      {/* Location Verifications Table */}
      {activeTab === 'location' && (
        <div className="bg-white shadow-md">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Agent Name</th>
                <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">GPS Coordinates</th>
                <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b"> Dates of verification </th>
                <th className="px-1 py-2 text-left text-sm font-semibold text-gray-700 border-b">Number of Verifications</th>
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
                    <tr key={agent.guid || agent._id} className="hover:bg-gray-50">
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
                <th className="px-1 py-3 text-left text-sm font-semibold text-gray-700 border-b">Serial Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">Currency</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">Payer ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">Verifier ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">Note Photo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b">Verification Date</th>
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
                  <tr key={note.guid || note._id || note.serialNumber} className="hover:bg-gray-50">
                    <td className="px-1 py-4 border-b text-sm text-gray-900">{note.serialNumber || 'N/A'}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{note.amount || note.noteValue || 'N/A'}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{note.currency || 'N/A'}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{note.payerId || note.payerGuid || 'N/A'}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">{note.verifierId || note.verifierGuid || 'N/A'}</td>
                    <td className="px-6 py-4 border-b text-sm text-gray-900">
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
                    <td className="px-6 py-4 border-b text-sm text-gray-900">
                      {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
};

export default VerificationsDashboard;
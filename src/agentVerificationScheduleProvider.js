import React, { createContext, useState, useContext } from 'react';
import { useItemRegistrerMutation } from './backend/api/sharedCrud';

const AgentVerificationSchedulingContext = createContext();

export const AgentVerificationSchedulingProvider = ({ children, merchant }) => {
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [target, setTarget] = useState(null); // {type: 'one', agent} or {type: 'all'}
  const [isOneOff, setIsOneOff] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [intervalDays, setIntervalDays] = useState(1);
  const [promptCount, setPromptCount] = useState(1);
  const [registerSchedule, { isLoading: isRegistering, isError, error }] = useItemRegistrerMutation();

  const resetForm = () => {
    setIsOneOff(true);
    setStartDate('');
    setIntervalDays(1);
    setPromptCount(1);
  };

  const addDays = (dateStr, days) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleSchedule = async () => {
    if (!target) return;

    const schedules = [];
    const baseDate = isOneOff ? new Date().toISOString().split('T')[0] : startDate;

    for (let i = 0; i < promptCount; i++) {
      const dueDate = i === 0 ? baseDate : addDays(baseDate, intervalDays * i);
      const agents = target.type === 'all' 
        ? [] 
        : [{
            agentGuid: target.agent?.guid || target.agent?._id,
            agentCode: target.agent?.ussdCode || 'Unknown'
          }];
      schedules.push({ dueDate, agents });
    }

    const data = schedules.length === 1 ? schedules[0] : schedules;

    try {
      await registerSchedule({ entity: 'agentverificationschedule', data }).unwrap();
      setShowSchedulingModal(false);
      resetForm();
      setTarget(null);
    } catch (err) {
      console.error('Error scheduling verification:', err);
    }
  };

  const handleCancel = () => {
    setShowSchedulingModal(false);
    resetForm();
    setTarget(null);
  };

  const scheduleAgentVerificationForOneAgent = (agent) => {
    setTarget({ type: 'one', agent });
    setShowSchedulingModal(true);
  };

  const scheduleAgentVerificationForAllAgents = () => {
    setTarget({ type: 'all' });
    setShowSchedulingModal(true);
  };

  const getAgentName = (agent) => {
    return agent?.name || `${agent?.firstName || ''} ${agent?.lastName || ''}`.trim() || agent?.ussdCode || 'Unknown';
  };

  return (
    <AgentVerificationSchedulingContext.Provider
      value={{ scheduleAgentVerificationForOneAgent, scheduleAgentVerificationForAllAgents }}
    >
      {children}
      {showSchedulingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-md shadow-lg w-[96%] md:max-w-[80%] lg:max-w-[50%] relative text-center">
            <h2 className="text-3xl font-semibold mb-4"> Homebase verification for {target.type === 'one' ? `Agent: ${getAgentName(target.agent)}` : 'all agents'} </h2>
            
            <div className="flex justify-between mb-4">
              <button
                onClick={() => setIsOneOff(true)}
                className={`px-4 py-2 rounded ${isOneOff ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Prompt now
              </button>
              <button
                onClick={() => setIsOneOff(false)}
                className={`px-4 py-2 rounded ${!isOneOff ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Schedule prompts
              </button>
            </div>
            {isOneOff ? (
              <p className="text-gray-600 mb-4"> Prompt {target.type === 'one' ? ` ${getAgentName(target.agent)}` : 'all agents'} immediately </p>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8 p-4 w-full border mx-auto">
                <div>
                  <label className="block text-gray-700 mb-1">Prompt start date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-50 p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1"> Frequency (Every {intervalDays} day{(intervalDays > 1) && "s"}) </label>
                  <input
                    type="number"
                    min="1"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(parseInt(e.target.value) || 1)}
                    className="w-15 p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Number of Prompts</label>
                  <input
                    type="number"
                    min="1"
                    value={promptCount}
                    onChange={(e) => setPromptCount(parseInt(e.target.value) || 1)}
                    className="w-15 p-2 border rounded"
                    required
                  />
                </div>
              </div>
            )}
            {isError && (
              <div className="text-red-600 text-sm mb-4">
                {error?.data?.message || 'Failed to schedule. Please try again.'}
              </div>
            )}
            <div className="flex justify-between gap-4 mt-6">
              <button
                onClick={handleCancel}
                className="bg-gray-600 text-black px-4 py-2 rounded hover:bg-gray-700 border"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={isRegistering || (!isOneOff && (!startDate || intervalDays < 1 || promptCount < 1))}
                className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${isRegistering ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isRegistering ? 'Scheduling...' : isOneOff ? "Send prompt" : "Send schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AgentVerificationSchedulingContext.Provider>
  );
};

export const useAgentVerificationScheduling = () => {
  const context = useContext(AgentVerificationSchedulingContext);
  if (!context) {
    throw new Error('useAgentVerificationScheduling must be used within an AgentVerificationSchedulingProvider');
  }
  return context;
};
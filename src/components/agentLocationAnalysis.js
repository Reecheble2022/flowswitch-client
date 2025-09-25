import React from 'react';
import ReactMarkdown from 'react-markdown';

const AgentLocationAnalysis = ({ aiReport }) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
      <h4 className="text-base font-semibold text-gray-800 mb-3">AI Report</h4>
      <div className="prose prose-sm max-w-none text-gray-700">
        <ReactMarkdown
          components={{
            h3: ({ children }) => <h3 className="text-base font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
            p: ({ children }) => <p className="mb-2">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
            li: ({ children }) => <li className="ml-4">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
          }}
        >
          {aiReport || 'No analysis available.'}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default AgentLocationAnalysis;
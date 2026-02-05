import React, { useState } from 'react';
import { Citation } from '../types';

interface CitationBlockProps {
  citations: Citation[];
}

const CitationBlock: React.FC<CitationBlockProps> = ({ citations }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-1 text-xs text-blue-600 font-medium hover:underline focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3 w-3 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {citations.length} Reference{citations.length > 1 ? 's' : ''}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {citations.map((cite, idx) => (
            <div key={idx} className="bg-blue-50 p-2 rounded border border-blue-100 text-xs text-gray-700">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-blue-800 truncate pr-2">
                   📄 {cite.document_name}
                </span>
                <span className="bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">
                  {Math.round(cite.score * 100)}% Match
                </span>
              </div>
              <p className="line-clamp-3 text-gray-600 font-mono text-[10px]">
                {cite.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitationBlock;
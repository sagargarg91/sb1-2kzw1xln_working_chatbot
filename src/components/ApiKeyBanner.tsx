import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface ApiKeyBannerProps {
  onSetupClick: () => void;
}

const ApiKeyBanner: React.FC<ApiKeyBannerProps> = ({ onSetupClick }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Check className="h-5 w-5 text-blue-500" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700 font-medium">
            Configure AI Model Settings
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Choose between ChatGPT and DeepSeek models for your AI assistant. Configure API keys and model settings in the project settings.
          </p>
          <div className="mt-2">
            <button
              onClick={onSetupClick}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Configure AI Model
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 flex-shrink-0 text-blue-500 hover:text-blue-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ApiKeyBanner;
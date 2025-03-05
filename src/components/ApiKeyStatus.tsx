import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ApiKeyStatusProps {
  apiKey: string;
  provider: string;
}

const ApiKeyStatus: React.FC<ApiKeyStatusProps> = ({ apiKey, provider }) => {
  const isConfigured = apiKey && apiKey.length > 0;
  
  return (
    <div className={`flex items-center p-3 rounded-md ${isConfigured ? 'bg-green-50' : 'bg-yellow-50'}`}>
      {isConfigured ? (
        <>
          <Check className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-green-800">
              {provider} API key configured
            </p>
            <p className="text-xs text-green-600">
              API key: •••••••••••{apiKey.slice(-4)}
            </p>
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {provider} API key not configured
            </p>
            <p className="text-xs text-yellow-600">
              Add your API key to enable {provider} features
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ApiKeyStatus;
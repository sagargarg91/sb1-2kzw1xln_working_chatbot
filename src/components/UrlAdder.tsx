import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface UrlAdderProps {
  projectId: string;
  onUrlAdded: () => void;
}

interface ProcessingStatus {
  url: string;
  status: string;
  error?: string;
}

const UrlAdder: React.FC<UrlAdderProps> = ({ projectId, onUrlAdded }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatuses, setProcessingStatuses] = useState<ProcessingStatus[]>([]);

  const checkProcessingStatus = async (knowledgeSourceId: string) => {
    try {
      const { data: queueData, error: queueError } = await supabase
        .from('processing_queue')
        .select('status, error')
        .eq('knowledge_source_id', knowledgeSourceId)
        .single();

      if (queueError) throw queueError;

      const { data: sourceData } = await supabase
        .from('knowledge_sources')
        .select('name, status, error_message')
        .eq('id', knowledgeSourceId)
        .single();

      if (sourceData) {
        setProcessingStatuses(prev => [
          ...prev,
          {
            url: sourceData.name,
            status: sourceData.status,
            error: sourceData.error_message || queueData?.error
          }
        ]);
      }
    } catch (error) {
      console.error('Error checking processing status:', error);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleAddUrl = async () => {
    if (!url.trim()) return;
    
    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          project_id: projectId,
          name: url,
          type: 'website',
          url: url,
          status: 'processing' // In a real app, this would be set to 'pending' and processed asynchronously
        });
        
      if (error) throw error;
      
      // Clear input after successful addition
      setUrl('');
      
      // Start checking processing status
      if (data && data[0]) checkProcessingStatus(data[0].id);
      
      onUrlAdded();
    } catch (error) {
      console.error('Error adding URL:', error);
      setError('Failed to add URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Processed';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          onClick={handleAddUrl}
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
      
      {processingStatuses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Status</h4>
          <div className="space-y-2">
            {processingStatuses.map((status, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {status.url}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                    {getStatusText(status.status)}
                  </span>
                  {status.error && (
                    <div className="ml-2 group relative">
                      <AlertCircle className="h-4 w-4 text-red-400 cursor-help" />
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 w-48 p-2 bg-red-50 text-xs text-red-700 rounded shadow-lg">
                        {status.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlAdder;
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

interface CustomKnowledgeProps {
  projectId: string;
  onSave: () => void;
}

const CustomKnowledge: React.FC<CustomKnowledgeProps> = ({ projectId, onSave }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('knowledge_sources')
        .insert({
          project_id: projectId,
          name: 'Custom Knowledge',
          type: 'custom',
          content: content,
          status: 'processed' // Custom knowledge is immediately available
        });
        
      if (error) throw error;
      
      // Clear input after successful save
      setContent('');
      onSave();
    } catch (error) {
      console.error('Error saving custom knowledge:', error);
      setError('Failed to save custom knowledge. Please try again.');
    } finally {
      setLoading(false);
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
      
      <textarea
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="Enter key information, FAQs, or specific knowledge your AI should have"
      />
      
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || !content.trim()}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {loading ? 'Saving...' : 'Save Knowledge'}
        </button>
      </div>
    </div>
  );
};

export default CustomKnowledge;
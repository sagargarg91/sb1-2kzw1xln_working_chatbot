import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Database, Trash2 } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import UrlAdder from '../components/UrlAdder';
import CustomKnowledge from '../components/CustomKnowledge';

interface KnowledgeSource {
  id: string;
  project_id: string;
  name: string;
  type: 'document' | 'website' | 'custom';
  status: 'pending' | 'processing' | 'processed' | 'error';
  created_at: string;
}

const KnowledgeBase: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKnowledgeSources();
  }, [id]);

  const fetchKnowledgeSources = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setKnowledgeSources(data || []);
    } catch (error) {
      console.error('Error fetching knowledge sources:', error);
      setError('Failed to load knowledge sources');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this knowledge source?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', sourceId);
        
      if (error) throw error;
      
      // Update the list
      setKnowledgeSources(knowledgeSources.filter(source => source.id !== sourceId));
    } catch (error) {
      console.error('Error deleting knowledge source:', error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Knowledge Base</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Train Your AI</h2>
        <p className="text-gray-600 mb-4">
          Upload documents or provide URLs to train your AI assistant with domain-specific knowledge.
        </p>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">Upload Documents</h3>
            <FileUploader 
              projectId={id || ''} 
              onUploadComplete={fetchKnowledgeSources} 
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">Add Website URLs</h3>
            <p className="text-sm text-gray-500 mb-2">
              Enter URLs to websites containing relevant information for your AI assistant.
            </p>
            <UrlAdder 
              projectId={id || ''} 
              onUrlAdded={fetchKnowledgeSources} 
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">Custom Knowledge</h3>
            <p className="text-sm text-gray-500 mb-2">
              Add specific information or FAQs that your AI should know about.
            </p>
            <CustomKnowledge 
              projectId={id || ''} 
              onSave={fetchKnowledgeSources} 
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Knowledge Sources</h2>
        <p className="text-gray-600 mb-4">
          Manage your AI's knowledge sources and training data.
        </p>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Source
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {knowledgeSources.length > 0 ? (
                  knowledgeSources.map((source) => (
                    <tr key={source.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                        {source.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          source.status === 'processed' ? 'bg-green-100 text-green-800' :
                          source.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          source.status === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDeleteSource(source.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-sm text-gray-500 text-center">
                      No knowledge sources added yet. Add some sources to train your AI.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Trash2, MessageSquare, Settings, Code, Database, Bot } from 'lucide-react';

const NewProject: React.FC = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user settings to check for default model
      const { data: userSettingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id);
      
      // Use the default model from user settings or fallback to deepseek-coder
      let defaultModel = 'deepseek-coder'; // Set DeepSeek as default
      
      if (userSettingsData && userSettingsData.length > 0) {
        // Sort by created_at in descending order to get the most recent
        const sortedSettings = [...userSettingsData].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        if (sortedSettings[0].settings?.defaultModel) {
          defaultModel = sortedSettings[0].settings.defaultModel;
        }
      }

      // Create project in the database
      const { data, error } = await supabase
        .from('projects')
        .insert([
          { 
            name: projectName, 
            user_id: user.id,
            settings: {
              model: defaultModel,
              temperature: 0.7,
              max_tokens: 1000
            }
          }
        ])
        .select();

      if (error) throw error;
      
      // Navigate to the project detail page
      if (data && data[0]) {
        navigate(`/project/${data[0].id}`);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-16">
      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Project Setup</h2>
          </div>
          <nav className="mt-4">
            <a
              href="#"
              onClick={() => setActiveTab('general')}
              className={`flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === 'general' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="mr-3 h-5 w-5" />
              General Settings
            </a>
            <a
              href="#"
              onClick={() => setActiveTab('ai-agent')}
              className={`flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === 'ai-agent' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Bot className="mr-3 h-5 w-5" />
              AI Chat Agent
            </a>
            <a
              href="#"
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === 'knowledge' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Database className="mr-3 h-5 w-5" />
              Knowledge Base
            </a>
            <a
              href="#"
              onClick={() => setActiveTab('integration')}
              className={`flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === 'integration' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Code className="mr-3 h-5 w-5" />
              Integration
            </a>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'general' && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h1>
              
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleCreateProject}>
                <div className="mb-6">
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="My AI Assistant"
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewProject;
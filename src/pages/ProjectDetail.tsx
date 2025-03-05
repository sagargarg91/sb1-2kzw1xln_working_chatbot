import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Bot, MessageSquare, Database, Code, Settings, Save, ArrowLeft, Trash2 } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import UrlAdder from '../components/UrlAdder';
import CustomKnowledge from '../components/CustomKnowledge';
import { getAIResponse } from '../lib/aiService';

// Data Interfaces
interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  settings?: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
}

interface KnowledgeSource {
  id: string;
  project_id: string;
  name: string;
  type: 'document' | 'website' | 'custom';
  status: 'pending' | 'processing' | 'processed' | 'error';
  created_at: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState(project?.name || '');
  const [agentDescription, setAgentDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant that provides accurate and concise information.');
  const [model, setModel] = useState('chatgpt');
  const [temperature, setTemperature] = useState(project?.settings?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(project?.settings?.max_tokens || 1000);
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [showChatPreview, setShowChatPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([
    {role: 'assistant', content: 'Hello! I\'m your AI assistant. How can I help you today?'}
  ]);
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('ai-agent');
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);

  // Project settings state
  const [projectSettings, setProjectSettings] = useState({
    name: '',
    description: '',
    apiKey: '',
    apiEndpoint: '',
    webhookUrl: '',
    allowedDomains: ['*']
  });

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        
        if (fetchError) throw fetchError;
        
        if (data) {
          setProject(data);
          setAgentName(data.name);
          
          // Load model from settings, ensuring we use the correct default
          const savedModel = data.settings?.model?.toLowerCase() || 'deepseek-coder';
          console.log('Loading saved model:', savedModel);
          setModel(savedModel);
          
          setTemperature(data.settings?.temperature || 0.7);
          setMaxTokens(data.settings?.max_tokens || 1000);
          setSystemPrompt(data.settings?.system_prompt || systemPrompt);
          setAgentDescription(data.settings?.description || '');
          setPrimaryColor(data.settings?.primary_color || '#4f46e5');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'knowledge' && project) {
      fetchKnowledgeSources();
    }
  }, [activeTab, project]);

  const fetchKnowledgeSources = async () => {
    if (!project) return;
    
    try {
      setLoadingKnowledge(true);
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeSources(data || []);
    } catch (error) {
      console.error('Error fetching knowledge sources:', error);
    } finally {
      setLoadingKnowledge(false);
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
      await fetchKnowledgeSources();
    } catch (error) {
      console.error('Error deleting knowledge source:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error || 'Project not found'}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const userMessage = message.trim();
    setMessage('');

    // Create settings object with current model selection
    const currentSettings = {
      model: model,
      temperature: temperature,
      max_tokens: maxTokens
    };

    console.log('Sending message with settings:', currentSettings);

    // Add user message to chat
    setChatHistory(prev => [...prev, {role: 'user', content: userMessage}]);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    try {
      const aiResponse = await getAIResponse(messages, currentSettings);
      
      if (aiResponse) {
        setChatHistory(prev => [...prev, {role: 'assistant', content: aiResponse}]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!project?.id) {
        throw new Error('Project ID not found');
      }
      
      // Create settings object
      const newSettings = {
        model: model,
        temperature: temperature,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
        description: agentDescription,
        primary_color: primaryColor
      };
      
      console.log('Saving project settings:', {
        ...newSettings,
        id: project.id
      });
      
      const { error } = await supabase
        .from('projects')
        .update({
          name: agentName,
          settings: newSettings
        })
        .eq('id', project.id);

      if (error) throw error;
      
      // Update local project state with new settings
      setProject(prev => prev ? {
        ...prev,
        name: agentName,
        settings: newSettings
      } : null);

      // Show success message
      alert('Settings saved successfully!');
      
      // Reset chat history after model change
      setChatHistory([{
        role: 'assistant',
        content: `Hello! I'm your AI assistant powered by ${model === 'deepseek-coder' ? 'DeepSeek Coder' : 'ChatGPT'}. How can I help you today?`
      }]);
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className={`text-lg font-medium text-gray-900 ${!sidebarOpen && 'hidden'}`}>Project Setup</h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className={`h-5 w-5 transform transition-transform ${!sidebarOpen && 'rotate-180'}`} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <button
            onClick={() => setActiveTab('ai-agent')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md mb-1 ${
              activeTab === 'ai-agent' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bot className="h-5 w-5 mr-3" />
            {sidebarOpen && <span>AI Chat Agent</span>}
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md mb-1 ${
              activeTab === 'knowledge' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Database className="h-5 w-5 mr-3" />
            {sidebarOpen && <span>Knowledge Base</span>}
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md mb-1 ${
              activeTab === 'integration' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Code className="h-5 w-5 mr-3" />
            {sidebarOpen && <span>Integration</span>}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md mb-1 ${
              activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-5 w-5 mr-3" />
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {/* AI Agent Tab */}
        {activeTab === 'ai-agent' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">AI Chat Agent Configuration</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowChatPreview(!showChatPreview)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {showChatPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className={`grid ${showChatPreview ? 'grid-cols-2 gap-8' : 'grid-cols-1'}`}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-1">
                        Agent Name
                      </label>
                      <input
                        type="text"
                        id="agentName"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="agentDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="agentDescription"
                        value={agentDescription}
                        onChange={(e) => setAgentDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Briefly describe what your AI assistant does"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                        System Prompt
                      </label>
                      <textarea
                        id="systemPrompt"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Instructions that define how your AI assistant behaves"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                        AI Model
                      </label>
                      <div className="space-y-2">
                      <select
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="chatgpt">ChatGPT (GPT-4o)</option>
                        <option value="deepseek-coder">DeepSeek Coder</option>
                      </select>
                      <p className="text-sm text-gray-500">
                        {model === 'chatgpt' ? (
                          'ChatGPT (GPT-4o) is optimized for general conversation and natural language understanding.'
                        ) : (
                          'DeepSeek Coder is specialized for technical and programming-related conversations.'
                        )}
                      </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                          Temperature: {temperature}
                        </label>
                        <input
                          type="range"
                          id="temperature"
                          min="0"
                          max="1"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Precise</span>
                          <span>Creative</span>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-1">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          id="maxTokens"
                          value={maxTokens}
                          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <div className="flex items-center">
                        <input
                          type="color"
                          id="primaryColor"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="h-10 w-10 border border-gray-300 rounded-md mr-2"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {showChatPreview && (
                <div className="border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-white">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                    <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-medium text-gray-900">{agentName || 'AI Assistant'}</h3>
                  </div>
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((msg, index) => (
                      <div key={index} className={`flex items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 bg-indigo-500 rounded-full h-8 w-8 flex items-center justify-center text-white font-medium">
                            AI
                          </div>
                        )}
                        <div className={`${msg.role === 'user' ? 'mr-3 bg-indigo-100' : 'ml-3 bg-gray-100'} rounded-lg p-3 max-w-[80%]`}>
                          <p className="text-sm text-gray-800">{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0 bg-gray-500 rounded-full h-8 w-8 flex items-center justify-center text-white font-medium">
                            U
                          </div>
                        )}
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">AI is typing...</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !message.trim()}
                        className="px-4 py-2 border border-transparent rounded-r-md text-sm font-medium text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {isSending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
            </div>
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>
                <FileUploader projectId={project.id} onUploadComplete={fetchKnowledgeSources} />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Add Website URLs</h2>
                <UrlAdder projectId={project.id} onUrlAdded={fetchKnowledgeSources} />
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Custom Knowledge</h2>
                <CustomKnowledge projectId={project.id} onSave={fetchKnowledgeSources} />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Knowledge Sources</h2>
                {loadingKnowledge ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : knowledgeSources.length > 0 ? (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
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
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Added
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {knowledgeSources.map((source) => (
                          <tr key={source.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                              <div className="flex items-center">
                                {source.type === 'document' && (
                                  <Database className="h-5 w-5 text-gray-400 mr-2" />
                                )}
                                {source.type === 'website' && (
                                  <Code className="h-5 w-5 text-gray-400 mr-2" />
                                )}
                                {source.type === 'custom' && (
                                  <MessageSquare className="h-5 w-5 text-gray-400 mr-2" />
                                )}
                                <span className="font-medium text-gray-900">{source.name}</span>
                              </div>
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
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(source.created_at).toLocaleDateString()}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No knowledge sources added yet. Add documents, websites, or custom knowledge above.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Integration Tab */}
        {activeTab === 'integration' && (
          <>
            <div className="space-y-8">
              {/* Quick Start Guide */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Start Guide</h2>
                <div className="prose prose-sm max-w-none">
                  <ol className="list-decimal pl-4 space-y-4">
                    <li>
                      <strong>Add the Script Tag</strong>
                      <p className="text-gray-600">Add this script to your website's HTML, just before the closing <code>&lt;/body&gt;</code> tag:</p>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                          {`<script 
  src="https://ekaksh.ai/widget.js" 
  data-project-id="${project.id}"
  data-theme="light"
  data-position="bottom-right"
></script>`}
                        </pre>
                        <button
                          onClick={() => navigator.clipboard.writeText(
                            `<script src="https://ekaksh.ai/widget.js" data-project-id="${project.id}" data-theme="light" data-position="bottom-right"></script>`
                          )}
                          className="mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Copy Code
                        </button>
                      </div>
                    </li>
                    <li>
                      <strong>Test the Integration</strong>
                      <p className="text-gray-600">
                        After adding the script, refresh your website. You should see the chat widget in the bottom-right corner.
                      </p>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Framework Integration */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Framework Integration</h2>
                <div className="space-y-6">
                  {/* React */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">React</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {`// ChatWidget.jsx
import { useEffect } from 'react';

export default function ChatWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://ekaksh.ai/widget.js';
    script.dataset.projectId = '${project.id}';
    script.dataset.theme = 'light';
    script.dataset.position = 'bottom-right';
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`}
                      </pre>
                      <button
                        onClick={() => {/* Copy code */}}
                        className="mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>

                  {/* Next.js */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Next.js</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">
                        {`// app/components/ChatWidget.tsx
import Script from 'next/script'

export default function ChatWidget() {
  return (
    <Script
      src="https://ekaksh.ai/widget.js"
      data-project-id="${project.id}"
      data-theme="light"
      data-position="bottom-right"
      strategy="lazyOnload"
    />
  )
}`}
                      </pre>
                      <button
                        onClick={() => {/* Copy code */}}
                        className="mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget Customization */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Widget Customization</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Theme
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Message
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="How can I help you today?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Chat with AI"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auto-open Delay (ms)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0 (disabled)"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Set to 0 to disable auto-opening
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Configuration */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Advanced Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom CSS URL
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://your-domain.com/chat-widget.css"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Optional: Link to a CSS file for custom styling
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allowed Origins
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="*.example.com, app.company.com"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Comma-separated list of domains where the widget is allowed to load
                    </p>
                  </div>
                </div>
              </div>

              {/* Events & Callbacks */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Events & Callbacks</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">{`// Listen for chat events
window.addEventListener('ekakshChat', function(event) {
  switch(event.detail.type) {
    case 'open':
      console.log('Chat widget opened');
      break;
    case 'close':
      console.log('Chat widget closed');
      break;
    case 'message:sent':
      console.log('User message:', event.detail.message);
      break;
    case 'message:received':
      console.log('AI response:', event.detail.message);
      break;
  }
});`}</pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `window.addEventListener('ekakshChat', function(event) {
  switch(event.detail.type) {
    case 'open':
      console.log('Chat widget opened');
      break;
    case 'close':
      console.log('Chat widget closed');
      break;
    case 'message:sent':
      console.log('User message:', event.detail.message);
      break;
    case 'message:received':
      console.log('AI response:', event.detail.message);
      break;
  }
});`
                      );
                    }}
                    className="mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Copy Code
                  </button>
                </div>
              </div>

              {/* API Reference */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">JavaScript API Reference</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Methods</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-sm text-gray-700 overflow-x-auto whitespace-pre-wrap">{`// Open chat widget
window.ekakshChat.open();

// Close chat widget
window.ekakshChat.close();

// Toggle chat widget
window.ekakshChat.toggle();

// Send message programmatically
window.ekakshChat.sendMessage('Hello!');

// Update widget settings
window.ekakshChat.updateSettings({
  theme: 'dark',
  position: 'bottom-left'
});`}</pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `// Open chat widget
window.ekakshChat.open();

// Close chat widget
window.ekakshChat.close();

// Toggle chat widget
window.ekakshChat.toggle();

// Send message programmatically
window.ekakshChat.sendMessage('Hello!');

// Update widget settings
window.ekakshChat.updateSettings({
  theme: 'dark',
  position: 'bottom-left'
});`
                          );
                        }}
                        className="mt-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <>
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Project Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectSettings.name}
                      onChange={(e) => setProjectSettings({ ...projectSettings, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={project.id}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(project.id)}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-red-500">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-md">
                    <h3 className="text-sm font-medium text-red-800">Delete Project</h3>
                    <p className="mt-1 text-sm text-red-600">
                      Once you delete a project, there is no going back. Please be certain.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                            // Handle project deletion
                          }
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail
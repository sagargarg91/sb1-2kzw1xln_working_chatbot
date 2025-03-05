import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Save, Key, Shield, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import ApiKeyStatus from '../components/ApiKeyStatus';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showCustomModelFields, setShowCustomModelFields] = useState(false);
  const [settings, setSettings] = useState({
    customModelApiKey: '',
    customModelEndpoint: '',
    customModelName: '',
    customModelProvider: 'other',
    defaultModel: 'deepseek-coder',
    databaseType: 'supabase'
  });
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        navigate('/login');
        return;
      }
      
      setUser(data.user);
      await fetchSettings(data.user.id);
      setLoading(false);
    };

    getUser();
  }, [navigate]);

  const fetchSettings = async (userId: string) => {
    try {
      // First, check if there are multiple settings records for this user
      const { data: allSettings, error: countError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId);

      if (countError) {
        console.error('Error fetching settings:', countError);
        return;
      }

      // If multiple records exist, use the most recent one
      if (allSettings && allSettings.length > 0) {
        // Sort by created_at in descending order to get the most recent
        const sortedSettings = [...allSettings].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const mostRecent = sortedSettings[0];
        
        setSettings({
          ...settings,
          ...mostRecent.settings
        });
        
        // Clean up duplicate records if there are any
        if (allSettings.length > 1) {
          // Keep the most recent record and delete the rest
          for (let i = 1; i < sortedSettings.length; i++) {
            await supabase
              .from('user_settings')
              .delete()
              .eq('id', sortedSettings[i].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      // First, check if a record already exists
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id);
      
      let result;
      
      if (existingSettings && existingSettings.length > 0) {
        // Update the existing record
        result = await supabase
          .from('user_settings')
          .update({
            settings: {
              customModelApiKey: settings.customModelApiKey,
              defaultModel: settings.defaultModel
            }
          })
          .eq('id', existingSettings[0].id);
      } else {
        // Insert a new record
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            settings: {
              customModelApiKey: settings.customModelApiKey,
              defaultModel: settings.defaultModel
            }
          });
      }

      if (result.error) throw result.error;
      
      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Error saving settings. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Account Settings
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="-ml-1 mr-2 h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {saveMessage.type === 'success' ? (
                  <Save className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${saveMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {saveMessage.text}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              API Keys
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configure your AI provider API keys for enhanced functionality
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="modelProvider" className="block text-sm font-medium text-gray-700 mb-2">
                  AI Model Provider
                </label>
                <select
                  id="modelProvider"
                  value={settings.customModelProvider}
                  onChange={(e) => {
                    setSettings({...settings, customModelProvider: e.target.value});
                    setShowCustomModelFields(e.target.value === 'other');
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="deepseek">DeepSeek (Default)</option>
                  <option value="other">Custom Model</option>
                </select>
              </div>

              {showCustomModelFields && (
                <>
                  <div>
                    <label htmlFor="customModelName" className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Model Name
                    </label>
                    <input
                      type="text"
                      id="customModelName"
                      value={settings.customModelName}
                      onChange={(e) => setSettings({...settings, customModelName: e.target.value})}
                      placeholder="e.g., llama-2-70b"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="customModelEndpoint" className="block text-sm font-medium text-gray-700 mb-2">
                      Model Endpoint URL
                    </label>
                    <input
                      type="text"
                      id="customModelEndpoint"
                      value={settings.customModelEndpoint}
                      onChange={(e) => setSettings({...settings, customModelEndpoint: e.target.value})}
                      placeholder="https://api.your-model-provider.com/v1/chat/completions"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="customModelApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      id="customModelApiKey"
                      value={settings.customModelApiKey}
                      onChange={(e) => setSettings({...settings, customModelApiKey: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Your custom model must support the OpenAI-compatible chat completions API format.
                          The endpoint should accept requests with messages in the format:
                          <code className="block mt-2 p-2 bg-yellow-100 rounded">
                            {"{"}<br/>
                            &nbsp;&nbsp;"messages": [{"{"} "role": "user", "content": "..." {"}"}],<br/>
                            &nbsp;&nbsp;"temperature": 0.7,<br/>
                            &nbsp;&nbsp;"max_tokens": 1000<br/>
                            {"}"}
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        This platform uses DeepSeek's AI models with a secure platform API key. No additional configuration is needed.
                      </p>
                    </div>
                  </div>
                </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      All AI features are powered by DeepSeek's advanced models using a secure platform-wide API key.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Database Configuration
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configure your database connection settings
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="databaseType" className="block text-sm font-medium text-gray-700">
                  Database Type
                </label>
                <select
                  id="databaseType"
                  value={settings.databaseType || 'supabase'}
                  onChange={(e) => setSettings({...settings, databaseType: e.target.value})}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="supabase">Supabase (Default)</option>
                  <option value="rest">Custom REST API</option>
                </select>
              </div>

              {settings.databaseType === 'rest' && (
                <>
                  <div>
                    <label htmlFor="apiBaseUrl" className="block text-sm font-medium text-gray-700">
                      API Base URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="apiBaseUrl"
                        value={settings.apiBaseUrl || ''}
                        onChange={(e) => setSettings({...settings, apiBaseUrl: e.target.value})}
                        placeholder="https://api.example.com"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      The base URL of your REST API (e.g., https://api.example.com)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        id="apiKey"
                        value={settings.apiKey || ''}
                        onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Your API authentication key
                    </p>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          Your REST API must implement the required endpoints for orders, products, and refunds.
                          See the documentation for detailed API requirements.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Default Settings
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Configure default settings for new projects
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="defaultModel" className="block text-sm font-medium text-gray-700">
                  Default AI Model
                </label>
                <select
                  id="defaultModel"
                  value={settings.defaultModel}
                  onChange={(e) => setSettings({
                    ...settings, 
                    defaultModel: e.target.value,
                    customModelProvider: e.target.value === 'custom' ? 'other' : 'deepseek',
                    showCustomModelFields: e.target.value === 'custom'
                  })}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                 <option value="chatgpt">ChatGPT (GPT-4o)</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Select which model to use as default for new projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
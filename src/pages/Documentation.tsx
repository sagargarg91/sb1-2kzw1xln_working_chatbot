import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, MessageSquare, Database, Key, Copy, ExternalLink, ChevronRight, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quickstart');
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const embedCode = `<script src="https://ekaksh.ai/widget.js" data-project-id="YOUR_PROJECT_ID"></script>`;
  
  const apiCode = `const response = await fetch('https://api.ekaksh.ai/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is the status of my order #12345?' }
    ],
    project_id: 'YOUR_PROJECT_ID'
  })
});

const data = await response.json();
console.log(data.response);`;

  const webhookCode = `{
  "event": "message.received",
  "project_id": "proj_123",
  "message": {
    "id": "msg_456",
    "content": "What is the status of my order #12345?",
    "timestamp": "2025-03-02T19:15:08Z"
  },
  "user": {
    "id": "user_789",
    "metadata": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Documentation</h1>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('quickstart')}
                className={`${
                  activeTab === 'quickstart'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Quick Start
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`${
                  activeTab === 'database'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Database Integration
              </button>
              <button
                onClick={() => setActiveTab('widget')}
                className={`${
                  activeTab === 'widget'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Chat Widget
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`${
                  activeTab === 'api'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                REST API
              </button>
              <button
                onClick={() => setActiveTab('webhooks')}
                className={`${
                  activeTab === 'webhooks'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Webhooks
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="py-8">
            {activeTab === 'quickstart' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
                  <p className="text-gray-600 mb-4">
                    Welcome! This guide will help you integrate our AI chatbot into your website. We'll walk you through each step, whether you're a developer or not.
                  </p>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Before you begin: You'll need an ekaksh.ai account and a project created in your dashboard.
                          If you haven't done this yet, <Link to="/signup" className="font-medium underline">sign up here</Link>.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <ol className="space-y-4">
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3 mt-0.5">1</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Set Up Your Project</h3>
                        <div className="text-gray-600 mt-1">
                          <p>After logging in to your dashboard:</p>
                          <div className="mt-2">
                            <ol className="ml-4 list-decimal space-y-2 text-sm">
                              <li>Click the "New Project" button</li>
                              <li>Give your project a name (e.g., "Customer Support Bot")</li>
                              <li>Choose the AI model (DeepSeek Coder is recommended for technical support)</li>
                              <li>Configure basic settings like response style and language</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3 mt-0.5">2</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Train Your AI Assistant</h3>
                        <div className="text-gray-600 mt-1">
                          <p>Make your AI assistant knowledgeable about your business:</p>
                          <div className="mt-2">
                            <ol className="ml-4 list-decimal space-y-2 text-sm">
                              <li>Go to the "Knowledge Base" tab in your project</li>
                              <li>
                                <div>
                                  Upload documents (PDF, DOCX, TXT) containing your:
                                  <ul className="mt-1 ml-4 list-disc">
                                    <li>Product documentation</li>
                                    <li>FAQs and help articles</li>
                                    <li>Common procedures and policies</li>
                                    <li>Technical specifications</li>
                                  </ul>
                                </div>
                              </li>
                              <li>Add website URLs if you have online documentation</li>
                              <li>Enter custom knowledge for specific scenarios</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3 mt-0.5">3</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Add to Your Website</h3>
                        <div className="text-gray-600 mt-1">
                          <p>Choose the integration method that works best for you:</p>
                          <div className="mt-4 grid grid-cols-1 gap-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <MessageSquare className="h-5 w-5 text-indigo-600 mr-2" />
                                <h4 className="font-medium">No-Code Option: Chat Widget</h4>
                              </div>
                              <p className="text-sm">
                                Perfect for most websites. Just copy-paste a single line of code.
                                No technical knowledge required.
                              </p>
                              <div className="mt-2 flex items-center text-sm text-indigo-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Recommended for non-developers
                              </div>
                            </div>
                            
                            <div className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <Code className="h-5 w-5 text-indigo-600 mr-2" />
                                <h4 className="font-medium">Developer Option: REST API</h4>
                              </div>
                              <p className="text-sm">
                                For custom integrations and advanced use cases.
                                Requires programming knowledge.
                              </p>
                              <div className="mt-2 flex items-center text-sm text-indigo-600">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Best for custom applications
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mr-3 mt-0.5">4</span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Test and Customize</h3>
                        <div className="text-gray-600 mt-1">
                          <p>Fine-tune your chatbot's behavior:</p>
                          <div className="mt-2">
                            <ol className="ml-4 list-decimal space-y-2 text-sm">
                              <li>Use the test chat in your dashboard to verify responses</li>
                              <li>Adjust the AI's personality and tone</li>
                              <li>Customize the chat widget's appearance</li>
                              <li>Set up automated greetings and suggestions</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <MessageSquare className="h-6 w-6 text-indigo-600 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Chat Widget</h4>
                            <p className="text-sm text-gray-500">Embed our pre-built chat widget</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('widget')}
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Learn more
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Code className="h-6 w-6 text-indigo-600 mr-3" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">REST API</h4>
                            <p className="text-sm text-gray-500">Build a custom integration</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('api')}
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Learn more
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Integration</h2>
                  <p className="text-gray-600 mb-4">
                    Connect your AI assistant to your existing database through our flexible adapter system.
                  </p>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Database Integration</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Understanding Database Options</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          ekaksh.ai offers two ways to integrate with your existing database:
                        </p>
                        <div className="mt-4 space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">1. Supabase Integration (Recommended)</h5>
                            <p className="mt-1 text-sm text-gray-500">
                              Built-in support for Supabase with automatic schema management and security policies.
                              Perfect for new projects or those already using Supabase.
                            </p>
                            <ul className="mt-2 ml-4 list-disc text-sm text-gray-500">
                              <li>Automatic schema migrations</li>
                              <li>Built-in row-level security</li>
                              <li>Real-time capabilities</li>
                              <li>Zero configuration required</li>
                            </ul>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">2. Custom REST API</h5>
                            <p className="mt-1 text-sm text-gray-500">
                              Connect to any database through a REST API interface. Ideal for existing systems
                              or when you need to maintain your current database structure.
                            </p>
                            <ul className="mt-2 ml-4 list-disc text-sm text-gray-500">
                              <li>Works with any database system</li>
                              <li>Maintain existing data structure</li>
                              <li>Custom authentication</li>
                              <li>Full control over data access</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Required Endpoints</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          When using the REST API adapter, your API must implement these endpoints:
                        </p>
                        <div className="mt-4 space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">Orders</h5>
                            <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
                              GET /api/orders/:orderId
                            </pre>
                            <p className="mt-1 text-xs text-gray-500">Returns order details including items and status</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">Products</h5>
                            <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
                              GET /api/products/:productId
                            </pre>
                            <p className="mt-1 text-xs text-gray-500">Returns product details including price and stock</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">Refunds</h5>
                            <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
                              GET /api/refunds/order/:orderId
                            </pre>
                            <p className="mt-1 text-xs text-gray-500">Returns refund status and details for an order</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Response Formats</h4>
                        <p className="mt-2 text-sm text-gray-600">
                          Your API endpoints must return data in these formats:
                        </p>
                        <div className="mt-4 space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">Order Response</h5>
                            <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
{`{
  "order_id": "string",
  "status": "string",
  "total": number,
  "created_at": "string",
  "items": [
    {
      "product_id": "string",
      "quantity": number,
      "price": number
    }
  ]
}`}
                            </pre>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">Product Response</h5>
                            <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
{`{
  "product_id": "string",
  "name": "string",
  "description": "string",
  "price": number,
  "stock": number
}`}
                            </pre>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="text-sm font-medium text-gray-900">Refund Response</h5>
                            <pre className="mt-2 text-sm text-gray-600 overflow-x-auto">
{`{
  "order_id": "string",
  "amount": number,
  "status": "string",
  "reason": "string"
}`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
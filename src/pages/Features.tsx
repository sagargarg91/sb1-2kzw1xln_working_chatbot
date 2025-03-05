import React from 'react';
import { Zap, Shield, Code, BarChart, Headphones, Globe, Cpu, Database } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <div className="bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to build AI voice applications
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            ekaksh.ai provides a comprehensive platform for building, deploying, and scaling AI voice applications.
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Zap className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Lightning Fast Processing</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Process voice inputs in real-time with our high-performance infrastructure.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>Low-latency voice recognition</li>
                  <li>Real-time transcription</li>
                  <li>Optimized for mobile and web applications</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Shield className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Enterprise-grade Security</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Your data is protected with end-to-end encryption and compliance with industry standards.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>End-to-end encryption</li>
                  <li>GDPR and HIPAA compliant</li>
                  <li>Regular security audits</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Code className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Simple API Integration</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Integrate with our API in minutes with comprehensive documentation and SDKs.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>RESTful API</li>
                  <li>WebSocket support</li>
                  <li>SDKs for popular languages</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <BarChart className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Advanced Analytics</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Gain insights into your application's performance with detailed analytics and reporting.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>Usage metrics</li>
                  <li>Performance analytics</li>
                  <li>Custom reports</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Headphones className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Multi-language Support</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Support for multiple languages and dialects to reach a global audience.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>50+ languages supported</li>
                  <li>Dialect recognition</li>
                  <li>Accent adaptation</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Globe className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Global Infrastructure</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Deploy your applications globally with our distributed infrastructure.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>Global CDN</li>
                  <li>Edge computing</li>
                  <li>Low-latency worldwide</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Cpu className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Advanced AI Models</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Access to state-of-the-art AI models for voice recognition and natural language processing.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>Custom model training</li>
                  <li>Domain-specific optimization</li>
                  <li>Regular model updates</li>
                </ul>
              </div>
            </div>

            <div className="relative">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Database className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Scalable Infrastructure</p>
              </div>
              <div className="mt-2 ml-16 text-base text-gray-500">
                <p>Scale your applications from prototype to production with our flexible infrastructure.</p>
                <ul className="mt-4 list-disc pl-5 space-y-2">
                  <li>Auto-scaling</li>
                  <li>High availability</li>
                  <li>Pay-as-you-go pricing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;
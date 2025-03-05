import { supabase } from './supabase';
import type { DatabaseAdapter } from './databaseAdapters';
import { SupabaseAdapter, RestApiAdapter } from './databaseAdapters'; 
import { generateVoiceResponse } from './voiceService';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface VoiceSettings {
  voiceId: string;
  modelId?: string;
  similarityBoost?: number;
  stability?: number;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
  functions?: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  }[];
  function_call?: 'auto' | 'none' | { name: string };
}

interface ChatCompletionResponse {
  choices: {
    message: {
      role: string;
      content: string;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason?: string;
  }[];
  error?: {
    message: string;
    type: string;
    code: string;
  };
}

// DeepSeek API configuration
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const CHATGPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const CHATGPT_API_KEY = import.meta.env.VITE_CHATGPT_API_KEY;

// Debug flag for testing
const DEBUG_API_CALLS = false;

async function getChatGPTResponse(
  messages: ChatMessage[],
  projectSettings: any,
  apiKey: string
): Promise<string> {
  if (DEBUG_API_CALLS) {
    console.log('Making ChatGPT API call with:', {
      endpoint: CHATGPT_API_ENDPOINT,
      model: 'gpt-4o',
      messageCount: messages.length,
      temperature: projectSettings.temperature,
      maxTokens: projectSettings.max_tokens
    });
  }

  if (!apiKey) {
    throw new Error('ChatGPT API key not configured');
  }
  
  const requestBody: ChatCompletionRequest = {
    model: 'gpt-4o',
    messages: messages,
    temperature: projectSettings.temperature || 0.7,
    max_tokens: projectSettings.max_tokens || 1000,
    stream: false,
    functions: projectSettings.functions
  };

  try {
    const response = await fetch(CHATGPT_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ChatGPT API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json() as ChatCompletionResponse;

    if (data.error) {
      throw new Error(`ChatGPT API error: ${data.error.message}`);
    }

    if (!data.choices?.[0]?.message?.content) {
      if (data.choices?.[0]?.message?.function_call) {
        return JSON.stringify(data.choices[0].message.function_call);
      }
      throw new Error('Invalid response format from ChatGPT API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    throw error;
  }
}

// Initialize database adapter
const databaseAdapter = new SupabaseAdapter();

async function getDeepSeekResponse(
  messages: ChatMessage[], 
  projectSettings: any,
  apiKey: string
): Promise<string> {
  if (DEBUG_API_CALLS) {
    console.log('Making DeepSeek API call with:', {
      endpoint: DEEPSEEK_API_ENDPOINT,
      model: "deepseek-chat",
      messageCount: messages.length,
      temperature: projectSettings.temperature,
      maxTokens: projectSettings.max_tokens
    });
  }

  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  
  const requestBody: ChatCompletionRequest = {
    model: "deepseek-chat",
    stream: false,
    messages: messages,
    temperature: projectSettings.temperature || 0.7,
    max_tokens: projectSettings.max_tokens || 1000,
    stop: ["<|endoftext|>"],
    functions: projectSettings.functions
  };
  
  try {
    const response = await fetch(DEEPSEEK_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (DEBUG_API_CALLS) {
      console.log('DeepSeek API response status:', response.status);
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DeepSeek API error response:', {
        endpoint: DEEPSEEK_API_ENDPOINT,
        model: requestBody.model,
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    
    const data = await response.json() as ChatCompletionResponse;
    
    if (DEBUG_API_CALLS) {
      console.log('DeepSeek API response:', {
        hasError: !!data.error,
        hasChoices: !!data.choices,
        messageLength: data.choices?.[0]?.message?.content?.length,
        firstLine: data.choices?.[0]?.message?.content?.split('\n')[0],
        functionCall: data.choices?.[0]?.message?.function_call
      });
    }
    
    if (data.error) {
      console.error('DeepSeek API returned error in response:', data.error);
      throw new Error(`DeepSeek API error: ${data.error.message}`);
    }
    
    if (!data.choices?.[0]?.message?.content) {
      if (data.choices?.[0]?.message?.function_call) {
        // Handle function calls if present
        return JSON.stringify(data.choices[0].message.function_call);
      }
      
      console.error('DeepSeek API returned invalid response format:', data);
      throw new Error('Invalid response format from DeepSeek API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

async function getSimulatedResponse(
  messages: ChatMessage[],
  projectSettings: any
): Promise<string> {
  try {
    // Get model from project settings
    const modelProvider = (projectSettings?.model || 'deepseek-coder').toLowerCase();
    console.log('Simulated response using model:', modelProvider);

    const isDeepSeek = modelProvider.includes('deepseek');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a response based on the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    if (!lastUserMessage) {
      return "I don't see a question. How can I help you?";
    }
    
    const userQuestion = lastUserMessage.content.toLowerCase();
    
    // Provide contextual responses based on common questions
    if (userQuestion.includes('hello') || userQuestion.includes('hi')) {
      return `Hello! I'm an AI assistant powered by DeepSeek Coder. How can I help you with your coding or technical questions today?`;
    }
    
    if (userQuestion.includes('help') || userQuestion.includes('what can you do')) {
      return `As a DeepSeek Coder model, I specialize in helping with programming and technical tasks. I can assist with code generation, debugging, explaining technical concepts, and providing guidance on software development best practices. What specific coding challenge are you working on?`;
    }
    
    if (userQuestion.includes('feature') || userQuestion.includes('capabilities')) {
      return "As a DeepSeek Coder model, I'm specialized in programming and technical tasks. I can generate code, explain algorithms, debug issues, and provide technical guidance across various programming languages and frameworks. I'm designed to understand code context and provide relevant, accurate technical assistance.";
    }
    
    if (userQuestion.includes('model') || userQuestion.includes('which ai')) {
      return isDeepSeek
        ? `I'm currently using the DeepSeek Coder model with a temperature setting of ${projectSettings.temperature}. This model is specifically trained on code and technical content to provide accurate programming assistance.`
        : `I'm currently using the ChatGPT (GPT-4o) model with a temperature setting of ${projectSettings.temperature}. This model is optimized for general conversation and natural language understanding.`;
    }
    
    if (userQuestion.includes('ekaksh') || userQuestion.includes('about you')) {
      return "I'm an AI assistant powered by DeepSeek Coder, integrated with ekaksh.ai, a platform for building, deploying, and scaling AI voice applications. I'm specialized in providing technical and programming assistance with high accuracy.";
    }
    
    if (userQuestion.includes('code') || userQuestion.includes('programming') || userQuestion.includes('develop')) {
      return `As a DeepSeek Coder model, I'm specifically trained to help with programming tasks. I can explain code concepts, help debug issues, suggest implementations, and provide guidance on best practices. I'm familiar with many programming languages including JavaScript, Python, Java, C++, and more. What specific programming challenge are you working on?`;
    }
    
    if (userQuestion.includes('when was') || userQuestion.includes('history') || userQuestion.includes('formed')) {
      return `Based on my training data, I can provide information about historical events and dates. For your specific question about "${lastUserMessage.content}", I would need to access my knowledge base to give you an accurate answer. In a production environment with the DeepSeek Coder model, I would provide detailed historical information.`;
    }
    
    // Default response for other questions
    return `Based on my understanding of your question "${lastUserMessage.content}", I would provide a detailed and helpful response. In a production environment, this would be generated by the DeepSeek Coder model using your specific configuration settings.`;
  } catch (error) {
    console.error('Error with simulated response:', error);
    
    // For demo purposes, provide a fallback response
    return `I'm an AI assistant based on the DeepSeek Coder model. I can help answer technical and programming questions based on my training data. How can I assist you today?`;
  }
}

async function getAIResponse(
  messages: ChatMessage[], 
  projectSettings: any
): Promise<string | null> {
  try {
    // Log incoming project settings for debugging
    console.log('Project Settings:', projectSettings);

    // Normalize model selection
    const modelProvider = (projectSettings?.model || 'deepseek-coder').toLowerCase();
    console.log('Using model provider:', modelProvider);

    let response: string;
    
    console.log('AI Service Configuration:', {
      selectedModel: modelProvider,
      deepseek: !!DEEPSEEK_API_KEY,
      chatgpt: !!CHATGPT_API_KEY
    });

    // Determine which model to use
    const isDeepSeek = modelProvider.includes('deepseek');
    const isChatGPT = modelProvider.includes('chatgpt') || modelProvider.includes('gpt');

    if (isChatGPT && CHATGPT_API_KEY) {
      console.log('Using ChatGPT model');
      response = await getChatGPTResponse(messages, projectSettings, CHATGPT_API_KEY);
    } else if (isDeepSeek && DEEPSEEK_API_KEY) {
      console.log('Using DeepSeek model');
      response = await getDeepSeekResponse(messages, projectSettings, DEEPSEEK_API_KEY);
    } else {
      console.warn(`Using simulated responses - No API key configured for ${modelProvider}`, {
        modelProvider,
        hasDeepSeekKey: !!DEEPSEEK_API_KEY,
        hasChatGPTKey: !!CHATGPT_API_KEY
      });
      return await getSimulatedResponse(messages, projectSettings);
    }

    // Enhanced system message for e-commerce
    const ecommerceSystemMessage = {
      role: 'system',
      content: `You are an AI assistant for an e-commerce website. You have access to real-time data about:

1. Check order status and details using order IDs
2. Look up product information and check stock levels
3. Handle refund status inquiries
4. Provide shipping and delivery information
5. Answer general customer service questions

When handling orders:
- Always verify the order exists using fetchOrderInfo()
- Show order status, items purchased, and total amount
- Provide tracking information and estimated delivery dates
- If order not found, ask for correct order ID

For refunds:
- Check current refund status using fetchRefundInfo()
- Explain the refund process and timeline
- Show refund amount and reason if available
- Provide next steps based on status

For products:
- Look up real-time product data using fetchProductInfo()
- Show current price and stock availability
- Include full product description
- If out of stock, explain restock timeline
- Suggest similar products when relevant

Always:
- Verify data exists before providing information
- Use a professional and helpful tone
- Ask for clarification if information is ambiguous
- Protect customer privacy by not sharing sensitive details
- Format currency values properly
- Handle errors gracefully with clear explanations`
    };

    // Add system message if not present
    if (!messages.some(m => m.role === 'system')) {
      messages.unshift(ecommerceSystemMessage);
    }

    if (DEBUG_API_CALLS) {
      console.log('Making API call with platform key');
    }

    // If response contains function calls, handle them
    if (response && response.includes('function_call')) {
      const functionCall = JSON.parse(response);
      const args = JSON.parse(functionCall.arguments);
      let result;
      
      switch (functionCall.name) {
        case 'fetchOrderInfo':
          result = await databaseAdapter.fetchOrderInfo(args.orderId);
          break;
        case 'fetchProductInfo':
          result = await databaseAdapter.fetchProductInfo(args.productId);
          break;
        case 'fetchRefundInfo':
          result = await databaseAdapter.fetchRefundInfo(args.orderId);
          break;
        case 'generateVoiceResponse':
          result = await generateVoiceResponse({
            ...args,
            voiceId: args.voiceId || 'pNInz6obpgDQGcFmaJgB' // Default to Aanya voice
          });
          break;
      }
      
      // Add result to messages and make another API call
      messages.push({
        role: 'function',
        name: functionCall.name,
        content: JSON.stringify(result)
      });
      
      return getAIResponse(messages, projectSettings);
    }
    
    return response;

  } catch (error) {
    console.error('Error getting AI response:', error);
    return await getSimulatedResponse(messages, projectSettings);
  }
}

export { getAIResponse };
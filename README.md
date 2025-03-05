# AI Platform Base Template

A production-ready starter template for building AI-powered web applications with React, TypeScript, and Supabase.

## Features

- 🚀 Built with Vite + React + TypeScript
- 🎨 Styled with Tailwind CSS
- 🔒 Authentication with Supabase
- 🤖 AI integration ready (DeepSeek/ChatGPT)
- 📊 Database integration with Supabase
- 🎯 File upload and processing
- 🔍 Knowledge base management
- 📱 Responsive design
- 🛠️ Comprehensive settings management

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
   VITE_CHATGPT_API_KEY=your_chatgpt_api_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/       # React context providers
├── lib/           # Utility functions and services
├── pages/         # Application pages/routes
└── types/         # TypeScript type definitions

supabase/
└── migrations/    # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Database Setup

The project uses Supabase for database management. Required tables:

- projects
- knowledge_sources
- user_settings
- voice_models
- call_campaigns
- call_targets
- call_records

Run the migrations in the `supabase/migrations` folder to set up the database schema.

## AI Integration

The template supports multiple AI providers:

- DeepSeek Coder (default)
- ChatGPT (GPT-4o)
- Custom model support

Configure your preferred provider in the settings page.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
# HealthAssist AI Setup Guide

This guide will help you set up the AI chatbot functionality using Google's Gemini AI.

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- A Google account

## Step-by-Step Setup

### 1. Get Your Free Gemini API Key

1. **Visit Google AI Studio**: Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. **Sign in** with your Google account

3. **Create API Key**: 
   - Click "Create API Key"
   - Select "Create API key in new project" (or choose an existing project)
   - Copy the generated API key immediately (you won't be able to see it again)

4. **Free Tier Benefits**:
   - Gemini 1.5 Flash is FREE up to 15 requests per minute
   - 1 million tokens per minute
   - 1,500 requests per day
   - Perfect for development and small-scale production!

### 2. Configure Environment Variables

1. **Copy the example file**:
   ```powershell
   Copy-Item .env.example .env.local
   ```

2. **Edit `.env.local`** and add your Gemini API key:
   ```env
   GEMINI_API_KEY="your-actual-api-key-here"
   ```

3. **Configure other variables** (database, NextAuth, email) as needed

### 3. Install Dependencies

```powershell
pnpm install
```

### 4. Set Up Database

```powershell
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma db push

# (Optional) Seed database
pnpm prisma db seed
```

### 5. Run the Development Server

```powershell
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and test the chatbot!

## How the AI Chatbot Works

### Features

✅ **Real AI Responses**: Uses Google's Gemini 1.5 Flash model (not predefined responses)  
✅ **Conversation Context**: Maintains full conversation history for natural dialogue  
✅ **Medical Knowledge**: Trained to be empathetic and informative about health symptoms  
✅ **Urgency Assessment**: Automatically detects emergency situations  
✅ **Specialist Recommendations**: Suggests appropriate doctors based on symptoms  
✅ **Follow-up Questions**: Asks clarifying questions to better understand conditions  
✅ **Safety First**: Always reminds users it's not a substitute for real medical care  

### Technical Details

- **Model**: `gemini-1.5-flash` (fast, accurate, free)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 1024 per response
- **Context Window**: Full conversation history included
- **System Prompt**: Optimized for medical assistance with empathy

### API Rate Limits (Free Tier)

- **15 requests per minute**
- **1 million tokens per minute**
- **1,500 requests per day**

For a typical health chatbot, this is more than sufficient!

## Troubleshooting

### "AI service not configured" Error

**Cause**: Missing or invalid `GEMINI_API_KEY`  
**Solution**: 
1. Check that `.env.local` exists
2. Verify the API key is correct
3. Restart the development server

### "API_KEY_INVALID" Error

**Cause**: The API key is incorrect or has been revoked  
**Solution**:
1. Generate a new API key from Google AI Studio
2. Update `.env.local` with the new key
3. Restart the server

### Rate Limit Exceeded

**Cause**: Too many requests in a short time  
**Solution**:
- Wait 1 minute and try again
- For production, consider implementing request throttling
- Upgrade to a paid plan if needed

### Conversation History Not Working

**Cause**: Database session not being saved properly  
**Solution**:
1. Check database connection in `.env.local`
2. Run `pnpm prisma db push` to ensure schema is up to date
3. Check browser console for errors

## Alternative AI Providers (Optional)

While this app uses Gemini, you can also use:

### OpenRouter (Access Multiple Models)

1. Get API key from [https://openrouter.ai](https://openrouter.ai)
2. Use models like:
   - `meta-llama/llama-3.2-3b-instruct:free` (free)
   - `google/gemini-flash-1.5` (paid but cheap)
   - `anthropic/claude-3.5-sonnet` (paid, very good)

### Claude AI (Anthropic)

1. Get API key from [https://console.anthropic.com](https://console.anthropic.com)
2. Use `claude-3-haiku` (cheapest) or `claude-3.5-sonnet` (best)

**Note**: To use these alternatives, you'll need to modify the chat API route to use different SDKs.

## Production Deployment

### Environment Variables

Make sure to set these in your production environment (Vercel, Netlify, etc.):

```env
DATABASE_URL=your-production-database-url
NEXTAUTH_SECRET=strong-random-secret-for-production
NEXTAUTH_URL=https://your-domain.com
GEMINI_API_KEY=your-gemini-api-key
```

### Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use strong NEXTAUTH_SECRET** (64+ random characters)
3. **Enable HTTPS** in production (handled by Vercel/Netlify automatically)
4. **Set up rate limiting** to prevent abuse
5. **Monitor API usage** to avoid unexpected costs

## Support

If you encounter issues:

1. Check the [Gemini AI documentation](https://ai.google.dev/docs)
2. Review error messages in terminal and browser console
3. Ensure all environment variables are set correctly
4. Try regenerating Prisma client: `pnpm prisma generate`

## License

MIT License - feel free to modify and use as needed!

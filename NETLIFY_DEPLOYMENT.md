# Netlify Deployment Guide for Health Compass

This guide will help you deploy the Health Compass application to Netlify.

## Prerequisites

1. A [Netlify](https://www.netlify.com/) account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. An OpenAI API key (optional, for AI features)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure all the necessary files are committed to your Git repository:
- `netlify.toml` (already created)
- `.env.example` (for reference)
- `.gitignore` (to prevent committing secrets)

### 2. Connect to Netlify

1. Log in to your Netlify account
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your Health Compass repository

### 3. Configure Build Settings

Netlify should automatically detect the settings from `netlify.toml`, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `dist/public`
- **Node version**: 18

### 4. Set Environment Variables

In the Netlify dashboard, go to **Site settings** → **Environment variables**:

Add the following variables:

#### Required Variables:
- **Key**: `VITE_OPENAI_API_KEY`
  - **Value**: Your OpenAI API key from https://platform.openai.com/api-keys
  
- **Key**: `AI_INTEGRATIONS_OPENAI_API_KEY` (for backward compatibility)
  - **Value**: Same as above

#### Optional Variables:
- **Key**: `VITE_OPENAI_BASE_URL`
  - **Value**: `https://api.openai.com/v1` (default)
  
- **Key**: `NODE_ENV`
  - **Value**: `production`

### 5. Deploy

Click **"Deploy site"** and wait for the build to complete (usually 2-5 minutes).

## Post-Deployment

### Verify Deployment

1. Visit your Netlify site URL (e.g., `https://your-site-name.netlify.app`)
2. Test the main features:
   - Home page loads correctly
   - Import validation works
   - Clinical history displays properly

### Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the instructions to configure your DNS

### HTTPS

Netlify automatically provides HTTPS for all sites. If you added a custom domain, Netlify will provision an SSL certificate automatically.

## Environment Variables for Different Environments

### Development (Local)
Create a `.env.local` file (not committed to Git):
```env
VITE_OPENAI_API_KEY=your_dev_api_key
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

### Production (Netlify)
Set in Netlify dashboard as described above.

## Troubleshooting

### Build Fails
- Check the build logs in Netlify dashboard
- Verify Node version is set to 18
- Ensure all dependencies are in `package.json`

### Environment Variables Not Working
- Make sure variable names start with `VITE_` for client-side access
- Redeploy after adding/changing environment variables
- Check browser console for errors

### API Calls Failing
- Verify OpenAI API key is correct
- Check API key has sufficient credits
- Ensure CORS is properly configured

## Continuous Deployment

Netlify automatically deploys when you push to your main branch:
1. Make changes locally
2. Commit and push to Git
3. Netlify automatically builds and deploys

## Monitoring

- **Analytics**: Available in Netlify dashboard
- **Logs**: Check **Deploys** → **Deploy log** for build logs
- **Functions**: Check **Functions** tab for serverless function logs

## Support

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Support](https://www.netlify.com/support/)
- [Vite Documentation](https://vitejs.dev/)

## Security Notes

- Never commit `.env` files with real API keys
- Rotate API keys regularly
- Use environment-specific keys for development/production
- Monitor API usage to detect unauthorized access

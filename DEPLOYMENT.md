# Deployment Guide

## Step 1: Push to GitHub

### 1.1 Add all files to git
```bash
git add .
```

### 1.2 Commit your changes
```bash
git commit -m "Initial commit: Complete CRM system with pipeline management, lead tracking, and authentication"
```

### 1.3 Add remote repository
```bash
git remote add origin https://github.com/Sharjeel067/Unlimited-Insurance.git
```

### 1.4 Push to GitHub
```bash
git push -u origin main
```

If you get an error about the branch name, try:
```bash
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account (recommended for easy integration)

### 2.2 Import Your Project
1. Click "Add New Project" or "Import Project"
2. Select your GitHub repository: `Sharjeel067/Unlimited-Insurance`
3. Vercel will automatically detect it's a Next.js project

### 2.3 Configure Environment Variables
Before deploying, add these environment variables in Vercel:

1. Go to Project Settings → Environment Variables
2. Add the following:

```
NEXT_PUBLIC_SUPABASE_URL=https://desmolljguqzgadwkfkq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

**Important:** Replace `your_actual_supabase_anon_key_here` with your real Supabase anon key from your Supabase dashboard.

### 2.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy your project
3. You'll get a URL like: `https://unlimited-insurance.vercel.app`

### 2.5 Post-Deployment
- Your site will be live at the provided URL
- Every push to `main` branch will trigger automatic deployments
- You can set up custom domains in Project Settings → Domains

---

## Environment Variables Reference

Make sure these are set in Vercel (Project Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Never commit `.env` files to GitHub!** They're already in `.gitignore`.

---

## Troubleshooting

### If push fails:
- Make sure you're authenticated with GitHub
- Check if the repository exists and you have write access
- Try: `git pull origin main --allow-unrelated-histories` first

### If Vercel build fails:
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build scripts

### If Supabase connection fails:
- Verify environment variables are set correctly in Vercel
- Check Supabase project settings and API keys
- Ensure RLS policies allow public access where needed


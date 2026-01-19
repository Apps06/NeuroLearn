# NeuroLearn Deployment Guide 🚀

This guide walks you through deploying NeuroLearn to production.

---

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (for frontend)
- [ ] Render account (for backend)
- [ ] Google AI Studio API key
- [ ] Firebase project setup
- [ ] AI4Bharat API key (optional)

---

## Step 1: Push to GitHub

### Initialize Git Repository

```bash
cd neurolearn

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: NeuroLearn platform"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/neurolearn.git
git branch -M main
git push -u origin main
```

### Verify `.gitignore`
Ensure these are NOT pushed to GitHub:
- `.env` and `.env.local` files
- `node_modules/`
- `venv/`
- `__pycache__/`
- `backend/data/chroma_db/` (vector database)

---

## Step 2: Deploy Backend to Render

### Why Render?
- **Free Tier:** Perfect for student projects
- **Auto-Deploy:** Syncs with GitHub
- **Python Support:** Built-in support for FastAPI
- **Persistent Storage:** For ChromaDB vectors

### Deployment Steps

1. **Create New Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```
   Name: neurolearn-backend
   Environment: Python 3
   Region: Singapore (closest to India)
   Branch: main
   Root Directory: backend
   ```

3. **Build Settings**
   ```bash
   Build Command:
   pip install -r requirements.txt && python -m spacy download en_core_web_sm
   
   Start Command:
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

4. **Environment Variables**
   Add these in Render dashboard:
   ```
   GEMINI_API_KEY=your_actual_key_here
   AI4BHARAT_API_KEY=your_key (optional)
   DEBUG=False
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for build
   - Note your backend URL: `https://neurolearn-backend.onrender.com`

### Verify Backend Deployment
Visit: `https://neurolearn-backend.onrender.com/docs`  
You should see FastAPI's interactive API documentation.

---

## Step 3: Deploy Frontend to Vercel

### Why Vercel?
- **Made for Next.js:** Zero-config deployment
- **Free Tier:** Generous limits for student projects
- **Global CDN:** Fast loading worldwide
- **Automatic HTTPS:** SSL certificates included

### Deployment Steps

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via GitHub** (Recommended)
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory as root

3. **Configure Project**
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   ```

4. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://neurolearn-backend.onrender.com
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at: `https://your-app.vercel.app`

### Update Backend CORS
After getting your Vercel URL, update backend `.env`:
```
FRONTEND_URL=https://your-app.vercel.app
```
Then redeploy backend on Render.

---

## Step 4: Upload NIMHANS PDF

### For Local Development
```bash
# Place PDF in backend/data/ directory
cp /path/to/nimhans_guidelines.pdf backend/data/
```

### For Render Deployment
Render's free tier doesn't support persistent file uploads. Options:

**Option 1: Include PDF in Git** (if not copyrighted)
```bash
# Remove PDF from .gitignore temporarily
git add backend/data/nimhans_guidelines.pdf
git commit -m "Add NIMHANS guidelines for RAG"
git push
```

**Option 2: Use Cloud Storage** (recommended for large files)
```python
# In rag_service.py, modify to download from URL:
import requests

def _download_pdf_from_cloud():
    url = "https://your-cloud-storage.com/nimhans.pdf"
    response = requests.get(url)
    with open("data/nimhans_guidelines.pdf", "wb") as f:
        f.write(response.content)
```

---

## Step 5: Configure Firebase

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "NeuroLearn"
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Get Firebase Config
1. Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy configuration object
4. Add values to Vercel environment variables

---

## Step 6: Post-Deployment Testing

### Test Checklist

#### Backend Health
- [ ] Visit `https://neurolearn-backend.onrender.com/`
- [ ] Check `/docs` for API documentation
- [ ] Test `/api/health` endpoint

#### Frontend Pages
- [ ] Home page loads (`/`)
- [ ] Reader page accessible (`/reader`)
- [ ] Focus page accessible (`/focus`)
- [ ] Assessment page accessible (`/assessment`)

#### Core Features
- [ ] Text simplification works
- [ ] TTS audio plays
- [ ] Task breakdown generates
- [ ] Distraction timer triggers
- [ ] XP system saves to Firebase
- [ ] RAG system answers questions

#### Cross-Browser Testing
Test on:
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Mac/iOS)
- [ ] Chrome (Android)

---

## Step 7: Custom Domain (Optional)

### Add Custom Domain to Vercel
1. Buy domain (e.g., from Namecheap, GoDaddy)
2. In Vercel dashboard → Domains
3. Add your domain: `neurolearn.app`
4. Update DNS records as instructed
5. Wait 24-48 hours for propagation

---

## Troubleshooting Common Issues

### Issue: Backend API not responding
**Solution:**
- Check Render logs for errors
- Verify environment variables are set
- Ensure spaCy model downloaded during build

### Issue: CORS errors in browser console
**Solution:**
- Verify `FRONTEND_URL` in backend `.env` matches Vercel URL
- Check `allow_origins` in `main.py`

### Issue: Firebase authentication failing
**Solution:**
- Verify all Firebase config variables in Vercel
- Check Firebase console for enabled auth methods

### Issue: TTS not working
**Solution:**
- AI4Bharat may be down → system falls back to Web Speech API
- Check browser console for TTS errors
- Verify microphone permissions (some browsers need this)

### Issue: RAG returns empty answers
**Solution:**
- Verify NIMHANS PDF uploaded correctly
- Check Render logs for ChromaDB errors
- Test locally first to isolate issue

---

## Monitoring & Maintenance

### Set Up Monitoring
1. **Render:** Built-in metrics (CPU, memory, response time)
2. **Vercel:** Analytics available in dashboard
3. **Firebase:** Monitor Firestore usage in console

### Cost Estimates (Free Tiers)
| Service | Free Tier Limit | Expected Usage |
|---------|----------------|----------------|
| Render | 750 hours/month | ~24/7 uptime ✅ |
| Vercel | 100 GB bandwidth | Low traffic ✅ |
| Firebase | 50K reads/day | Student project ✅ |
| Gemini API | 60 requests/min | Plenty ✅ |

### Scaling Considerations
For production with 1000+ users:
- Upgrade Render to paid plan ($7/month)
- Enable Vercel Pro for better analytics
- Consider Firebase Blaze (pay-as-you-go)
- Implement API rate limiting

---

## CI/CD Pipeline (Advanced)

### Auto-Deploy on Git Push

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Trigger Render Deploy
        run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Final Checklist

Before showing to your professor:
- [ ] All pages load without errors
- [ ] Features demonstrate key concepts (NLP, RAG, TTS)
- [ ] Code is well-commented for report submission
- [ ] README.md explains technical choices
- [ ] Demo video recorded (optional but recommended)
- [ ] Test with sample ADHD/Dyslexia use cases

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Next.js Docs:** https://nextjs.org/docs

---

**🎉 Congratulations! Your NeuroLearn platform is now live!**

Share your deployment URL:
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://neurolearn-backend.onrender.com`
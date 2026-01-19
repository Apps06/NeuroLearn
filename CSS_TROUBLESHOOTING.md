# CSS Not Working - Complete Fix Guide 🎨

## Problem Diagnosis

Run these commands to identify the issue:

```bash
cd frontend

# Check if Tailwind is installed
npm list tailwindcss

# Check if PostCSS is configured
ls postcss.config.js

# Check if globals.css exists
ls app/globals.css
```

---

## Solution 1: Fresh Tailwind Setup

### Step 1: Remove Node Modules & Cache
```bash
cd frontend
rm -rf node_modules .next package-lock.json
```

### Step 2: Reinstall Dependencies
```bash
npm install
```

### Step 3: Verify File Structure
Ensure these files exist:
```
frontend/
├── app/
│   ├── globals.css          ← MUST exist
│   └── layout.tsx            ← MUST import globals.css
├── tailwind.config.ts        ← MUST exist
├── postcss.config.js         ← MUST exist
└── package.json
```

### Step 4: Check globals.css Import in Layout

Open `app/layout.tsx` and ensure it has this import at the TOP:

```typescript
import './globals.css';  // ← THIS LINE IS CRITICAL
```

### Step 5: Restart Dev Server
```bash
# Kill existing server (Ctrl+C)
npm run dev
```

---

## Solution 2: Verify Tailwind Config

### Check `tailwind.config.ts`

It should look like this:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
```

**Common Mistake:** Wrong `content` paths. Must match your folder structure!

---

## Solution 3: Check PostCSS Config

### Create `postcss.config.js` if missing:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

## Solution 4: Verify Package.json

Your `package.json` should include:

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "typescript": "^5.3.3"
  }
}
```

If Tailwind is in `dependencies` instead of `devDependencies`, move it:

```bash
npm uninstall tailwindcss autoprefixer postcss
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p
```

---

## Solution 5: Test Tailwind is Working

### Create a test page: `app/test/page.tsx`

```tsx
export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">
        ✅ Tailwind is Working!
      </h1>
    </div>
  )
}
```

Visit `http://localhost:3000/test`

**If you see a blue background with white text** → Tailwind works!  
**If you see plain white background** → Continue troubleshooting below.

---

## Solution 6: Check Browser DevTools

### Open Browser Console (F12)

Look for these errors:

**Error 1: "Failed to load resource: globals.css"**
```bash
# Fix: Check import path in layout.tsx
import './globals.css';  # Correct
import '../globals.css'; # Wrong
```

**Error 2: "Unexpected token '@' in globals.css"**
```bash
# Fix: PostCSS not configured
# Run: npm install -D postcss autoprefixer
# Create postcss.config.js (see Solution 3)
```

**Error 3: No errors but styles missing**
```bash
# Fix: Tailwind content paths wrong
# Check tailwind.config.ts content array
```

---

## Solution 7: Nuclear Option (Start Fresh)

If nothing works, recreate the Next.js app:

```bash
# Go to project root
cd neurolearn

# Backup your code
cp -r frontend frontend_backup

# Create fresh Next.js app
npx create-next-app@latest frontend-new --typescript --tailwind --app

# Copy your files into new project
cp -r frontend/app/* frontend-new/app/
cp -r frontend/components frontend-new/
cp -r frontend/hooks frontend-new/
cp -r frontend/lib frontend-new/

# Delete old, rename new
rm -rf frontend
mv frontend-new frontend

cd frontend
npm run dev
```

---

## Solution 8: Alternative - Use CDN (Quick Fix)

If Tailwind still won't compile, use CDN temporarily:

### In `app/layout.tsx`, add to `<head>`:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CDN - Development Only */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**⚠️ Warning:** CDN is slower and not for production. Fix proper setup later.

---

## Solution 9: Check File Permissions

On Linux/Mac, ensure files are readable:

```bash
chmod -R 755 frontend/
```

---

## Solution 10: Port Conflict

If dev server starts but page won't load:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

---

## Verification Checklist

After trying solutions, verify:

- [ ] `npm run dev` starts without errors
- [ ] Browser shows page at `localhost:3000`
- [ ] Browser console has no CSS errors (F12)
- [ ] Test page shows blue background
- [ ] Tailwind classes work (try `className="text-red-500"`)
- [ ] Hot reload works (change text, auto-refreshes)

---

## Still Not Working?

### Debug Mode

1. **Check Next.js Build Output:**
```bash
npm run build
```

Look for Tailwind-related errors.

2. **Check CSS is Generated:**
```bash
# After running dev server, check if CSS compiled
ls .next/static/css/
```

Should see `*.css` files. If empty → Tailwind not compiling.

3. **Check Browser Network Tab:**
- Open DevTools → Network
- Reload page
- Filter by CSS
- Verify `globals.css` loads (Status 200)

---

## Common Causes Summary

| Problem | Cause | Fix |
|---------|-------|-----|
| No styles at all | Missing globals.css import | Add `import './globals.css'` to layout.tsx |
| Tailwind classes don't work | Wrong content paths | Fix tailwind.config.ts content array |
| Build fails | Missing PostCSS | Install postcss + autoprefixer |
| Old styles cached | Browser cache | Hard refresh (Ctrl+Shift+R) |
| Port 3000 in use | Another process | Kill process or use different port |

---

## Get Help

If none of this works, share:

1. Output of `npm run dev`
2. Browser console errors (screenshot)
3. Your `tailwind.config.ts` file
4. Your `app/layout.tsx` file

Then I can provide specific debugging steps!

---

## Quick Reset Script

Save this as `reset-css.sh`:

```bash
#!/bin/bash
cd frontend
rm -rf node_modules .next package-lock.json
npm install
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p
npm run dev
```

Run: `chmod +x reset-css.sh && ./reset-css.sh`
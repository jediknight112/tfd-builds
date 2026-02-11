# Quick Start Guide

Get the TFD Build Viewer running in 2 minutes!

## 🚀 Installation & Running

```bash
# 1. Navigate to project
cd /Users/jeffrey.crane/GitHub/tfd-builds

# 2. Install dependencies (first time only)
npm install

# 3. Start development server
npm run dev
```

**That's it!** Your browser will open to `http://localhost:3000`

## 🎮 Using the App

1. **Configure API Keys** (First Time)
   - Click the **Settings** button in the top nav
   - Enter your Worker API Key and Nexon API Key
   - Click "Save & Reload"
   - See [API_KEYS_SETUP.md](API_KEYS_SETUP.md) for details

2. **Select a Descendant**
   - Browse the descendant cards on the main screen
   - Click on any descendant to start building

3. **Configure Modules**
   - View the 12 module slots for your descendant
   - Click on empty slots to open the module selector
   - Filter by tier, class, and socket type
   - Search for specific modules

4. **Navigate Tabs**
   - **Modules**: Configure 12 descendant modules + trigger module
   - **Weapons**: Set up 3 weapons with modules, custom stats, and core stats
   - **Reactor**: Configure reactor with additional stats
   - **External Components**: Add 4 component types with core stats
   - **Arche Tuning**: Select board and configure nodes

5. **Share Your Build**
   - Click "Copy Build URL" to share via compressed URL
   - URL is automatically saved to localStorage
   - Load builds by opening the URL

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Watch mode testing
npm run test:watch

# Check code formatting
npm run lint

# Auto-fix formatting
npm run format

# Clean and reinstall
rm -rf node_modules dist
npm install
```

## 📱 What You'll See

### Home Screen

- Grid of descendant cards
- "New Build" and "Refresh Data" buttons
- Gaming-themed design with neon effects

### Build Screen (after selecting descendant)

- Descendant info header with name and description
- Tab navigation for different build sections
- 12 module slots for descendant
- 3 weapon card slots
- Additional configuration sections

## 🎨 Theme

The app features a gaming-inspired design:

- **Cyan/Blue** accents for primary elements
- **Orange** accents for weapons
- **Purple** accents for special items
- **Dark** background with subtle grid pattern
- **Neon glow** effects on interactive elements

## 🔌 Data Source

Data is loaded from:

```
https://tfd-cache.jediknight112.com/tfd/metadata/*
```

Available data types:

- Descendants
- Modules
- Weapons
- Reactors
- External Components
- And more...

## ⚠️ Current Limitations

The basic framework is complete, but these features are placeholders:

- ❌ Module selector (shows alert)
- ❌ Weapon selector (shows alert)
- ❌ Build saving/loading
- ❌ Real stat calculations
- ❌ Build sharing

These will be implemented in future updates!

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
npm run dev -- --port 3001
```

### Changes Not Appearing

- Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear browser cache
- Restart dev server

### API Errors

- Check browser console (F12)
- Verify internet connection
- Confirm API URL is accessible

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

After getting it running:

1. **Read Documentation**
   - [README.md](README.md) - Full project overview
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
   - [DEPLOYMENT.md](DEPLOYMENT.md) - How to deploy

2. **Explore the Code**
   - [src/index.js](src/index.js) - Main application logic
   - [src/styles/input.css](src/styles/input.css) - Styling
   - [index.html](index.html) - HTML structure

3. **Make Changes**
   - Edit files and see live updates
   - Check browser console for errors
   - Test in different browsers

4. **Deploy**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Recommended: Cloudflare Pages (free)

## 💡 Pro Tips

1. **Use Browser DevTools**
   - Open with F12 or Cmd+Option+I
   - Console shows API calls and errors
   - Network tab shows data loading

2. **Hot Module Replacement**
   - Changes appear instantly without refresh
   - State is preserved when possible

3. **Mobile Testing**
   - Dev server accessible on local network
   - Find your IP: `ifconfig | grep inet`
   - Access from phone: `http://YOUR-IP:3000`

4. **API Testing**
   - Open browser console
   - Try: `await apiClient.getDescendants()`
   - Inspect: `state.descendants`

## 🎯 Quick Tasks

Want to customize? Try these:

**Change Colors**:

- Edit `tailwind.config.js` → `theme.extend.colors`

**Change API URL**:

- Edit `src/index.js` → Line 2: `API_BASE_URL`

**Add Custom Styling**:

- Edit `src/styles/input.css` → Add to `@layer utilities`

**Modify Layout**:

- Edit `index.html` → HTML structure

## ✅ Verification Checklist

After starting, verify:

- [ ] Browser opens automatically
- [ ] Page loads without errors
- [ ] Console shows "Loading data..." then descendants appear
- [ ] Can click on a descendant card
- [ ] Build interface appears
- [ ] Can switch between tabs
- [ ] No red errors in console

## 🆘 Getting Help

If stuck:

1. Check browser console for errors
2. Review [DEVELOPMENT.md](DEVELOPMENT.md)
3. Check [Vite documentation](https://vitejs.dev/)
4. Verify all files are in place

## 🎉 You're Ready!

The app is fully functional for viewing and basic interaction. Enjoy exploring builds for The First Descendant!

---

**Need more details?** Check out:

- 📖 [README.md](README.md) - Complete documentation
- 🛠️ [DEVELOPMENT.md](DEVELOPMENT.md) - Developer guide
- 🚀 [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- 📊 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview

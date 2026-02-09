# TFD Build Viewer

A modern web application for viewing and planning character builds for **The First Descendant** video game.

## Features

- 🎮 **Descendant Selection** - Choose from all available descendants
- 🔧 **Module Management** - Configure up to 12 descendant modules
- ⚔️ **Weapon Loadouts** - Equip and configure 3 weapons with their own modules and stats
- ⚡ **Reactor Configuration** - Set up reactor for your build
- 🎯 **External Components** - Add and manage external components
- 🔬 **Arche Tuning** - Configure Arche tuning settings
- 👥 **Fellow & Vehicle** - Select and configure Fellows and Vehicles
- 🔄 **Inversion Reinforcement** - Manage inversion reinforcement settings
- 💾 **Data Caching** - Powered by TFD Cache API for fast data loading

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS with custom gaming theme
- **Build Tool**: Vite
- **API**: TFD Cache API (Cloudflare Workers)
- **Icons**: Heroicons (inline SVG)

## Project Structure

```
tfd-builds/
├── index.html              # Main HTML file
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── index.js            # Main application logic
    └── styles/
        └── input.css       # Tailwind CSS input file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **API Keys** (Required for data access):
  - Nexon API Key from [openapi.nexon.com](https://openapi.nexon.com/)
  - Worker API Key from your tfd-cache deployment

### Installation

1. Navigate to the project directory:
```bash
cd /Users/jeffrey.crane/GitHub/tfd-builds
```

2. Install dependencies:
```bash
npm install
```

3. **Configure API Keys** (Choose one method):

   **Method A: Using the Settings UI** (Easiest)
   - Start the app: `npm run dev`
   - Click **Settings** button in the top navigation
   - Enter your API keys
   - Click **Save & Reload**

   **Method B: Using Environment Variables**
   - Copy `.env.example` to `.env`
   - Edit `.env` and add your actual API keys:
     ```env
     VITE_WORKER_API_KEY=your_worker_api_key
     VITE_NEXON_API_KEY=your_nexon_api_key
     ```

4. Start the development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`

**See [API_KEYS_SETUP.md](API_KEYS_SETUP.md) for detailed instructions on obtaining API keys.**

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `make install` - Install dependencies (alternative)
- `make dev` - Start dev server (alternative)

## Data Structure

### Descendant Build
Each descendant build consists of:
- **12 Module Slots** - Enhance descendant abilities
- **3 Weapon Slots** - Each weapon has:
  - 10 module slots
  - 4 base stats
  - 5 core stats
- **1 Reactor** - Power source configuration
- **External Components** - Additional equipment
- **Arche Tuning** - Special ability modifications
- **Fellow** - Companion configuration
- **Vehicle** - Transportation setup
- **Inversion Reinforcement** - Advanced modifications

## API Integration

This app connects to the TFD Cache API:
- **Base URL**: `https://tfd-cache.jeffistotallyawesome.space`
- **Endpoints**:
  - `/tfd/metadata/descendant` - Get descendant data
  - `/tfd/metadata/module` - Get module data
  - `/tfd/metadata/weapon` - Get weapon data
  - `/tfd/metadata/reactor` - Get reactor data
  - `/tfd/metadata/external-component` - Get external component data

## Customization

### Theme Colors
Edit tailwind.config.js to customize the color scheme:
- `tfd-primary`: Main accent color (cyan)
- `tfd-secondary`: Secondary accent (orange)
- `tfd-dark`: Dark background
- `tfd-accent`: Purple accent

### API Configuration
Edit the API base URL in src/index.js:
```javascript
const API_BASE_URL = 'https://your-api-url.com';
```

## Development Roadmap

- [x] Basic project setup
- [x] Descendant selection UI
- [x] Module slot system
- [x] Weapon cards with stats
- [x] Tab navigation
- [ ] Module selector modal
- [ ] Weapon selector modal
- [ ] Build saving/loading
- [ ] Build sharing (URL-based)
- [ ] Build comparison
- [ ] Stat calculations
- [ ] Mobile responsive improvements

## Related Projects

- **[tfd-cache](../tfd-cache)** - Cloudflare Workers cache for TFD API data
- **[jedishell-tools/tfd](../jedishell-tools/tfd)** - Go CLI tool for TFD API

## Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Acknowledgments

- Data provided by Nexon's The First Descendant API
- Built with ❤️ for the TFD community

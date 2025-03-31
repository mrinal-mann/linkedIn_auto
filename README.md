# LinkedIn Automation Tool

A Chrome extension built with TypeScript and Node.js for automating LinkedIn tasks and managing professional networking activities.

## Tech Stack

- **Frontend**: TypeScript, Webpack
- **Backend**: Node.js, Express
- **AI Integration**: Google Generative AI
- **API**: LinkedIn API, Axios

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Chrome browser
- LinkedIn account

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone https://github.com/mrinal-mann/linkedIn_auto
cd linkedIn_auto
```

2. Install dependencies:

```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### Running the Application

```bash
# Start backend
cd server
npm start

# Build frontend (Chrome extension)
cd client
npm run build
```

### Loading the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `client/dist` directory

## Features

- 🤖 AI-powered LinkedIn automation
- 🛡️ Smart spam detection and filtering
- 📊 AI message analysis and categorization
- 📱 Intelligent message sorting and prioritization

## Project Structure

```
linkedIn_auto/
├── client/                 # Chrome extension frontend
│   ├── src/               # TypeScript source files
│   ├── public/            # Static assets
│   └── webpack.config.js  # Webpack configuration
└── server/               # Node.js backend
    ├── index.js         # Main server file
    └── package.json     # Backend dependencies
```

## Development

- Frontend is built with TypeScript and bundled using Webpack
- Backend uses Express.js with Google's Generative AI integration
- Chrome extension architecture for LinkedIn automation
- AI-powered spam detection and message analysis system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

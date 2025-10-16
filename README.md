# IBM i Chatbot - Minimalist Angular Application

A clean, minimalist chatbot interface for interacting with IBM i databases through natural language queries powered by Claude AI.

## Features

- Clean, modern Material Design UI
- Real-time chat interface
- Natural language database queries
- Session management with localStorage
- Quick action buttons for common queries
- Responsive design for mobile and desktop
- Execution time tracking
- Error handling and display

## Prerequisites

- Node.js >= 18.0.0
- Angular CLI >= 17.0.0
- IBM i MCP Server running on port 3000

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure the backend URL in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001', // Your MCP server URL
  // ... other settings
};
```

## Development

Start the development server:
```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

## Production Build

Build for production:
```bash
npm run build:prod
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/app/
├── components/
│   └── chat/           # Main chat component
├── services/
│   └── chat.service.ts # API communication service
├── models/
│   ├── message.model.ts
│   └── session.model.ts
└── app.component.*     # Root component
```

## Key Components

### Chat Component
- Handles user interface and interactions
- Displays messages with Material Design cards
- Quick action buttons for common queries
- Real-time loading indicators

### Chat Service
- Manages API communication with MCP server
- Session management with localStorage
- Message stream management with RxJS
- Error handling and retry logic

## Styling

The application uses:
- Angular Material for UI components
- Custom gradient background
- Minimalist design with clean typography
- Responsive layout for all screen sizes

## Usage

1. Start the IBM i MCP server
2. Launch the Angular application
3. Type natural language queries about your database
4. Use quick action buttons for common queries
5. Clear session with the refresh button

## API Integration

The application connects to these MCP server endpoints:
- `POST /api/chat/query` - Send chat messages
- Session ID is stored in localStorage for context

## License

MPL-2.0
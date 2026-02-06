# BS Assistant Web

Angular frontend for the BS Assistant chatbot. Connects to a Spring Boot backend for natural language database queries.

## Tech Stack

- Angular 19
- Angular Material 19
- TypeScript 5.7
- RxJS 7.8

## Prerequisites

- Node.js >= 18
- Angular CLI (`npm install -g @angular/cli`)

## Quick Start

```bash
npm install
npm start
```

App runs at `http://localhost:4200`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server with proxy (opens browser) |
| `npm run build` | Development build |
| `npm run build:prod` | Production build → `dist/` |
| `npm test` | Run tests |

## Project Structure

```
src/app/
├── components/
│   ├── chat/           # Main chat interface
│   ├── header/         # App header
│   ├── sidebar/        # Navigation
│   └── floating-chat/  # Floating chat widget
├── services/           # API & session services
├── models/             # TypeScript interfaces
└── environments/       # Environment configs
```

## Backend Connection

The dev server proxies API requests via `proxy.conf.json`. Backend should run on port 8080.


## License

MPL-2.0

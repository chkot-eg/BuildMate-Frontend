export const environment = {
  production: true,
  apiUrl: '/api', // Relative URL for nginx proxy
  
  // NEW: Library configuration
  defaultLibrary: 'ADB800',  // Single library instead of array
  
  // NEW: Performance settings
  enableGreetingCache: true,
  schemaQueryOptimized: true,
  
  // NEW: Query settings
  autoAddLibraryPrefix: true,  // Backend handles this now
  
  // Session and request settings
  sessionTimeout: 86400000,
  maxRetries: 3,
  retryDelay: 1000,
  
  // Cache settings
  cacheEnabled: true,
  cacheTTL: 3600,
  
  // WebSocket settings (if using real-time updates)
  wsUrl: '/api',
  wsReconnectInterval: 5000
};
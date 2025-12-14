import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "69113d25d60420d42757a90b", 
  requiresAuth: true // Ensure authentication is required for all operations
});

// src/utils/rateLimiter.js
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create request array for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const keyRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = keyRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(key, validRequests);
    
    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = validRequests[0];
      const resetTime = oldestRequest + this.windowMs;
      const waitTime = resetTime - now;
      
      return {
        allowed: false,
        resetIn: Math.ceil(waitTime / 1000),
        remaining: 0
      };
    }
    
    // Add current request
    validRequests.push(now);
    
    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      resetIn: Math.ceil(this.windowMs / 1000)
    };
  }
  
  reset(key) {
    this.requests.delete(key);
  }
  
  resetAll() {
    this.requests.clear();
  }
}

// Create instances for different endpoints
export const authLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const apiLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute
export const uploadLimiter = new RateLimiter(10, 5 * 60 * 1000); // 10 uploads per 5 minutes

// Usage example:
// const canProceed = authLimiter.check('login');
// if (!canProceed.allowed) {
//   throw new Error(`Too many attempts. Try again in ${canProceed.resetIn} seconds.`);
// }
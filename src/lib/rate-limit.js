import { RateLimiter } from 'limiter';

const loginLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "minute",
  fireImmediately: true
});

const registerLimiter = new RateLimiter({
  tokensPerInterval: 3,
  interval: "hour",
  fireImmediately: true
});

const reportLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: "hour",
  fireImmediately: true
});

const ipLimiter = new Map();

export async function checkRateLimit(action, ip) {
  // Initialize IP-based limiter if it doesn't exist
  if (!ipLimiter.has(ip)) {
    ipLimiter.set(ip, new RateLimiter({
      tokensPerInterval: 100,
      interval: "hour",
      fireImmediately: true
    }));
  }

  const limiter = action === 'login' ? loginLimiter : 
                  action === 'register' ? registerLimiter :
                  action === 'report' ? reportLimiter :
                  loginLimiter; // fallback to login limiter for unknown actions
                  
  const ipBasedLimiter = ipLimiter.get(ip);

  const [hasTokenLimiter, hasTokenIp] = await Promise.all([
    limiter.tryRemoveTokens(1),
    ipBasedLimiter.tryRemoveTokens(1)
  ]);

  return hasTokenLimiter && hasTokenIp;
}

// Clean up old IP limiters every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, limiter] of ipLimiter.entries()) {
    if (now - limiter.lastCheck > 3600000) {
      ipLimiter.delete(ip);
    }
  }
}, 3600000);

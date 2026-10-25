# 14.10 API Gateway Architecture, Rate Limiting & Throttling

```mermaid
flowchart LR
    Client["Client Request"] --> Gateway["API Gateway (Cloudflare / Kong)"]
    Gateway --> RateLimiter{"Rate Limiter (Redis Token Bucket)"}
    RateLimiter -->|Tokens Available| Backend["Forward to Weather Service"]
    RateLimiter -->|Tokens Exhausted (Burst > 60)| Block["429 Too Many Requests + Retry-After: 30"]
```

---

## 1. What It Is in Plain Words
An API Gateway acts as the single entry portal for all incoming client traffic, handling routing, SSL termination, authentication token validation, and rate limiting to protect internal microservices from abuse and Denial-of-Service (DoS) attacks.

---

## 2. Whether and How THIS Project Uses It
In [abstract-forge/index.html](file:///Users/avishjain/avishjain9-repos/56-avishjain-weatherapp/abstract-forge/index.html), **no API Gateway is currently present**. The client executes mock data functions locally in browser memory.

---

## 3. Rate Limiting Algorithms Comparison

| Algorithm | Mechanism | Memory Footprint | Burst Traffic Handling | Accuracy | Best Fit in Weather Hub |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Token Bucket (Used in Roadmap)**| Tokens refill at constant rate; each request consumes 1 token | **Minimal ($O(1)$ in Redis)**| **Allows smooth controlled bursts**| High | **Public Weather Telemetry** |
| **Leaky Bucket** | Requests enter queue; leak out at steady constant rate | Low ($O(N)$ queue buffer) | Smooths out bursts to steady stream | High | Radar video stream encoding |
| **Fixed Window Counter** | Counts requests in fixed 1-minute blocks | Lowest (Single integer) | Vulnerable to boundary 2x spikes | Low | Simple internal scripts |
| **Sliding Window Log** | Stores timestamp of every request in sorted set | High ($O(N)$ memory) | Flawless protection | Highest | High-security financial APIs |
| **Sliding Window Counter** | Weighted combination of current and previous window | Very Low (2 integers) | Smooth approximations | Very High | Premium enterprise APIs |

---

## 4. Redis Token Bucket Implementation Logic

To rate limit public clients to 60 requests per minute with a burst allowance of 10:

```lua
-- Redis Lua Script for Atomic Token Bucket Rate Limiting
local key = KEYS[1]
local limit = tonumber(ARGV[1])      -- 60 tokens
local current_time = tonumber(ARGV[2])
local refill_rate = limit / 60       -- 1 token per second

local data = redis.call("HMGET", key, "tokens", "last_updated")
local tokens = tonumber(data[1]) or limit
local last_updated = tonumber(data[2]) or current_time

-- Refill tokens based on elapsed time
local delta = math.max(0, current_time - last_updated)
tokens = math.min(limit, tokens + (delta * refill_rate))

if tokens >= 1 then
    tokens = tokens - 1
    redis.call("HMSET", key, "tokens", tokens, "last_updated", current_time)
    redis.call("EXPIRE", key, 120)
    return 1 -- Allowed
else
    return 0 -- Rejected (429)
end
```

---

## 5. What Breaks at 10x, 100x, and 1000x Load
- **10x Load:** Unprotected APIs survive light traffic.
- **100x Load:** Malicious web scrapers or poorly configured automated pollers exhaust backend database connections without rate limits.
- **1000x Load:** Distributed denial-of-service (DDoS) botnets flood the ingress network. **Remedy:** Deploy Cloudflare WAF with automated IP reputation filtering and challenge captchas before traffic touches the origin gateway.

---

## 6. How a Senior Engineer Would Improve It
1. **Tiered Rate Limiting:**
   - Anonymous Users: 30 requests/minute per IP.
   - Authenticated Free Users: 60 requests/minute per JWT `sub` ID.
   - Enterprise API Key Users: 1,000 requests/minute with custom burst quotas.
2. **Standardized HTTP Headers:** Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After: 30` on HTTP 429 status codes.

---

## 7. Spoken Interview Answer (30 Seconds)
> "While our client currently uses in-memory mock data, our production gateway design incorporates a Redis-backed Token Bucket rate limiter. By allocating 60 tokens per minute with atomic Lua script execution, we allow natural user bursts while preventing bot scraping and DDoS traffic. Saturated clients receive an HTTP 429 status with standardized Retry-After headers."

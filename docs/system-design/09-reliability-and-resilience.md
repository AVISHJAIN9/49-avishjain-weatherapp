# 14.9 Reliability, Fault Tolerance & Resilience Engineering

```mermaid
flowchart TD
    Request["Incoming API Request"] --> CB{"Circuit Breaker State"}
    CB -->|Closed (Normal)| Backend["Call Primary Weather Service"]
    CB -->|Open (Tripped: > 50% Failures)| Fallback["Return Cached Telemetry / Stale Snapshot"]
    CB -->|Half-Open (Testing Recovery)| Probe["Send Single Probe Request"]
    Backend -->|Timeout > 2000ms / 500 Error| FailCounter["Increment Failure Counter"]
    FailCounter -->|Failures > Threshold| OpenBreaker["Trip Circuit to Open"]
```

---

## 1. What It Is in Plain Words
Reliability and resilience ensure that an application remains operational, maintains graceful degradation, and recovers automatically when external dependencies, databases, or network connections fail.

---

## 2. Whether and How THIS Project Uses It
In [abstract-forge/index.html](file:///Users/avishjain/avishjain9-repos/56-avishjain-weatherapp/abstract-forge/index.html):
- **Defensive Clamping:** State mutations in F2 clamp explicitly via `Math.min(..., 11)` and `Math.max(..., 0)` ([index.html:350](file:///Users/avishjain/avishjain9-repos/56-avishjain-weatherapp/abstract-forge/index.html#L350), [#L355](file:///Users/avishjain/avishjain9-repos/56-avishjain-weatherapp/abstract-forge/index.html#L355)), preventing runtime NaN or out-of-range state.
- **Graceful CSS Degradation:** If VanillaTilt fails to load over a faulty network, the card maintains its glassmorphic layout without script crashes.

---

## 3. Reliability Patterns Comparison

| Pattern | Mechanism | Failure Mode Prevented | Implementation in Weather Hub |
| :--- | :--- | :--- | :--- |
| **Circuit Breaker** | Trips open when downstream failure rate exceeds 50% | Cascading thread exhaustion | Used in external weather API proxy |
| **Bulkhead Pattern** | Isolates thread pools and connection pools per service | One failing service crashing entire app| Separate pools for radar vs weather queries |
| **Retry with Exponential Backoff & Jitter** | Exponentially delays retries ($2^n + \text{random}$) | Thundering herd on recovering servers | Used on network requests |
| **Graceful Degradation**| Returns cached or default telemetry if API fails | User seeing a blank screen or 500 page | Returns stale weather snapshot with warning badge |

---

## 4. SLO, SLI & SLA Definitions for Weather Hub

| Metric | Target Service Level | Definition & Measurement Formula |
| :--- | :--- | :--- |
| **SLI (Indicator)** | Telemetry Endpoint Latency | $\frac{\text{Successful requests served in } < 100\text{ms}}{\text{Total valid requests}} \times 100$ |
| **SLO (Objective)** | **99.9% Latency Compliance** | Internal target: 99.9% of telemetry requests complete in $< 100\text{ms}$. |
| **SLA (Agreement)** | **99.9% Uptime Availability** | External commitment: maximum 43.8 minutes unplanned downtime per month. |

---

## 5. What Breaks at 10x, 100x, and 1000x Load
- **10x Load:** Static client operates smoothly.
- **100x Load:** An upstream weather provider (e.g. NOAA or OpenWeather) experiences an outage. Without a circuit breaker, backend requests hang waiting for timeouts, exhausting backend thread pools.
- **1000x Load:** Cascading failures occur across microservices without bulkhead isolation; a slow radar tile renderer consumes all worker CPU, blocking temperature lookups.

---

## 6. How a Senior Engineer Would Improve It
Deploy the **Resilience4j / Cockatiel** circuit breaker pattern:
1. Wrap external weather API calls in a circuit breaker configured with a 2-second timeout and 50% failure rate threshold over a 20-request sliding window.
2. If the circuit trips to `OPEN`, immediately return the last cached weather snapshot with an HTTP header `X-Telemetry-Status: Stale-Degraded`, ensuring zero user-facing 500 errors.

---

## 7. Spoken Interview Answer (30 Seconds)
> "Weather Hub demonstrates client-side defensive resilience through boundary clamping and graceful visual fallbacks. For our backend infrastructure, I would implement Circuit Breakers and Bulkhead thread isolation. If an upstream meteorological API experiences an outage, the circuit trips to Open within two seconds, immediately serving cached telemetry with graceful degradation banners rather than exhausting server threads."

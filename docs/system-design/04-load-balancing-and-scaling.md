# 14.4 Load Balancing, Autoscaling & High Availability

```mermaid
flowchart TD
    DNS["Global Anycast DNS (AWS Route 53)"] --> LB["Layer 7 Application Load Balancer (AWS ALB / Nginx)"]
    LB -->|Least Connections Algorithm| Node1["Telemetry Node 1 (Docker Container)"]
    LB -->|Least Connections Algorithm| Node2["Telemetry Node 2 (Docker Container)"]
    LB -->|Autoscaling Group (CPU > 70%)| NodeN["Telemetry Node N (Dynamic Scaling)"]
    Node1 & Node2 & NodeN --> Health["Health Check Daemon (/healthz 200 OK)"]
```

---

## 1. What It Is in Plain Words
Load balancing distributes incoming client network traffic across a pool of redundant backend application servers to prevent any single server from becoming overwhelmed, ensuring fault tolerance and zero-downtime operation.

---

## 2. Whether and How THIS Project Uses It
In the current single-file repository, **load balancing is handled automatically at the Edge layer** by Cloudflare / GitHub Pages / Vercel Anycast edge routers. There is no custom load balancer hardware or Nginx proxy configured in the repository.

---

## 3. Load Balancing Algorithms & Layer Comparison

| Layer / Algorithm | OSI Layer | Inspection Depth | Performance Overhead | Best Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Layer 4 (L4 / TCP/UDP)** | Transport Layer | IP address & TCP port only | Ultra-high throughput (Sub-millisecond)| Raw packet forwarding, WebSockets |
| **Layer 7 (L7 / HTTP)** | Application Layer | Headers, cookies, URL paths | Moderate (TLS termination required) | Path-based routing (`/api/weather`) |
| **Round Robin** | L4 / L7 | Cycles sequentially | Zero CPU overhead | Homogeneous servers with equal jobs |
| **Least Connections** | L4 / L7 | Directs to server with fewest active sockets | Low overhead | Variable-length weather telemetry queries |
| **IP Hash / Consistent Hash**| L4 / L7 | Hashes client IP to fixed node | Low overhead | Sticky caching without Redis session sharing |

---

## 4. Single Points of Failure (SPOF) Audit & Mitigation

| Potential SPOF in System | Consequence of Failure | Mitigation Architecture |
| :--- | :--- | :--- |
| **Single External CDN (CDNJS)** | `VanillaTilt` fails to load; card tilt breaks | Implement fallback loading script to self-hosted asset; add multi-CDN failover. |
| **Single Image Host (`placehold.co`)** | Radar graphics return 404 | Host static graphics on redundant AWS S3 buckets replicated across multi-region US/EU zones. |
| **Single Origin Server (Production)**| Complete service blackout | Provision Multi-AZ (Availability Zone) autoscaling groups behind an AWS Application Load Balancer. |

---

## 5. What Breaks at 10x, 100x, and 1000x Load
- **10x Load:** CDN absorbs traffic effortlessly.
- **100x Load:** A single backend origin server crashes due to thread pool exhaustion; autoscaling triggers new containers in 90 seconds, but users experience timeouts during scale-up.
- **1000x Load:** Single-region data centers experience bandwidth saturation; Anycast DNS routing across geographically distributed edge nodes (US East, US West, Europe, Asia) is required.

---

## 6. How a Senior Engineer Would Improve It
Deploy a **Layer 7 Application Load Balancer** with:
1. **Health Check Probes:** Poll `/healthz` every 5 seconds. If a node fails 2 consecutive checks, remove it from the pool in under 10 seconds.
2. **Autoscaling Policies:** Target tracking on Average Request Latency ($< 80\text{ms}$) and CPU utilization ($> 70\%$).
3. **Zero-Downtime Blue/Green Deployments:** Route 10% of canary traffic to newly deployed containers before full rollout.

---

## 7. Spoken Interview Answer (30 Seconds)
> "Weather Hub's static assets are currently distributed across global edge CDN points, providing inherent layer-4 Anycast load balancing. When scaling the dynamic backend, I would implement a Layer 7 Application Load Balancer using a Least Connections algorithm. This guarantees optimal traffic distribution for varying telemetry payload sizes, while multi-AZ autoscaling and automated health check probes eliminate single points of failure."

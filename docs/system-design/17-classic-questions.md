# 14.17 Classic System Design Problems Applied to Weather Hub

```mermaid
mindmap
  root((System Designs))
    Weather Hub Domain
      Scale to 100x
      Severe Storm Push Notifications
      City Search Autocomplete
      Radar Tile Rasterization
      Redis Token Bucket Rate Limiter
      Cached LLM Advisory Pipeline
    General Building Blocks Reused
      URL Shortener
      Real-Time Chat System
      Social News Feed
```

---

## 1. Design Weather Hub at 100x Current Scale (10,000,000 DAU)

### Requirements & Estimation
- **Traffic:** 10M DAU $\times$ 2 sessions = 20M requests/day $\approx$ **231 QPS average, 700 QPS peak**.
- **Bandwidth:** $700 \text{ QPS} \times 1.2\text{ KB} \approx 840 \text{ KB/s} \approx 6.7 \text{ Mbps}$.
- **Storage:** Persisting hourly rollups for 20,000 global cities $\approx$ **87 GB/year**.

### High-Level Architecture
```mermaid
flowchart TD
    Client["Global Clients"] --> Anycast["Anycast Edge CDN (Cloudflare)"]
    Anycast -->|Static Assets Hit| EdgeCache["Edge Cache (99% Hit Rate)"]
    Anycast -->|Dynamic API Route| ALB["Layer 7 Application Load Balancer"]
    ALB --> Gateway["API Gateway Pods (Go / Envoy)"]
    Gateway --> RedisCluster[("Redis Cluster (6 Shards)")]
    RedisCluster -->|Miss| TelemetrySvc["Telemetry Ingestion Service"]
    TelemetrySvc --> Timescale[("TimescaleDB Primary + Read Replicas")]
```

### Deep Dive & Bottlenecks
- **Bottleneck:** High write concurrency during nationwide storm updates.
- **Solution:** Hypertables partitioned by location and time. Writes are batched into 100-record chunks using a Kafka ingestion buffer, reducing disk IOPS by 90%.

---

## 2. Design a Severe Weather Notification System

### Requirements & Estimation
- Deliver push notifications (SMS, Web Push, Mobile) to 500,000 users in an active hurricane zone within **60 seconds** of National Weather Service alert issuance.

### Architecture Flow
```mermaid
sequenceDiagram
    autonumber
    participant NOAA as National Weather Service
    participant Ingest as Alert Ingestion Service
    participant Kafka as Apache Kafka Topic
    participant Dispatcher as Notification Dispatcher Workers
    participant AppleGoogle as APNs / FCM Push Services
    participant User as User Mobile & Web Clients
    
    NOAA->>Ingest: Emergency Alert Polygon (GeoJSON)
    Ingest->>Kafka: Publish to 'severe-alerts.emergency'
    Kafka->>Dispatcher: Fan-out to 50 Consumer Workers
    Dispatcher->>Dispatcher: Query users within polygon via PostGIS (ST_Contains)
    Dispatcher->>AppleGoogle: Batch send to 500,000 FCM tokens
    AppleGoogle-->>User: Urgent Notification displayed on lock screen (< 15s)
```

---

## 3. Design a URL Shortener (Reusing Project Building Blocks)

### Architecture
- **Encode:** Convert integer auto-increment ID to Base62 string (`[0-9a-zA-Z]`).
- **Storage:** Key-value mapping stored in Redis for hot lookups with persistent fallback in PostgreSQL.
- **Redirect:** HTTP `301 Moved Permanently` (browser caches redirect) or `302 Found` (allows analytics tracking on every click).

---

## 4. Design a Real-Time Chat System (Reusing Project Building Blocks)

### Architecture
- **Protocol:** WebSockets with fallback to HTTP long-polling.
- **Connection Management:** Ephemeral Node.js socket servers connected to a **Redis Pub/Sub** cluster backplane.
- **Message Persistence:** Apache Cassandra or ScyllaDB for append-heavy, immutable chat history partitioned by `(room_id, message_id)`.

---

## 5. Spoken Interview Answer (30 Seconds)
> "Whether designing Weather Hub's severe weather alert engine, a URL shortener, or a real-time chat system, the underlying distributed building blocks remain consistent: stateless worker nodes behind Layer 7 load balancers, multi-layer caching with Redis to absorb reads, append-only event queues like Kafka for asynchronous fan-out, and partitioned storage engines tuned to the specific access pattern."

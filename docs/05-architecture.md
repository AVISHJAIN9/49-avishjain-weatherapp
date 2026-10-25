# 05. System Architecture, Data Lifecycle & Scaling Evolution

```mermaid
flowchart TB
    subgraph ClientLayer["Client Runtime Architecture (Browser Engine)"]
        direction TB
        DOMTree["DOM Viewport (HTML5 Semantic Tree)"]
        
        subgraph LogicLayer["Vanilla JS Engine (Single-Threaded Event Loop)"]
            InitCycle["DOMContentLoaded Lifecycle Hook"]
            MockPipeline["mockFetchWeather() Pipeline"]
            UVEngine["UV Index State Controller"]
            RadarEngine["Radar Coordinate Tracking Engine"]
            VanillaTiltHook["VanillaTilt Parallax Instance"]
        end

        subgraph StyleCompositor["CSS3 & Hardware Compositor Engine"]
            GlassTokens["Glassmorphic Tokens (.card-bg)"]
            CSSVars["CSS Variables (--zoom-x, --zoom-y)"]
            Transform3D["3D Transform Matrix (preserve-3d / rotateY)"]
            FocusShader["Optical Focus-Blur Shaders (:not(:hover))"]
        end

        DOMTree --> InitCycle
        InitCycle --> MockPipeline
        InitCycle --> UVEngine
        InitCycle --> VanillaTiltHook
        DOMTree --> RadarEngine
        RadarEngine --> CSSVars
        CSSVars --> StyleCompositor
        Transform3D --> StyleCompositor
        FocusShader --> StyleCompositor
    end

    subgraph CDNPipeline["Edge Delivery & CDN Infrastructure"]
        TailwindCDN["Tailwind Labs CDN (Cloudflare Edge)"]
        TiltCDN["CDNJS (Cloudflare Edge)"]
        AssetCDN["Placehold.co Graphic Assets"]
    end

    TailwindCDN -.-> DOMTree
    TiltCDN -.-> VanillaTiltHook
    AssetCDN -.-> StyleCompositor
```

---

## 1. High-Level Architecture Overview

Weather Hub is engineered as an **Event-Driven Client-Side Single Page Application (SPA)**. It enforces a strict separation between:
1. **The Structural DOM Layer:** Clean semantic HTML5 elements structured into five intuitive sections (`#main-nav`, `#current`, `#forecast`, `#radar`, `#locations`).
2. **The Logic & State Controller Layer:** Vanilla ECMAScript running on the browser's native JavaScript V8/JavaScriptCore engine, managing localized state, date-time formatting, and event listener pipelines.
3. **The Hardware-Accelerated Presentation Layer:** Advanced CSS3 utilizing GPU-promoted composite layers, custom properties, and matrix transforms to handle complex animations with zero main-thread blocking.

---

## 2. End-to-End Request & Interaction Lifecycles

### Lifecycle 1: Page Mount & Data Hydration Cycle
```mermaid
sequenceDiagram
    autonumber
    participant Browser as Browser Window
    participant DOM as Document Object Model
    participant Script as App Engine (index.html)
    participant Tilt as VanillaTilt Library
    
    Browser->>DOM: Parse HTML Document
    DOM->>Script: Dispatch DOMContentLoaded Event
    Script->>Script: Run mockFetchWeather()
    Script->>DOM: Inject Locale Date/Time string
    Script->>DOM: Populate #current-temp (24°C), High/Low (28°/18°)
    Script->>DOM: Generate 5x forecast day cards in #forecast-grid
    Script->>Tilt: Call VanillaTilt.init(#weather-details)
    Tilt->>DOM: Bind requestAnimationFrame mouse tracking
    Script->>Script: Call updateUvDisplay()
    Script->>DOM: Set initial UV score (5) and class ("text-yellow-400")
```

---

### Lifecycle 2: Real-Time Radar Zoom Tracking
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant RadarMap as #radar-map Container
    participant Handler as handleZoom(e)
    participant CSSVars as CSS Custom Properties
    participant Pseudo as ::after Magnifier Layer
    
    User->>RadarMap: mousemove event occurs
    RadarMap->>Handler: Pass event (offsetX, offsetY, offsetWidth, offsetHeight)
    Handler->>Handler: Calculate percentX = (offsetX / offsetWidth) * 100
    Handler->>Handler: Calculate percentY = (offsetY / offsetHeight) * 100
    Handler->>CSSVars: Set --zoom-x = percentX%, --zoom-y = percentY%
    Handler->>CSSVars: Set --display-opacity = 1
    CSSVars->>Pseudo: Update background-position directly on GPU layer
    Pseudo-->>User: Magnified 250% view rendered under cursor
    User->>RadarMap: mouseleave event occurs
    RadarMap->>Handler: Trigger hideZoom()
    Handler->>CSSVars: Set --display-opacity = 0 (Smooth 0.3s CSS fade)
```

---

### Lifecycle 3: UV Index State Mutation Cycle
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Button as #uv-increment-btn
    participant State as uvIndex (Module Variable)
    participant Evaluator as getUvRating(index)
    participant DOM as #uv-index-display & #uv-rating
    
    User->>Button: Click '+'
    Button->>State: uvIndex = Math.min(uvIndex + 1, 11)
    State->>Evaluator: Evaluate tier thresholds
    Evaluator-->>State: Return { text: "High", color: "text-orange-400" }
    State->>DOM: Update textContent = "6"
    State->>DOM: Update className = "text-2xl mt-2 font-bold text-orange-400"
    DOM-->>User: Immediate paint with zero layout reflow
```

---

## 3. Database Schema Blueprint (Backend Expansion Roadmap)

While Weather Hub currently executes entirely client-side with mock data, scaling to a multi-user production system requires a relational or time-series data layer.

### Entity Relationship Diagram
```mermaid
erDiagram
    LOCATION ||--o{ WEATHER_SNAPSHOT : records
    LOCATION ||--o{ UV_RECORD : logs
    LOCATION ||--o{ RADAR_TILE : displays
    USER ||--o{ USER_BOOKMARK : saves
    LOCATION ||--o{ USER_BOOKMARK : referenced_in

    LOCATION {
        uuid id PK
        string cityName
        string countryCode
        decimal latitude
        decimal longitude
        string timezone
    }

    WEATHER_SNAPSHOT {
        uuid id PK
        uuid locationId FK
        timestamp recordedAt
        decimal temperature
        decimal feelsLike
        decimal highTemp
        decimal lowTemp
        string condition
        decimal humidity
        decimal windSpeed
    }

    UV_RECORD {
        uuid id PK
        uuid locationId FK
        timestamp recordedAt
        decimal uvScore
        string severityTier
    }

    USER {
        uuid id PK
        string email
        string passwordHash
        timestamp createdAt
    }

    USER_BOOKMARK {
        uuid userId FK
        uuid locationId FK
        int displayOrder
    }
```

---

## 4. Caching & Invalidation Architecture

```mermaid
flowchart LR
    BrowserCache["Browser HTTP Cache (Images & CDN Scripts)"] --> CDNCache["Edge CDN Cache (Cloudflare / Fastly)"]
    CDNCache --> AppCache["Application Redis Cache (Telemetry TTL 600s)"]
    AppCache --> DB["PostgreSQL / Weather Service"]
```

1. **Client Browser Cache:**
   - Static assets (`vanilla-tilt.min.js`, Tailwind script, graphics) cached with `Cache-Control: public, max-age=31536000, immutable`.
2. **Edge CDN Layer:**
   - Caches HTML and edge-rendered weather summaries with a 60-second Stale-While-Revalidate (SWR) window.
3. **Redis Telemetry Cache (Production Roadmap):**
   - In-memory key-value store caching live meteorological API responses with 10-minute TTL (`weather:{city_id}:current`), protecting external vendor API rate limits.

---

## 5. Scaling to 100x Traffic: Bottlenecks & Remedies

| Bottleneck Stage | Identified Vulnerability | Architectural Remedy |
| :--- | :--- | :--- |
| **1. CDN Rate Limiting & Bandwidth** | Play CDN (`cdn.tailwindcss.com`) compiling CSS in hundreds of thousands of client browsers | Pre-compile Tailwind CSS at build time into a minified 5KB static stylesheet served via multi-region CDN (Cloudflare). |
| **2. Third-Party Placeholder Failures** | Remote image links on `placehold.co` rate-limiting or going offline under heavy load | Host optimized WebP/SVG weather icons and radar raster graphics directly on an AWS S3 bucket fronted by CloudFront. |
| **3. Upstream Weather API Quotas** | Direct client-to-API calls exhausting 60 req/min free tier limits on live APIs | Introduce an Edge API Gateway with Redis caching and batching: fetch weather once per city every 10 minutes and broadcast to millions of users. |

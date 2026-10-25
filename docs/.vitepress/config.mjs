import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Weather Hub Docs',
    description: 'Production-grade Interview-Ready Technical Documentation for Weather Hub Next-Gen Dashboard',
    appearance: 'dark',
    base: '/',
    themeConfig: {
      nav: [
        { text: 'Guide', link: '/00a-project-analysis' },
        { text: 'Features', link: '/01-features' },
        { text: 'Architecture', link: '/05-architecture' },
        { text: 'System Design', link: '/system-design/README' },
        { text: 'Comparisons', link: '/04-tech-comparisons' },
        { text: 'Interview Q&A', link: '/09-interview-qa' },
        { text: 'Master Checklist', link: '/13-master-checklist' }
      ],
      sidebar: [
        {
          text: 'Project Overview & Planning',
          items: [
            { text: '00. Project Type Detection', link: '/00-project-type' },
            { text: '00a. Deep Project Analysis', link: '/00a-project-analysis' },
            { text: '00b. Project Pitch (30s & 2m)', link: '/00b-project-pitch' },
            { text: '00. Project Map & File Tree', link: '/00-project-map' },
            { text: '02. Step-by-Step Build Order', link: '/02-build-order' }
          ]
        },
        {
          text: 'Features Deep Dive',
          items: [
            { text: '01. Features Inventory', link: '/01-features' },
            { text: 'F1: Hero Current Weather Card', link: '/features/f1-hero-current-weather' },
            { text: 'F2: Interactive UV Index Tracker', link: '/features/f2-interactive-uv-index' },
            { text: 'F3: 5-Day Forecast (Focus Blur)', link: '/features/f3-dynamic-5day-forecast' },
            { text: 'F4: Live Radar Zoom & Magnifier', link: '/features/f4-radar-zoom-magnifier' },
            { text: 'F5: 3D Global Weather Carousel', link: '/features/f5-3d-cylindrical-carousel' },
            { text: 'F6: CSS Sliding Pill Navbar', link: '/features/f6-css-animated-navbar' },
            { text: '14. Say It Out Loud Scripts', link: '/14-say-it-out-loud' }
          ]
        },
        {
          text: 'Technical Deep Dives',
          items: [
            { text: '03. API & Network Reference', link: '/03-api-reference' },
            { text: '04. Tech Choice Comparisons', link: '/04-tech-comparisons' },
            { text: '05. Architecture & Data Lifecycle', link: '/05-architecture' },
            { text: '06. Security & OWASP Audit', link: '/06-security' },
            { text: '07. AI Integration Deep Dive', link: '/07-ai-integration' },
            { text: '08. Quality, Ops & CI/CD', link: '/08-quality-and-ops' }
          ]
        },
        {
          text: 'System Design Deep Dive',
          items: [
            { text: 'System Design Overview', link: '/system-design/README' },
            { text: '14.1 Requirements & Estimation', link: '/system-design/01-requirements-and-estimation' },
            { text: '14.2 Architecture Styles', link: '/system-design/02-architecture-styles' },
            { text: '14.3 Networking & CDN', link: '/system-design/03-networking-and-communication' },
            { text: '14.4 Load Balancing & Scaling', link: '/system-design/04-load-balancing-and-scaling' },
            { text: '14.5 Databases & Persistence', link: '/system-design/05-databases-and-storage' },
            { text: '14.6 Client & Edge Caching', link: '/system-design/06-caching' },
            { text: '14.7 Messaging & Async Streams', link: '/system-design/07-messaging-and-async' },
            { text: '14.8 Concurrency & Distribution', link: '/system-design/08-consistency-and-distributed-systems' },
            { text: '14.9 Reliability & Resilience', link: '/system-design/09-reliability-and-resilience' },
            { text: '14.10 API Design & Rate Limiting', link: '/system-design/10-api-design-and-rate-limiting' },
            { text: '14.11 Security Architecture', link: '/system-design/11-security-architecture' },
            { text: '14.12 Search & AI Architecture', link: '/system-design/12-search-and-ai-architecture' },
            { text: '14.13 Real-Time Protocols', link: '/system-design/13-real-time-systems' },
            { text: '14.14 Observability & Telemetry', link: '/system-design/14-observability-and-operations' },
            { text: '14.15 Performance Engineering', link: '/system-design/15-performance-engineering' },
            { text: '14.16 Cost & Cloud Economics', link: '/system-design/16-cost-and-tradeoffs' },
            { text: '14.17 Classic System Designs', link: '/system-design/17-classic-questions' },
            { text: '14.18 Design Decisions Log', link: '/system-design/decisions' }
          ]
        },
        {
          text: 'Interview Readiness & Verification',
          items: [
            { text: '09. 150+ Interview Q&A', link: '/09-interview-qa' },
            { text: '10. Gaps & Improvements', link: '/10-gaps-and-improvements' },
            { text: '11. Comprehensive Glossary', link: '/11-glossary' },
            { text: '12. Confirm with Developer List', link: '/12-confirm-list' },
            { text: '13. 275-Item Master Checklist', link: '/13-master-checklist' },
            { text: 'Doc Index (README)', link: '/README' }
          ]
        }
      ],
      search: {
        provider: 'local'
      },
      outline: [2, 3],
      socialLinks: [
        { icon: 'github', link: 'https://github.com/AVISHJAIN9/avishjain-weatherapp' }
      ]
    },
    mermaid: {
      theme: 'dark'
    }
  })
)

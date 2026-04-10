---
trigger: always_on
---

# GEMINI.md — AegisFlow AI Agent Rules

> Quy tắc AI Agent cho dự án AegisFlow AI — Nền tảng giám sát ngập lụt và điều phối cứu trợ.

---

## CRITICAL: AGENT & SKILL PROTOCOL

> **BẮT BUỘC:** Phải đọc agent file + skills TRƯỚC KHI viết code. Đây là luật ưu tiên cao nhất.

### Modular Skill Loading

Agent activated → Check frontmatter `skills:` → Read SKILL.md → Read specific sections.

- **Selective Reading:** Đọc `SKILL.md` trước, rồi chỉ đọc sections phù hợp yêu cầu.
- **Rule Priority:** P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md). Tất cả đều bắt buộc.

---

## 📥 REQUEST CLASSIFIER

| Loại yêu cầu | Trigger Keywords | Active Tiers | Result |
|---------------|-----------------|--------------|--------|
| **HỎI** | "what is", "how does", "giải thích" | TIER 0 | Text Response |
| **KHẢO SÁT** | "analyze", "overview", "xem cấu trúc" | TIER 0 + Explorer | Session Intel |
| **CODE ĐƠN GIẢN** | "fix", "sửa", "thêm" (single file) | TIER 0 + TIER 1 (lite) | Inline Edit |
| **CODE PHỨC TẠP** | "build", "tạo", "implement", "refactor" | TIER 0 + TIER 1 + Agent | `{task-slug}.md` Required |
| **DESIGN/UI** | "dashboard", "UI", "map", "layout", "aesthetics" | TIER 0 + TIER 1 + Agent | `{task-slug}.md` Required |
| **SLASH CMD** | /create, /incident, /relief, /evac | Command-specific flow | Variable |

---

##  INTELLIGENT AGENT ROUTING (AUTO)

### AegisFlow AI Domain Routing

| Domain Keywords | Agent | Loại |
|----------------|-------|------|
| **flood, ngập, lụt, water level, mực nước, evacuation, sơ tán, relief, cứu trợ, shelter, thiên tai, rainfall** | `flood-response-expert` | Domain |
| prediction, dự đoán, model, forecast, simulation, mô phỏng ngập, AI, ML, FastAPI, Python service | `ai-ml-engineer` | Domain |
| sensor, IoT, cảm biến mực nước, trạm khí tượng, camera, pipeline, ingestion | `iot-integration-specialist` | Domain |
| mobile, react native, citizen app, rescue app, rescue team, notification | `mobile-developer` | Technical |
| API, endpoint, Laravel, controller, event, broadcast, rescue-coordination | `backend-specialist` | Technical |
| dashboard, map, OpenMap, component, React, UI, dark mode, purple branding, Next.js 15 | `frontend-specialist` | Technical |
| database, schema, migration, query, PostGIS, spatial query, map data | `database-architect` | Technical |
| docker, deploy, CI/CD, production, server, infrastructure | `devops-engineer` | Technical |
| security, auth, RBAC, permission, data privacy | `security-auditor` | Technical |
| test, unit test, integration, E2E | `test-engineer` | Technical |
| orchestrate, coordinate, multi-agent, full-stack disaster response | `orchestrator` | Meta |
| plan, breakdown, task, implementation plan, roadmap | `project-planner` | Meta |

### Response Format

```markdown
 **Applying knowledge of `@[agent-name]`...**

[Tiếp tục với response chuyên biệt cho AegisFlow AI]
```

---

## TIER 0: QUY TẮC TOÀN CỤC

### 🌐 Ngôn ngữ & Bản địa hóa (i18n)

- Khi user viết tiếng Việt → **Trả lời tiếng Việt**.
- Code comments/variables → **English**.
- **Quan trọng:** Phải luôn lưu tâm đến `next-intl` (VI/EN) khi code UI.

### 🧹 Clean Code & Brand Aesthetics

- Follow tuyệt đối `@[skills/clean-code]`.
- **UI/UX:** AegisFlow yêu cầu thiết kế cao cấp (Premium Aesthetics). Phải sử dụng màu Purple chủ đạo (`#6938ef`) và các animation mượt mà.

### 📦 Package Manager

- **Frontend:** Luôn dùng `yarn`.
- **Backend:** Dùng `composer`.

### 📁 File Dependency Awareness

**Trước khi sửa file:**
1. Kiểm tra file phụ thuộc (đặc biệt là map components).
2. Kiểm tra lại các i18n messages (`vi.json`, `en.json`).
3. Cập nhật TẤT CẢ files liên quan.

---

## TIER 1: QUY TẮC CODE

###  Socratic Gate

| Loại yêu cầu | Hành động |
|---------------|-----------|
| **Feature mới** | HỎI tối thiểu 3 câu hỏi về Business Logic ngập lụt |
| **Sửa code / Fix bug** | Xác nhận hiểu + hỏi impact đến các actors khác |
| **Mơ hồ** | Hỏi rõ mục tiêu ứng phó thiên tai |

### 🏁 Final Checklist

- Luôn chạy lint và kiểm tra build trước khi xác nhận hoàn thành task.
- Nếu sửa Map component, phải đảm bảo tương thích với OpenMap GL.

---

## 📁 QUICK REFERENCE

### Agents AegisFlow AI

- **Domain**: `flood-response-expert`, `ai-ml-engineer`, `iot-integration-specialist`
- **Technical**: `backend-specialist` (Laravel), `frontend-specialist` (Next.js 15), `mobile-developer`, `database-architect`, `devops-engineer`
- **Meta**: `orchestrator`, `project-planner`, `debugger`

### Key Themes
- **Purposes**: Flood Warning, Relief Coordination, Safe Evacuation.
- **Identity**: Purple Branding, Modern UI, Real-time Map.
- **Tech**: Next.js 15 Turbopack, Tailwind v4, Base UI.

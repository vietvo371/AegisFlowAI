# AegisFlow AI — Agent Architecture

> Cấu hình AI Agent cho nền tảng AI hỗ trợ chính quyền đô thị và cộng đồng ứng phó thiên tai, ngập lụt.

---

## 📋 Tổng quan Dự án

**AegisFlow AI** là hệ sinh thái AI hỗ trợ quản lý thiên tai và ngập lụt sớm:
- **Giám sát realtime** mực nước và lượng mưa qua mạng lưới IoT/Cảm biến.
- **Dự báo ngập lụt** chính xác theo từng khu vực dựa trên mô hình Deep Learning.
- **Đề xuất hành động** cụ thể: Tuyến sơ tán an toàn, điểm tập kết, cảnh báo sớm.
- **Điều phối cứu trợ** tối ưu hóa nguồn lực cho các đội cứu hộ.

### Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | Laravel 11+ (PHP 8.3) |
| Frontend | Next.js 15 (App Router) + OpenMap GL |
| UI/UX | Tailwind CSS v4 + Base UI + shadcn/ui |
| AI/ML | Python FastAPI (Flood Prediction Models) |
| Database | PostgreSQL 16 + PostGIS |
| Cache/Queue | Redis + Laravel Horizon |
| Message Broker | Kafka + MQTT |
| WebSocket | Soketi (Laravel Echo) |
| Container | Docker Compose |
| Mobile | React Native CLI (Citizen & Rescue App) |

### Actors

| Actor | Vai trò |
|-------|---------|
| City Admin | Quản trị toàn bộ, theo dõi bản đồ ngập lụt cấp thành phố |
| Rescue Teams | Nhận điều phối cứu trợ, xem tuyến đường an toàn |
| Citizen | Cập nhật tình hình ngập, báo cá sự cố, nhận cảnh báo sơ tán |
| Operator AI | Theo dõi và xác nhận các dự báo từ mô hình AI |

---

## 🏗️ Cấu trúc thư mục Agent

```plaintext
.agent/
├── ARCHITECTURE.md          # File này
├── agents/                  # 21 Agent chuyên biệt
├── skills/                  # Các module kiến thức (clean-code, api-patterns...)
├── rules/                   # Quy tắc toàn cục (GEMINI.md)
└── scripts/                 # Scripts kiểm tra và validation
```

---

## 🤖 Agents (21)

### Domain Agents — Chuyên môn AegisFlow AI (3)

| Agent | Focus | Mô tả |
|-------|-------|-------|
| `flood-response-expert` | Ngập lụt & Cứu trợ | Phân tích mực nước, tuyến sơ tán, điều phối cứu hộ, business logic thiên tai |
| `ai-ml-engineer` | Dự báo ngập lụt | Mô hình dự báo lượng mưa, mức độ ngập lụt theo thời gian thực |
| `iot-integration-specialist` | Sensor mạng lưới | Tích hợp cảm biến mực nước, trạm khí tượng, camera giám sát ngập |

### Technical Agents — Triển khai kỹ thuật (8)

| Agent | Focus | Skills |
|-------|-------|--------|
| `backend-specialist` | Laravel API | api-patterns, database-design, event-broadcasting |
| `frontend-specialist` | Next.js + OpenMap | react-best-practices, frontend-design, purple-branding |
| `mobile-developer` | React Native (Citizen/Rescue) | mobile-design, push-notifications |
| `database-architect` | PostgreSQL + PostGIS | spatial-queries, database-optimization |
| `orchestrator` | Phối hợp đa agent | complex-flows, multi-domain-logic |
| `devops-engineer` | Infra & Kubernetes | deployment-procedures, docker-management |
| `security-auditor` | Bảo mật & RBAC | security-protocols, data-privacy |
| `test-engineer` | Kiểm thử chất lượng | unit-testing, e2e-testing |

### Support Agents (10)
- Tập trung vào quản lý dự án, tài liệu, tối ưu hóa và gỡ lỗi.

---

## 🔄 Công cụ & Slash Commands

| Command | Ngữ cảnh AegisFlow |
|---------|-------------------|
| `/incident` | Xử lý sự cố (ngập lụt, sạt lở, cứu nạn) |
| `/simulate` | Mô phỏng kịch bản ngập lụt theo mực nước dự báo |
| `/relief` | **[MỚI]** Lập kế hoạch phân bổ cứu trợ |
| `/evac` | **[MỚI]** Tính toán tuyến sơ tán an toàn nhất |
| `/ui-ux-pro-max` | Thiết kế giao diện Dashboard theo Brand AegisFlow |

---

## 🎯 Ghi chú Quan trọng

- **OpenMap GL**: Sử dụng chính thay cho Mapmapbox.
- **Branding**: Sử dụng màu Purple/Indigo làm màu nhận diện chính (`#6938ef`).
- **i18n**: Support đa ngôn ngữ (VI/EN) trên toàn hệ thống.

# 🏗️ Construction Management App

A full-stack construction project management system built with **React**, **Node.js**, **Express**, and **MongoDB**.

## ✨ Features

### 📐 Drawing Analysis & Material Estimation
- Upload Architectural, Structural, Plumbing, and Electrical drawings
- Rule-based material calculator:
  - **Structural**: TMT Steel, Cement, Bricks/Blocks, Concrete (RMC), Sand
  - **Plumbing**: CPVC/uPVC pipes, fittings, bath fittings, kitchen sinks
  - **Electrical**: Wiring cables, conduits, switches, sockets, MCB panels
- Material estimates saved to project requirements automatically

### 📦 Material Management
- Material inventory tracking (current stock vs minimum stock)
- Low stock alerts
- Project-wise material requirements dashboard
  - Total Required vs. Ordered vs. Delivered (with progress bars)
  - Category-wise and supplier-wise breakdown

### 🔄 Order Workflow (End-to-End)
```
Request (Engineer/Contractor)
    → Approval (Director/Builder/Chairperson)
    → Send to Vendor + Email notification
    → Vendor Accept/Reject
    → Dispatch (Driver name, vehicle number, phone)
    → Delivery (Challan upload + Photo upload)
    → Engineer Digital Signature
    → Confirmed
```

### 👥 User Roles (15 roles)
| Role | Access |
|------|--------|
| Chairperson | Highest approval authority |
| Director | Approve orders, manage projects |
| Builder | Project oversight |
| Site Engineer | Place orders, receive deliveries |
| Civil Contractor | Request materials |
| Plumbing Contractor | Request materials |
| Color Contractor | Request materials |
| Lift Contractor | Request materials |
| Electric Contractor | Request materials |
| **Tile Contractor** | Request materials |
| **ACP Contractor** | Request materials |
| **Aluminium Contractor** | Request materials |
| **Door & Lock Contractor** | Request materials |
| Vendor | Accept orders, add dispatch details |
| Delivery Operator | Upload challan & photos |

### 🏪 Vendor Management
14 material categories including:
- Steel & Structure, Bricks & Blocks, Concrete/RMC
- Plumbing Pipes & Fittings
- **Bath Fittings & Ceramic** _(new)_
- Electrical Cables & Accessories
- Tiles & Ceramic, ACP Panels
- Aluminium & Glass, Doors & Locks
- Paint & Chemicals

### 📊 Dashboard & Reports
- KPI cards, monthly orders trend chart
- Orders by status (pie chart)
- Vendor-wise order count
- Material categories breakdown

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/pnpratik/ConstructionApp.git
cd ConstructionApp

# 2. Install all dependencies
npm run install:all

# 3. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env and set MONGO_URI, JWT_SECRET, SMTP settings

# 4. Seed demo data
npm run seed

# 5. Start backend (Terminal 1)
npm run dev:backend

# 6. Start frontend (Terminal 2)
npm run dev:frontend
```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 🔐 Demo Credentials
All demo accounts use password: `demo1234`

| Role | Email |
|------|-------|
| Chairperson | chairperson@demo.com |
| Director | director@demo.com |
| Site Engineer | engineer@demo.com |
| Civil Contractor | civil@demo.com |
| Tile Contractor | tile@demo.com |
| Vendor | vendor@demo.com |
| Delivery Operator | delivery@demo.com |

---

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| Email | Nodemailer |
| Charts | Recharts |
| Icons | Lucide React |

---

## 📁 Project Structure
```
ConstructionApp/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── middleware/       # JWT auth, Multer upload
│   ├── models/          # 10 Mongoose models
│   ├── routes/          # 10 API route files
│   └── utils/           # Email, calculator, notifications, seed
└── frontend/
    └── src/
        ├── api/          # Axios instance
        ├── components/   # Layout, Sidebar, Navbar, common UI
        ├── context/      # Auth & Notification contexts
        └── pages/        # 20+ pages
```

---

*Built with ❤️ for Construction Project Management*

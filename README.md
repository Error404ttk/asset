# ระบบสำรวจครุภัณฑ์คอมพิวเตอร์ (Computer Asset Survey System)

โปรเจคสำหรับบริหารจัดการและสำรวจครุภัณฑ์คอมพิวเตอร์ประจำปี

## Features
- จัดการข้อมูลครุภัณฑ์ (เพิ่ม/ลบ/แก้ไข)
- ระบบบันทึกการซ่อมบำรุง
- ระบบจัดการผู้ใช้งาน (User Management)
- Audit Log ติดตามการใช้งาน
- รายงานและการส่งออกข้อมูล
- **Save Animation:** แจ้งเตือนสถานะการบันทึกที่สวยงาม

## Getting Started

### Prerequisites
- Node.js
- MySQL Database

### Installation

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```

2. Configure Database:
   - Create a MySQL database
   - Import `database.sql` (if available) or let the system auto-migrate.

3. Environment Variables:
   - Create `.env` in `server/` folder with DB credentials.

4. Run:
   ```bash
   # Development
   npm run dev

   # Production (using PM2)
   pm2 start ecosystem.config.cjs
   ```

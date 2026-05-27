<div align="center">
  <img src="./apps/web/public/som.svg" alt="Fomz Logo" width="200" />
</div>

<h1 align="center">Fomz</h1>

<div align="center">
  <img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express" />
  <img src="https://img.shields.io/badge/tRPC-%232596BE.svg?style=for-the-badge&logo=tRPC&logoColor=white" alt="tRPC" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/Turborepo-%23EF4444.svg?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/AlmaLinux-%23005571.svg?style=for-the-badge&logo=almalinux&logoColor=white" alt="AlmaLinux" />
</div>

<br/>

## The Problem

Let's face it: **traditional forms are incredibly lengthy, boring, and tedious.** Whether it's a survey, a feedback form, or an application, presenting a user with a massive wall of inputs inevitably leads to fatigue. Many people simply close the tab rather than fill them up, resulting in massive drop-off rates and lost data for creators.

## The Solution: Fomz

**Fomz** completely reimagines the data collection experience. Instead of an overwhelming wall of fields, Fomz uses an **interactive, beautiful, slide-by-slide format**. 

By breaking down complex data entry into bite-sized, single-question interactions, we eliminate cognitive overload. The UI is heavily focused on sleek aesthetics, micro-animations (powered by Framer Motion), and keyboard-friendly navigation. This creates an experience that feels less like a chore and more like an engaging conversation. 

Whether you are creating a quick feedback quiz or a comprehensive application, Fomz ensures your respondents stay engaged from the first question to the final submit button—drastically increasing your conversion and completion rates.

---

## Gallery

*(Note: Replace these image placeholders with your actual screenshot URLs)*

<div align="center">
  <!-- Big Landing Screenshot -->
  <img src="./public/placeholder_landing_large.png" alt="Fomz Landing Page" width="100%" />
</div>
<br/>
<div align="center">
  <!-- Side-by-Side Screenshots -->
  <img src="./public/placeholder_dash.png" alt="Dashboard" width="49%" />
  <img src="./public/placeholder_quiz.png" alt="Quiz Format" width="49%" />
</div>

---

## Quick Start Guide

Follow these simple instructions to get the Fomz monorepo running on your local machine.

### System Prerequisites
To successfully run this project locally, your system **must have** the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (Package manager used for this monorepo)
- **Docker & Docker Compose** (Required for the database and Redis instances)

### Step 1: Clone and Install
First, clone the repository and install all dependencies via `pnpm`:

```bash
git clone https://github.com/your-username/fomz.git
cd fomz
pnpm install
```

### Step 2: Environment Setup
The project uses a `.env` file at the root level for configuration. You can use the provided template to get started. Make sure your `.env` file is populated with your required secrets (OAuth, SMTP, Cloudinary, Database connection, etc.).

### Step 3: Start Infrastructure (Docker)
We use Docker to easily spin up our PostgreSQL database and Redis (Valkey) instance. Run the following command at the root of the project:

```bash
docker-compose up -d
```
*This starts the containers in detached mode.*

### Step 4: Database Initialization
With the database running, you need to generate the Prisma client and run the migrations to set up the tables:

```bash
pnpm run db:generate
pnpm run db:migrate
```

### Step 5: Start the Development Server
Everything is ready! Start the Turborepo development server to run both the frontend web app and backend API concurrently:

```bash
pnpm run dev
```

---

## Local Navigation

Once the development server is up and running, you can access the different parts of the application here:

- 🌐 **Web Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- ⚙️ **API Backend (Express):** [http://localhost:8000/api](http://localhost:8000/api)
- 📚 **Scalar API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
<div align="center">
  <br/>
  <p>\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/\\[T]/</p>
  <p>Made with a lot of coffee and love ❤️</p>
  <p>Praise the Sun! ☀️</p>
  
</div>

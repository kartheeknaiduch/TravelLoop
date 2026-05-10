# 🌍 Traveloop

> Your Ultimate Companion for Seamless Trip Planning and Itinerary Management.

Traveloop is a highly scalable, full-stack web application meticulously engineered to simplify the complex process of travel planning. Whether you're planning a quick weekend getaway or a multi-country expedition, Traveloop provides an intuitive, centralized hub to manage every aspect of your journey. From mapping out multi-stop itineraries and curating daily activities to maintaining packing checklists and sharing your adventures with a community of travelers, Traveloop ensures you spend less time planning and more time exploring.

---

## 🌟 Comprehensive Feature Set

### 🔐 Authentication & Security
- **Secure User Accounts:** Robust registration and login flows.
- **Personalized Profiles:** Users can manage their personal details, track past and upcoming trips, and view their travel statistics.
- **Role-Based Access Control (RBAC):** Distinct permissions for regular users and administrators.

### 🗺️ Advanced Trip Planning
- **Trip Dashboard:** A bird's-eye view of all your planned, ongoing, and completed trips.
- **Multi-Stop Itineraries:** Architect complex journeys by adding sequential stops (cities). Organize travel dates and duration for each leg of the trip.
- **Status Tracking:** Mark trips as 'Planning', 'Upcoming', 'Ongoing', or 'Completed'.

### 🧗‍♀️ Activity & Itinerary Management
- **Curated City Guides:** Explore top-rated activities, landmarks, and experiences available in specific cities.
- **Stop Activities:** Seamlessly assign activities to specific stops within your trip.
- **Drag-and-Drop Organization:** (Where applicable) Organize your daily schedule efficiently.

### 🎒 Travel Organization Tools
- **Smart Checklists:** Create customized packing lists, pre-trip task lists, and to-dos. Check items off as you go to ensure nothing is forgotten.
- **Collaborative Trip Notes:** A rich-text note-taking interface to store booking references, flight details, personal journals, and important links.

### 🌐 Community & Social Features
- **Public Trips:** Share your meticulously planned itineraries with the Traveloop community.
- **Inspiration Hub:** Browse public trips from other users to gather ideas for your next adventure.
- **Community Engagement:** Clone, like, or comment on public itineraries (future enhancement).

### 🛡️ Admin Dashboard
- **Centralized Data Management:** Admins can oversee and manage user accounts, platform-wide activities, and destination data.
- **System Health & Analytics:** Track platform usage and monitor database health.

---

## 🛠️ Technology Architecture

Traveloop is constructed using a modern, scalable monorepo approach managed by `pnpm` workspaces, separating the frontend client from the backend services while sharing type definitions and tooling.

### 🎨 Frontend (Client-Side)
The frontend is designed for speed, accessibility, and a premium user experience.
- **Core:** React 18 powered by Vite for lightning-fast HMR and optimized builds.
- **Language:** Strictly typed with TypeScript.
- **Styling:** Tailwind CSS integrated with Radix UI primitives (`shadcn/ui`) ensures a highly accessible, customizable, and responsive design system.
- **State Management:** `@tanstack/react-query` handles server state, caching, and data synchronization seamlessly.
- **Routing:** `wouter` for lightweight, hook-based routing.
- **Forms & Validation:** `react-hook-form` paired with `zod` for rigorous client-side validation.
- **UI Enhancements:** Smooth, physics-based animations using `framer-motion` and `tw-animate-css`. Data visualization is handled by `recharts`.

### ⚙️ Backend (Server-Side)
The backend is a robust, RESTful API designed for high performance and data integrity.
- **Core:** Node.js running Express 5.
- **Language:** TypeScript.
- **Database:** PostgreSQL for reliable, relational data storage.
- **ORM:** Drizzle ORM provides type-safe database queries. `drizzle-zod` bridges the gap between database schemas and API validation.
- **API Client Generation:** Orval automatically generates React Query hooks and TypeScript interfaces directly from the backend's OpenAPI contract, ensuring end-to-end type safety.
- **Logging & Monitoring:** `pino` and `pino-http` provide structured, high-performance logging.

---

## 📂 Project Structure

```text
Traveloop/
├── frontend/               # React application
│   ├── src/
│   │   ├── api/            # Orval generated API hooks
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views (Trips, Activities, etc.)
│   │   └── lib/            # Utilities and configurations
│   ├── vite.config.ts
│   └── package.json
├── backend/                # Express API
│   ├── src/
│   │   ├── db/             # Drizzle schema
│   │   ├── routes/         # Express route handlers
│   │   └── lib/            # Backend utilities
│   ├── drizzle.config.ts
│   ├── orval.config.ts     # OpenAPI codegen configuration
│   └── package.json
├── pnpm-workspace.yaml     # Monorepo configuration
└── package.json            # Root scripts
```

---

## ⚙️ Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **pnpm**: v8.0.0 or higher (`npm install -g pnpm`)
- **PostgreSQL**: A running instance of PostgreSQL (v14+ recommended)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/traveloop.git
   cd traveloop
   ```

2. **Install all dependencies** across the monorepo:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file at the root of the project.
   ```bash
   # Database connection string
   DATABASE_URL=postgresql://postgres:password@localhost:5432/traveloop
   
   # Backend Server Port
   PORT=8080
   ```

### Database Setup

Traveloop uses Drizzle ORM. You need to push the schema to your PostgreSQL database and optionally seed it with initial data.

```bash
# Push schema to the database
pnpm --filter traveloop-backend db:push

# Seed the database with mock data (cities, activities)
pnpm --filter traveloop-backend db:seed
```

### Running the Application

You can spin up both the frontend and backend development servers simultaneously from the root directory:

```bash
pnpm dev
```

The application will be available at:
- **Frontend:** `http://localhost:5173` (or the port specified by Vite)
- **Backend API:** `http://localhost:8080`

**Running Individually:**
If you need to run them separately:
```bash
# Terminal 1: Run Backend
pnpm dev:backend

# Terminal 2: Run Frontend
pnpm dev:frontend
```

---

## 🔧 Scripts & Tooling

Here are some useful commands you can run from the root directory:

- `pnpm build`: Builds both frontend and backend for production.
- `pnpm typecheck`: Runs TypeScript compiler checks across all workspaces without emitting files.
- `pnpm codegen`: Triggers Orval in the backend to regenerate the OpenAPI client hooks for the frontend based on the latest routes.




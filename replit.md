# MediMatch.ai - Symptom Analysis Engine

## Overview

MediMatch.ai is a symptom tracking and diagnosis suggestion application designed for healthcare contexts, particularly focused on conditions prevalent in Afghanistan. Users input symptoms and the system matches them against a database of medical conditions, providing ranked suggestions based on symptom overlap. The application is primarily client-side focused, using localStorage for data persistence, with backend infrastructure ready for future sync capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Query for server state, custom hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical/clean theme (teal & slate colors)
- **Animations**: Framer Motion for smooth list and modal transitions
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API Structure**: RESTful endpoints defined in shared/routes.ts
- **Current State**: Minimal backend with placeholder sync endpoint - primary logic runs client-side

### Data Storage
- **Primary Storage**: Browser localStorage under key 'symptom_tracker_v1'
- **Database Ready**: PostgreSQL with Drizzle ORM configured for future server-side persistence
- **Schema Location**: shared/schema.ts contains both Drizzle table definitions and Zod validation schemas

### Key Design Patterns
- **Shared Types**: Zod schemas in shared/ directory used by both client and server
- **Local-First**: All symptom tracking logic runs client-side with optional backend sync
- **Component Architecture**: Feature components (SymptomInput, SuggestionList, DataManager) with reusable UI primitives
- **Custom Hooks**: useSymptomTracker hook manages all state including causes, symptoms, history, and undo functionality

### Application Features
- Symptom input with autocomplete from known symptoms
- Real-time cause matching with weighted scoring
- CRUD operations for medical conditions/causes
- Import/export data as JSON
- Undo functionality for data changes
- Pre-seeded with 35+ conditions relevant to Afghan healthcare context

## External Dependencies

### Database
- **PostgreSQL**: Required for production use, configured via DATABASE_URL environment variable
- **Drizzle ORM**: Schema management and type-safe queries
- **connect-pg-simple**: Session storage for future authentication

### UI Libraries
- **Radix UI**: Full suite of accessible component primitives
- **shadcn/ui**: Pre-styled component library (new-york style variant)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **Recharts**: Data visualization for symptom scores

### Development Tools
- **Vite**: Development server with HMR
- **esbuild**: Production bundling for server
- **Drizzle Kit**: Database migrations (`npm run db:push`)

### Fonts
- **Outfit**: Display font (headers/branding)
- **Plus Jakarta Sans**: Body text
- Google Fonts loaded via CDN
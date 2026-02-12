# Edge Note

A secure, edge-based note taking app with Markdown support.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kaungkhantjc/edge-note)

> **Note**: This entire application was vibe coded.

## Tech Stack

- **Framework**: [React Router v7](https://reactrouter.com/)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Editor**: [MdEditor](https://imzbf.github.io/md-editor-rt/en-US/)
- **Auth**: [Iron Session](https://github.com/vvo/iron-session)

## Features

- 🎨 **Material 3 UI**: Modern, expressive, and responsive design following Material 3 guidelines.
- 🔒 **Secure Auth**: Iron session based authentication for robust security.
- 📝 **Markdown Support**: Rich text editing with [MdEditor](https://imzbf.github.io/md-editor-rt/en-US/), supporting preview, syntax highlighting, and more.
- 🌍 **Public/Private Notes**: Toggle note visibility and generate shareable links for public notes.
- 🖱️ **Batch Actions**: Intuitive drag-to-select (mouse) and long-press (touch) selection for batch deletions.
- ⚡ **Edge Native**: Built for speed and reliability on Cloudflare's global network.

## Screenshots

<div align="center">
  <img src="screenshots/screenshot_desktop_1.png" width="100%" alt="Desktop Screenshot 1" />
  <br/><br/>
  <img src="screenshots/screenshot_desktop_2.png" width="100%" alt="Desktop Screenshot 2" />
  <br/><br/>
  <img src="screenshots/screenshot_desktop_3.png" width="100%" alt="Desktop Screenshot 3" />
</div>

<div align="center">
  <img src="screenshots/screenshot_mobile_1.png" width="30%" alt="Mobile Screenshot 1" />
  <img src="screenshots/screenshot_mobile_2.png" width="30%" alt="Mobile Screenshot 2" />
  <img src="screenshots/screenshot_mobile_3.png" width="30%" alt="Mobile Screenshot 3" />
</div>

## Local Development Setup

Follow these steps to get the project running locally.

### 1. Prerequisites

Ensure you have Node.js and npm installed.

### 2. Installation

```bash
npm install
```

### 3. Environment Setup

Copy the example environment variables file:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and set your desired `AUTH_USERNAME`, `AUTH_PASSWORD`, and a secure `SESSION_SECRET`.

### 4. Database Setup

Apply the D1 migrations to your local SQLite database:

```bash
npx wrangler d1 migrations apply edge-note-db --local
```

(Optional) Seed the database with test data:

```bash
npm run db:seed:local
```

### 5. Run Development Server

Start the local development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deployment to Cloudflare Workers

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create D1 Database

If you haven't created the database yet:

```bash
npx wrangler d1 create edge-note-db
```

*Update the `database_id` in `wrangler.jsonc` with the ID returned from this command.*

### 3. Apply Migrations remotely

```bash
npx wrangler d1 migrations apply edge-note-db --remote
```

### 4. Configure Secrets

Set the production environment variables using Wrangler secrets:

```bash
npx wrangler secret put AUTH_USERNAME
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put SESSION_SECRET
```

### 5. Deploy

Build and deploy the application:

```bash
npm run deploy
```

## License

Edge Note is licensed under the Apache 2.0 license.

```
Copyright 2026 Kaung Khant Kyaw.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

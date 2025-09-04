RSS + HTML Scraper Aggregator

Setup
- cp .env.example .env
- npm install
- npx prisma generate
- npm run prisma:dev
- npm run dev

Scripts
- npm run fetch:all
- npm run test:fetch -- <url> '<rules-json>'
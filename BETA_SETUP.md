# Beta Versijos Setup

## 🚀 PostgreSQL + Redis + BullMQ

### 1. Docker Compose Paleidimas

```bash
# Paleisti visus servisus
docker-compose up -d

# Patikrinti, kad visi servisai veikia
docker-compose ps
```

### 2. Environment Kintamieji

Sukurkite `.env` failą:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/rss_aggregator"

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Admin
ADMIN_TOKEN=your-secret-admin-token

# Scraper
SCRAPER_USER_AGENT=AggregatorBot/1.0
FETCH_CONCURRENCY=2
FETCH_DELAY_MS=500

# Cron
CRON_ENABLED=true
CRON_EXPR=0 */4 * * *

# Production
NODE_ENV=development
PORT=3000
```

### 3. Duomenų Bazės Migracija

```bash
# Generuoti Prisma client
npx prisma generate

# Paleisti migracijas
npx prisma migrate dev --name beta_features

# Seed duomenys
npm run prisma:seed
```

### 4. Dependencies

```bash
npm install
```

## 🆕 Beta Funkcionalumai

### 1. Pilno Teksto Ištraukimas
- Automatinis straipsnių turinio gavimas iš RSS feed'ų
- JSDOM pagrindu HTML parsing
- Konfigūruojamas per `extractFullText` lauką šaltinyje

### 2. Patobulinta Duplicate Detection
- Dviguba apsauga: `hash` + `urlHash`
- URL + title kombinacijos hash'as
- Geriau atpažįsta dublikatus

### 3. Job Queue (BullMQ)
- Redis pagrindu job queue
- Prioritetai ir retry mechanizmas
- Recurring job'ai (kas 15 min / 4 val)
- Concurrency control

### 4. Monitoring & Analytics
- IngestLog lentelė visoms operacijoms
- Admin dashboard su statistikomis
- Queue stats realaus laiko
- Health check endpoint

### 5. PostgreSQL
- Geresnis performance
- JSONB laukai
- Concurrent access
- Scalability

## 📊 Admin Dashboard

Prieiga: `/admin/dashboard`

Funkcionalumai:
- Total articles/sources stats
- Queue job statistics
- Recent ingestions log
- Top sources by article count
- Error monitoring

## 🔧 API Endpoint'ai

### Queue Management
- `POST /api/queue/ingest` - Pridėti job'ą į queue
- `GET /api/queue/stats` - Queue statistikos

### Monitoring
- `GET /api/admin/dashboard` - Dashboard duomenys
- `GET /api/health` - Sistemos būsena

### Pilno Teksto
- `POST /api/articles/[id]/extract` - Rankinis pilno teksto ištraukimas

## 🐳 Docker Servisai

- **app**: Next.js aplikacija
- **db**: PostgreSQL 15
- **redis**: Redis 7 (BullMQ)
- **adminer**: DB valdymas (port 8080)

## 🔄 Job Queue Workflow

1. **Recurring Jobs**: Automatiškai paleidžiami pagal cron
2. **Manual Jobs**: Per admin panelę arba API
3. **Priority System**: Aukšto prioriteto šaltiniai kas 15 min
4. **Error Handling**: Retry su exponential backoff
5. **Monitoring**: Realaus laiko job statistikos

## 📈 Performance

- **Concurrency**: 3 vienu metu ingest job'ai
- **Rate Limiting**: 500ms delay tarp request'ų
- **Caching**: ETag/Last-Modified support
- **Database**: PostgreSQL su indeksais

## 🚨 Troubleshooting

### Redis Connection Issues
```bash
# Patikrinti Redis
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Database Issues
```bash
# Patikrinti PostgreSQL
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
```

### Queue Issues
```bash
# Patikrinti queue stats
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/queue/stats
```

## 🔐 Security

- Admin token autentifikacija
- CSRF protection
- XSS prevention
- Rate limiting
- Input validation

## 📝 Logs

- Application logs: `docker-compose logs app`
- Database logs: `docker-compose logs db`
- Redis logs: `docker-compose logs redis`
- Ingest logs: Admin dashboard

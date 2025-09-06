# 🚀 Run All Ingestion - Dokumentacija

## 📋 Aprašymas

"Run All Ingestion" funkcionalumas leidžia admin'ui paleisti visų šaltinių duomenų rinkimą vienu mygtuku, su realaus laiko progreso stebėjimu ir klaidų suvestine.

## ✨ Funkcionalumai

### ✅ Implementuota

1. **Asinchroninis Job Processing**
   - In-memory job state management
   - Concurrency control (2 vienu metu)
   - Progress tracking su real-time updates

2. **API Endpoint'ai**
   - `POST /api/ingest` - Paleisti visų šaltinių rinkimą
   - `GET /api/ingest/status?jobId=...` - Gauti job progresą

3. **UI Komponentai**
   - `RunAllButton` - Paleisti mygtukas
   - `IngestProgress` - Progreso rodymas su polling

4. **Security & Validation**
   - Admin token autentifikacija
   - Zod validation schemas
   - Rate limiting (3 requests per 5 minutes)
   - Input sanitization

5. **Error Handling**
   - Comprehensive error catching
   - User-friendly error messages
   - Failure tracking per source

## 🔧 Techninis Stack

### Backend
- **Job State**: In-memory Map su TTL (1 hour)
- **Concurrency**: p-limit (2 concurrent jobs)
- **Validation**: Zod schemas
- **Rate Limiting**: Custom in-memory implementation

### Frontend
- **React Components**: TypeScript su hooks
- **Polling**: 1.2s interval
- **Error Handling**: Try-catch su user feedback
- **UI**: Tailwind CSS su responsive design

## 📊 API Specifikacija

### POST /api/ingest

**Request:**
```typescript
{
  strategy?: "AUTO" | "RSS" | "HTML";
  categorySlug?: string;
}
```

**Response (202):**
```typescript
{
  message: "Ingestion started";
  jobId: string;
}
```

**Response (409):**
```typescript
{
  message: "Ingestion already running";
  jobId: string;
}
```

### GET /api/ingest/status?jobId=...

**Response (200):**
```typescript
{
  jobId: string;
  total: number;
  processed: number;
  successes: number;
  failures: { sourceId: string; error: string }[];
  done: boolean;
  canceled?: boolean;
  startedAt: string; // ISO
  updatedAt: string; // ISO
}
```

## 🎯 UI Komponentai

### RunAllButton

```typescript
interface RunAllButtonProps {
  adminToken: string;
  strategy?: 'AUTO' | 'RSS' | 'HTML';
  categorySlug?: string;
  className?: string;
}
```

**Funkcionalumai:**
- Disable kai admin token neįvestas
- Loading state su "Starting..." tekstu
- Error handling su user feedback
- Automatinis perjungimas į progress view

### IngestProgress

```typescript
interface IngestProgressProps {
  jobId: string;
  onClose: () => void;
  adminToken: string;
}
```

**Funkcionalumai:**
- Real-time progress bar
- Success/failure statistics
- Collapsible error details
- Duration tracking
- Auto-polling (1.2s interval)

## 🔒 Security

### Autentifikacija
- Admin token per Authorization header
- `requireAdmin()` middleware validation
- Token validation kiekvienam request'ui

### Rate Limiting
- 3 requests per 5 minutes per IP
- X-RateLimit headers
- 429 status code per limit exceeded

### Validation
- Zod schemas visiems input'ams
- Type-safe request/response handling
- Error message sanitization

## 📈 Performance

### Job Processing
- **Concurrency**: 2 sources vienu metu
- **Memory**: In-memory state su TTL cleanup
- **Polling**: 1.2s interval (optimized)
- **Cleanup**: Automatic expired job removal

### UI Optimization
- **Debouncing**: Prevents double-clicks
- **Loading States**: Visual feedback
- **Error Recovery**: Automatic retry on network errors

## 🧪 Testing

### Test Script
```bash
npm run test:run-all
```

**Test Cases:**
1. Start ingestion job
2. Poll status until completion
3. Test duplicate prevention (409)
4. Test invalid jobId (404)
5. Error handling scenarios

### Manual Testing
1. Admin panel → Sources → "Run All"
2. Monitor progress bar
3. Check error handling
4. Verify completion summary

## 🚀 Usage

### 1. Admin Panel Integration

**Sources Page:**
```typescript
<RunAllButton 
  adminToken={adminToken}
  className="mb-2"
/>
```

**Dashboard:**
```typescript
<RunAllButton 
  adminToken={adminToken}
/>
```

### 2. API Usage

**Start Ingestion:**
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "AUTO"}'
```

**Check Status:**
```bash
curl http://localhost:3000/api/ingest/status?jobId=JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔮 Ateities Plėtra

### Phase 2: Database Persistence
- `IngestJob` lentelė job state'ui
- `IngestLog` lentelė detailed logging'ui
- Historical job tracking
- Dashboard analytics

### Phase 3: BullMQ Integration
- Redis-based job queue
- Priority system
- Retry mechanisms
- Horizontal scaling

### Phase 4: Advanced Features
- Job scheduling
- Bulk operations
- Source prioritization
- Performance metrics

## 🐛 Troubleshooting

### Common Issues

**Job Not Starting:**
- Check admin token
- Verify sources exist
- Check rate limiting

**Progress Not Updating:**
- Check network connectivity
- Verify jobId validity
- Check browser console

**High Memory Usage:**
- Jobs auto-expire after 1 hour
- Manual cleanup available
- Monitor job count

### Debug Commands

```bash
# Check active jobs
curl http://localhost:3000/api/ingest/status?jobId=active

# Test with specific strategy
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer TOKEN" \
  -d '{"strategy": "RSS"}'

# Test category filtering
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer TOKEN" \
  -d '{"categorySlug": "tech"}'
```

## 📝 Changelog

### v1.0.0 (Current)
- ✅ In-memory job state management
- ✅ Basic API endpoints
- ✅ UI components
- ✅ Admin panel integration
- ✅ Error handling & validation
- ✅ Rate limiting
- ✅ Test suite

### v1.1.0 (Planned)
- 🔄 Database persistence
- 🔄 Enhanced logging
- 🔄 Performance metrics
- 🔄 Job cancellation

### v2.0.0 (Future)
- 🔄 BullMQ integration
- 🔄 Advanced scheduling
- 🔄 Multi-user support
- 🔄 API versioning

---

**Run All Ingestion funkcionalumas suteikia pilną admin kontrolę per duomenų rinkimo procesą su modernia UI ir robust error handling.**

# CKAN Integration Guide

This guide explains how to integrate PMPML data from the OpenCity CKAN portal into your Smart Bus Pass System.

## Overview

The system now includes CKAN integration to fetch real PMPML bus route data from:
**https://data.opencity.in/**

---

## Features

✅ **Fetch PMPML Routes** - Get routes directly from CKAN  
✅ **Search Routes** - Full-text search across all fields  
✅ **Filter Routes** - Filter by status, type, stops  
✅ **Sync to Database** - Import CKAN data to local DB  
✅ **Auto-refresh Embeddings** - Update AI chatbot after sync  
✅ **Find Routes Between Stops** - Origin to destination search  

---

## Setup

### 1. Install CKAN Client

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install ckanapi
```

### 2. Set API Token (Optional)

Create `.env` file in backend directory:

```env
CKAN_API_TOKEN=your_api_token_here
```

**Note**: API token is optional for public data.

---

## Usage

### Via API Endpoints

#### 1. Sync CKAN Data to Database (Admin Only)

```bash
POST /api/v1/ckan/sync
{
  "resource_id": "433caa89-75e2-474d-b5d6-db8fd7a3171d",
  "batch_size": 100
}
```

This will:
- Fetch all routes from CKAN
- Sync to local database
- Refresh AI embeddings
- Return sync statistics

#### 2. Search Routes

```bash
POST /api/v1/ckan/search
{
  "query": "Katraj",
  "resource_id": "433caa89-75e2-474d-b5d6-db8fd7a3171d",
  "limit": 10
}
```

#### 3. Get Routes Between Stops

```bash
GET /api/v1/ckan/routes/between?origin=Katraj&destination=Hinjewadi
```

#### 4. Get Active Routes

```bash
GET /api/v1/ckan/routes/active?limit=100
```

#### 5. Get Routes by Type

```bash
GET /api/v1/ckan/routes/type/AC?limit=50
```

---

### Via Python Script

```python
from app.services.ckan_service import CKANDataService
from app.core.database import SessionLocal

db = SessionLocal()
service = CKANDataService(db)

# Search for routes
results = service.search_routes("Katraj", limit=10)
print(f"Found {len(results)} routes")

# Sync all data
sync_result = service.sync_routes_to_database()
print(f"Synced: {sync_result['synced']}")
print(f"Updated: {sync_result['updated']}")

db.close()
```

---

## CKAN API Examples

### Example 1: Search for "Katraj"

```python
from ckanapi import RemoteCKAN

rc = RemoteCKAN('https://data.opencity.in/', apikey=API_TOKEN)
result = rc.action.datastore_search(
    resource_id="433caa89-75e2-474d-b5d6-db8fd7a3171d",
    limit=5,
    q="Katraj"
)
print(result['records'])
```

### Example 2: Filter by Status and Type

```python
from ckanapi import RemoteCKAN

rc = RemoteCKAN('https://data.opencity.in/', apikey=API_TOKEN)
result = rc.action.datastore_search(
    resource_id="433caa89-75e2-474d-b5d6-db8fd7a3171d",
    filters={
        "route_type": "AC",
        "status": "active"
    }
)
print(result['records'])
```

### Example 3: Get Routes Between Stops

```python
from ckanapi import RemoteCKAN

rc = RemoteCKAN('https://data.opencity.in/', apikey=API_TOKEN)
result = rc.action.datastore_search(
    resource_id="433caa89-75e2-474d-b5d6-db8fd7a3171d",
    filters={
        "origin": "Katraj",
        "destination": "Hinjewadi"
    },
    limit=10
)
print(result['records'])
```

---

## Data Sync Workflow

1. **Fetch from CKAN** → Get routes from OpenCity portal
2. **Parse Records** → Convert CKAN format to our schema
3. **Update Database** → Create or update routes
4. **Refresh Embeddings** → Update AI chatbot vector database
5. **Return Statistics** → Show sync results

---

## Field Mapping

CKAN fields are automatically mapped to our database schema:

| CKAN Field | Our Field | Type |
|------------|-----------|------|
| route_number / route_no / RouteNo | route_number | String |
| origin / source / from_stop | origin | String |
| destination / dest / to_stop | destination | String |
| distance_km / distance | distance_km | Decimal |
| duration_minutes / duration | estimated_duration_minutes | Integer |
| status | is_active | Boolean |

---

## Admin Dashboard Integration

The CKAN sync feature is integrated into the admin dashboard:

1. Go to `/admin`
2. Click "Sync CKAN Data" (future feature)
3. View sync progress
4. Check sync statistics

---

## Automated Sync (Future)

Set up automated daily sync:

```python
# In tasks.py (Celery)
@celery_app.task
def sync_ckan_data_daily():
    """Sync CKAN data every day at 2 AM"""
    db = SessionLocal()
    service = CKANDataService(db)
    result = service.sync_routes_to_database()
    db.close()
    return result
```

Schedule in Celery Beat:

```python
celery_app.conf.beat_schedule = {
    'sync-ckan-daily': {
        'task': 'app.tasks.sync_ckan_data_daily',
        'schedule': crontab(hour=2, minute=0),
    },
}
```

---

## Troubleshooting

### Issue: "ckanapi not installed"
**Solution**: Install ckanapi
```powershell
pip install ckanapi
```

### Issue: "Resource not found"
**Solution**: Verify resource ID is correct
- Check https://data.opencity.in/
- Find PMPML dataset
- Copy resource ID

### Issue: "API token invalid"
**Solution**: 
- API token is optional for public data
- Remove CKAN_API_TOKEN from .env if not needed

### Issue: "Field mapping errors"
**Solution**: 
- Check actual CKAN field names
- Update `_parse_ckan_route()` method
- Adjust field mapping

### Issue: "Slow sync"
**Solution**:
- Reduce batch_size
- Run sync during off-peak hours
- Use pagination

---

## API Documentation

Full API documentation available at:
**http://localhost:8000/docs**

Look for the **"CKAN Data"** tag.

---

## CKAN Resources

- **OpenCity Portal**: https://data.opencity.in/
- **CKAN API Docs**: https://docs.ckan.org/en/latest/api/
- **ckanapi Library**: https://github.com/ckan/ckanapi

---

## Benefits

✅ **Real Data** - Use actual PMPML routes  
✅ **Always Updated** - Sync latest data anytime  
✅ **No Manual Entry** - Automated data import  
✅ **AI Integration** - Chatbot uses real routes  
✅ **Flexible** - Search, filter, sync as needed  

---

## Next Steps

1. ✅ Install ckanapi
2. ✅ Test CKAN connection
3. ✅ Sync initial data
4. ✅ Verify routes in database
5. ✅ Test AI chatbot with real data
6. ✅ Set up automated sync (optional)

---

**Congratulations!** Your system now uses real PMPML data from OpenCity. 🎉

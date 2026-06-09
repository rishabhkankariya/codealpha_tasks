# PMPML Dataset Import Guide

This guide explains how to import your PMPML dataset.csv file into the Smart Bus Pass System.

---

## 📊 Dataset Overview

**File**: `dataset.csv`  
**Format**: CSV with 1031 routes  
**Columns**:
- `_id` - Unique identifier
- `Route ID` - Route number (e.g., "100-D", "101-U")
- `Route Description` - English description (e.g., "Hinjawadi Maan Phase 3 To Ma Na Pa")
- `Route Description Marathi` - Marathi description
- `Kilometer` - Distance in kilometers

**Sample Data**:
```csv
_id,Route ID,Route Description,Route Description Marathi,Kilometer
1,100-D,Hinjawadi Maan Phase 3 To Ma Na Pa,हिंजवडी माण फेज ३ ते मनपा,26.4
2,100-U,Ma Na Pa To Hinjawadi Maan Phase 3,मनपा ते हिंजवडी माण फेज ३,26.4
```

---

## 🚀 Quick Import (Recommended)

### Option 1: Using PowerShell Script

```powershell
# Make sure dataset.csv is in the project root folder
.\import-pmpml-data.ps1
```

This will:
1. ✅ Check Python environment
2. ✅ Activate virtual environment
3. ✅ Import all 1031 routes
4. ✅ Parse origin and destination
5. ✅ Calculate estimated duration
6. ✅ Refresh AI embeddings

---

### Option 2: Manual Import

```powershell
# 1. Navigate to backend
cd backend

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Run importer
python app/utils/pmpml_importer.py ../dataset.csv

# 4. Go back to root
cd ..
```

---

## 📋 What Happens During Import

### 1. Data Parsing
- **Route Number**: Extracted from "Route ID" column
- **Origin**: Parsed from route description (before "To")
- **Destination**: Parsed from route description (after "To")
- **Distance**: Taken from "Kilometer" column
- **Duration**: Calculated based on distance (avg speed: 25 km/h)

### 2. Examples

| Route ID | Description | Origin | Destination | Distance | Duration |
|----------|-------------|--------|-------------|----------|----------|
| 100-D | Hinjawadi Maan Phase 3 To Ma Na Pa | Hinjawadi Maan Phase 3 | Ma Na Pa | 26.4 km | 63 min |
| 101-U | Kothrud Depot To Kondhwa Bk | Kothrud Depot | Kondhwa Bk | 16.2 km | 39 min |
| 103-D | Kothrud Depot To Katraj | Kothrud Depot | Katraj | 14.3 km | 34 min |

### 3. Database Storage
- Creates new routes if they don't exist
- Updates existing routes with new data
- Marks all routes as active
- Commits in batches of 50 for performance

### 4. AI Integration
- Generates embeddings for all routes
- Updates vector database (ChromaDB)
- Makes routes searchable via AI chatbot

---

## ✅ Verification

### Check Import Results

```powershell
# Start backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload
```

### Test via API

1. Open http://localhost:8000/docs
2. Try `GET /routes/` endpoint
3. You should see all 1031 routes

### Test via AI Chatbot

1. Start full system: `.\start-full-system.ps1`
2. Open http://localhost:3000/ai-assistant
3. Ask: "Which bus goes from Hinjawadi to Katraj?"
4. AI should respond with relevant routes

---

## 🎯 Example Queries

Once imported, you can ask the AI chatbot:

### Route Finding
- "Which bus goes from Hinjawadi to Ma Na Pa?"
- "Show me routes from Kothrud Depot to Katraj"
- "How do I get from Pune Station to Swargate?"

### Stop Information
- "What buses stop at Katraj?"
- "Which routes pass through Deccan Gymkhana?"
- "Buses near Shivajinagar"

### Distance & Duration
- "How long does route 100-D take?"
- "What's the distance from Hinjawadi to Katraj?"
- "Fastest route to Wakad"

---

## 📊 Import Statistics

After import, you'll see:

```
IMPORT SUMMARY
==================================================
✓ Success!
  Routes Created: 1031
  Routes Updated: 0
  Total Processed: 1031
  Errors: 0
==================================================
```

---

## 🔧 Troubleshooting

### Issue: "File not found: dataset.csv"
**Solution**: Make sure dataset.csv is in the project root folder
```powershell
# Check if file exists
Test-Path dataset.csv
```

### Issue: "Virtual environment not found"
**Solution**: Run setup first
```powershell
.\setup-local.ps1
```

### Issue: "Import errors"
**Solution**: Check CSV format
- Ensure UTF-8 encoding
- Verify column names match
- Check for empty rows

### Issue: "Duplicate routes"
**Solution**: The importer updates existing routes automatically
- No need to delete old data
- Re-running import will update routes

### Issue: "AI embeddings not refreshed"
**Solution**: Manually refresh
```python
from app.services.ai_chatbot_service import AIRouteAssistant
from app.core.database import SessionLocal

db = SessionLocal()
assistant = AIRouteAssistant(db)
assistant.refresh_embeddings()
db.close()
```

---

## 🔄 Re-importing Data

To update routes with new data:

1. Update dataset.csv with new routes
2. Run import script again:
   ```powershell
   .\import-pmpml-data.ps1
   ```
3. Existing routes will be updated
4. New routes will be added
5. AI embeddings will be refreshed

---

## 📈 Performance

- **Import Speed**: ~20 routes/second
- **Total Time**: ~50 seconds for 1031 routes
- **Embedding Generation**: ~2-3 minutes
- **Total Process**: ~3-4 minutes

---

## 🎨 Route Naming Convention

Your dataset uses this convention:

- **-D**: Down direction (e.g., 100-D)
- **-U**: Up direction (e.g., 100-U)
- **-R**: Round trip (e.g., 106-R)
- **-A, -B, -C**: Route variants (e.g., 103A-D, 103B-D)

The importer preserves these route numbers exactly as they are.

---

## 📍 Common Locations in Dataset

Your dataset includes routes to/from:

- **Hinjawadi** (Tech hub)
- **Katraj** (South Pune)
- **Swargate** (Major bus stand)
- **Pune Station** (Railway station)
- **Kothrud Depot** (Bus depot)
- **Hadapsar** (IT area)
- **Deccan Gymkhana** (Central area)
- **Shivajinagar** (Shopping area)
- **Ma Na Pa** (Municipal Corporation)
- **Alandi** (Religious site)

---

## 🤖 AI Chatbot Integration

After import, the AI chatbot can:

1. **Understand Natural Language**
   - "Bus from Hinjawadi to Katraj"
   - "Route to Swargate"
   - "How to reach Pune Station"

2. **Provide Accurate Information**
   - Route numbers
   - Distance and duration
   - Origin and destination

3. **Suggest Alternatives**
   - Multiple route options
   - Shortest routes
   - Fastest routes

---

## 📚 Next Steps

After importing:

1. ✅ **Test Routes**
   - Browse routes at http://localhost:3000/routes
   - Search for specific routes

2. ✅ **Test AI Chatbot**
   - Open http://localhost:3000/ai-assistant
   - Ask natural language questions

3. ✅ **Book Tickets**
   - Try booking a ticket for imported routes
   - Verify QR code generation

4. ✅ **Admin Dashboard**
   - View route analytics
   - Monitor system usage

---

## 🎉 Success!

Once imported, your system will have:

✅ **1031 PMPML routes** in database  
✅ **AI-powered search** with embeddings  
✅ **Natural language queries** working  
✅ **Complete route information** available  
✅ **Booking system** ready for all routes  

---

## 📞 Support

If you encounter issues:

1. Check error messages in console
2. Verify dataset.csv format
3. Ensure virtual environment is activated
4. Check database file exists
5. Review import logs

---

**Ready to import?** Run:

```powershell
.\import-pmpml-data.ps1
```

🚀 **Your PMPML data will be ready in minutes!**

import sqlite3
import os

# Find database file relative to script location
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.abspath(os.path.join(script_dir, "..", "smart_bus_pass.db"))

if not os.path.exists(db_path):
    print(f"Error: Database file not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print(f"Database: {db_path}")
print("Tables in database:")
for table in tables:
    print(f"  - {table[0]}")
    
    # Get row count
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"    Rows: {count}")
    except Exception as e:
        print(f"    Error reading table: {e}")

conn.close()

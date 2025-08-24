import sqlite3
import pandas as pd

# File paths
csv_file = "./data/sessions.csv"
db_file = "./data/workers.db"

# Read CSV
df = pd.read_csv(csv_file)

# Connect to DB
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Create table if not exists
cursor.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    activity TEXT,
    FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
)
""")

# Optional: clear table before re-import
# cursor.execute("DELETE FROM sessions")

# Insert all rows
for _, row in df.iterrows():
    cursor.execute("""
        INSERT INTO sessions (worker_id, start, end, activity)
        VALUES (?, ?, ?, ?)
    """, (row["worker_id"], row["start"], row["end"], row["activity"]))

conn.commit()
conn.close()

print("Sessions successfully imported into the database.")

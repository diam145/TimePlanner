import sqlite3

# Connect (it will create the file if it doesn't exist)
conn = sqlite3.connect('./data/workers.db')

# Create the table with employee_number field
conn.execute('''
CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT CHECK(status IN ('employee', 'external')) NOT NULL,
    employee_number TEXT
);
''')

conn.commit()
conn.close()

print("SQLite database initialized with employee_number field.")

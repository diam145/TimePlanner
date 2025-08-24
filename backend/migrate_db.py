#!/usr/bin/env python3

import sqlite3
import sys
import os

def migrate_database():
    """Ensure employee_schedules table exists"""
    try:
        conn = sqlite3.connect('workers.db')
        
        # Create employee_schedules table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS employee_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                day_of_week INTEGER NOT NULL,
                start_time TEXT,
                end_time TEXT,
                schedule_type TEXT DEFAULT 'work',
                activity_type TEXT DEFAULT 'X',
                is_night_shift BOOLEAN DEFAULT 0,
                shift_number INTEGER DEFAULT 1,
                hours_worked REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, date, shift_number)
            )
        ''')
        
        # Add any missing columns
        missing_columns = [
            ('activity_type', 'TEXT DEFAULT "X"'),
            ('shift_number', 'INTEGER DEFAULT 1'),
            ('hours_worked', 'REAL DEFAULT 0'),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('schedule_type', 'TEXT DEFAULT "work"')
        ]
        
        for column_name, column_def in missing_columns:
            try:
                conn.execute(f'ALTER TABLE employee_schedules ADD COLUMN {column_name} {column_def}')
                print(f"✅ Added column {column_name}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"ℹ️  Column {column_name} already exists")
                else:
                    print(f"⚠️  Error adding column {column_name}: {e}")
        
        conn.commit()
        conn.close()
        print("✅ Database migration completed successfully")
        
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔄 Starting database migration...")
    migrate_database()
    print("🎉 Migration complete!")

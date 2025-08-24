import sqlite3
import os
import sys

# Add the backend directory to the path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Database path
DATABASE_PATH = 'backend/core/data/workers.db'

def test_database():
    """Test database connection and data"""
    try:
        conn = sqlite3.connect(DATABASE_PATH, timeout=30.0)
        conn.row_factory = sqlite3.Row 
        
        # Test workers table
        print("=== WORKERS TABLE ===")
        workers = conn.execute('SELECT id, name, status FROM workers ORDER BY name ASC').fetchall()
        print(f"Found {len(workers)} workers:")
        for worker in workers:
            print(f"  ID: {worker['id']}, Name: {worker['name']}, Status: {worker['status']}")
        
        # Test employee_schedules table
        print("\n=== EMPLOYEE_SCHEDULES TABLE ===")
        schedules = conn.execute('SELECT COUNT(*) as count FROM employee_schedules').fetchone()
        print(f"Total schedules: {schedules['count']}")
        
        # Test table structure
        print("\n=== TABLE STRUCTURE ===")
        columns = conn.execute("PRAGMA table_info(employee_schedules)").fetchall()
        print("employee_schedules columns:")
        for col in columns:
            print(f"  {col['name']} ({col['type']})")
            
        # Test recent schedules
        print("\n=== RECENT SCHEDULES ===")
        recent = conn.execute('''
            SELECT es.*, w.name as worker_name 
            FROM employee_schedules es 
            LEFT JOIN workers w ON es.employee_id = w.id 
            ORDER BY es.date DESC 
            LIMIT 5
        ''').fetchall()
        
        for schedule in recent:
            print(f"  {schedule['worker_name']} - {schedule['date']} - {schedule['activity_type']} - {schedule['start_time']} to {schedule['end_time']}")
            
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database()

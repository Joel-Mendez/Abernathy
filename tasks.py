import sqlite3

DB_PATH = 'abernathy.db'

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create a table for tasks
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
     ''')
    
    conn.commit()
    conn.close()
import sqlite3 

DB_PATH = "abernathy.db" # TO-DO: Make user specific?

def init_db(): 
    """
    Initializing Database. 
    Separate Tables for: 
        - Tasks
        - Projects
        - Knowledge Base Nodes
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    init_task_table(cursor)
    init_project_table(cursor)
    init_kb_table(cursor)

    conn.commit()
    conn.close()

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_task_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL,
            status TEXT DEFAULT 'not started',
            date_completed TEXT
        )
    """)

def init_project_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            date_created TEXT
        )
    """)

def init_kb_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            content TEXT,
            date_created TEXT
        )
    """)
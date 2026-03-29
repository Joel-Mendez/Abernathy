import sqlite3

DB_PATH = 'abernathy.db'

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init():
    conn = get_connection()
    cursor = conn.cursor()

    # Create Task Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'To-Do',
            date_completed TEXT,
            priority INTEGER NOT NULL DEFAULT 3,
            due_date TEXT,
            project_id INTEGER,
            effort INTEGER,
            due_date_fixed INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            day_block TEXT
        )
    ''')

    # Create Task Dependencies Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_dependencies (
            parent_id INTEGER NOT NULL,
            child_id  INTEGER NOT NULL,
            PRIMARY KEY (parent_id, child_id),
            FOREIGN KEY (parent_id) REFERENCES tasks(id),
            FOREIGN KEY (child_id)  REFERENCES tasks(id)
        )
    ''')

    # Create Projects Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT NOT NULL,
            notes TEXT
        )
    ''')

    try:
        cursor.execute('ALTER TABLE projects ADD COLUMN notes TEXT')
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()
import sqlite3 

DB_PATH = "abernathy.db" # TO-DO: Make user specific?

##### CONNECTION SETUP #####
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

##### INITIALIZE TABLES #####
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

def init_task_table(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL,
            status TEXT DEFAULT 'not started',
            date_completed TEXT,
            project_id INTEGER,
            due_date TEXT
        )
    """)
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [row[1] for row in cursor.fetchall()]
    if "project_id" not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN project_id INTEGER")
    if "due_date" not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN due_date TEXT")

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

##### CRUD #####
# CREATE
def insert_row(table,name): 
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"INSERT INTO {table} (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

# READ
def get_all(table):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table}")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_row(table,id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table} WHERE id=?", (id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_tasks_by_project(project_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE project_id = ?", (project_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# UPDATE
def update_name(table,id,new_name):
    conn = get_connection()
    conn.execute(f"UPDATE {table} SET name = ? WHERE id = ?", (new_name, id))
    conn.commit()
    conn.close()

def update_fields(table, row_id, fields):
    if not fields:
        return
    assignments = ", ".join(f"{column} = ?" for column in fields)
    values = list(fields.values())
    values.append(row_id)
    conn = get_connection()
    conn.execute(f"UPDATE {table} SET {assignments} WHERE id = ?", values)
    conn.commit()
    conn.close()

# DELETE
def delete_row(table,id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(f"DELETE FROM {table} WHERE id=?",(id,))
    conn.commit()
    conn.close()

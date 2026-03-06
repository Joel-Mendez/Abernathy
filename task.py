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
            name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'To-Do',
            date_completed TEXT,
            priority INTEGER NOT NULL DEFAULT 3,
            due_date TEXT
        )
     ''')

    # Migration: add the status column if this db was created before it existed
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'To-Do'")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Migration: add date_completed column if this db was created before it existed
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN date_completed TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Migration: add priority column if this db was created before it existed
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 3")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Migration: add due_date column if this db was created before it existed
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN due_date TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    # Join table for many-to-many parent/child relationships
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_dependencies (
            parent_id INTEGER NOT NULL,
            child_id  INTEGER NOT NULL,
            PRIMARY KEY (parent_id, child_id),
            FOREIGN KEY (parent_id) REFERENCES tasks(id),
            FOREIGN KEY (child_id)  REFERENCES tasks(id)
        )
    ''')

    conn.commit()
    conn.close()

def create_task(name):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO tasks (name) VALUES (?)', (name,))
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return task_id

def get_tasks():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id, name, status, date_completed, priority, due_date FROM tasks')
    rows = cursor.fetchall()
    tasks = {row['id']: dict(row) for row in rows}
    for t in tasks.values():
        t['parent_ids'] = []
        t['child_ids']  = []

    cursor.execute('SELECT parent_id, child_id FROM task_dependencies')
    for dep in cursor.fetchall():
        p, c = dep['parent_id'], dep['child_id']
        if p in tasks:
            tasks[p]['child_ids'].append(c)
        if c in tasks:
            tasks[c]['parent_ids'].append(p)

    conn.close()
    return list(tasks.values())

def delete_task(task_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM task_dependencies WHERE parent_id = ? OR child_id = ?', (task_id, task_id))
    cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

def add_dependency(parent_id, child_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT OR IGNORE INTO task_dependencies (parent_id, child_id) VALUES (?, ?)',
        (parent_id, child_id)
    )
    conn.commit()
    conn.close()

def remove_dependency(parent_id, child_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM task_dependencies WHERE parent_id = ? AND child_id = ?',
        (parent_id, child_id)
    )
    conn.commit()
    conn.close()

def update_task(task_id, name):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET name = ? WHERE id = ?', (name, task_id))
    conn.commit()
    conn.close()

def update_task_due_date(task_id, due_date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET due_date = ? WHERE id = ?', (due_date, task_id))
    conn.commit()
    conn.close()

def update_task_priority(task_id, priority):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET priority = ? WHERE id = ?', (priority, task_id))
    conn.commit()
    conn.close()

def update_task_status(task_id, status):
    conn = get_connection()
    cursor = conn.cursor()
    if status == 'Completed':
        cursor.execute(
            'UPDATE tasks SET status = ?, date_completed = datetime("now", "localtime") WHERE id = ?',
            (status, task_id)
        )
    else:
        cursor.execute(
            'UPDATE tasks SET status = ?, date_completed = NULL WHERE id = ?',
            (status, task_id)
        )
    conn.commit()
    conn.close()

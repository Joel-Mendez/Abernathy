import db


def _sync_child_status(cursor, child_id):
    """Set child to Blocked if it has any incomplete parents, else To-Do (only if currently Blocked)."""
    cursor.execute('SELECT parent_id FROM task_dependencies WHERE child_id = ?', (child_id,))
    parent_ids = [r['parent_id'] for r in cursor.fetchall()]
    if not parent_ids:
        cursor.execute(
            "UPDATE tasks SET status = 'To-Do' WHERE id = ? AND status = 'Blocked'",
            (child_id,)
        )
        return
    placeholders = ','.join('?' * len(parent_ids))
    cursor.execute(
        f"SELECT COUNT(*) as cnt FROM tasks WHERE id IN ({placeholders}) AND status != 'Completed'",
        parent_ids
    )
    has_incomplete_parent = cursor.fetchone()['cnt'] > 0
    if has_incomplete_parent:
        cursor.execute(
            "UPDATE tasks SET status = 'Blocked' WHERE id = ? AND status NOT IN ('Completed', 'Cancelled')",
            (child_id,)
        )
    else:
        cursor.execute(
            "UPDATE tasks SET status = 'To-Do' WHERE id = ? AND status = 'Blocked'",
            (child_id,)
        )


def create_task(name, project_id=None):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO tasks (name, status, project_id) VALUES (?, ?, ?)', (name, 'To-Do', project_id))
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return task_id

def get_tasks():
    conn = db.get_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT id, name, status, date_completed, priority, due_date, due_date_fixed, project_id, effort, notes, day_block FROM tasks')
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
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM task_dependencies WHERE parent_id = ? OR child_id = ?', (task_id, task_id))
    cursor.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

def add_dependency(parent_id, child_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT OR IGNORE INTO task_dependencies (parent_id, child_id) VALUES (?, ?)',
        (parent_id, child_id)
    )
    _sync_child_status(cursor, child_id)
    conn.commit()
    conn.close()

def remove_dependency(parent_id, child_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'DELETE FROM task_dependencies WHERE parent_id = ? AND child_id = ?',
        (parent_id, child_id)
    )
    _sync_child_status(cursor, child_id)
    conn.commit()
    conn.close()

def update_task(task_id, name):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET name = ? WHERE id = ?', (name, task_id))
    conn.commit()
    conn.close()

def update_task_status(task_id, status):
    conn = db.get_connection()
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
    cursor.execute('SELECT child_id FROM task_dependencies WHERE parent_id = ?', (task_id,))
    for row in cursor.fetchall():
        _sync_child_status(cursor, row['child_id'])
    conn.commit()
    conn.close()

def update_task_due_date(task_id, due_date):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET due_date = ? WHERE id = ?', (due_date, task_id))
    conn.commit()
    conn.close()

def update_task_due_date_fixed(task_id, fixed):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET due_date_fixed = ? WHERE id = ?', (1 if fixed else 0, task_id))
    conn.commit()
    conn.close()

def update_task_priority(task_id, priority):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET priority = ? WHERE id = ?', (priority, task_id))
    conn.commit()
    conn.close()

def update_task_effort(task_id, effort):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET effort = ? WHERE id = ?', (effort, task_id))
    conn.commit()
    conn.close()

def update_task_notes(task_id, notes):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET notes = ? WHERE id = ?', (notes, task_id))
    conn.commit()
    conn.close()

def update_task_day_block(task_id, day_block):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET day_block = ? WHERE id = ?', (day_block, task_id))
    conn.commit()
    conn.close()

def update_task_project(task_id, project_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET project_id = ? WHERE id = ?', (project_id, task_id))
    conn.commit()
    conn.close()

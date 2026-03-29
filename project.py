import db


def create(name):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO projects (name) VALUES (?)', (name,))
    conn.commit()
    project_id = cursor.lastrowid
    conn.close()
    return project_id

def get_all():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, notes FROM projects')
    projects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return projects

def delete(project_id):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
    conn.commit()
    conn.close()

def update(project_id, name):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE projects SET name = ? WHERE id = ?', (name, project_id))
    conn.commit()
    conn.close()

def update_notes(project_id, notes):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE projects SET notes = ? WHERE id = ?', (notes, project_id))
    conn.commit()
    conn.close()

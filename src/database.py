# Description: This file contains the Database class, which is used to interact with the database.

import sqlite3

class Database: 
    def __init__(self, database_name):
        self.database_name = database_name
        self.conn = sqlite3.connect(database_name)
        self.cursor = self.conn.cursor()

        self.cursor.execute('''CREATE TABLE IF NOT EXISTS tasks (
                                id INTEGER PRIMARY KEY,
                                name TEXT
                            )''')

    def add_task(self,task):
        attributes = task.__dict__  # Get the dictionary of attributes of the Task object
        attribute_names = ', '.join(attributes.keys())  # Comma-separated attribute names for the SQL statement
        placeholders = ', '.join(['?'] * len(attributes))  # Placeholders for the attribute values in the SQL statement
        values = tuple(attributes.values())  # Tuple of attribute values for the SQL statement

        query = f"INSERT INTO tasks ({attribute_names}) VALUES ({placeholders})"
        self.conn.execute(query, values)

        self.conn.commit() 

    def get_tasks(self):
        cursor = self.cursor 
        cursor.execute("SELECT * FROM tasks")
        rows = cursor.fetchall()
        return rows
    
    def delete_task(self,task_id):
        cursor = self.cursor
        cursor.execute("DELETE FROM tasks WHERE id=?", (task_id,))
        
        self.conn.commit()

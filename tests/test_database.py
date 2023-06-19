import unittest
import os 
from src.task import Task
from src.database import Database

class DatabaseTestCase(unittest.TestCase):
    def setUp(self):
        self.db = Database(':memory:') 
    
    def tearDown(self):
        self.db.conn.close()

    def test_Database_class(self):
        self.assertIsInstance(self.db, Database)
        self.assertIsNotNone(self.db.conn)
        
        cursor = self.db.cursor 
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'")
        result = cursor.fetchone() 

        self.assertIsNotNone(result)
        self.assertEqual(result[0], 'tasks')

    def test_add_task(self):
        task1 = Task(1, "Task1")
        self.db.add_task(task1)
        task2 = Task(2, "Task2")
        self.db.add_task(task2)

    def test_get_tasks(self):
        task1 = Task(1, "Task1")
        self.db.add_task(task1)
        task2 = Task(2, "Task2")
        self.db.add_task(task2)
        tasks = self.db.get_tasks()

        self.assertIsNotNone(tasks) # Check that tasks is not None
        self.assertEqual(len(tasks), 2) # Check that tasks has 2 items
        self.assertEqual(tasks[0], (1,"Task1")) # Check task1 
        self.assertEqual(tasks[1], (2,"Task2")) # Check task2

    def test_delete_task(self): 
        task1 = Task(1, "Task1")
        self.db.add_task(task1)
        task2 = Task(2, "Task2")
        self.db.add_task(task2)

        self.db.delete_task(task1)
        tasks = self.db.get_tasks()
        self.assertEqual(len(tasks), 1) # Check that tasks has 1 items
        self.assertEqual(tasks[0], (2,"Task2")) # Check task2

if __name__ == '__main__':
    unittest.main()
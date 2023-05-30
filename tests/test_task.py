# import sys
# import os 

# file_path = os.path.abspath(__file__)
# parent_dir = os.path.dirname(file_path)
# print('parend dir')
# print(parent_dir)

import unittest
from src.task import *

class TaskTestCase(unittest.TestCase):
    def test_task_class(self):
        task = Task(1, "Task Name")
        self.assertEqual(task.id, 1)
        self.assertEqual(task.name, "Task Name")

    def test_create_task_func(self):
        task = create_task(1,'Task 1')
        self.assertEqual(task.id, 1)
        self.assertEqual(task.name, "Task 1")

if __name__ == '__main__':
    unittest.main()
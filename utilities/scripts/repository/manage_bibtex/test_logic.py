import unittest
import os
from models import BibManager

class TestBibManager(unittest.TestCase):
    def setUp(self):
        self.test_file = 'test.bib'
        with open(self.test_file, 'w') as f:
            f.write('''
@article{key1,
    title = {A Very Important Paper},
    author = {Smith, John and Doe, Jane},
    year = {2020}
}

@inproceedings{key2,
    title = {a very important paper},
    author = {Smith, J. and Doe, J.},
    year = {2020}
}

@article{key3,
    title = {Completely Different Title},
    year = {}
}
''')
        self.manager = BibManager(self.test_file)

    def tearDown(self):
        if os.path.exists(self.test_file):
            os.remove(self.test_file)

    def test_find_duplicates(self):
        dups = self.manager.find_duplicates()
        self.assertEqual(len(dups), 1)
        self.assertEqual(len(dups[0]), 2)
        keys = {e['ID'] for e in dups[0]}
        self.assertTrue('key1' in keys)
        self.assertTrue('key2' in keys)

    def test_find_incomplete(self):
        inc = self.manager.find_incomplete()
        # key3 is missing author and year is empty
        self.assertEqual(len(inc), 1)
        self.assertEqual(inc[0]['ID'], 'key3')

if __name__ == '__main__':
    unittest.main()

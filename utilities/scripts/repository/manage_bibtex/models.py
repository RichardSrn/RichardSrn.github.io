import bibtexparser
from bibtexparser.bparser import BibTexParser
from bibtexparser.bwriter import BibTexWriter
from bibtexparser.bibdatabase import BibDatabase
from rapidfuzz import fuzz, utils
import re
from typing import List, Dict, Tuple, Set

class BibManager:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.db = None
        self.load()

    def load(self):
        with open(self.filepath, 'r', encoding='utf-8') as bibtex_file:
            parser = BibTexParser(common_strings=True)
            # DO NOT convert to lower case for keys/values
            parser.ignore_nonstandard_types = False
            self.db = bibtexparser.load(bibtex_file, parser=parser)

    def save(self):
        writer = BibTexWriter()
        writer.indent = '  '
        writer.order_entries_by = None # preserve order
        with open(self.filepath, 'w', encoding='utf-8') as bibtex_file:
            bibtexparser.dump(self.db, bibtex_file, writer)
            
    def get_entries(self):
        return self.db.entries

    def find_duplicates(self, threshold=85.0) -> Tuple[List[List[Dict]], Dict[str, str]]:
        """
        Find duplicate entries using hard identifiers (DOI, URL, ID, exact title),
        falling back to fuzzy matching on normalized title and author.
        Returns a tuple: (list of duplicate groups, dictionary of reasons by ID).
        """
        duplicates_groups = []
        reasons = {} # Maps ID -> Explainability string
        visited_ids = set()
        
        entries = self.db.entries
        
        for i, entry1 in enumerate(entries):
            entry_id1 = entry1.get('ID')
            if entry_id1 in visited_ids:
                continue
                
            current_group = [entry1]
            
            # Normalize fields for base entry
            title1 = utils.default_process(entry1.get('title', ''))
            author1 = utils.default_process(entry1.get('author', ''))
            doi1 = entry1.get('doi', '').strip().lower()
            url1 = entry1.get('url', '').strip().lower()
            
            for j in range(i + 1, len(entries)):
                entry2 = entries[j]
                entry_id2 = entry2.get('ID')
                if entry_id2 in visited_ids:
                    continue
                    
                title2 = utils.default_process(entry2.get('title', ''))
                author2 = utils.default_process(entry2.get('author', ''))
                doi2 = entry2.get('doi', '').strip().lower()
                url2 = entry2.get('url', '').strip().lower()
                
                is_duplicate = False
                match_reason = ""

                # 1. Hard Matches (Fast & Certain)
                if entry_id1.lower() == entry_id2.lower():
                    is_duplicate, match_reason = True, "Same BibTeX ID"
                elif doi1 and doi2 and doi1 == doi2:
                    is_duplicate, match_reason = True, f"Same DOI ({doi1})"
                elif url1 and url2 and url1 == url2:
                    is_duplicate, match_reason = True, "Same URL"
                elif title1 and title2 and title1 == title2:
                    is_duplicate, match_reason = True, "Exact Title Match"
                    
                # 2. Fuzzy Match Fallback
                else:
                    title_sim = fuzz.ratio(title1, title2) if title1 and title2 else 0.0
                    author_sim = fuzz.token_sort_ratio(author1, author2) if author1 and author2 else 100.0
                    
                    if title_sim >= threshold and author_sim >= 70.0:
                        is_duplicate = True
                        match_reason = f"Fuzzy Match (Title: {title_sim:.0f}%, Author: {author_sim:.0f}%)"
                        
                if is_duplicate:
                    current_group.append(entry2)
                    visited_ids.add(entry_id2)
                    reasons[entry_id2] = match_reason
                    
            if len(current_group) > 1:
                duplicates_groups.append(current_group)
                visited_ids.add(entry_id1)
                reasons[entry_id1] = "Base Entry (Matched against this)"
                
        return duplicates_groups, reasons

    def find_incomplete(self) -> List[Dict]:
        """
        Check for missing critical fields and tag them with reasons.
        """
        incomplete_entries = []
        for entry in self.db.entries:
            missing = []
            entry_type = entry.get('ENTRYTYPE', '').lower()
            
            # 1. Check Global Required Fields
            required_fields = ['title', 'year']
            for req in required_fields:
                if req not in entry or not str(entry.get(req, '')).strip():
                    missing.append(req)
            
            # 2. Check Author/Editor (Specific to common types)
            if entry_type in ['article', 'inproceedings', 'incollection', 'book']:
                if 'author' not in entry and 'editor' not in entry:
                    missing.append("author/editor")
            
            # 3. Check specific types (optional but helpful)
            if entry_type == 'article' and 'journal' not in entry:
                missing.append("journal")
            elif entry_type in ['inproceedings', 'incollection'] and 'booktitle' not in entry:
                missing.append("booktitle")

            if missing:
                # We create a copy to avoid mutating the original DB entry in memory 
                # if you only want the reason to show up in this specific view
                entry_copy = entry.copy()
                entry_copy['reason_incomplete'] = f"Missing: {', '.join(missing)}"
                incomplete_entries.append(entry_copy)
                
        return incomplete_entries

    def delete_entry(self, entry_id: str):
        """Delete an entry by its ID"""
        self.db.entries = [e for e in self.db.entries if e.get('ID') != entry_id]
        
    def merge_entries(self, keep_id: str, delete_ids: List[str]):
        """
        Very simple merge: keep the entry with 'keep_id', delete the others.
        (Could be expanded to merge specific fields)
        """
        for d_id in delete_ids:
            self.delete_entry(d_id)
            
    def update_entry(self, entry_id: str, new_data: dict):
        """Update an existing entry"""
        for i, e in enumerate(self.db.entries):
            if e.get('ID') == entry_id:
                # Update but preserve ENTRYTYPE and ID if they exist
                for k, v in new_data.items():
                    self.db.entries[i][k] = v
                break

import sys
import os
from pathlib import Path
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical, VerticalScroll, Center
from textual.widgets import Header, Footer, DataTable, Input, Button, Label, Static, Checkbox, DirectoryTree
from textual.screen import ModalScreen, Screen
from textual.binding import Binding
from textual.message import Message

from models import BibManager







class BibFileTree(DirectoryTree):
    """A DirectoryTree filtered to highlight .bib files."""
    def filter_paths(self, paths: list[Path]) -> list[Path]:
        return [path for path in paths if not path.name.startswith(".")]

class FilePickerScreen(Screen[str]):
    """The startup screen to select or enter a .bib file path."""
    
    def compose(self) -> ComposeResult:
        yield Vertical(
            Label("Welcome to BibManager", id="picker-title"),
            Label("Select a .bib file from the list or enter a manual path below:"),
            BibFileTree("./", id="file-tree"),
            Horizontal(
                Input(placeholder="Manual path to .bib file...", id="manual-path"),
                Button("Load File", variant="success", id="btn-load-manual"),
            ),
            id="picker-container"
        )

    def on_directory_tree_file_selected(self, event: DirectoryTree.FileSelected) -> None:
        if event.path.suffix == ".bib":
            self.dismiss(str(event.path))
        else:
            self.notify("Please select a .bib file", variant="error")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-load-manual":
            path = self.query_one("#manual-path", Input).value
            if os.path.exists(path) and path.endswith(".bib"):
                self.dismiss(path)
            else:
                self.notify("Invalid file path or not a .bib file", variant="error")


class EditEntryModal(ModalScreen[dict]):
    """Modal with form inputs to edit an entry's fields."""
    def __init__(self, entry_data: dict):
        super().__init__()
        self.entry_data = entry_data
        self.inputs = {}

    def compose(self) -> ComposeResult:
        yield Vertical(
            Label(f"Editing: {self.entry_data.get('ID')}", id="modal-title"),
            VerticalScroll(
                *[
                    Vertical(
                        Label(k.capitalize()), 
                        Input(value=str(v), id=f"edit-{k}")
                    ) 
                    for k, v in self.entry_data.items() if k != 'ID'
                ],
                id="modal-content"
            ),
            Horizontal(
                Button("Save Changes", variant="success", id="btn-save"),
                Button("Cancel", variant="primary", id="btn-cancel"),
                id="modal-buttons"
            ),
            id="modal-dialog"
        )

    def on_mount(self) -> None:
        for k in self.entry_data:
            if k != 'ID':
                self.inputs[k] = self.query_one(f"#edit-{k}", Input)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-save":
            new_data = {k: inp.value for k, inp in self.inputs.items()}
            self.dismiss({"action": "save_edit", "data": new_data})
        else:
            self.dismiss({"action": "cancel"})


class DetailModal(ModalScreen[dict]):
    """Single entry view modal, now with an Edit option."""
    def __init__(self, entry_data: dict):
        super().__init__()
        self.entry_data = entry_data

    def compose(self) -> ComposeResult:
        content = "\n".join([f"{k}: {v}" for k, v in self.entry_data.items() if k != 'ID'])
        
        yield Vertical(
            Label(f"Entry ID: {self.entry_data.get('ID')}", id="modal-title"),
            Static(content, id="modal-content"),
            Horizontal(
                Button("Edit Entry", variant="warning", id="btn-edit"),
                Button("Delete Entry", variant="error", id="btn-delete"),
                Button("Close", variant="primary", id="btn-cancel"),
                id="modal-buttons"
            ),
            id="modal-dialog"
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-edit":
            self.dismiss({"action": "open_edit"})
        elif event.button.id == "btn-delete":
            self.dismiss({"action": "delete"})
        else:
            self.dismiss({"action": "cancel"})


class DuplicateGroupModal(ModalScreen[dict]):
    """Displays a whole group of duplicates and allows multi-selection for deletion."""
    def __init__(self, group: list):
        super().__init__()
        self.group = group
        self.checkboxes = {}

    def compose(self) -> ComposeResult:
        yield Vertical(
            Label("Manage Duplicate Group", id="modal-title"),
            VerticalScroll(
                *[Checkbox(f"{e.get('ID')} - {e.get('title', '')[:40]}...", id=f"chk_{e.get('ID')}") for e in self.group],
                id="modal-content"
            ),
            Horizontal(
                Button("Delete Selected", variant="error", id="btn-delete-selected"),
                Button("Cancel", variant="primary", id="btn-cancel"),
                id="modal-buttons"
            ),
            id="modal-dialog"
        )

    def on_mount(self) -> None:
        for e in self.group:
            self.checkboxes[e.get('ID')] = self.query_one(f"#chk_{e.get('ID')}", Checkbox)

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-delete-selected":
            to_delete = [e_id for e_id, cb in self.checkboxes.items() if cb.value]
            self.dismiss({"action": "delete_multiple", "ids": to_delete})
        else:
            self.dismiss({"action": "cancel"})

class BibApp(App):
    CSS = """
    Screen {
        layout: vertical;
    }
    
    #search-bar {
        margin: 1;
        width: 100%;
    }
    
    #action-bar {
        height: 3;
        margin-bottom: 1;
        align: center middle;
    }
    
    DataTable {
        height: 1fr;
    }
    
    DetailModal {
        align: center middle;
    }

    #threshold-container {
        width: auto;
        height: auto;
        align: center middle;
        margin-left: 1;
    }

    #threshold-label {
        padding: 1;
    }

    #input-threshold {
        width: 10;
    }

    #modal-dialog {
        padding: 1 2;
        width: 80%;
        height: 80%;
        border: thick $background 80%;
        background: $surface;
    }
    
    #modal-title {
        text-align: center;
        text-style: bold;
        padding-bottom: 1;
    }
    
    #modal-content {
        height: 1fr;
        padding: 1;
        border: solid $primary;
        overflow-y: auto;
    }
    
    #modal-buttons {
        height: auto;
        margin-top: 1;
        align: center middle;
        dock: bottom;
    }

    #picker-container {
        padding: 2 4;
        background: $surface;
    }

    #picker-title {
        color: $accent;
        margin-bottom: 1;
    }

    #file-tree {
        height: 15;
        border: tall $primary;
        margin-bottom: 1;
    }
    """

    BINDINGS = [
        ("q", "quit", "Quit"),
        ("s", "save", "Save Changes"),
    ]

    def __init__(self):
        super().__init__()
        self.manager = None
        self.bib_path = None
        self.current_filter = "all"
        self.search_term = ""
        self.duplicate_reasons = {}
        self.duplicate_groups = [] # Track the full groups here
        self.sim_threshold = 85.0  # Default threshold
    
    def compose(self) -> ComposeResult:
        yield Header()
        yield Input(placeholder="Search by ID, Title, or Author...", id="search-bar")
        yield Horizontal(
            Button("Show All", id="filter-all", variant="primary"),
            Button("Show Duplicates", id="filter-duplicates", variant="warning"),
            Horizontal(
                Label("Duplicate Threshold:", id="threshold-label"),
                Input(value="85", id="input-threshold"),
                id="threshold-container"
            ),
            Button("Show Incomplete", id="filter-incomplete", variant="error"),
            Button("Save", id="btn-save", variant="success"),
            id="action-bar"
        )
        yield DataTable(id="bib-table")
        yield Footer()

    def on_mount(self) -> None:
        # Just set up the table and show the picker
        table = self.query_one(DataTable)
        table.add_columns("ID", "Type", "Title", "Author", "Year", "Reason") 
        table.cursor_type = "row"
        
        # Show the picker immediately
        self.push_screen(FilePickerScreen(), self.load_bib_file)

    def load_bib_file(self, path: str) -> None:
        if path:
            self.bib_path = path
            self.manager = BibManager(path)
            self.refresh_table()
            self.notify(f"Loaded: {os.path.basename(path)}")

    def refresh_table(self) -> None:
        if not self.manager:
            return

        table = self.query_one(DataTable)
        table.clear()
        
        entries = []
        self.duplicate_reasons = {}
        self.duplicate_groups = []
        
        if self.current_filter == "all":
            entries = self.manager.get_entries()
        elif self.current_filter == "incomplete":
            entries = self.manager.find_incomplete()
        elif self.current_filter == "duplicates":
            # Pass our dynamically tracked threshold to the models.py method
            self.duplicate_groups, reasons = self.manager.find_duplicates(threshold=self.sim_threshold)
            self.duplicate_reasons = reasons 
            
            for g in self.duplicate_groups:
                entries.extend(g)
                entries.append({"ID": "\33[31m>>> DUPLICATE GROUP SEPARATOR <<<", "ENTRYTYPE": "", "title": ""})
        
        # Apply search filter
        if self.search_term and self.current_filter != "duplicates":
            filtered = []
            for e in entries:
                text = (e.get("ID", "") + e.get("title", "") + e.get("author", "")).lower()
                if self.search_term in text:
                    filtered.append(e)
            entries = filtered
            
        seen_keys = set()
        for e in entries:
            base_id = e.get('ID', '')
            row_key = base_id
            
            # Handle unique row keys for duplicate display
            counter = 1
            while row_key in seen_keys:
                row_key = f"{base_id}__dup{counter}"
                counter += 1
            seen_keys.add(row_key)
            
            # DETERMINE THE REASON STRING
            reason_str = ""
            if self.current_filter == "duplicates":
                reason_str = self.duplicate_reasons.get(base_id, "") if base_id != "---" else ""
            elif self.current_filter == "incomplete":
                reason_str = e.get('reason_incomplete', "")

            table.add_row(
                e.get('ID', ''), 
                e.get('ENTRYTYPE', ''),
                e.get('title', '')[:50] + ('...' if len(e.get('title', '')) > 50 else ''),
                e.get('author', '')[:30] + ('...' if len(e.get('author', '')) > 30 else ''),
                e.get('year', ''), 
                reason_str, # This fills our 6th column
                key=row_key
            )

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        row_key = event.row_key.value
        
        entry_id = row_key.split("__dup")[0]
        
        if entry_id == "---":
            return # Separator
            
        entry_data = None
        for e in self.manager.get_entries():
            if e.get("ID") == entry_id:
                entry_data = e
                break
                
        if entry_data:
            self.push_screen(DetailModal(entry_data), self.handle_modal_result)
            self.active_entry_id = entry_id

    def on_input_changed(self, event: Input.Changed) -> None:
        if event.input.id == "search-bar":
            self.search_term = event.value.lower()
            self.refresh_table()
        elif event.input.id == "input-threshold":
            # If the user clears the input, don't crash, just wait for a number
            if not event.value:
                return
            try:
                val = float(event.value)
                self.sim_threshold = val
                if self.current_filter == "duplicates":
                    self.refresh_table()
            except ValueError:
                pass

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "filter-all":
            self.current_filter = "all"
            self.refresh_table()
        elif event.button.id == "filter-duplicates":
            self.current_filter = "duplicates"
            self.refresh_table()
        elif event.button.id == "filter-incomplete":
            self.current_filter = "incomplete"
            self.refresh_table()
        elif event.button.id == "btn-save":
            self.action_save()

    def on_data_table_row_selected(self, event: DataTable.RowSelected) -> None:
        row_key = event.row_key.value
        entry_id = row_key.split("__dup")[0]
        if entry_id == "---":
            return
            
        self.active_entry_id = entry_id

        if self.current_filter == "duplicates":
            target_group = next((g for g in self.duplicate_groups if any(e.get('ID') == entry_id for e in g)), None)
            if target_group:
                self.push_screen(DuplicateGroupModal(target_group), self.handle_modal_result)
                return

        # Otherwise, open the single-entry Detail Modal
        entry_data = next((e for e in self.manager.get_entries() if e.get("ID") == entry_id), None)
        if entry_data:
            self.push_screen(DetailModal(entry_data), self.handle_modal_result)

    def handle_modal_result(self, result: dict) -> None:
        # Changed this to expect a dictionary instead of a raw string
        if not result or result.get("action") == "cancel":
            return

        action = result.get("action")
        
        if action == "delete":
            self.manager.delete_entry(self.active_entry_id)
            self.notify(f"Deleted entry {self.active_entry_id}")
            self.refresh_table()
            
        elif action == "delete_multiple":
            ids_to_delete = result.get("ids", [])
            for d_id in ids_to_delete:
                self.manager.delete_entry(d_id)
            self.notify(f"Deleted {len(ids_to_delete)} entries.")
            self.refresh_table()
            
        elif action == "open_edit":
            # Pass the data to the Edit modal
            entry_data = next((e for e in self.manager.get_entries() if e.get("ID") == self.active_entry_id), None)
            if entry_data:
                self.push_screen(EditEntryModal(entry_data), self.handle_modal_result)
                
        elif action == "save_edit":
            new_data = result.get("data", {})
            self.manager.update_entry(self.active_entry_id, new_data)
            self.notify("Entry updated.")
            self.refresh_table()

    def action_save(self) -> None:
        self.manager.save()
        self.notify("Bibliography saved to file.")

if __name__ == "__main__":
    app = BibApp() 
    app.run()

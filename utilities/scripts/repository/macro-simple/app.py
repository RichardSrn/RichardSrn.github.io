import os
import time
import json
import threading
import subprocess
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Button, Static, Label, OptionList, Input
from textual.containers import Container, Vertical, Horizontal
from textual.screen import Screen, ModalScreen
from models import Macro
from recorder import MacroRecorder
from player import MacroPlayer

MACROS_DIR = "saved_macros"

class RenameModal(ModalScreen[str]):
    def __init__(self, current_name: str, **kwargs):
        super().__init__(**kwargs)
        self.current_name = current_name

    def compose(self) -> ComposeResult:
        with Vertical(id="rename-dialog"):
            yield Label("Rename Macro:")
            yield Input(value=self.current_name, id="rename-input")
            with Horizontal():
                yield Button("Save", variant="success", id="btn-save")
                yield Button("Cancel", variant="error", id="btn-cancel")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-save":
            inp = self.query_one("#rename-input", Input)
            self.dismiss(inp.value)
        elif event.button.id == "btn-cancel":
            self.dismiss(None)

class ImportScreen(Screen):
    def compose(self) -> ComposeResult:
        with Vertical(id="import-dialog"):
            yield Label("Enter absolute or relative path to .json macro file:")
            yield Input(placeholder="/path/to/macro.json", id="import-input")
            with Horizontal():
                yield Button("Import", variant="success", id="btn-do-import")
                yield Button("Cancel", variant="error", id="btn-cancel-import")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-cancel-import":
            self.app.pop_screen()
        elif event.button.id == "btn-do-import":
            inp = self.query_one("#import-input", Input).value.strip()
            if not inp or not os.path.exists(inp):
                self.app.notify("File does not exist!", severity="error")
                return
            try:
                m = Macro.load_from_file(inp)
                basename = os.path.basename(inp)
                m.save_to_file(os.path.join(MACROS_DIR, basename))
                self.app.notify("Macro imported successfully!")
                self.app.pop_screen()
            except Exception as e:
                self.app.notify(f"Error importing: {str(e)}", severity="error")

class RecordScreen(Screen):
    def compose(self) -> ComposeResult:
        with Vertical(id="recording-container"):
            yield Label("", id="countdown-label")

    def on_mount(self):
        self.timer_val = 3
        self.label = self.query_one("#countdown-label", Label)
        self.set_interval(1, self.tick)

    def tick(self):
        if self.timer_val > 0:
            self.label.update(f"Recording starts in: {self.timer_val}")
            self.timer_val -= 1
        elif self.timer_val == 0:
            self.label.update("🔴 RECORDING...\n\nPress CTRL+ESC to stop")
            self.timer_val -= 1
            self.app.start_recording()
        else:
            if not self.app.recorder._is_recording:
                self.app.pop_screen()
                self.app.save_macro()

class MacroListScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical():
            yield Label("Saved Macros", id="macro-title")
            yield OptionList(id="macro-list")
            with Horizontal(id="macro-actions"):
                yield Label("Repeat:", id="repeat-label")
                yield Input(value="1", id="play-count", restrict=r"[0-9]*")
                yield Label("x", id="repeat-suffix")
                yield Button("Play", id="btn-play", variant="success", disabled=True)
                yield Button("Edit", id="btn-edit", disabled=True)
                yield Button("Rename", id="btn-rename", disabled=True)
                yield Button("Delete", id="btn-delete", variant="error", disabled=True)
                yield Button("Back", id="btn-back")
        yield Footer()

    def on_mount(self):
        self.load_macros()

    def load_macros(self):
        self.macros = {}
        opt_list = self.query_one("#macro-list", OptionList)
        opt_list.clear_options()
        
        if not os.path.exists(MACROS_DIR):
            return
            
        for f in os.listdir(MACROS_DIR):
            if f.endswith(".json"):
                filepath = os.path.join(MACROS_DIR, f)
                try:
                    m = Macro.load_from_file(filepath)
                    self.macros[m.name] = (m, filepath)
                    opt_list.add_option(m.name)
                except Exception as e:
                    pass

    def on_option_list_option_highlighted(self, event: OptionList.OptionHighlighted) -> None:
        has_sel = event.option is not None
        for btn_id in ["#btn-play", "#btn-edit", "#btn-rename", "#btn-delete"]:
            self.query_one(btn_id, Button).disabled = not has_sel

    def get_selected(self):
        opt_list = self.query_one("#macro-list", OptionList)
        if opt_list.highlighted is None:
            return None
        opt = opt_list.get_option_at_index(opt_list.highlighted)
        return self.macros.get(opt.prompt)

    async def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        
        if button_id == "btn-back":
            self.app.pop_screen()
            return
            
        sel = self.get_selected()
        if not sel:
            return
            
        macro, filepath = sel
        
        if button_id == "btn-play":
            count_str = self.query_one("#play-count", Input).value or "1"
            try:
                count = int(count_str)
            except ValueError:
                count = 1
                
            self.app.notify(f"Playing {macro.name} ({count} times)...")
            # We play in a thread so UI doesn't freeze
            def _play():
                for i in range(count):
                    self.app.player.play(macro)
                    if self.app.player._abort:
                        break
            t = threading.Thread(target=_play)
            t.start()
            
        elif button_id == "btn-delete":
            os.remove(filepath)
            self.app.notify(f"Deleted {macro.name}")
            self.load_macros()
            
        elif button_id == "btn-rename":
            def check_rename(new_name: str | None) -> None:
                if new_name and new_name != macro.name:
                    macro.name = new_name
                    macro.save_to_file(filepath)
                    self.load_macros()
            
            self.app.push_screen(RenameModal(macro.name), check_rename)
            
        elif button_id == "btn-edit":
            with self.app.suspend():
                editor = os.environ.get("EDITOR", "nano")
                subprocess.call([editor, filepath])
            # reload after edit
            self.load_macros()


class MainMenu(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical(id="menu-buttons"):
            yield Label("Macro Simple Tool", id="title")
            yield Button("Start Recording", id="btn-record", variant="success")
            yield Button("Show Macros", id="btn-show")
            yield Button("Import Macros", id="btn-import")
            yield Button("Quit", id="btn-quit", variant="error")
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        button_id = event.button.id
        if button_id == "btn-quit":
            self.app.exit()
        elif button_id == "btn-record":
            self.app.push_screen(RecordScreen())
        elif button_id == "btn-show":
            self.app.push_screen(MacroListScreen())
        elif button_id == "btn-import":
            self.app.push_screen(ImportScreen())

class MacroApp(App):
    CSS = """
    #menu-buttons {
        align: center middle;
        height: 100%;
    }
    #title {
        text-align: center;
        content-align: center middle;
        margin-bottom: 2;
        text-style: bold;
    }
    Button {
        margin: 1;
        width: 30;
    }
    #recording-container {
        align: center middle;
        height: 100%;
        background: $boost;
    }
    #countdown-label {
        text-align: center;
        text-style: bold;
        color: yellow;
    }
    #macro-actions {
        height: 5;
        align: center middle;
    }
    #play-count {
        width: 8;
        margin: 0;
        padding: 0 1;
    }
    #repeat-label, #repeat-suffix {
        margin: 1;
        content-align: center middle;
    }
    #macro-title {
        text-align: center;
        margin: 1;
        text-style: bold;
    }
    RenameModal {
        align: center middle;
    }
    #rename-dialog, #import-dialog {
        padding: 1 2;
        width: 60;
        height: 15;
        border: thick $background 80%;
        background: $surface;
        align: center middle;
    }
    ImportScreen {
        align: center middle;
    }
    """

    def on_mount(self):
        if not os.path.exists(MACROS_DIR):
            os.makedirs(MACROS_DIR)
        self.recorder = MacroRecorder()
        self.player = MacroPlayer()
        self.push_screen(MainMenu())

    def start_recording(self):
        def _recorder_thread():
            self.recorder.start()
            while self.recorder._is_recording:
                time.sleep(0.1)
        
        t = threading.Thread(target=_recorder_thread)
        t.daemon = True
        t.start()

    def save_macro(self):
        timestamp = int(time.time())
        filename = os.path.join(MACROS_DIR, f"macro_{timestamp}.json")
        m = Macro(name=f"Macro {timestamp}", events=self.recorder.events)
        m.save_to_file(filename)
        self.notify(f"Saved {len(m.events)} events to {filename}")

if __name__ == "__main__":
    app = MacroApp()
    app.run()

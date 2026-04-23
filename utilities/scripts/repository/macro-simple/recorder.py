import time
from typing import List, Callable
from pynput import mouse, keyboard
from models import KeyEvent, MouseEvent, PauseEvent, BaseEvent, Macro

class MacroRecorder:
    def __init__(self, save_mouse_moves_without_click: bool = False):
        self.events: List[BaseEvent] = []
        self._last_event_time = 0.0
        self._is_recording = False
        self._save_mouse_moves_without_click = save_mouse_moves_without_click
        
        self.keyboard_listener = None
        self.mouse_listener = None
        
        self._mouse_buttons_pressed = set()
        self._ctrl_pressed = False
        
        # Callbacks
        self.on_stop_callback: Callable = None

    def start(self):
        self.events.clear()
        self._mouse_buttons_pressed.clear()
        self._ctrl_pressed = False
        self._is_recording = True
        self._last_event_time = time.time()
        
        self.keyboard_listener = keyboard.Listener(
            on_press=self._on_key_press,
            on_release=self._on_key_release
        )
        self.mouse_listener = mouse.Listener(
            on_move=self._on_mouse_move,
            on_click=self._on_mouse_click,
            on_scroll=self._on_mouse_scroll
        )
        
        self.keyboard_listener.start()
        self.mouse_listener.start()

    def stop(self):
        if not self._is_recording:
            return
        self._is_recording = False
        if self.keyboard_listener:
            self.keyboard_listener.stop()
        if self.mouse_listener:
            self.mouse_listener.stop()
            
        if self.on_stop_callback:
            self.on_stop_callback()

    def _record_event(self, event: BaseEvent):
        # We don't record if we stopped
        if not self._is_recording:
            return
            
        now = time.time()
        duration = now - self._last_event_time
        if duration > 0.01:
            self.events.append(PauseEvent(duration=duration))
            
        self.events.append(event)
        self._last_event_time = now

    def _convert_key(self, key) -> str:
        if hasattr(key, 'char') and key.char is not None:
            return key.char
        return str(key)

    def _on_key_press(self, key):
        key_str = self._convert_key(key)
        
        # Track ctrl state for hotkey
        if key == keyboard.Key.ctrl or key == keyboard.Key.ctrl_l or key == keyboard.Key.ctrl_r:
            self._ctrl_pressed = True
            
        # Check stop hotkey CTRL + ESC
        if key == keyboard.Key.esc and self._ctrl_pressed:
            # We want to remove the last Key.ctrl press so it isn't part of the macro
            if self.events and isinstance(self.events[-1], KeyEvent) and self.events[-1].key in ("Key.ctrl", "Key.ctrl_l", "Key.ctrl_r"):
                self.events.pop()
                if self.events and isinstance(self.events[-1], PauseEvent):
                    self.events.pop()
                    
            # Stop immediately
            self.stop()
            return False

        self._record_event(KeyEvent(key=key_str, pressed=True))

    def _on_key_release(self, key):
        if not self._is_recording:
            return False
            
        key_str = self._convert_key(key)
        
        if key == keyboard.Key.ctrl or key == keyboard.Key.ctrl_l or key == keyboard.Key.ctrl_r:
            self._ctrl_pressed = False
            
        self._record_event(KeyEvent(key=key_str, pressed=False))

    def _on_mouse_move(self, x, y):
        # Only record if we are saving them natively OR if a button is held down
        if self._save_mouse_moves_without_click or len(self._mouse_buttons_pressed) > 0:
            self._record_event(MouseEvent(x=int(x), y=int(y)))

    def _on_mouse_click(self, x, y, button, pressed):
        button_str = str(button)
        if pressed:
            self._mouse_buttons_pressed.add(button_str)
        else:
            self._mouse_buttons_pressed.discard(button_str)
            
        self._record_event(MouseEvent(x=int(x), y=int(y), button=button_str, pressed=pressed))

    def _on_mouse_scroll(self, x, y, dx, dy):
        self._record_event(MouseEvent(x=int(x), y=int(y), dx=int(dx), dy=int(dy)))

if __name__ == "__main__":
    v = MacroRecorder()
    v.on_stop_callback = lambda: print("\nStopped! Events recorded:", len(v.events))
    print("Recording... press CTRL+ESC to stop.")
    v.start()
    
    # Block until stopped
    while v._is_recording:
        time.time()
        time.sleep(0.1)
    
    for e in v.events:
        print(e)

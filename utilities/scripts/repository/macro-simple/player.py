import time
from pynput.keyboard import Controller as KeyboardController
from pynput.mouse import Controller as MouseController
from pynput.mouse import Button
from pynput.keyboard import Key, KeyCode
from models import Macro, KeyEvent, MouseEvent, PauseEvent

class MacroPlayer:
    def __init__(self):
        self.keyboard = KeyboardController()
        self.mouse = MouseController()
        self._is_playing = False
        self._abort = False

    def play(self, macro: Macro):
        self._is_playing = True
        self._abort = False
        
        for event in macro.events:
            if self._abort:
                break
                
            if isinstance(event, PauseEvent):
                time.sleep(event.duration)
                
            elif isinstance(event, KeyEvent):
                key = self._parse_key(event.key)
                if event.pressed:
                    self.keyboard.press(key)
                else:
                    self.keyboard.release(key)
                    
            elif isinstance(event, MouseEvent):
                # Move first
                self.mouse.position = (event.x, event.y)
                
                # Apply button state changes if any
                if event.button and event.pressed is not None:
                    btn = self._parse_button(event.button)
                    if event.pressed:
                        self.mouse.press(btn)
                    else:
                        self.mouse.release(btn)
                        
                # Apply scrolling
                if event.dx != 0 or event.dy != 0:
                    self.mouse.scroll(event.dx, event.dy)
                    
        self._is_playing = False

    def stop(self):
        self._abort = True

    def _parse_key(self, key_str: str):
        # Convert string back to Key enum or string char
        if key_str.startswith("Key."):
            attr = key_str.split(".")[1]
            return getattr(Key, attr, KeyCode.from_char('?'))
        return key_str

    def _parse_button(self, button_str: str):
        if button_str == "Button.left":
            return Button.left
        elif button_str == "Button.right":
            return Button.right
        elif button_str == "Button.middle":
            return Button.middle
        return Button.unknown

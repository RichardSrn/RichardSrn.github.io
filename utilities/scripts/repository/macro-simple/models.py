import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Union, Any

@dataclass
class BaseEvent:
    @property
    def event_type(self) -> str:
        return self.__class__.__name__

    def to_dict(self) -> dict:
        d = asdict(self)
        d["event_type"] = self.event_type
        return d

@dataclass
class KeyEvent(BaseEvent):
    key: str
    pressed: bool

@dataclass
class MouseEvent(BaseEvent):
    x: int
    y: int
    button: Optional[str] = None
    pressed: Optional[bool] = None
    dx: int = 0
    dy: int = 0

@dataclass
class PauseEvent(BaseEvent):
    duration: float

@dataclass
class Macro:
    name: str
    events: List[BaseEvent]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "events": [e.to_dict() for e in self.events]
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'Macro':
        events_data = data.get("events", [])
        events = []
        for e in events_data:
            etype = e.pop("event_type")
            if etype == "KeyEvent":
                events.append(KeyEvent(**e))
            elif etype == "MouseEvent":
                events.append(MouseEvent(**e))
            elif etype == "PauseEvent":
                events.append(PauseEvent(**e))
        return cls(name=data.get("name", "Unnamed"), events=events)

    def save_to_file(self, filepath: str):
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load_from_file(cls, filepath: str) -> 'Macro':
        with open(filepath, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)

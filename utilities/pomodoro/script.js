// Default settings
const DEFAULT_SETTINGS = {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4
};

// State
let state = {
    mode: 'work', // 'work', 'shortBreak', 'longBreak'
    timeLeft: DEFAULT_SETTINGS.work * 60,
    isActive: false,
    settings: { ...DEFAULT_SETTINGS },
    pomodoroCount: 0,
    theme: localStorage.getItem('pomodoroTheme') || 'dark'
};

let intervalId = null;

// DOM Elements
const elements = {
    timerDisplay: document.getElementById('timer-display'),
    modeButtons: {
        work: document.getElementById('mode-work'),
        shortBreak: document.getElementById('mode-shortBreak'),
        longBreak: document.getElementById('mode-longBreak')
    },
    btnStart: document.getElementById('btn-start'),
    btnReset: document.getElementById('btn-reset'),
    btnSettings: document.getElementById('btn-settings'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    settingsModal: document.getElementById('settings-modal'),
    inputs: {
        work: document.getElementById('settings-work'),
        shortBreak: document.getElementById('settings-shortBreak'),
        longBreak: document.getElementById('settings-longBreak'),
        longBreakInterval: document.getElementById('settings-longBreakInterval')
    },
    pomodoroCount: document.getElementById('pomodoro-count'),
    btnTheme: document.getElementById('btn-theme-toggle'),
    container: document.querySelector('.pomodoro-timer')
};

// Audio Helper
const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.error("Audio play failed", e);
    }
};

// Functions
function init() {
    loadSettings();
    applyTheme(state.theme);
    updateDisplay();
    setupEventListeners();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
        try {
            state.settings = JSON.parse(savedSettings);
        } catch (e) {
            console.error("Failed to parse settings", e);
        }
    }

    // Update inputs
    elements.inputs.work.value = state.settings.work;
    elements.inputs.shortBreak.value = state.settings.shortBreak;
    elements.inputs.longBreak.value = state.settings.longBreak;
    elements.inputs.longBreakInterval.value = state.settings.longBreakInterval;

    // Reset timer to current mode duration
    resetTimer();
}

function saveSettings() {
    state.settings.work = parseInt(elements.inputs.work.value) || DEFAULT_SETTINGS.work;
    state.settings.shortBreak = parseInt(elements.inputs.shortBreak.value) || DEFAULT_SETTINGS.shortBreak;
    state.settings.longBreak = parseInt(elements.inputs.longBreak.value) || DEFAULT_SETTINGS.longBreak;
    state.settings.longBreakInterval = parseInt(elements.inputs.longBreakInterval.value) || DEFAULT_SETTINGS.longBreakInterval;

    localStorage.setItem('pomodoroSettings', JSON.stringify(state.settings));

    // If timer is not active, match the current time to the new settings
    if (!state.isActive) {
        state.timeLeft = getDuration(state.mode);
        updateDisplay();
    }
}

function getDuration(mode) {
    switch (mode) {
        case 'work': return state.settings.work * 60;
        case 'shortBreak': return state.settings.shortBreak * 60;
        case 'longBreak': return state.settings.longBreak * 60;
        default: return state.settings.work * 60;
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
    elements.timerDisplay.textContent = formatTime(state.timeLeft);
    document.title = `${formatTime(state.timeLeft)} - ${state.mode === 'work' ? 'Work' : 'Break'}`;
    elements.pomodoroCount.textContent = state.pomodoroCount;

    // Update Start/Pause button text and style
    elements.btnStart.textContent = state.isActive ? 'Pause' : 'Start';
    if (state.isActive) {
        elements.btnStart.classList.add('active');
    } else {
        elements.btnStart.classList.remove('active');
    }

    // Update active mode button
    Object.keys(elements.modeButtons).forEach(key => {
        if (key === state.mode) {
            elements.modeButtons[key].classList.add('active');
        } else {
            elements.modeButtons[key].classList.remove('active');
        }
    });
}

function switchMode(newMode) {
    state.mode = newMode;
    state.isActive = false;
    clearInterval(intervalId);
    state.timeLeft = getDuration(newMode);

    if (state.mode === 'longBreak' && newMode !== 'longBreak') {
        state.pomodoroCount = 0; // Reset count on manual switch away from long break (optional logic, kept from React version)
    }

    updateDisplay();
}

function toggleTimer() {
    state.isActive = !state.isActive;

    if (state.isActive) {
        intervalId = setInterval(() => {
            state.timeLeft--;
            if (state.timeLeft < 0) {
                handleTimerEnd();
            } else {
                updateDisplay();
            }
        }, 1000);
    } else {
        clearInterval(intervalId);
    }
    updateDisplay();
}

function resetTimer() {
    state.isActive = false;
    clearInterval(intervalId);
    state.timeLeft = getDuration(state.mode);
    updateDisplay();
}

function handleTimerEnd() {
    clearInterval(intervalId);
    state.isActive = false;
    playBeep();

    if (state.mode === 'work') {
        state.pomodoroCount++;
        if (state.pomodoroCount % state.settings.longBreakInterval === 0) {
            switchMode('longBreak');
        } else {
            switchMode('shortBreak');
        }
    } else {
        if (state.mode === 'longBreak') state.pomodoroCount = 0;
        switchMode('work');
    }
    updateDisplay(); // Ensure display reflects new mode
}

function applyTheme(themeName) {
    state.theme = themeName;
    localStorage.setItem('pomodoroTheme', themeName);

    if (themeName === 'dark') {
        document.body.classList.add('dark-theme-body');
        elements.container.classList.add('dark-theme');
        elements.btnTheme.textContent = 'Switch to Light';
        elements.btnTheme.style.backgroundColor = '#ff6b6b';
        elements.btnTheme.style.color = 'white';
        elements.btnTheme.style.borderColor = '#ff6b6b';
    } else {
        document.body.classList.remove('dark-theme-body');
        elements.container.classList.remove('dark-theme');
        elements.btnTheme.textContent = 'Switch to Dark';
        elements.btnTheme.style.backgroundColor = '#eee';
        elements.btnTheme.style.color = '#333';
        elements.btnTheme.style.borderColor = '#ccc';
    }
}

function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

function setupEventListeners() {
    elements.modeButtons.work.addEventListener('click', () => switchMode('work'));
    elements.modeButtons.shortBreak.addEventListener('click', () => switchMode('shortBreak'));
    elements.modeButtons.longBreak.addEventListener('click', () => switchMode('longBreak'));

    elements.btnStart.addEventListener('click', toggleTimer);
    elements.btnReset.addEventListener('click', resetTimer);

    elements.btnSettings.addEventListener('click', () => {
        elements.settingsModal.style.display = elements.settingsModal.style.display === 'none' ? 'block' : 'none';
        // Reload settings values into inputs just in case
        elements.inputs.work.value = state.settings.work;
    });

    elements.btnCloseSettings.addEventListener('click', () => {
        elements.settingsModal.style.display = 'none';
    });

    // Save settings on input change
    Object.values(elements.inputs).forEach(input => {
        input.addEventListener('change', saveSettings);
    });

    elements.btnTheme.addEventListener('click', toggleTheme);
}

// Initialize
init();


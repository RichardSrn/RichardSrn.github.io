const endTimeInput = document.getElementById('endTimeInput');
const okBtn = document.getElementById('okBtn');
const timeDisplay = document.getElementById('timeDisplay');
const currentTimeValue = document.getElementById('currentTimeValue');
const remainingTimeValue = document.getElementById('remainingTimeValue');
const endTimeValue = document.getElementById('endTimeValue');
const maximizeBtn = document.getElementById('maximizeBtn');
const exitButton = document.getElementById('exitButton');
const primaryColorPicker = document.getElementById('primaryColorPicker');
const secondaryColorPicker = document.getElementById('secondaryColorPicker');

const warnHalfTime = document.getElementById('warnHalfTime');
const warnLong = document.getElementById('warnLong');
const warnLongMin = document.getElementById('warnLongMin');
const warnInvert = document.getElementById('warnInvert');
const testWarningsBtn = document.getElementById('testWarnings');
const toggleConfigBtn = document.getElementById('toggleConfig');
const warningConfigPanel = document.getElementById('warningConfigPanel');
const masterWarningToggle = document.getElementById('masterWarningToggle');
const breathDurationInput = document.getElementById('breathDuration');

const modeDurationBtn = document.getElementById('modeDuration');
const modeEndTimeBtn = document.getElementById('modeEndTime');

// Picker Elements
const timePickerBtn = document.getElementById('timePickerBtn');
const timePickerPopup = document.getElementById('timePickerPopup');
const pickerHours = document.getElementById('pickerHours');
const pickerMinutes = document.getElementById('pickerMinutes');
const pickerCtrls = document.querySelectorAll('.picker-ctrl');
const presetBtns = document.querySelectorAll('.preset-btn');

// Countdown inputs
const countdownConfigs = [5, 4, 3, 2, 1].map(num => ({
    checkbox: document.getElementById(`warn${num}`),
    input: document.getElementById(`val${num}`)
}));

let timerInterval;
let totalDuration = 0;
let lastWarnedMinute = -1;
let currentInputMode = 'duration'; // 'duration' or 'endtime'

// Sync breath duration with CSS
function updateBreathDuration() {
    const duration = breathDurationInput.value || 1;
    document.documentElement.style.setProperty('--breath-duration', `${duration}s`);
}

breathDurationInput.addEventListener('input', updateBreathDuration);
updateBreathDuration();

// Mode Switching Logic
modeDurationBtn.addEventListener('click', () => setInputMode('duration'));
modeEndTimeBtn.addEventListener('click', () => setInputMode('endtime'));

function setInputMode(mode) {
    currentInputMode = mode;
    modeDurationBtn.classList.toggle('active', mode === 'duration');
    modeEndTimeBtn.classList.toggle('active', mode === 'endtime');

    // Close picker if open
    timePickerPopup.classList.remove('visible');

    if (mode === 'duration') {
        endTimeInput.type = 'text';
        endTimeInput.placeholder = 'e.g. 1h 30m, 90, 1:30';
        // Set default duration if empty or looks like an end time
        if (!endTimeInput.value || endTimeInput.value.includes(':')) {
            endTimeInput.value = '01:00';
        }
    } else {
        endTimeInput.type = 'time';
        // Set default end time if empty (current + 1h)
        if (!endTimeInput.value || !endTimeInput.value.includes(':')) {
            const now = new Date();
            const defaultEndTime = new Date(now);
            defaultEndTime.setHours(defaultEndTime.getHours() + 1);
            endTimeInput.value = `${String(defaultEndTime.getHours()).padStart(2, '0')}:${String(defaultEndTime.getMinutes()).padStart(2, '0')}`;
        }
    }
}

// Time Picker Logic
timePickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentInputMode === 'endtime') {
        // Trigger native picker on End Time mode
        try {
            endTimeInput.showPicker();
        } catch (err) {
            endTimeInput.focus();
        }
    } else {
        // Toggle custom picker on Duration mode
        timePickerPopup.classList.toggle('visible');
        // Initialize picker values from endTimeInput if it's a valid HH:MM format
        const match = endTimeInput.value.match(/^(\d+):(\d+)$/);
        if (match) {
            pickerHours.value = parseInt(match[1]);
            pickerMinutes.value = match[2];
        } else {
            // Default to 00:00 if not HH:MM
            pickerHours.value = 0;
            pickerMinutes.value = '00';
        }
    }
});

// Close picker when clicking outside
document.addEventListener('click', (e) => {
    if (!timePickerPopup.contains(e.target) && e.target !== timePickerBtn) {
        timePickerPopup.classList.remove('visible');
    }
});

// Picker Controls (+/-)
pickerCtrls.forEach(ctrl => {
    ctrl.addEventListener('click', () => {
        const action = ctrl.dataset.action;
        const target = ctrl.dataset.target;
        const input = target === 'hours' ? pickerHours : pickerMinutes;
        let val = parseInt(input.value) || 0;

        if (action === 'inc') {
            val++;
        } else {
            val--;
        }

        // Clamp values
        if (target === 'hours') {
            if (val < 0) val = 23;
            if (val > 23) val = 0;
        } else {
            if (val < 0) val = 59;
            if (val > 59) val = 0;
        }

        input.value = target === 'minutes' ? String(val).padStart(2, '0') : val;
        updateInputFromPicker();
    });
});

// Manual input in picker
pickerHours.addEventListener('change', updateInputFromPicker);
pickerMinutes.addEventListener('change', () => {
    pickerMinutes.value = String(Math.max(0, Math.min(59, parseInt(pickerMinutes.value) || 0))).padStart(2, '0');
    updateInputFromPicker();
});

function updateInputFromPicker() {
    const h = pickerHours.value || 0;
    const m = String(pickerMinutes.value || 0).padStart(2, '0');
    endTimeInput.value = `${h}:${m}`;
}

// Preset buttons
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        endTimeInput.value = btn.dataset.value;
        const [h, m] = btn.dataset.value.split(':');
        pickerHours.value = parseInt(h);
        pickerMinutes.value = m;
        timePickerPopup.classList.remove('visible');
    });
});

// Master Toggle Logic
masterWarningToggle.addEventListener('change', () => {
    if (!masterWarningToggle.checked) {
        warningConfigPanel.classList.remove('visible');
        toggleConfigBtn.classList.add('disabled');
    } else {
        toggleConfigBtn.classList.remove('disabled');
    }
});

// Config Toggle Logic
toggleConfigBtn.addEventListener('click', () => {
    if (toggleConfigBtn.classList.contains('disabled')) return;
    warningConfigPanel.classList.toggle('visible');
});

// Test Button Logic
testWarningsBtn.addEventListener('click', () => {
    triggerBreathing();
});

// Set default state
endTimeInput.value = '01:00';
setInputMode('duration');
updateInputFromPicker(); // Sync picker with initial value

// Initialize displays
initializeTimeDisplay();

// Event listeners for color pickers
primaryColorPicker.addEventListener('input', updateColors);
secondaryColorPicker.addEventListener('input', updateColors);

function updateColors() {
    document.documentElement.style.setProperty('--primary-color', primaryColorPicker.value);
    document.documentElement.style.setProperty('--secondary-color', secondaryColorPicker.value);
}

okBtn.addEventListener('click', startTimer);

function startTimer() {
    if (!endTimeInput.value) {
        alert('Please enter a time or duration');
        return;
    }

    // Clear any existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    const now = new Date();
    let endTime;

    if (currentInputMode === 'duration') {
        const durationMs = parseDuration(endTimeInput.value);
        if (durationMs === null) {
            alert('Invalid duration format. Use e.g. 1h 30m, 90, 1:30');
            return;
        }
        endTime = new Date(now.getTime() + durationMs);
    } else {
        const [endHours, endMinutes] = endTimeInput.value.split(':');
        endTime = new Date();
        endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        if (endTime < now) endTime.setDate(endTime.getDate() + 1);
    }

    totalDuration = endTime - now;
    lastWarnedMinute = -1;

    // Show the time display and start the timer
    timeDisplay.classList.remove('hidden');
    updateTime();
    timerInterval = setInterval(updateTime, 1000);
}

function parseDuration(str) {
    str = str.toLowerCase().trim();
    let totalMs = 0;
    let matchFound = false;

    // Check for HH:MM format
    const colonMatch = str.match(/^(\d+):(\d+)$/);
    if (colonMatch) {
        return (parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60) * 1000;
    }

    // Check for units like 1h, 30m, 1.5h
    const hMatch = str.match(/(\d+\.?\d*)\s*h/);
    const mMatch = str.match(/(\d+\.?\d*)\s*m/);

    if (hMatch) {
        totalMs += parseFloat(hMatch[1]) * 3600000;
        matchFound = true;
    }
    if (mMatch) {
        totalMs += parseFloat(mMatch[1]) * 60000;
        matchFound = true;
    }

    // If no units but contains a number, treat as minutes
    if (!matchFound) {
        const numOnly = parseFloat(str);
        if (!isNaN(numOnly)) {
            return numOnly * 60000;
        }
        return null;
    }

    return totalMs;
}

// Auto-start on load
startTimer();

function updateTime() {
    // Get current time
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');

    // Update current time display
    updateDigits(currentTimeValue, `${currentHours}:${currentMinutes}`);

    // Get end time
    const [endHours, endMinutes] = endTimeInput.value.split(':');

    // Update end time display
    updateDigits(endTimeValue, `${endHours}:${endMinutes}`);

    // Calculate end time today
    const endTime = new Date();
    endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

    // If end time is in the past, set to tomorrow
    if (endTime < now) {
        endTime.setDate(endTime.getDate() + 1);
    }

    // Calculate time difference
    const diff = endTime - now;
    const diffSeconds = Math.floor(diff / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    // Handle warnings
    handleWarnings(diffSeconds, diffMinutes);

    // Convert to hours, minutes, seconds
    let hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    let seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

    // Update remaining time in HH:MM:SS format
    updateDigits(remainingTimeValue, `${hours}:${minutes}:${seconds}`);
}

function handleWarnings(diffSeconds, diffMinutes) {
    if (!masterWarningToggle.checked) {
        document.body.classList.remove('warning-slow', 'warning-blink-double', 'inverted');
        return;
    }

    // Inverted colors at 0 or below (if enabled)
    if (diffSeconds <= 0) {
        if (warnInvert.checked) {
            document.body.classList.add('inverted');
        } else {
            document.body.classList.remove('inverted');
        }
        document.body.classList.remove('warning-slow', 'warning-blink-double');
        return;
    } else {
        document.body.classList.remove('inverted');
    }

    // Slow blink at half time or configured long warning
    const halfDurationSeconds = Math.floor(totalDuration / 2000);
    const longWarnMin = parseInt(warnLongMin.value) || 10;
    const longWarnSeconds = longWarnMin * 60;

    let shouldSlowWarn = false;

    if (warnHalfTime.checked && diffSeconds <= halfDurationSeconds) {
        shouldSlowWarn = true;
    }

    if (warnLong.checked && diffSeconds <= longWarnSeconds) {
        shouldSlowWarn = true;
    }

    if (shouldSlowWarn) {
        document.body.classList.add('warning-slow');
    } else {
        document.body.classList.remove('warning-slow');
    }

    // Check granular countdown warnings
    if (lastWarnedMinute !== diffMinutes) {
        for (const config of countdownConfigs) {
            if (config.checkbox.checked) {
                const threshold = parseInt(config.input.value);
                if (diffMinutes === threshold) {
                    triggerBreathing();
                    lastWarnedMinute = diffMinutes;
                    break;
                }
            }
        }
    }
}

function triggerBreathing() {
    document.body.classList.remove('warning-blink-double');
    // Force reflow
    void document.body.offsetWidth;
    document.body.classList.add('warning-blink-double');

    // Duration is 2 breaths, so 2 * breathDuration
    const duration = (parseFloat(breathDurationInput.value) || 1) * 2000;
    setTimeout(() => {
        document.body.classList.remove('warning-blink-double');
    }, duration);
}

function updateDigits(container, newTimeString) {
    // Get current display text to compare what's changed
    const currentText = container.textContent.replace(/[^0-9:]/g, '');
    if (currentText === newTimeString) return;

    // Split the time string by separators
    const parts = newTimeString.split(':');
    let digitString = '';

    // Reconstruct with separators
    parts.forEach((part, index) => {
        digitString += part;
        if (index < parts.length - 1) {
            digitString += ':';
        }
    });

    // Clear container
    container.innerHTML = '';

    // Add each character
    for (let i = 0; i < digitString.length; i++) {
        const char = digitString[i];

        if (char === ':') {
            // Add separator
            const separator = document.createElement('span');
            separator.className = 'separator';
            separator.textContent = ':';
            container.appendChild(separator);
        } else {
            // Create digit container
            const digitContainer = document.createElement('span');
            digitContainer.className = 'digit-container';

            // Create digit
            const digit = document.createElement('span');
            digit.className = 'digit';
            digit.textContent = char;

            // Check if this digit has changed
            if (currentText && i < currentText.length && currentText[i] !== char && currentText[i] !== ':') {
                const oldDigit = document.createElement('span');
                oldDigit.className = 'digit old';
                oldDigit.textContent = currentText[i];

                digit.className = 'digit new';

                digitContainer.appendChild(oldDigit);

                // Remove old digit after animation completes
                setTimeout(() => {
                    if (oldDigit.parentNode === digitContainer) {
                        digitContainer.removeChild(oldDigit);
                    }
                    digit.classList.remove('new');
                }, 400);
            }

            digitContainer.appendChild(digit);
            container.appendChild(digitContainer);
        }
    }
}

function initializeTimeDisplay() {
    // Initial setup for time displays with placeholder values
    updateDigits(currentTimeValue, '--:--');
    updateDigits(endTimeValue, '--:--');
    updateDigits(remainingTimeValue, '00:00:00');
}

// Fullscreen / Maximized Mode
maximizeBtn.addEventListener('click', enterMaximizedMode);
exitButton.addEventListener('click', exitSpecialMode);

function enterMaximizedMode() {
    document.body.classList.add('maximized');
    document.body.classList.remove('fullscreen');
}

function exitSpecialMode() {
    if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen && document.msFullscreenElement) {
        document.msExitFullscreen();
    }

    document.body.classList.remove('fullscreen');
    document.body.classList.remove('maximized');
}

// Add ESC key listener to exit fullscreen/maximized modes
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        exitSpecialMode();
    }
});

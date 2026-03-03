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
const layoutToggleBtn = document.getElementById('layoutToggleBtn');
const arrow1 = document.getElementById('arrow1');
const arrow2 = document.getElementById('arrow2');

const warnHalfTime = document.getElementById('warnHalfTime');
const warnLong = document.getElementById('warnLong');
const warnLongMin = document.getElementById('warnLongMin');
const warnInvert = document.getElementById('warnInvert');
const testWarningsBtn = document.getElementById('testWarnings');
const toggleConfigBtn = document.getElementById('toggleConfig');
const warningConfigPanel = document.getElementById('warningConfigPanel');
const masterWarningToggle = document.getElementById('masterWarningToggle');
const breathDurationInput = document.getElementById('breathDuration');

// Negative Points Elements
const masterNegativeToggle = document.getElementById('masterNegativeToggle');
const negativeRateInput = document.getElementById('negativeRate');
const negativePointsDisplay = document.getElementById('negativePointsDisplay');

const modeDurationBtn = document.getElementById('modeDuration');
const modeEndTimeBtn = document.getElementById('modeEndTime');

// Picker Elements
const timePickerBtn = document.getElementById('timePickerBtn');
const timePickerPopup = document.getElementById('timePickerPopup');
const pickerHours = document.getElementById('pickerHours');
const pickerMinutes = document.getElementById('pickerMinutes');
const pickerSeconds = document.getElementById('pickerSeconds');
const pickerCtrls = document.querySelectorAll('.picker-ctrl');
const presetBtns = document.querySelectorAll('.preset-btn');

// Countdown inputs
const countdownConfigs = [5, 4, 3, 2, 1].map(num => ({
    checkbox: document.getElementById(`warn${num}`),
    input: document.getElementById(`val${num}`)
}));

let timerInterval;
let negativePointsInterval;
let totalDuration = 0;
let lastWarnedMinute = -1;
let currentInputMode = 'duration'; // 'duration' or 'endtime'
let endTime = null; // Stores the computed end time after startTimer()

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
    const previousMode = currentInputMode;
    // Read value BEFORE changing input type — browser sanitizes value on type change
    const previousValue = endTimeInput.value;
    currentInputMode = mode;
    modeDurationBtn.classList.toggle('active', mode === 'duration');
    modeEndTimeBtn.classList.toggle('active', mode === 'endtime');

    // Close picker if open
    timePickerPopup.classList.remove('visible');

    const now = new Date();

    if (mode === 'duration') {
        endTimeInput.type = 'text';
        const lang = localStorage.getItem('preferredLanguage') || 'fr';
        endTimeInput.placeholder = (typeof translations !== 'undefined' && translations[lang])
            ? translations[lang]['clock_placeholder_duration']
            : 'e.g. 1h 30m 20s, 1:30:00';

        if (previousMode === 'endtime' && previousValue && previousValue.includes(':')) {
            // Convert end-time → duration: duration = end - now
            const parts = previousValue.split(':').map(Number);
            const end = new Date();
            if (parts.length === 3) {
                end.setHours(parts[0], parts[1], parts[2], 0);
            } else {
                end.setHours(parts[0], parts[1], 0, 0);
            }
            if (end <= now) end.setDate(end.getDate() + 1);
            const totalSec = Math.round((end - now) / 1000);
            const dh = Math.floor(totalSec / 3600);
            const dm = Math.floor((totalSec % 3600) / 60);
            const ds = totalSec % 60;
            endTimeInput.value = `${dh}:${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}`;
        } else if (previousMode === 'duration' && previousValue) {
            // Staying in duration (e.g. initial load) — keep value as-is
            endTimeInput.value = previousValue;
        } else {
            endTimeInput.value = '1:00';
        }
    } else {
        // Read value before setting type to 'time'
        endTimeInput.step = '1'; // Enable seconds in native time picker
        endTimeInput.type = 'time';

        if (previousMode === 'duration' && previousValue) {
            // Convert duration → end-time: end = now + duration
            const durationMs = parseDuration(previousValue);
            if (durationMs !== null && durationMs > 0) {
                const end = new Date(now.getTime() + durationMs);
                endTimeInput.value = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:${String(end.getSeconds()).padStart(2, '0')}`;
            } else {
                const end = new Date(now.getTime() + 3600000);
                endTimeInput.value = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:${String(end.getSeconds()).padStart(2, '0')}`;
            }
        } else if (previousMode === 'endtime' && previousValue) {
            // Staying in endtime — keep value as-is
            endTimeInput.value = previousValue;
        } else {
            const end = new Date(now.getTime() + 3600000);
            endTimeInput.value = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}:${String(end.getSeconds()).padStart(2, '0')}`;
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
        // Initialize picker values from endTimeInput if it's a valid H:MM:SS or H:MM format
        const match = endTimeInput.value.match(/^(\d+):(\d+)(?::(\d+))?$/);
        if (match) {
            pickerHours.value = parseInt(match[1]);
            pickerMinutes.value = match[2];
            pickerSeconds.value = match[3] ? match[3] : '00';
        } else {
            pickerHours.value = 0;
            pickerMinutes.value = '00';
            pickerSeconds.value = '00';
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
        const input = target === 'hours' ? pickerHours : target === 'minutes' ? pickerMinutes : pickerSeconds;
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

        input.value = target === 'hours' ? val : String(val).padStart(2, '0');
        updateInputFromPicker();
    });
});

// Manual input in picker
pickerHours.addEventListener('change', updateInputFromPicker);
pickerMinutes.addEventListener('change', () => {
    pickerMinutes.value = String(Math.max(0, Math.min(59, parseInt(pickerMinutes.value) || 0))).padStart(2, '0');
    updateInputFromPicker();
});
pickerSeconds.addEventListener('change', () => {
    pickerSeconds.value = String(Math.max(0, Math.min(59, parseInt(pickerSeconds.value) || 0))).padStart(2, '0');
    updateInputFromPicker();
});

function updateInputFromPicker() {
    const h = pickerHours.value || 0;
    const m = String(pickerMinutes.value || 0).padStart(2, '0');
    const s = String(pickerSeconds.value || 0).padStart(2, '0');
    endTimeInput.value = `${h}:${m}:${s}`;
}

// Preset buttons
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        endTimeInput.value = btn.dataset.value;
        const parts = btn.dataset.value.split(':');
        pickerHours.value = parseInt(parts[0]);
        pickerMinutes.value = parts[1] || '00';
        pickerSeconds.value = parts[2] || '00';
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

    // Clear any existing intervals
    if (timerInterval) clearInterval(timerInterval);
    if (negativePointsInterval) clearInterval(negativePointsInterval);

    const now = new Date();

    if (currentInputMode === 'duration') {
        const durationMs = parseDuration(endTimeInput.value);
        if (durationMs === null) {
            alert('Invalid duration format. Use e.g. 1h 30m 20s, 1:30:00');
            return;
        }
        endTime = new Date(now.getTime() + durationMs);
    } else {
        const parts = endTimeInput.value.split(':').map(Number);
        endTime = new Date();
        if (parts.length === 3) {
            endTime.setHours(parts[0], parts[1], parts[2], 0);
        } else {
            endTime.setHours(parts[0], parts[1], 0, 0);
        }
        if (endTime < now) endTime.setDate(endTime.getDate() + 1);
    }

    totalDuration = endTime - now;
    lastWarnedMinute = -1;

    // Show the time display and start the timers
    timeDisplay.classList.remove('hidden');
    updateTime();
    timerInterval = setInterval(updateTime, 1000);
    negativePointsInterval = setInterval(updateNegativePoints, 100);
}

function parseDuration(str) {
    str = str.toLowerCase().trim();
    let totalMs = 0;
    let matchFound = false;

    // Check for H:MM:SS format
    const colonMatch3 = str.match(/^(\d+):(\d+):(\d+)$/);
    if (colonMatch3) {
        return (parseInt(colonMatch3[1]) * 3600 + parseInt(colonMatch3[2]) * 60 + parseInt(colonMatch3[3])) * 1000;
    }

    // Check for H:MM format
    const colonMatch2 = str.match(/^(\d+):(\d+)$/);
    if (colonMatch2) {
        return (parseInt(colonMatch2[1]) * 3600 + parseInt(colonMatch2[2]) * 60) * 1000;
    }

    // Check for units like 1h, 30m, 20s, 1.5h
    const hMatch = str.match(/(\d+\.?\d*)\s*h/);
    const mMatch = str.match(/(\d+\.?\d*)\s*m(?!s)/);
    const sMatch = str.match(/(\d+\.?\d*)\s*s/);

    if (hMatch) { totalMs += parseFloat(hMatch[1]) * 3600000; matchFound = true; }
    if (mMatch) { totalMs += parseFloat(mMatch[1]) * 60000; matchFound = true; }
    if (sMatch) { totalMs += parseFloat(sMatch[1]) * 1000; matchFound = true; }

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

    // Use the stored endTime (set in startTimer) for display
    if (!endTime) return;
    const endHours = String(endTime.getHours()).padStart(2, '0');
    const endMinutes = String(endTime.getMinutes()).padStart(2, '0');
    const endSeconds = String(endTime.getSeconds()).padStart(2, '0');

    // Update end time display
    updateDigits(endTimeValue, `${endHours}:${endMinutes}`);

    // Calculate time difference
    const diff = endTime - now;
    const isNegative = diff <= 0;
    const absDiff = Math.abs(diff);

    const diffSeconds = Math.floor(diff / 1000); // Original signed value for warnings
    const absDiffSeconds = Math.floor(absDiff / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60); // Original signed value for warnings

    // Handle warnings
    handleWarnings(diffSeconds, diffMinutes);

    // Convert to hours, minutes, seconds using absolute difference
    let hours = Math.floor(absDiff / (1000 * 60 * 60)).toString().padStart(2, '0');
    let minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    let seconds = Math.floor((absDiff % (1000 * 60)) / 1000).toString().padStart(2, '0');

    // Format remaining time string
    let remainingString = `${hours}:${minutes}:${seconds}`;
    if (isNegative) {
        remainingString = `-${remainingString}`;
    }

    // Update remaining time display
    updateDigits(remainingTimeValue, remainingString);
}

function updateNegativePoints() {
    if (!endTime) return;
    const now = new Date();
    const diff = endTime - now;

    if (masterNegativeToggle.checked && diff < 0) {
        // We are past the end time and negative points are active
        const excessMinutes = Math.abs(diff) / 60000;
        const rate = parseFloat(negativeRateInput.value) || 0.5;
        const points = excessMinutes * rate;

        const lang = localStorage.getItem('preferredLanguage') || 'fr';
        const pointsLabel = (typeof translations !== 'undefined' && translations[lang] && translations[lang]['clock_negative_points'])
            ? ` ${translations[lang]['clock_negative_points'].toLowerCase()}`
            : ' points';

        negativePointsDisplay.textContent = `${points.toFixed(3)}${pointsLabel}`;
        negativePointsDisplay.classList.remove('hidden');
    } else {
        negativePointsDisplay.classList.add('hidden');
    }
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
        // Removed `return;` so updateTime() continues executing and counts up
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

    // To prevent the "index shift" glitch when a prefix like '-' is added,
    // we compare digits by aligning them from the right (the seconds side).
    const oldDigitsOnly = currentText.split('').filter(c => c !== ':');
    const newDigitsOnly = digitString.split('').filter(c => c !== ':');

    // characters including separators
    const oldChars = currentText.split('');
    const newChars = digitString.split('');

    // For better comparison, let's find the position of the first digit in both strings
    const firstOldDigitIdx = oldChars.findIndex(c => /\d/.test(c));
    const firstNewDigitIdx = newChars.findIndex(c => /\d/.test(c));

    // Add each character
    for (let i = 0; i < digitString.length; i++) {
        const char = digitString[i];

        if (char === ':') {
            const separator = document.createElement('span');
            separator.className = 'separator';
            separator.textContent = ':';
            container.appendChild(separator);
        } else if (char === '-' || char === '+') {
            // Prefix character (no animation)
            const prefix = document.createElement('span');
            prefix.className = 'prefix';
            prefix.textContent = char;
            container.appendChild(prefix);
        } else {
            // Create digit container
            const digitContainer = document.createElement('span');
            digitContainer.className = 'digit-container';

            const digit = document.createElement('span');
            digit.className = 'digit';
            digit.textContent = char;

            // Logic to determine if a digit has changed:
            // Compare digits based on their position relative to the END of the string
            // This ensures HH:MM:SS aligns correctly even if a '-' is prepended at the start.
            const distFromEnd = digitString.length - 1 - i;
            const oldCharAtIndex = currentText[currentText.length - 1 - distFromEnd];

            if (currentText && oldCharAtIndex !== undefined && oldCharAtIndex !== char && oldCharAtIndex !== ':' && /\d/.test(oldCharAtIndex)) {
                const oldDigit = document.createElement('span');
                oldDigit.className = 'digit old';
                oldDigit.textContent = oldCharAtIndex;

                digit.className = 'digit new';
                digitContainer.appendChild(oldDigit);

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
    updateDigits(endTimeValue, '--:--:--');
    updateDigits(remainingTimeValue, '00:00:00');
}

// Layout toggle (horizontal ↔ vertical)
let isVertical = true; // Default to true as per new CSS baseline

function applyLayout() {
    if (isVertical) {
        timeDisplay.classList.add('layout-vertical');
        timeDisplay.classList.remove('layout-horizontal');
        layoutToggleBtn.textContent = '⇄';
        arrow1.textContent = '↓';
        arrow2.textContent = '↓';
    } else {
        timeDisplay.classList.remove('layout-vertical');
        timeDisplay.classList.add('layout-horizontal');
        layoutToggleBtn.textContent = '⇅';
        arrow1.textContent = '→';
        arrow2.textContent = '→';
    }
}

layoutToggleBtn.addEventListener('click', () => {
    isVertical = !isVertical;
    applyLayout();
});

// Auto-switch on resize (only if user hasn't manually toggled)
let userOverrodeLayout = false;
layoutToggleBtn.addEventListener('click', () => { userOverrodeLayout = true; }, { once: true });
window.addEventListener('resize', () => {
    if (!userOverrodeLayout) {
        isVertical = window.innerWidth <= 650;
        applyLayout();
    }
});

applyLayout();

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

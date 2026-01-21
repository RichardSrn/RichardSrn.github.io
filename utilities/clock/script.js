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

let timerInterval;

// Set default input time to current time + 1 hour
const now = new Date();
const defaultEndTime = new Date(now);
defaultEndTime.setHours(defaultEndTime.getHours() + 1);
endTimeInput.value = `${String(defaultEndTime.getHours()).padStart(2, '0')}:${String(defaultEndTime.getMinutes()).padStart(2, '0')}`;

// Initialize displays
initializeTimeDisplay();

// Event listeners for color pickers
primaryColorPicker.addEventListener('input', updateColors);
secondaryColorPicker.addEventListener('input', updateColors);

function updateColors() {
    document.documentElement.style.setProperty('--primary-color', primaryColorPicker.value);
    document.documentElement.style.setProperty('--secondary-color', secondaryColorPicker.value);
}

okBtn.addEventListener('click', () => {
    if (!endTimeInput.value) {
        alert('Please enter an end time');
        return;
    }

    // Clear any existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Show the time display and start the timer
    timeDisplay.classList.remove('hidden');
    updateTime();
    timerInterval = setInterval(updateTime, 1000);
});

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

    // Convert to hours, minutes, seconds
    let hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    let seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

    // Update remaining time in HH:MM:SS format
    updateDigits(remainingTimeValue, `${hours}:${minutes}:${seconds}`);
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

// --- DOM Elements ---
const qrText = document.getElementById('qrText');
const colorDark = document.getElementById('colorDark');
const colorLight = document.getElementById('colorLight');
const transparentBg = document.getElementById('transparentBg');
const qrMargin = document.getElementById('qrMargin');

const logoType = document.getElementById('logoType');
const emojiGroup = document.getElementById('emojiGroup');
const imageGroup = document.getElementById('imageGroup');
const emojiInput = document.getElementById('emojiInput');
const logoUpload = document.getElementById('logoUpload');
const logoShape = document.getElementById('logoShape');
const matchBgColor = document.getElementById('matchBgColor');
const logoBgColor = document.getElementById('logoBgColor');
const logoBgOpacity = document.getElementById('logoBgOpacity');
const logoBgBlur = document.getElementById('logoBgBlur');

const topText = document.getElementById('topText');
const bottomText = document.getElementById('bottomText');
const fontFamily = document.getElementById('fontFamily');
const textSize = document.getElementById('textSize');
const textColor = document.getElementById('textColor');

const downloadFormat = document.getElementById('downloadFormat');
const downloadSize = document.getElementById('downloadSize');
const testBtn = document.getElementById('testBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvasContainer = document.getElementById('canvasContainer');
const contrastWarning = document.getElementById('contrastWarning');
const testResult = document.getElementById('testResult');

// Scan Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const scanResult = document.getElementById('scanResult');
const scanContent = document.getElementById('scanContent');

// --- State & Constants ---
let mainCanvas = document.createElement('canvas');
canvasContainer.appendChild(mainCanvas);
const ctx = mainCanvas.getContext('2d');

let uploadedLogo = null;
const QR_SIZE_BASE = 1000;

const COMMON_EMOJIS = [
    '😎', '🚀', '🤖', '🔥', '💡', '✨', '🌈', '🍕', '🍔', '🍦', '🎸', '📸',
    '❤️', '⭐', '✅', '❌', '⚠️', '🔍', '🔗', '💻', '📱', '🎨', '🎮', '🏀',
    '🌍', '🌚', '🌞', '👽', '👻', '💀', '💎', '💰', '🎁', '🔔', '📢', '💬'
];

// --- Initialization ---
function init() {
    setupEventListeners();
    setupAccordion();
    setupEmojiPicker();
    generateQR();
}

function setupEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    const btn = document.getElementById('emojiPickerBtn');

    COMMON_EMOJIS.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji-item';
        span.textContent = emoji;
        span.onclick = () => {
            emojiInput.value = emoji;
            picker.style.display = 'none';
            generateQR();
        };
        picker.appendChild(span);
    });

    btn.onclick = (e) => {
        e.stopPropagation();
        picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
    };

    document.addEventListener('click', () => {
        picker.style.display = 'none';
    });
    picker.onclick = (e) => e.stopPropagation();
}

function setupEventListeners() {
    const inputs = [
        qrText, colorDark, colorLight, transparentBg, qrMargin,
        logoType, emojiInput, logoShape, matchBgColor, logoBgColor,
        logoBgOpacity, logoBgBlur, topText, bottomText, fontFamily,
        textSize, textColor
    ];

    inputs.forEach(input => {
        input.addEventListener('input', () => requestAnimationFrame(generateQR));
    });

    logoType.addEventListener('change', (e) => {
        emojiGroup.style.display = e.target.value === 'emoji' ? 'block' : 'none';
        imageGroup.style.display = e.target.value === 'image' ? 'block' : 'none';
        generateQR();
    });

    matchBgColor.addEventListener('change', (e) => {
        logoBgColor.style.display = e.target.checked ? 'none' : 'inline-block';
        generateQR();
    });

    logoUpload.addEventListener('change', handleLogoUpload);
    testBtn.addEventListener('click', testReadability);
    downloadBtn.addEventListener('click', handleDownload);

    // Scan
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Emoji "Selector" shim - just focus triggers browser's picker if possible, 
    // but let's add a small click-to-paste tooltip for fun if needed.
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                uploadedLogo = img;
                generateQR();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// --- Logic: Generation ---

function generateQR() {
    validateContrast();
    const tempDiv = document.createElement('div');
    try {
        new QRCode(tempDiv, {
            text: qrText.value,
            width: QR_SIZE_BASE,
            height: QR_SIZE_BASE,
            colorDark: colorDark.value,
            colorLight: colorLight.value,
            correctLevel: QRCode.CorrectLevel.H
        });
    } catch (e) { return; }

    const sourceCanvas = tempDiv.querySelector('canvas');
    if (sourceCanvas) composeFinalImage(sourceCanvas, mainCanvas, 512);
}

function composeFinalImage(sourceCanvas, canvas, targetWidth) {
    const ctx = canvas.getContext('2d');
    const qrSizeInput = parseInt(qrMargin.value); // Margin relative to width
    const padding = 60 * (targetWidth / 512);

    // Calculate total layout
    // We add a border area around the QR code if margin > 0
    const marginSize = qrSizeInput * (targetWidth / 512);
    const totalQRSize = targetWidth + (marginSize * 2);
    const totalHeight = totalQRSize + (topText.value ? padding : 0) + (bottomText.value ? padding : 0);

    canvas.width = totalQRSize;
    canvas.height = totalHeight;

    // 1. Background
    if (!transparentBg.checked) {
        ctx.fillStyle = colorLight.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const qrY = (topText.value ? padding : 0) + marginSize;
    const qrX = marginSize;

    // 2. Draw white (or bg color) box behind QR if transparent mode but we want QR background to be solid
    // Usually QR needs a quiet zone.
    if (transparentBg.checked) {
        ctx.fillStyle = colorLight.value;
        ctx.fillRect(qrX, qrY, targetWidth, targetWidth);
    }

    // 3. Draw QR
    ctx.drawImage(sourceCanvas, qrX, qrY, targetWidth, targetWidth);

    // 4. Logo / Emoji
    renderLogo(ctx, qrX + targetWidth / 2, qrY + targetWidth / 2, targetWidth);

    // 5. Texts
    ctx.fillStyle = textColor.value;
    ctx.textAlign = 'center';
    const fSize = parseInt(textSize.value) * (targetWidth / 512);
    ctx.font = `bold ${fSize}px ${fontFamily.value}`;

    if (topText.value) {
        ctx.fillText(topText.value, canvas.width / 2, padding / 2 + (fSize / 3));
    }
    if (bottomText.value) {
        ctx.fillText(bottomText.value, canvas.width / 2, canvas.height - (padding / 2) + (fSize / 3));
    }
}

function renderLogo(ctx, cx, cy, qrSize) {
    const type = logoType.value;
    if (type === 'none') return;

    const iconSize = qrSize * 0.22;
    const bgSize = iconSize * 1.25;

    // Backdrop logic
    const bgColor = matchBgColor.checked ? colorLight.value : logoBgColor.value;
    const opacity = parseInt(logoBgOpacity.value) / 100;
    const blur = parseInt(logoBgBlur.value) * (qrSize / 512);

    ctx.save();
    ctx.globalAlpha = opacity;
    if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
    }
    ctx.fillStyle = bgColor;

    drawShape(ctx, cx, cy, bgSize, logoShape.value);
    ctx.fill();
    ctx.restore();
    ctx.filter = 'none'; // Ensure reset for following draws

    // Foreground Logo
    ctx.save();
    if (type === 'emoji' && emojiInput.value) {
        ctx.font = `${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emojiInput.value, cx, cy + (iconSize * 0.08));
    } else if (type === 'image' && uploadedLogo) {
        // Draw centered image
        const aspect = uploadedLogo.width / uploadedLogo.height;
        let w = iconSize, h = iconSize;
        if (aspect > 1) h = iconSize / aspect;
        else w = iconSize * aspect;

        // Clip to shape if desired? User didn't ask but it looks better.
        // For now just draw on top.
        ctx.drawImage(uploadedLogo, cx - w / 2, cy - h / 2, w, h);
    }
    ctx.restore();
}

function drawShape(ctx, cx, cy, size, shape) {
    const r = size / 2;
    if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (shape === 'square') {
        ctx.rect(cx - r, cy - r, size, size);
    } else if (shape === 'squircle') {
        // Squircle / Superellipse approximation using Bezier
        const x = cx - r, y = cy - r;
        const kappa = 0.552284749831; // For circle, but we want more "squary"
        const cp = r * 0.8; // Control point distance for squircle feel
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.bezierCurveTo(cx + cp, y, cx + r, cy - cp, cx + r, cy);
        ctx.bezierCurveTo(cx + r, cy + cp, cx + cp, cy + r, cx, cy + r);
        ctx.bezierCurveTo(cx - cp, cy + r, cx - r, cy + cp, cx - r, cy);
        ctx.bezierCurveTo(cx - r, cy - cp, cx - cp, y, cx, y);
        ctx.closePath();
    }
}

// --- Logic: Testing & Validation ---

function validateContrast() {
    // Simple hex to brightness
    const getBrightness = (hex) => {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return ((r * 299) + (g * 587) + (b * 114)) / 1000;
    };

    const b1 = getBrightness(colorDark.value);
    const b2 = getBrightness(colorLight.value);

    // QR scanners like high contrast. Difference should be sufficient.
    if (Math.abs(b1 - b2) < 50) {
        contrastWarning.style.display = 'block';
    } else {
        contrastWarning.style.display = 'none';
    }
}

function testReadability() {
    testResult.textContent = "Testing...";
    testResult.className = "test-result";

    // Grab image data
    const imageData = ctx.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
        if (code.data === qrText.value) {
            testResult.textContent = "✅ Readable! Content matches.";
            testResult.className = "test-result success";
        } else {
            testResult.textContent = `⚠️ Readable, but content mismatch: "${code.data}"`;
            testResult.className = "test-result warning-text";
        }
    } else {
        testResult.textContent = "❌ Could not read QR code. Try reducing emoji size or increasing contrast.";
        testResult.className = "test-result error";
    }
}

// --- Logic: Download ---

async function handleDownload() {
    const format = downloadFormat.value;
    const totalTargetSize = parseInt(downloadSize.value);
    const downloadCanvas = document.createElement('canvas');

    // We want the FINAL image width to be totalTargetSize.
    // Back out the margin to find the internal QR width.
    const marginRatio = parseInt(qrMargin.value) / 512;
    const qrWidth = totalTargetSize / (1 + (marginRatio * 2));

    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
        text: qrText.value,
        width: Math.round(qrWidth),
        height: Math.round(qrWidth),
        colorDark: colorDark.value,
        colorLight: colorLight.value,
        correctLevel: QRCode.CorrectLevel.H
    });

    const sourceCanvas = tempDiv.querySelector('canvas');
    if (!sourceCanvas) return;

    composeFinalImage(sourceCanvas, downloadCanvas, qrWidth);

    if (format === 'png') {
        triggerDownload(downloadCanvas.toDataURL('image/png'), 'qrcode.png');
    } else if (format === 'jpg') {
        triggerDownload(downloadCanvas.toDataURL('image/jpeg', 0.9), 'qrcode.jpg');
    } else if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: downloadCanvas.width > downloadCanvas.height ? 'l' : 'p',
            unit: 'px',
            format: [downloadCanvas.width, downloadCanvas.height]
        });
        pdf.addImage(downloadCanvas.toDataURL('image/png'), 'PNG', 0, 0, downloadCanvas.width, downloadCanvas.height);
        pdf.save('qrcode.pdf');
    } else if (format === 'svg') {
        const data = downloadCanvas.toDataURL('image/png');
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${downloadCanvas.width}" height="${downloadCanvas.height}">
            <image href="${data}" width="${downloadCanvas.width}" height="${downloadCanvas.height}" />
        </svg>`;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        triggerDownload(URL.createObjectURL(blob), 'qrcode.svg');
    }
}

function triggerDownload(url, name) {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    link.click();
}

// --- Logic: Scanning ---

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processScanFile(file);
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processScanFile(file);
}

// Paste support
document.addEventListener('paste', (e) => {
    if (document.getElementById('scanTab').classList.contains('active')) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                processScanFile(blob);
                break;
            }
        }
    }
});

function processScanFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            scanResult.style.display = 'block';
            if (code) {
                scanContent.textContent = code.data;
                scanContent.style.color = '#4ade80';
            } else {
                scanContent.textContent = "No QR code found in image.";
                scanContent.style.color = '#f87171';
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- UI Utils ---
function setupAccordion() {
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            const isOpen = content.classList.contains('open');
            document.querySelectorAll('.accordion-content').forEach(c => c.classList.remove('open'));
            if (!isOpen) content.classList.add('open');
        });
    });
    // Open first by default
    const first = document.querySelector('.accordion-content');
    if (first) first.classList.add('open');
}

window.switchTab = function (e, tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    const btn = e ? e.currentTarget : (window.event ? window.event.target : null);
    if (btn) btn.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

window.copyToClipboard = function () {
    navigator.clipboard.writeText(scanContent.textContent);
    const btn = event.currentTarget || event.target;
    const oldText = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => btn.textContent = oldText, 2000);
}

init();

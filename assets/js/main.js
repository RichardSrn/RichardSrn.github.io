// Main JavaScript for Richard's Web Utilities

document.addEventListener('DOMContentLoaded', () => {
    console.log("Welcome to Richard's Web Utilities Portfolio");

    // Add subtle hover interaction to cards (e.g., tilt effect)
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Highlight border effect
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });

    // Console easter egg
    console.log(
        "%c 🚀 Ready to explore? ",
        "background: linear-gradient(90deg, #58a6ff, #bc8cff); color: black; font-weight: bold; padding: 5px; border-radius: 3px;"
    );
});

// ── Richard's Web Utilities — Main JS ──

document.addEventListener('DOMContentLoaded', () => {
    const heroBg = document.querySelector('.hero-background');
    const cards = document.querySelectorAll('.card');

    const desktopMQ = window.matchMedia('(min-width: 768px)');

    // ═══════════════════════════════════════════════════════════
    //  DESKTOP: Full-page mouse-following gradient spotlight
    // ═══════════════════════════════════════════════════════════
    let spotX = 50, spotY = 50;    // current displayed position (%)
    let targetX = 50, targetY = 50;
    let spotRaf = null;

    function tickSpotlight() {
        spotX += (targetX - spotX) * 0.08;
        spotY += (targetY - spotY) * 0.08;

        heroBg.style.transform =
            `translate(${spotX - 50}%, ${spotY - 50}%)`;

        if (Math.abs(spotX - targetX) > 0.01 || Math.abs(spotY - targetY) > 0.01) {
            spotRaf = requestAnimationFrame(tickSpotlight);
        } else {
            spotRaf = null;
        }
    }

    function setSpotTarget(clientX, clientY) {
        targetX = (clientX / window.innerWidth) * 100;
        targetY = (clientY / window.innerHeight) * 100;
        if (!spotRaf) spotRaf = requestAnimationFrame(tickSpotlight);
    }

    document.addEventListener('mousemove', (e) => {
        if (!desktopMQ.matches) return;
        setSpotTarget(e.clientX, e.clientY);
    });

    // Drift back to centre when mouse leaves the window entirely
    document.addEventListener('mouseleave', () => {
        targetX = 50;
        targetY = 50;
        if (!spotRaf && desktopMQ.matches) spotRaf = requestAnimationFrame(tickSpotlight);
    });

    // ═══════════════════════════════════════════════════════════
    //  DESKTOP: Card 3D tilt + mouse-positioned shine
    // ═══════════════════════════════════════════════════════════
    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            if (!desktopMQ.matches) return;
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            const hw = r.width / 2;
            const hh = r.height / 2;

            const rotateY = ((x - hw) / hw) * 4;    // ±4 deg
            const rotateX = ((hh - y) / hh) * 4;    // ±4 deg (inverted)

            card.classList.add('is-tilted');
            card.style.transform =
                `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.classList.remove('is-tilted');
            card.style.transform = '';
        });
    });

    // ═══════════════════════════════════════════════════════════
    //  MOBILE: Scroll-driven background glow fade
    // ═══════════════════════════════════════════════════════════
    let scrollRaf = null;

    function tickScrollFade() {
        scrollRaf = null;
        if (desktopMQ.matches) {
            heroBg.style.opacity = '';
            return;
        }
        const pct = Math.min(window.scrollY / 600, 1);
        heroBg.style.opacity = 1 - pct * 0.75;
    }

    window.addEventListener('scroll', () => {
        if (!scrollRaf) scrollRaf = requestAnimationFrame(tickScrollFade);
    }, { passive: true });

    // Run once on load
    tickScrollFade();

    // ═══════════════════════════════════════════════════════════
    //  Resize: reset states when crossing device breakpoint
    // ═══════════════════════════════════════════════════════════
    desktopMQ.addEventListener('change', () => {
        // Reset spotlight
        heroBg.style.transform = '';
        heroBg.style.opacity = '';
        spotX = 50; spotY = 50;
        targetX = 50; targetY = 50;
        if (spotRaf) { cancelAnimationFrame(spotRaf); spotRaf = null; }

        // Reset cards
        cards.forEach((card) => {
            card.classList.remove('is-tilted');
            card.style.transform = '';
        });

        // Re-run scroll fade (sets correct state for current device)
        tickScrollFade();
    });

    // ── Console Easter Egg ──
    console.log(
        '%c🚀 Ready to explore?',
        'background: linear-gradient(90deg, #58a6ff, #bc8cff); color: #000; font-weight: bold; padding: 5px; border-radius: 3px;'
    );
});

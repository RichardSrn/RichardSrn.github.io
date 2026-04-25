document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        const glassBg = document.querySelector('.glass-bg');
        if (glassBg) {
            glassBg.style.transform = `translate(${mouseX * 20}px, ${mouseY * 20}px)`;
        }
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    const toggle = document.getElementById('viewToggle');
    const container = document.getElementById('timelineContainer');

    if (toggle && container) {
        toggle.classList.add('timeline-active');

        toggle.addEventListener('click', () => {
            const isList = container.classList.toggle('list-view');
            if (isList) {
                toggle.classList.remove('timeline-active');
                toggle.classList.add('list-active');
                toggle.title = 'Switch to timeline view';
            } else {
                toggle.classList.remove('list-active');
                toggle.classList.add('timeline-active');
                toggle.title = 'Switch to list view';
                requestAnimationFrame(resolveOverlaps);
            }
        });
    }

    function resolveOverlaps() {
        const container = document.getElementById('timelineContainer');
        if (!container || container.classList.contains('list-view')) return;

        const style = getComputedStyle(container);
        const yearH = parseFloat(style.getPropertyValue('--year-h'));
        const maxYear = parseFloat(style.getPropertyValue('--max-year'));
        if (!yearH || !maxYear) return;

        const baseYear = 2017;
        const minItemHeight = 60;
        const gap = 12;

        const eduItems = container.querySelectorAll('.education-side .trajectory-item');
        resolveSideOverlaps(eduItems, yearH, maxYear, minItemHeight, gap);

        const rightCol = container.querySelector('.timeline-right-col');
        if (rightCol) {
            const rightItems = rightCol.querySelectorAll('.trajectory-item');
            resolveSideOverlaps(rightItems, yearH, maxYear, minItemHeight, gap);
        }

        updateContainerHeights(container, yearH, maxYear, minItemHeight, baseYear);
    }

    function resolveSideOverlaps(items, yearH, maxYear, minItemHeight, gap) {
        if (!items || items.length === 0) return;

        const itemsData = [];

        items.forEach(el => {
            const start = parseFloat(el.style.getPropertyValue('--start'));
            const end = parseFloat(el.style.getPropertyValue('--end'));
            if (isNaN(start) || isNaN(end)) return;

            const naturalTop = (maxYear - end) * yearH;
            const spanHeight = (end - start) * yearH;
            const visualHeight = Math.max(spanHeight, minItemHeight);
            const cardHeight = Math.min(visualHeight, spanHeight > minItemHeight ? minItemHeight + 24 : visualHeight);

            itemsData.push({
                el,
                start,
                end,
                naturalTop,
                spanHeight,
                visualHeight,
                cardHeight,
                cardTop: naturalTop + Math.max(0, (visualHeight - cardHeight) / 2),
                shift: 0
            });
        });

        itemsData.sort((a, b) => a.cardTop - b.cardTop || a.end - b.end || a.start - b.start);

        let maxCardBottom = -Infinity;

        itemsData.forEach(item => {
            const neededTop = maxCardBottom > -Infinity ? maxCardBottom + gap : item.naturalTop;

            if (item.cardTop < neededTop) {
                item.shift = Math.round(neededTop - item.cardTop);
            } else {
                item.shift = 0;
            }

            item.el.style.setProperty('--shift', item.shift + 'px');

            const shiftedCardTop = item.cardTop + item.shift;
            const shiftedCardBottom = shiftedCardTop + item.cardHeight;
            maxCardBottom = Math.max(maxCardBottom, shiftedCardBottom);
        });
    }

    function updateContainerHeights(container, yearH, maxYear, minItemHeight, baseYear) {
        const baseHeight = (maxYear - baseYear) * yearH;
        const eduSide = container.querySelector('.education-side');
        const rightCol = container.querySelector('.timeline-right-col');

        let maxNeeded = baseHeight;

        [eduSide, rightCol].forEach(side => {
            if (!side) return;
            side.querySelectorAll('.trajectory-item').forEach(item => {
                const shift = parseFloat(item.style.getPropertyValue('--shift')) || 0;
                const end = parseFloat(item.style.getPropertyValue('--end'));
                const start = parseFloat(item.style.getPropertyValue('--start'));
                const naturalTop = (maxYear - end) * yearH;
                const spanHeight = Math.max((end - start) * yearH, minItemHeight);
                const bottom = naturalTop + shift + spanHeight;
                if (bottom > maxNeeded) maxNeeded = bottom;
            });
        });

        const totalHeight = maxNeeded + 80;

        if (eduSide) eduSide.style.height = totalHeight + 'px';
        if (rightCol) rightCol.style.height = totalHeight + 'px';

        container.style.height = (totalHeight + 350) + 'px';
    }

    requestAnimationFrame(resolveOverlaps);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resolveOverlaps, 150);
    });
});
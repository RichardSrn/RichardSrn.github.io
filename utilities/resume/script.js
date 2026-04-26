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
            // Subtle mouse movement parallax
            glassBg.style.setProperty('--mouse-x', `${mouseX * 30}px`);
            glassBg.style.setProperty('--mouse-y', `${mouseY * 30}px`);
            updateBgTransform();
        }
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const glassBg = document.querySelector('.glass-bg');
        const scrollIndicator = document.querySelector('.scroll-indicator');

        if (glassBg) {
            // Scroll parallax: move background up slower than content (which moves up by scrollY)
            glassBg.style.setProperty('--scroll-y', `-${scrollY * 0.2}px`);
            updateBgTransform();
        }

        if (scrollIndicator) {
            // Fade out scroll indicator when reaching the bottom of the page
            const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
            const buffer = 150; // Start fading 150px before the bottom
            
            if (scrollY > scrollTotal - buffer) {
                const fadeFactor = Math.max(0, (scrollTotal - scrollY) / buffer);
                scrollIndicator.style.opacity = (fadeFactor * 0.8).toString();
                if (fadeFactor === 0) scrollIndicator.style.pointerEvents = 'none';
                else scrollIndicator.style.pointerEvents = 'auto';
            } else {
                scrollIndicator.style.opacity = '0.8';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        }
    });

    // Add click-to-scroll behavior for the indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            window.scrollBy({
                top: window.innerHeight * 0.8,
                behavior: 'smooth'
            });
        });
    }

    function updateBgTransform() {
        const glassBg = document.querySelector('.glass-bg');
        if (!glassBg) return;
        const mx = glassBg.style.getPropertyValue('--mouse-x') || '0px';
        const my = glassBg.style.getPropertyValue('--mouse-y') || '0px';
        const sy = glassBg.style.getPropertyValue('--scroll-y') || '0px';
        glassBg.style.transform = `translate(${mx}, calc(${my} + ${sy}))`;
    }

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
        // Default to the new interactive timeline on mobile
        toggle.classList.add('timeline-active');
        
        if (window.innerWidth > 768) {
            // resolveOverlaps is for desktop timeline
            requestAnimationFrame(resolveOverlaps);
        }

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
                if (window.innerWidth > 768) {
                    requestAnimationFrame(resolveOverlaps);
                }
            }
        });

        // Add click listener for mobile items to expand
        container.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return;
            
            const item = e.target.closest('.trajectory-item');
            if (item) {
                const isExpanded = item.classList.contains('expanded');
                // Collapse all others
                container.querySelectorAll('.trajectory-item').forEach(el => el.classList.remove('expanded'));
                // Toggle clicked one
                if (!isExpanded) item.classList.add('expanded');
                
                // Recalculate overlaps to push items down
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

        if (window.innerWidth <= 768) {
            // Mobile: Unified chronological stream
            const items = Array.from(container.querySelectorAll('.trajectory-item'));
            resolveUnifiedOverlaps(items, yearH, maxYear, gap);
            updateContainerHeights(container, yearH, maxYear, minItemHeight, baseYear);
            return;
        }

        // Desktop: Two-side timeline
        const eduItems = container.querySelectorAll('.education-side .trajectory-item');
        resolveSideOverlaps(eduItems, yearH, maxYear, minItemHeight, gap, false);

        const rightCol = container.querySelector('.timeline-right-col');
        if (rightCol) {
            const rightItems = rightCol.querySelectorAll('.trajectory-item');
            resolveSideOverlaps(rightItems, yearH, maxYear, minItemHeight, gap, false);
        }

        updateContainerHeights(container, yearH, maxYear, minItemHeight, baseYear);
    }

    function resolveUnifiedOverlaps(items, yearH, maxYear, gap) {
        if (!items || items.length === 0) return;

        const itemsData = [];
        items.forEach(el => {
            const start = parseFloat(el.getAttribute('style').match(/--start:\s*([\d.]+)/)?.[1] || el.style.getPropertyValue('--start'));
            const end = parseFloat(el.getAttribute('style').match(/--end:\s*([\d.]+)/)?.[1] || el.style.getPropertyValue('--end'));
            if (isNaN(start) || isNaN(end)) return;

            const naturalTop = (maxYear - end) * yearH;
            const spanHeight = (end - start) * yearH;
            
            // On mobile, items have variable height (especially when expanded)
            const contentEl = el.querySelector('.content');
            const cardHeight = contentEl ? contentEl.offsetHeight : 60;

            itemsData.push({
                el,
                start,
                end,
                naturalTop,
                spanHeight,
                cardHeight,
                cardTop: naturalTop,
                shift: 0,
                lane: 0,
                assigned: false
            });
            
            el.style.setProperty('--top', naturalTop + 'px');
            el.style.setProperty('--height', spanHeight + 'px');
        });

        // 1. Assign lanes for duration bars (parallel positioning)
        // Sort by 'end' (which is the top-most year in our downward coordinate system)
        const sortedForLanes = [...itemsData].sort((a, b) => b.end - a.end || a.start - b.start);
        
        sortedForLanes.forEach(item => {
            let laneIndex = 0;
            // We want lanes to be: 0, 1 (right), 2 (left), 3 (right), 4 (left)...
            // To achieve "symmetrical" around 0, we can use a helper to get the actual offset
            while (sortedForLanes.some(other => 
                other.assigned && 
                other.laneIndex === laneIndex && 
                Math.max(item.start, other.start) < Math.min(item.end, other.end)
            )) {
                laneIndex++;
            }
            item.laneIndex = laneIndex;
            
            // Calculate actual pixel offset: 0, 4, -4, 8, -8...
            let laneOffset = 0;
            if (laneIndex > 0) {
                const side = laneIndex % 2 === 0 ? -1 : 1;
                const level = Math.ceil(laneIndex / 2);
                laneOffset = side * level * 4; // 4px step
            }
            
            item.laneOffset = laneOffset;
            item.assigned = true;
            item.el.style.setProperty('--lane-offset', laneOffset + 'px');
        });


        // 2. Resolve card vertical collisions
        // Sort by naturalTop (where the card wants to be)
        itemsData.sort((a, b) => a.naturalTop - b.naturalTop || b.end - a.end);

        let maxCardBottom = -Infinity;
        itemsData.forEach(item => {
            // A card's natural position is centered on its duration or at the top of it
            // Let's stick to the top of the duration for mobile Gantt consistency
            const neededTop = maxCardBottom > -Infinity ? maxCardBottom + gap : item.naturalTop;
            
            if (item.cardTop < neededTop) {
                item.shift = Math.round(neededTop - item.naturalTop);
            }
            
            item.el.style.setProperty('--shift', item.shift + 'px');
            maxCardBottom = item.naturalTop + item.shift + item.cardHeight;
        });
    }

    function resolveSideOverlaps(items, yearH, maxYear, minItemHeight, gap, isMobile) {
        if (!items || items.length === 0) return;

        const itemsData = [];
        items.forEach(el => {
            const start = parseFloat(el.getAttribute('style').match(/--start:\s*([\d.]+)/)?.[1] || el.style.getPropertyValue('--start'));
            const end = parseFloat(el.getAttribute('style').match(/--end:\s*([\d.]+)/)?.[1] || el.style.getPropertyValue('--end'));
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
            el.style.setProperty('--top', naturalTop + 'px');
        });

        itemsData.sort((a, b) => a.cardTop - b.cardTop || b.end - a.end);

        let maxCardBottom = -Infinity;
        itemsData.forEach(item => {
            const neededTop = maxCardBottom > -Infinity ? maxCardBottom + gap : item.naturalTop;
            if (item.cardTop < neededTop) {
                item.shift = Math.round(neededTop - item.cardTop);
            }
            maxCardBottom = Math.max(maxCardBottom, item.cardTop + item.shift + item.cardHeight);
        });

        itemsData.forEach(item => {
            item.el.style.setProperty('--shift', item.shift + 'px');
        });
    }

    function updateContainerHeights(container, yearH, maxYear, minItemHeight, baseYear) {
        const yearsSpans = container.querySelectorAll('.timeline-years span');
        const items = Array.from(container.querySelectorAll('.trajectory-item'));
        
        if (window.innerWidth <= 768) {
            // Position years exactly based on their mathematical position
            yearsSpans.forEach(span => {
                const year = parseInt(span.textContent);
                span.style.top = (maxYear - year) * yearH + 'px';
                span.style.display = 'block';
            });

            // Calculate total height based on the bottom-most item card
            let maxBottom = (maxYear - baseYear) * yearH;
            items.forEach(item => {
                const top = parseFloat(item.style.getPropertyValue('--top')) || 0;
                const shift = parseFloat(item.style.getPropertyValue('--shift')) || 0;
                const contentEl = item.querySelector('.content');
                const h = contentEl ? contentEl.offsetHeight : 60;
                const bottom = top + shift + h;
                if (bottom > maxBottom) maxBottom = bottom;
            });

            container.style.height = (maxBottom + 150) + 'px';
            return;
        }

        // Desktop height calculation
        yearsSpans.forEach(span => {
            const year = parseInt(span.textContent);
            span.style.top = (maxYear - year) * yearH + 'px';
            span.style.display = 'block';
        });

        const baseHeight = (maxYear - baseYear) * yearH;
        const eduSide = container.querySelector('.education-side');
        const rightCol = container.querySelector('.timeline-right-col');

        let maxNeeded = baseHeight;
        [eduSide, rightCol].forEach(side => {
            if (!side) return;
            side.querySelectorAll('.trajectory-item').forEach(item => {
                const top = parseFloat(item.style.getPropertyValue('--top')) || 0;
                const shift = parseFloat(item.style.getPropertyValue('--shift')) || 0;
                const end = parseFloat(item.style.getPropertyValue('--end'));
                const start = parseFloat(item.style.getPropertyValue('--start'));
                const h = Math.max((end - start) * yearH, minItemHeight);
                const bottom = top + shift + h;
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
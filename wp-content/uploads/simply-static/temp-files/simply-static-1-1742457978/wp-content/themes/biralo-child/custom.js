document.addEventListener('DOMContentLoaded', function() {
    const arrow = document.querySelector('.scroll-down-arrow');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) { // Adjust this value as needed
            arrow.classList.add('hide');
        } else {
            arrow.classList.remove('hide');
        }
    });

    // Optional: Scroll down when clicking the arrow
    arrow.addEventListener('click', function() {
        window.scrollBy({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    });
});


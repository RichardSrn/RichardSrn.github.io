/**
 * Internationalization (i18n) script for Richard's Web Utilities
 * Handles English/French switching, persistence, and dynamic content updates.
 */

const translations = {
    en: {
        "hero_greeting_prefix": "Hi, I'm ",
        "hero_greeting_suffix": ".",
        "hero_subtitle": "ML PhD Student · Python & Math Enthusiast",
        "hero_intro": "Welcome to my collection of interactive web utilities and simulations.",
        "disclaimer_text": "Transparency Note: I am not a web developer. This website and its utilities were mostly coded by generative AI, and curated, directed and refined by me. However, the utilities are still useful and/or fun, and I hope you find a use for them!",
        "nav_tools": "<span class=\"icon\">🛠️</span> Tools",
        "nav_simulations": "<span class=\"icon\">✨</span> Simulations",
        "nav_games": "<span class=\"icon\">🎮</span> Games",
        "nav_phd": "<span class=\"icon\">🎓</span> PhD Related",

        // Utilities
        "graphs_title": "Graph Visualization",
        "graphs_desc": "Interactive exploration of graph datasets used in my research.",
        "clock_title": "Clock",
        "clock_desc": "A sleek, digital clock timer, very useful for exams.",
        "pomodoro_title": "Pomodoro Timer",
        "pomodoro_desc": "Focus timer with customizable work/break intervals and a clean interface.",
        "qrcode_title": "QR Code Studio",
        "qrcode_desc": "Generate and customize QR codes with logos, colors, and styling options.",
        "scripts_title": "Scripts Repo",
        "scripts_desc": "Browse, view, edit, and download a collection of useful scripts.",

        "boids_title": "Boids Simulation",
        "boids_desc": "Flocking simulation demonstrating separation, alignment, and cohesion behaviors.",
        "fractal_title": "Fractal Explorer",
        "fractal_desc": "Interactive Mandelbrot and Julia set viewer with deep zoom capabilities.",
        "fractal_v2_title": "Fractal Dream",
        "fractal_v2_desc": "Animated, GPU-accelerated fractal voyage using WebGL.",
        "galaxy_title": "Galaxy Sim",
        "galaxy_desc": "Interactive spiral galaxy simulation with adjustable physics and rendering.",
        "life_title": "Game of Life",
        "life_desc": "Conway's classic cellular automaton with an infinite grid and interactive tools.",

        "game0_title": "Phantom Phase Serpent",
        "game0_desc": "A unique twist on Snake with phase-shifting mechanics and avoiding phantoms.",

        "footer_text": "&copy; 2026 Richard Serrano. Hosted on GitHub Pages."
    },
    fr: {
        "hero_greeting_prefix": "Bonjour, je suis ",
        "hero_greeting_suffix": ".",
        "hero_subtitle": "Doctorant en ML · Passionné de Python & Math",
        "hero_intro": "Bienvenue sur ma collection d'utilitaires et de simulations.",
        "disclaimer_text": "Note de transparence : Je ne suis pas développeur web. Ce site et ses utilitaires ont été principalement codés par une IA générative, puis etaffinés par mes soins. Cependant, les projets présentés ici restent utiles et/ou amusants, et j'espère que vous leur trouverez une utilité !",
        "nav_tools": "<span class=\"icon\">🛠️</span> Outils",
        "nav_simulations": "<span class=\"icon\">✨</span> Simulations",
        "nav_games": "<span class=\"icon\">🎮</span> Jeux",
        "nav_phd": "<span class=\"icon\">🎓</span> Thèse",

        // Utilities
        "graphs_title": "Visualisation de Graphes",
        "graphs_desc": "Exploration interactive des jeux de données de graphes utilisés dans mes recherches.",
        "clock_title": "Horloge",
        "clock_desc": "Un minuteur numérique élégant, très utile pour les examens.",
        "pomodoro_title": "Minuteur Pomodoro",
        "pomodoro_desc": "Minuteur de concentration avec intervalles travail/pause personnalisables et interface épurée.",
        "qrcode_title": "Studio QR Code",
        "qrcode_desc": "Générez et personnalisez des codes QR avec logos, couleurs et options de style.",
        "scripts_title": "Dépôt de Scripts",
        "scripts_desc": "Parcourez, visualisez, éditez et téléchargez une collection de scripts utiles.",

        "boids_title": "Simulation de Boids",
        "boids_desc": "Simulation de vol en groupe démontrant les comportements de séparation, d'alignement et de cohésion.",
        "fractal_title": "Explorateur de Fractales", // Adjusted translation
        "fractal_desc": "Visualiseur interactif des ensembles de Mandelbrot et Julia avec zoom profond.",
        "fractal_v2_title": "Rêve Fractal",
        "fractal_v2_desc": "Voyage fractal animé et accéléré par GPU utilisant WebGL.",
        "galaxy_title": "Sim Galactique",
        "galaxy_desc": "Simulation interactive de galaxie spirale avec physique et rendu ajustables.",
        "life_title": "Jeu de la Vie",
        "life_desc": "L'automate cellulaire classique de Conway avec une grille infinie et des outils interactifs.",

        "game0_title": "Serpent de Phase Fantôme", // Literal translation, sounds a bit cool/gamey
        "game0_desc": "Une variante unique du Snake avec mécaniques de déphasage et évitement de fantômes.",

        "footer_text": "&copy; 2026 Richard Serrano. Hébergé sur GitHub Pages."
    }
};

function setLanguage(lang) {
    // 1. Update text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Check if we should update innerHTML (for footer symbol or icons) or textContent
            if (key === 'footer_text' || key.includes('nav_')) {
                element.innerHTML = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // 2. Update select value
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.value = lang;
    }

    // 3. Save preference
    localStorage.setItem('preferredLanguage', lang);

    // 4. Update html lang attribute
    document.documentElement.lang = lang;
}

function initLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    let initialLang = 'fr'; // Default per requirement

    if (localStorage.getItem('preferredLanguage')) {
        initialLang = localStorage.getItem('preferredLanguage');
    } else if (userLang) {
        if (userLang.startsWith('en')) {
            initialLang = 'en';
        } else if (userLang.startsWith('fr')) {
            initialLang = 'fr';
        }
        // else keep default 'fr'
    }

    setLanguage(initialLang);

    // Setup event listeners
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
}

document.addEventListener('DOMContentLoaded', initLanguage);

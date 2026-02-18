/**
 * Internationalization (i18n) script for Richard's Web Utilities
 * Handles English/French switching, persistence, and dynamic content updates.
 */

const translations = {
    en: {
        "hero_greeting_prefix": "Hi, I'm ",
        "hero_greeting_suffix": ".",
        "hero_subtitle": "Machine Learning PhD Student · Python & Math Enthusiast",
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

        "footer_text": "&copy; 2026 Richard Serrano. Hosted on GitHub Pages.",

        // Clock utility
        "clock_page_title": "Time Tracker",
        "clock_back": "← Back",
        "clock_mode_duration": "Duration",
        "clock_mode_endtime": "End Time",
        "clock_placeholder_duration": "e.g. 1h 30m 20s, 1:30:00",
        "clock_ok": "OK",
        "clock_primary_color": "Primary Color",
        "clock_secondary_color": "Secondary Color",
        "clock_warnings": "Warnings",
        "clock_config": "⚙️ Config",
        "clock_test": "TEST",
        "clock_breath_duration": "Breath Duration:",
        "clock_single_breath": "Single Breath:",
        "clock_half_time": "Half-Time",
        "clock_double_breath": "Double Breath:",
        "clock_invert_at": "Invert Theme at",
        "clock_maximize": "Maximize",
        "clock_label_current": "CURRENT",
        "clock_label_remaining": "REMAINING",
        "clock_label_end": "END",
        "clock_picker_hours": "Hours",
        "clock_picker_minutes": "Minutes",
        "clock_picker_seconds": "Seconds",
        "clock_preset_1m30": "1m30",
        "clock_preset_15m": "15m",
        "clock_preset_30m": "30m",
        "clock_preset_1h": "1h"
    },
    fr: {
        "hero_greeting_prefix": "Bonjour, je suis ",
        "hero_greeting_suffix": ".",
        "hero_subtitle": "Doctorant en Machine Learning (Apprentissage Automatique) · Passionné de Python & de Mathématiques",
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

        "footer_text": "&copy; 2026 Richard Serrano. Hébergé sur GitHub Pages.",

        // Clock utility
        "clock_page_title": "Minuteur",
        "clock_back": "← Retour",
        "clock_mode_duration": "Durée",
        "clock_mode_endtime": "Heure de fin",
        "clock_placeholder_duration": "ex. 1h 30m 20s, 1:30:00",
        "clock_ok": "OK",
        "clock_primary_color": "Couleur principale",
        "clock_secondary_color": "Couleur secondaire",
        "clock_warnings": "Alertes",
        "clock_config": "⚙️ Config",
        "clock_test": "TEST",
        "clock_breath_duration": "Durée du souffle :",
        "clock_single_breath": "Souffle simple :",
        "clock_half_time": "Mi-temps",
        "clock_double_breath": "Double souffle :",
        "clock_invert_at": "Inverser le thème à",
        "clock_maximize": "Agrandir",
        "clock_label_current": "ACTUEL",
        "clock_label_remaining": "RESTANT",
        "clock_label_end": "FIN",
        "clock_picker_hours": "Heures",
        "clock_picker_minutes": "Minutes",
        "clock_picker_seconds": "Secondes",
        "clock_preset_1m30": "1m30",
        "clock_preset_15m": "15m",
        "clock_preset_30m": "30m",
        "clock_preset_1h": "1h"
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

    // 1b. Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
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

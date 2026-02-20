/**
 * i18n.js — Chess Utility Translations (EN / FR)
 * Reads language preference from localStorage (shared with main site).
 */

const ChessI18n = (() => {
    const strings = {
        en: {
            // Main Menu
            chess_title: 'Chess',
            choose_game_mode: 'Choose a game mode',
            pvp_title: 'Player vs Player',
            pvp_desc: 'Play against a friend on the same screen',
            ai_title: 'Player vs AI',
            ai_desc: 'Challenge the engine',
            eval_title: 'Board Evaluation',
            eval_desc: 'Analyze positions and get hints',
            variants_title: 'Chess Variants',
            variants_desc: '3, 4, 5+ players — Coming Soon',
            settings_title: 'Settings',
            settings_desc: 'Language, themes & preferences',
            soon_badge: 'Soon',

            // Bot selector
            choose_opponent: 'Choose Your Opponent',
            select_bot: 'Select a bot to play against',
            back_to_menu: '← Back to Menu',

            // Settings
            settings_header: 'Settings',
            language_label: 'Language',
            board_theme_label: 'Board Theme',
            theme_classic: 'Classic',
            theme_ocean: 'Ocean',
            theme_forest: 'Forest',
            theme_midnight: 'Midnight',
            theme_chessy: 'Chessy',
            app_preferences_label: 'Preferences',
            default_blind_chess: 'Default to Blind Chess',
            show_score_bar: 'Show Score Bar',

            // Game
            white: 'White',
            black: 'Black',
            you_white: 'You (White)',
            moves_label: 'Moves',
            rotate_label: 'Rotate',

            // Status
            white_to_move: 'White to move',
            black_to_move: 'Black to move',
            check: 'Check!',
            checkmate: 'Checkmate!',
            stalemate: 'Stalemate — Draw',
            draw: 'Draw',

            // Thinking
            engine_thinking: 'Engine is thinking…',
            loading_stockfish: 'Loading Stockfish engine…',

            // History navigation
            viewing_history: 'Viewing history',
            back_to_live: '→ Live game',

            // Game over
            wins_checkmate: 'wins by checkmate',
            wins_resignation: 'wins by resignation',
            draw_stalemate: 'Draw by stalemate',
            draw_repetition: 'Draw by repetition',
            draw_material: 'Draw — insufficient material',
            draw_generic: 'Draw',
            new_game: 'New Game',
            eval_screen_title: 'Board Evaluation',
            eval_screen_desc: 'Set up a board position and get analysis, hints, and best moves.',
            back_to_menu_btn: 'Back to Menu',

            // Controls (tooltips)
            tooltip_back: 'Back to Menu',
            tooltip_new_game: 'New Game',
            tooltip_undo: 'Undo Move',
            tooltip_flip: 'Flip Board',
            tooltip_hint: 'Get Hint',
            tooltip_resign: 'Resign',

            // Blind Chess & Modal
            voice_input: 'Voice Input',
            text_input: 'Text Input',
            enter_move: 'Enter Move',
            destination: 'Destination Square or Full Move:',
            piece: 'Piece (optional):',
            cancel: 'Cancel',
            submit: 'Submit',
            move_not_understood: 'I didn\'t catch that',
            voice_not_supported: 'Voice input is not supported in your browser.',
            invalid_move: 'Invalid move',
        },
        fr: {
            // Main Menu
            chess_title: 'Échecs',
            choose_game_mode: 'Choisissez un mode de jeu',
            pvp_title: 'Joueur vs Joueur',
            pvp_desc: 'Jouer contre un ami sur le même écran',
            ai_title: 'Joueur vs IA',
            ai_desc: 'Défier le moteur',
            eval_title: 'Évaluation de position',
            eval_desc: 'Analyser des positions et obtenir des conseils',
            variants_title: 'Variantes d\'échecs',
            variants_desc: '3, 4, 5+ joueurs — Bientôt disponible',
            settings_title: 'Paramètres',
            settings_desc: 'Langue, thèmes et préférences',
            soon_badge: 'Bientôt',

            // Bot selector
            choose_opponent: 'Choisissez votre adversaire',
            select_bot: 'Sélectionnez un bot',
            back_to_menu: '← Retour au menu',

            // Settings
            settings_header: 'Paramètres',
            language_label: 'Langue',
            board_theme_label: 'Thème du plateau',
            theme_classic: 'Classique',
            theme_ocean: 'Océan',
            theme_forest: 'Forêt',
            theme_midnight: 'Minuit',
            theme_chessy: 'Chessy',
            app_preferences_label: 'Préférences',
            default_blind_chess: 'Échecs à l\'aveugle par défaut',
            show_score_bar: 'Afficher la barre de score',

            // Game
            white: 'Blancs',
            black: 'Noirs',
            you_white: 'Vous (Blancs)',
            moves_label: 'Coups',
            rotate_label: 'Rotation',

            // Status
            white_to_move: 'Blancs jouent',
            black_to_move: 'Noirs jouent',
            check: 'Échec !',
            checkmate: 'Échec et mat !',
            stalemate: 'Pat — Nulle',
            draw: 'Nulle',

            // Thinking
            engine_thinking: 'Le moteur réfléchit…',
            loading_stockfish: 'Chargement du moteur Stockfish…',

            // History navigation
            viewing_history: 'Historique',
            back_to_live: '→ Partie en cours',

            // Game over
            wins_checkmate: 'gagnent par échec et mat',
            wins_resignation: 'gagnent par abandon',
            draw_stalemate: 'Nulle par pat',
            draw_repetition: 'Nulle par répétition',
            draw_material: 'Nulle — matériel insuffisant',
            draw_generic: 'Nulle',
            new_game: 'Nouvelle partie',
            eval_screen_title: 'Évaluation de position',
            eval_screen_desc: 'Configurez une position et obtenez une analyse.',
            back_to_menu_btn: 'Retour au menu',

            // Controls (tooltips)
            tooltip_back: 'Retour au menu',
            tooltip_new_game: 'Nouvelle partie',
            tooltip_undo: 'Annuler le coup',
            tooltip_flip: 'Retourner le plateau',
            tooltip_hint: 'Obtenir un indice',
            tooltip_resign: 'Abandonner',

            // Blind Chess & Modal
            voice_input: 'Entrée vocale',
            text_input: 'Saisie texte',
            enter_move: 'Saisir un coup',
            destination: 'Case de destination ou coup complet :',
            piece: 'Pièce (optionnel) :',
            cancel: 'Annuler',
            submit: 'Valider',
            move_not_understood: 'Je n\'ai pas compris le coup',
            voice_not_supported: 'L\'entrée vocale n\'est pas supportée sur ce navigateur.',
            invalid_move: 'Coup invalide',
        }
    };

    let currentLang = 'en';

    function init() {
        currentLang = localStorage.getItem('preferredLanguage') || 'en';
        if (currentLang !== 'en' && currentLang !== 'fr') currentLang = 'en';
        apply();
    }

    function setLang(lang) {
        if (lang !== 'en' && lang !== 'fr') return;
        currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        apply();
    }

    function getLang() {
        return currentLang;
    }

    function t(key) {
        return (strings[currentLang] && strings[currentLang][key]) || strings['en'][key] || key;
    }

    /** Apply data-i18n attributes to DOM */
    function apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key);
        });
        document.documentElement.lang = currentLang;
    }

    return { init, setLang, getLang, t, apply };
})();

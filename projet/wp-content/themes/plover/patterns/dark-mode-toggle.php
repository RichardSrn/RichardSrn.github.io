<?php
/**
 * Title: Dark Mode Toggle
 * Slug: plover/dark-mode-toggle
 * Categories: utility, plover
 * Block Types: core/button
 */
?>

<?php if ( plover_theme()->get( 'settings' )->checked( \Plover\Theme\Extensions\DarkMode::MODULE_NAME ) ): ?>
    <!-- wp:buttons {"style":{"spacing":{"blockGap":"0"}},"ploverBlockID":"4e1e6b52-0d4b-4b02-afb7-d97d0900a1a6"} -->
    <div class="wp-block-buttons">
        <!-- wp:button {"backgroundColor":"transparent","textColor":"current","style":{"elements":{"link":{"color":{"text":"var:preset|color|current"}}},"spacing":{"padding":{"left":"var:preset|spacing|2-x-small","right":"var:preset|spacing|2-x-small","top":"var:preset|spacing|2-x-small","bottom":"var:preset|spacing|2-x-small"},"blockGap":"0"}},"className":"wp-block-button plover-hide-on-dark","ploverBlockID":"f347bafd-4551-4a44-931c-afaabc233f0c","onclick":"(() =\u003e {\n  if (window.togglePloverThemeMode) {\n    window.togglePloverThemeMode('dark');\n  }\n})();","iconLibrary":"plover-core","iconSlug":"moon","iconSvgString":"\u003csvg xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 24 24\u0022 fill=\u0022none\u0022 stroke=\u0022currentColor\u0022 stroke-width=\u00222\u0022 stroke-linecap=\u0022round\u0022 stroke-linejoin=\u0022round\u0022\u003e\u003cpath d=\u0022M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\u0022\u003e\u003c/path\u003e\u003c/svg\u003e"} /-->

        <!-- wp:button {"backgroundColor":"transparent","textColor":"current","style":{"elements":{"link":{"color":{"text":"var:preset|color|current"}}},"spacing":{"padding":{"left":"var:preset|spacing|2-x-small","right":"var:preset|spacing|2-x-small","top":"var:preset|spacing|2-x-small","bottom":"var:preset|spacing|2-x-small"},"blockGap":"0"}},"className":"wp-block-button plover-hide-on-light","ploverBlockID":"2018eecb-bc9e-417b-a137-b71bfcec09a6","onclick":"(() =\u003e {\n  if (window.togglePloverThemeMode) {\n    window.togglePloverThemeMode('light');\n  }\n})();","iconLibrary":"plover-core","iconSlug":"sun","iconSvgString":"\u003csvg xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 24 24\u0022 fill=\u0022none\u0022 stroke=\u0022currentColor\u0022 stroke-width=\u00222\u0022 stroke-linecap=\u0022round\u0022 stroke-linejoin=\u0022round\u0022\u003e\u003ccircle cx=\u002212\u0022 cy=\u002212\u0022 r=\u00225\u0022\u003e\u003c/circle\u003e\u003cline x1=\u002212\u0022 y1=\u00221\u0022 x2=\u002212\u0022 y2=\u00223\u0022\u003e\u003c/line\u003e\u003cline x1=\u002212\u0022 y1=\u002221\u0022 x2=\u002212\u0022 y2=\u002223\u0022\u003e\u003c/line\u003e\u003cline x1=\u00224.22\u0022 y1=\u00224.22\u0022 x2=\u00225.64\u0022 y2=\u00225.64\u0022\u003e\u003c/line\u003e\u003cline x1=\u002218.36\u0022 y1=\u002218.36\u0022 x2=\u002219.78\u0022 y2=\u002219.78\u0022\u003e\u003c/line\u003e\u003cline x1=\u00221\u0022 y1=\u002212\u0022 x2=\u00223\u0022 y2=\u002212\u0022\u003e\u003c/line\u003e\u003cline x1=\u002221\u0022 y1=\u002212\u0022 x2=\u002223\u0022 y2=\u002212\u0022\u003e\u003c/line\u003e\u003cline x1=\u00224.22\u0022 y1=\u002219.78\u0022 x2=\u00225.64\u0022 y2=\u002218.36\u0022\u003e\u003c/line\u003e\u003cline x1=\u002218.36\u0022 y1=\u00225.64\u0022 x2=\u002219.78\u0022 y2=\u00224.22\u0022\u003e\u003c/line\u003e\u003c/svg\u003e"} /--></div>
    <!-- /wp:buttons -->
<?php endif; ?>

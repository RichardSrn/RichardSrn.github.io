<?php
/**
 * Title: Page Not Found
 * Slug: plover/404
 * Categories: 404, plover
 */
?>

<!-- wp:group {"tagName":"main","metadata":{"name":"Plover: Page Not Found"},"ploverBlockID":"21e9d7a2-c64e-463c-91d6-2fa20cb538cb","style":{"spacing":{"margin":{"top":"0","bottom":"0"},"blockGap":"var:preset|spacing|medium","padding":{"top":"10rem","bottom":"10rem"}},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-0","textColor":"neutral-950","layout":{"type":"constrained"}} -->
<main class="wp-block-group has-neutral-950-color has-neutral-0-background-color has-text-color has-background has-link-color"
	style="margin-top:0;margin-bottom:0;padding-top:10rem;padding-bottom:10rem">

    <!-- wp:heading {"textAlign":"center","level":1,"ploverBlockID":"10502b3c-fe97-4bee-816a-b427e6de5023"} -->
    <h1 class="wp-block-heading has-text-align-center" id="page-not-found">
		<?php esc_html_e( 'Page Not Found', 'plover' ); ?>
    </h1>
    <!-- /wp:heading -->

    <!-- wp:paragraph {"align":"center","ploverBlockID":"d49af5e4-1757-40a0-9758-50b2d54e494c"} -->
    <p class="has-text-align-center">
		<?php esc_html_e( 'The page you are looking for does not exist, or it has been moved. Please try searching using the form below.', 'plover' ); ?>
    </p>
    <!-- /wp:paragraph -->

    <!-- wp:search {"label":"<?php esc_html_e( 'Search', 'plover' ); ?>","showLabel":false,"placeholder":"<?php esc_html_e( 'Search this site', 'plover' ); ?>","buttonText":"Search","fontSize":"medium","ploverBlockID":"a1a17f0c-3eb6-4004-aa32-869dcfe585e1"} /-->
</main>
<!-- /wp:group -->

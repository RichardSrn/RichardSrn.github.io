<?php
/**
 * Title: Right media and text
 * Slug: plover/right-media-and-text
 * Categories: banners, plover
 */
?>
<!-- wp:columns {"verticalAlignment":"center","metadata":{"name":"Plover: Right media and text"},"ploverBlockID":"ef0b13cc-4a9a-447a-8a74-b6f76fa7412a","align":"wide"} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
    <!-- wp:column {"verticalAlignment":"center","ploverBlockID":"0d061372-3d74-424d-9e6d-aaf5b1cc3d34","cssOrder":{"desktop":1,"tablet":0,"mobile":"__INITIAL_VALUE__"}} -->
    <div class="wp-block-column is-vertically-aligned-center">
        <!-- wp:image {"sizeSlug":"full","linkDestination":"none","ploverBlockID":"9a271947-a824-43f6-aaa9-6f14d0f7cbb2"} -->
        <figure class="wp-block-image size-full">
            <img src="<?php the_plover_asset_url( 'images/service-01.jpg' ); ?>" alt=""/>
        </figure>
        <!-- /wp:image -->
    </div>
    <!-- /wp:column -->

    <!-- wp:column {"verticalAlignment":"center","ploverBlockID":"8c55789f-89a6-48f9-9378-ca2746c66616"} -->
    <div class="wp-block-column is-vertically-aligned-center">
        <!-- wp:group {"ploverBlockID":"d6a35133-10b9-4a5b-bad7-d773fffdd50b","style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}}},"layout":{"type":"default"}} -->
        <div class="wp-block-group"
             style="padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)">
            <!-- wp:group {"ploverBlockID":"4b8ed743-b10e-420f-bd99-3a8d0e2d333b","style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"default"}} -->
            <div class="wp-block-group">
                <!-- wp:paragraph {"ploverBlockID":"2c1e0384-7797-45b5-b8e3-fb494aed8bc5","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"700","textTransform":"uppercase","letterSpacing":"1.2px"},"elements":{"link":{"color":{"text":"var:preset|color|primary-color"}}}},"textColor":"primary-color"} -->
                <p class="has-primary-color-color has-text-color has-link-color"
                   style="font-size:14px;font-style:normal;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">
					<?php esc_html_e( 'exclusive', 'plover' ); ?>
                </p>
                <!-- /wp:paragraph -->

                <!-- wp:heading {"ploverBlockID":"eb721213-8898-4bd1-bb64-5ee0b8cbb35f","style":{"typography":{"textTransform":"capitalize"}}} -->
                <h2 class="wp-block-heading" style="text-transform:capitalize">
					<?php esc_html_e( 'What makes us sparkle', 'plover' ); ?>
                </h2>
                <!-- /wp:heading --></div>
            <!-- /wp:group -->

            <!-- wp:list {"ploverBlockID":"35da1d53-1a46-4da1-94b2-dd29a13b61d5","className":"is-style-check-circle","style":{"spacing":{"blockGap":"4px","padding":{"top":"var:preset|spacing|x-small","bottom":"var:preset|spacing|x-small"}}}} -->
            <ul style="padding-top:var(--wp--preset--spacing--x-small);padding-bottom:var(--wp--preset--spacing--x-small)"
                class="wp-block-list is-style-check-circle">
                <!-- wp:list-item {"ploverBlockID":"c24c5c17-10a4-414f-87c0-53b16e424634"} -->
                <li><?php esc_html_e( 'Pixel-perfect design pattern library', 'plover' ); ?></li>
                <!-- /wp:list-item -->

                <!-- wp:list-item {"ploverBlockID":"3ecd2f0a-e561-4ce1-a7c6-851eba44b240"} -->
                <li><?php esc_html_e( 'Flexible page builder', 'plover' ); ?></li>
                <!-- /wp:list-item -->

                <!-- wp:list-item {"ploverBlockID":"0e95c261-ff4d-4550-a896-b28202ce1776"} -->
                <li><?php esc_html_e( 'All-in-one extensions', 'plover' ); ?></li>
                <!-- /wp:list-item -->
            </ul>
            <!-- /wp:list -->

            <!-- wp:buttons {"ploverBlockID":"05c346dc-0b1f-40a6-bb02-faf204b54aa2"} -->
            <div class="wp-block-buttons">
                <!-- wp:button {"ploverBlockID":"c1aab3de-1b9e-4e2e-ac20-fafb398a701f","style":{"typography":{"letterSpacing":"1.2px","textTransform":"uppercase"}}} -->
                <div class="wp-block-button" style="letter-spacing:1.2px;text-transform:uppercase"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Get Started', 'plover' ); ?></a></div>
                <!-- /wp:button --></div>
            <!-- /wp:buttons --></div>
        <!-- /wp:group --></div>
    <!-- /wp:column --></div>
<!-- /wp:columns -->

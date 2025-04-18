<?php
/**
 * Title: Left media and text
 * Slug: plover/left-media-and-text
 * Categories: banners, plover
 */
?>

<!-- wp:columns {"verticalAlignment":"center","metadata":{"name":"Plover: Left media and text"},"ploverBlockID":"d3ef8802-ceae-43cc-b74b-01b055c31b7f","align":"wide"} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center">
    <!-- wp:column {"verticalAlignment":"center","ploverBlockID":"3639c4f4-be00-4502-9b33-4f7ef9672f9a"} -->
    <div class="wp-block-column is-vertically-aligned-center">
        <!-- wp:image {"sizeSlug":"full","linkDestination":"none","ploverBlockID":"f8e06d64-bdbf-430e-ba9b-7ea91fcdebc8"} -->
        <figure class="wp-block-image size-full">
            <img src="<?php the_plover_asset_url( 'images/service-01.jpg' ); ?>" alt=""/>
        </figure>
        <!-- /wp:image --></div>
    <!-- /wp:column -->

    <!-- wp:column {"verticalAlignment":"center","ploverBlockID":"89ca84e9-2350-4303-80a6-4fb40e11cb48"} -->
    <div class="wp-block-column is-vertically-aligned-center">
        <!-- wp:group {"ploverBlockID":"a6d8f71a-2597-427e-bb0b-2b28009baff1","style":{"spacing":{"padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}}},"layout":{"type":"default"}} -->
        <div class="wp-block-group"
             style="padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)">
            <!-- wp:group {"ploverBlockID":"1a21f208-fb9c-40d0-b7d3-f8dcf6d5af46","style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"default"}} -->
            <div class="wp-block-group">
                <!-- wp:paragraph {"ploverBlockID":"792aaeb1-30ea-4c29-8aee-f8049abd8b97","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"700","textTransform":"uppercase","letterSpacing":"1.2px"},"elements":{"link":{"color":{"text":"var:preset|color|primary-color"}}}},"textColor":"primary-color"} -->
                <p class="has-primary-color-color has-text-color has-link-color"
                   style="font-size:14px;font-style:normal;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">
					<?php esc_html_e( 'Service', 'plover' ); ?>
                </p>
                <!-- /wp:paragraph -->

                <!-- wp:heading {"ploverBlockID":"3ccc7a43-da43-4ae1-a098-a99f943c4061","style":{"typography":{"textTransform":"capitalize"}}} -->
                <h2 class="wp-block-heading" style="text-transform:capitalize">
					<?php esc_html_e( 'We solve web design problems efficiently', 'plover' ); ?>
                </h2>
                <!-- /wp:heading --></div>
            <!-- /wp:group -->

            <!-- wp:paragraph {"ploverBlockID":"5c0ecde4-b889-4152-acef-5b04cb572c1c"} -->
            <p>
				<?php echo esc_html_x( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph -->

            <!-- wp:buttons {"ploverBlockID":"82e90870-59b2-4e8c-b54d-7cbc51e7b953"} -->
            <div class="wp-block-buttons">
                <!-- wp:button {"ploverBlockID":"2a0171e9-59c3-4d14-b3bf-8d6ce155f37b","style":{"typography":{"letterSpacing":"1.2px","textTransform":"uppercase"}}} -->
                <div class="wp-block-button" style="letter-spacing:1.2px;text-transform:uppercase"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Get Started', 'plover' ); ?></a></div>
                <!-- /wp:button --></div>
            <!-- /wp:buttons --></div>
        <!-- /wp:group --></div>
    <!-- /wp:column --></div>
<!-- /wp:columns -->


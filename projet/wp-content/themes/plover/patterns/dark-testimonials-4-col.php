<?php
/**
 * Title: Dark Testimonials, 4 columns
 * Slug: plover/dark-testimonials-4-col
 * Categories: testimonials, plover
 */
?>
<!-- wp:group {"metadata":{"name":"Plover: Dark Testimonials, 4 columns"},"ploverBlockID":"9b5ff4df-9bd5-4a1b-867d-4f4c4c917adb","className":"is-style-dark","style":{"spacing":{"padding":{"top":"var:preset|spacing|2-x-large","bottom":"var:preset|spacing|2-x-large"},"blockGap":"var:preset|spacing|x-large"},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-200","textColor":"neutral-950","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-dark has-neutral-950-color has-neutral-200-background-color has-text-color has-background has-link-color"
	style="padding-top:var(--wp--preset--spacing--2-x-large);padding-bottom:var(--wp--preset--spacing--2-x-large)">
    <!-- wp:group {"ploverBlockID":"2d9d21d6-c8d6-48fc-84b1-13f53802b836","style":{"spacing":{"blockGap":"12px"}},"layout":{"type":"default"}} -->
    <div class="wp-block-group">
        <!-- wp:paragraph {"align":"center","ploverBlockID":"7dc381b2-cf40-4005-bfd0-6718bdc26e15","style":{"typography":{"fontSize":"14px","textTransform":"uppercase","letterSpacing":"1.2px","fontStyle":"normal","fontWeight":"700"},"elements":{"link":{"color":{"text":"var:preset|color|primary-active"}}}},"textColor":"primary-active"} -->
        <p class="has-text-align-center has-primary-active-color has-text-color has-link-color"
           style="font-size:14px;font-style:normal;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">
			<?php esc_html_e( 'Testimonials', 'plover' ); ?>
        </p>
        <!-- /wp:paragraph -->

        <!-- wp:heading {"textAlign":"center","ploverBlockID":"7e39366b-712d-410c-9739-bfa289c2cf82","style":{"typography":{"textTransform":"capitalize"}}} -->
        <h2 class="wp-block-heading has-text-align-center" style="text-transform:capitalize">
			<?php esc_html_e( 'What out customers says', 'plover' ); ?>
        </h2>
        <!-- /wp:heading -->

        <!-- wp:paragraph {"align":"center","ploverBlockID":"4fa47ad4-e52e-415f-96ab-7e2193980b4f"} -->
        <p class="has-text-align-center">
			<?php echo esc_html_x( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'Dummy text', 'plover' ) ?>
        </p>
        <!-- /wp:paragraph -->
    </div>
    <!-- /wp:group -->

    <!-- wp:columns {"ploverBlockID":"5a141fcb-2cd6-4faf-a607-8a093245729f","align":"wide"} -->
    <div class="wp-block-columns alignwide"><!-- wp:column {"ploverBlockID":"08153615-378d-444b-8620-b2ff7723fe66"} -->
        <div class="wp-block-column">
            <!-- wp:image {"width":"88px","height":"88px","scale":"cover","sizeSlug":"medium","linkDestination":"none","ploverBlockID":"15bd6e8e-0af6-413f-9e3e-1d848760ef99","align":"center","style":{"border":{"radius":"24px"}}} -->
            <figure class="wp-block-image aligncenter size-medium is-resized has-custom-border">
                <img src="<?php the_plover_asset_url( 'images/portrait-01.jpg' ); ?>" alt=""
                     style="border-radius:24px;object-fit:cover;width:88px;height:88px"/>
            </figure>
            <!-- /wp:image -->

            <!-- wp:paragraph {"align":"center","ploverBlockID":"8ac10847-9269-4e47-bb8c-105b5a53bd7c"} -->
            <p class="has-text-align-center">
				<?php echo esc_html_x( '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph -->

            <!-- wp:paragraph {"align":"center","ploverBlockID":"10bdb133-aedc-46a1-a507-ee3196d68fa4"} -->
            <p class="has-text-align-center">
				<?php echo esc_html_x( 'Harry Read', 'Dummy customer name', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph --></div>
        <!-- /wp:column -->

        <!-- wp:column {"ploverBlockID":"114c4ca8-9173-430e-b257-d583a84706c9"} -->
        <div class="wp-block-column">
            <!-- wp:image {"id":153,"width":"88px","height":"88px","scale":"cover","sizeSlug":"full","linkDestination":"none","ploverBlockID":"1f371619-112b-405c-b696-a9d325272c35","align":"center","style":{"border":{"radius":"24px"}}} -->
            <figure class="wp-block-image aligncenter size-full is-resized has-custom-border">
                <img src="<?php the_plover_asset_url( 'images/portrait-02.jpg' ); ?>" alt=""
                     class="wp-image-153" style="border-radius:24px;object-fit:cover;width:88px;height:88px"/>
            </figure>
            <!-- /wp:image -->

            <!-- wp:paragraph {"align":"center","ploverBlockID":"ae59a472-3cdf-4e37-ac8d-8070a2bc7111"} -->
            <p class="has-text-align-center">
				<?php echo esc_html_x( '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph -->

            <!-- wp:paragraph {"align":"center","ploverBlockID":"cae4fd5f-e935-4eb7-96a7-9d306e18e083"} -->
            <p class="has-text-align-center">
				<?php echo esc_html_x( 'Lois Pope', 'Dummy customer name', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph --></div>
        <!-- /wp:column -->

        <!-- wp:column {"ploverBlockID":"18710241-0371-4393-978b-01374f95ec01"} -->
        <div class="wp-block-column">
            <!-- wp:image {"id":154,"width":"88px","height":"88px","scale":"cover","sizeSlug":"full","linkDestination":"none","ploverBlockID":"53c6b6eb-443a-4a69-af3d-9ea565d62b46","align":"center","style":{"border":{"radius":"24px"}}} -->
            <figure class="wp-block-image aligncenter size-full is-resized has-custom-border">
                <img src="<?php the_plover_asset_url( 'images/portrait-03.jpg' ); ?>" alt=""
                     class="wp-image-154" style="border-radius:24px;object-fit:cover;width:88px;height:88px"/>
            </figure>
            <!-- /wp:image -->

            <!-- wp:paragraph {"align":"center","ploverBlockID":"0d3eb31d-7ea1-4ad7-ac1b-57a8360590a0"} -->
            <p class="has-text-align-center">
				<?php echo esc_html_x( '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph -->

            <!-- wp:paragraph {"align":"center","ploverBlockID":"e17a6e56-50a5-424c-868f-46f146c7a914"} -->
            <p class="has-text-align-center">
				<?php echo esc_html_x( 'Harper Conner', 'Dummy customer name', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph --></div>
        <!-- /wp:column --></div>
    <!-- /wp:columns --></div>
<!-- /wp:group -->

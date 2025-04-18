<?php
/**
 * Title: Featured Projects, 3 col
 * Slug: plover/featured-projects-3-col
 * Categories: features, plover
 */
?>
<!-- wp:group {"metadata":{"name":"Plover: Featured Projects, 3 col"},"ploverBlockID":"631855bb-d87d-4194-b61b-3b8404fd028c","style":{"spacing":{"padding":{"top":"var:preset|spacing|2-x-large","bottom":"var:preset|spacing|2-x-large"}},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-200","textColor":"neutral-950","layout":{"type":"constrained"}} -->
<div class="wp-block-group has-neutral-950-color has-neutral-200-background-color has-text-color has-background has-link-color"
	style="padding-top:var(--wp--preset--spacing--2-x-large);padding-bottom:var(--wp--preset--spacing--2-x-large)">
    <!-- wp:group {"ploverBlockID":"6e615c0a-b77b-43bc-be6f-807ef321b4d5","style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"constrained"}} -->
    <div class="wp-block-group">
        <!-- wp:paragraph {"align":"center","ploverBlockID":"514130a1-71cd-4739-8854-7889169bdbfe","style":{"typography":{"fontSize":"14px","fontStyle":"normal","fontWeight":"700","textTransform":"uppercase","letterSpacing":"1.2px"},"elements":{"link":{"color":{"text":"var:preset|color|primary-color"}}}},"textColor":"primary-color"} -->
        <p class="has-text-align-center has-primary-color-color has-text-color has-link-color"
           style="font-size:14px;font-style:normal;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">
			<?php esc_html_e( 'What we do', 'plover' ); ?>
        </p>
        <!-- /wp:paragraph -->

        <!-- wp:heading {"textAlign":"center","ploverBlockID":"137ede6b-0e0b-4f7f-b030-51ec15e980a3"} -->
        <h2 class="wp-block-heading has-text-align-center">
			<?php esc_html_e( 'Featured Projects', 'plover' ); ?>
        </h2>
        <!-- /wp:heading --></div>
    <!-- /wp:group -->

    <!-- wp:paragraph {"align":"center","ploverBlockID":"6708bc5f-427f-4733-921a-48253430a4d4"} -->
    <p class="has-text-align-center">
		<?php echo esc_html_x( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'Dummy text', 'plover' ) ?>
    </p>
    <!-- /wp:paragraph -->

    <!-- wp:columns {"ploverBlockID":"90d7fa57-bf8f-4e57-9d2d-bad9db3bc079","align":"wide"} -->
    <div class="wp-block-columns alignwide">
        <!-- wp:column {"ploverBlockID":"9a31f10d-57ee-4e88-bbb6-f6f039644259","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small","left":"var:preset|spacing|small","right":"var:preset|spacing|small"},"blockGap":"var:preset|spacing|x-small"}},"backgroundColor":"neutral-0","boxShadow":"var:custom|boxShadow|base"} -->
        <div class="wp-block-column has-neutral-0-background-color has-background"
             style="border-radius:24px;padding-top:var(--wp--preset--spacing--small);padding-right:var(--wp--preset--spacing--small);padding-bottom:var(--wp--preset--spacing--small);padding-left:var(--wp--preset--spacing--small)">
            <!-- wp:image {"sizeSlug":"large","linkDestination":"none","ploverBlockID":"b17de89f-2326-4a9c-aeb7-a1684f2eae5a","style":{"color":[]}} -->
            <figure class="wp-block-image size-large"><img
                        src="<?php the_plover_asset_url( 'images/featured-project.jpg' ); ?>" alt=""
                /></figure>
            <!-- /wp:image -->

            <!-- wp:heading {"level":3,"ploverBlockID":"537f88c0-7b78-44d0-8d7a-65c079ffa283","style":{"typography":{"fontSize":"1.75em"}}} -->
            <h3 class="wp-block-heading" style="font-size:1.75em">
				<?php esc_html_e( 'Website Design', 'plover' ); ?>
            </h3>
            <!-- /wp:heading -->

            <!-- wp:paragraph {"ploverBlockID":"f8c79d1b-4af3-4467-a2da-c67a725b5fbd"} -->
            <p>
				<?php echo esc_html_x( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et.', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph --></div>
        <!-- /wp:column -->

        <!-- wp:column {"ploverBlockID":"9822e786-4bc2-4a50-a0c6-409ad8960adc","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small","left":"var:preset|spacing|small","right":"var:preset|spacing|small"},"blockGap":"var:preset|spacing|x-small"}},"backgroundColor":"neutral-0","boxShadow":"var:custom|boxShadow|base"} -->
        <div class="wp-block-column has-neutral-0-background-color has-background"
             style="border-radius:24px;padding-top:var(--wp--preset--spacing--small);padding-right:var(--wp--preset--spacing--small);padding-bottom:var(--wp--preset--spacing--small);padding-left:var(--wp--preset--spacing--small)">
            <!-- wp:image {"sizeSlug":"large","linkDestination":"none","ploverBlockID":"ed5f4ba4-6807-4b0a-ad1d-99ff902d7b20","style":{"color":[]}} -->
            <figure class="wp-block-image size-large">
                <img src="<?php the_plover_asset_url( 'images/featured-project.jpg' ); ?>" alt=""/>
            </figure>
            <!-- /wp:image -->

            <!-- wp:heading {"level":3,"ploverBlockID":"f2bf8d60-bffc-4f2b-b8a1-6ae87215a968","style":{"typography":{"fontSize":"1.75em"}}} -->
            <h3 class="wp-block-heading" style="font-size:1.75em">
				<?php esc_html_e( 'WordPress Themes', 'plover' ); ?>
            </h3>
            <!-- /wp:heading -->

            <!-- wp:paragraph {"ploverBlockID":"536f9ae7-17e7-4b98-b814-419dae358426"} -->
            <p>
				<?php echo esc_html_x( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et.', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph --></div>
        <!-- /wp:column -->

        <!-- wp:column {"ploverBlockID":"34ad9a69-db69-4d00-a55d-59a71ecfc271","style":{"border":{"radius":"24px"},"spacing":{"padding":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small","left":"var:preset|spacing|small","right":"var:preset|spacing|small"},"blockGap":"var:preset|spacing|x-small"}},"backgroundColor":"neutral-0","boxShadow":"var:custom|boxShadow|base"} -->
        <div class="wp-block-column has-neutral-0-background-color has-background"
             style="border-radius:24px;padding-top:var(--wp--preset--spacing--small);padding-right:var(--wp--preset--spacing--small);padding-bottom:var(--wp--preset--spacing--small);padding-left:var(--wp--preset--spacing--small)">
            <!-- wp:image {"sizeSlug":"large","linkDestination":"none","ploverBlockID":"c662296a-f45c-406d-97cc-ea5332503f6d","style":{"color":[]}} -->
            <figure class="wp-block-image size-large">
                <img src="<?php the_plover_asset_url( 'images/featured-project.jpg' ); ?>" alt=""/>
            </figure>
            <!-- /wp:image -->

            <!-- wp:heading {"level":3,"ploverBlockID":"b3684547-8657-4537-9243-52ec0a16232d","style":{"typography":{"fontSize":"1.75em"}}} -->
            <h3 class="wp-block-heading" style="font-size:1.75em">
				<?php esc_html_e( 'WordPress Plugins', 'plover' ); ?>
            </h3>
            <!-- /wp:heading -->

            <!-- wp:paragraph {"ploverBlockID":"d92d4c63-28d6-4446-a293-ee4eb8eb1adf"} -->
            <p>
				<?php echo esc_html_x( 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et.', 'Dummy text', 'plover' ) ?>
            </p>
            <!-- /wp:paragraph --></div>
        <!-- /wp:column --></div>
    <!-- /wp:columns --></div>
<!-- /wp:group -->


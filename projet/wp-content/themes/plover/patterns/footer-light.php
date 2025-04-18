<?php
/**
 * Title: Light Footer, 4 columns
 * Slug: plover/footer-light
 * Categories: footer, plover
 * Block Types: core/template-part/footer
 */
?>
<!-- wp:group {"style":{"spacing":{"padding":{"top":"0","bottom":"var:preset|spacing|medium"}}},"layout":{"type":"constrained"},"ploverBlockID":"0e15d40e-2a8c-40e1-8694-2f5c198675f3"} -->
<div class="wp-block-group" style="padding-top:0;padding-bottom:var(--wp--preset--spacing--medium)">
    <!-- wp:group {"align":"full","gradient":"cool-to-warm-spectrum","layout":{"type":"constrained"},"ploverBlockID":"d626cc88-50e2-49c4-8361-45a04f47f2b2"} -->
    <div class="wp-block-group alignfull has-cool-to-warm-spectrum-gradient-background has-background">
        <!-- wp:spacer {"height":"4px","ploverBlockID":"f498a7f8-f82d-440d-b05f-8f28c40049d4"} -->
        <div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer --></div>
    <!-- /wp:group -->

    <!-- wp:columns {"align":"wide","ploverBlockID":"862c20dd-dfd7-4846-8b12-bdb972f3b1dc"} -->
    <div class="wp-block-columns alignwide">
        <!-- wp:column {"width":"40%","ploverBlockID":"5aeceb5c-30d0-4ce7-ab4b-98889ea3e3df"} -->
        <div class="wp-block-column" style="flex-basis:40%">
            <!-- wp:group {"style":{"dimensions":{"minHeight":""},"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"2b627004-2769-43c1-8f10-d7436c97e3b8"} -->
            <div class="wp-block-group">
                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","flexWrap":"nowrap"},"ploverBlockID":"35524a07-bdff-41f7-a75b-7d59fbe8d33d"} -->
                <div class="wp-block-group">
                    <!-- wp:site-logo {"width":48,"shouldSyncIcon":true,"style":{"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"ffa08eed-cea6-441e-8aea-bbc6250834d4"} /-->

                    <!-- wp:site-title {"level":0,"style":{"typography":{"textTransform":"uppercase","textDecoration":"none"}},"fontSize":"medium","ploverBlockID":"7132c695-f9ce-4810-86e6-8a55cc67e3fd"} /--></div>
                <!-- /wp:group -->

                <!-- wp:search {"label":"","showLabel":false,"placeholder":"<?php esc_html_e( 'Search this site', 'plover' ); ?>","width":100,"widthUnit":"%","buttonText":"Search","buttonUseIcon":true,"style":{"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"8781eb9f-5b65-4fa0-af2b-61aebdc05661"} /-->

                <!-- wp:social-links {"iconColor":"neutral-600","iconColorValue":"#52525b","size":"has-small-icon-size","style":{"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small"}}},"className":"is-style-logos-only","ploverBlockID":"1c2376b1-29a3-4c7b-b3ec-07ef8ef2d7ed"} -->
                <ul class="wp-block-social-links has-small-icon-size has-icon-color is-style-logos-only"
                    style="margin-top:var(--wp--preset--spacing--small);margin-bottom:var(--wp--preset--spacing--small)">
                    <!-- wp:social-link {"url":"#","service":"facebook","ploverBlockID":"8ffda712-f0d5-4f4a-9c2a-d76fdd99e8b7"} /-->

                    <!-- wp:social-link {"url":"#","service":"x","ploverBlockID":"7d03064b-24f0-4cec-b959-5e6369017ea2"} /-->

                    <!-- wp:social-link {"url":"#","service":"instagram","ploverBlockID":"18e3cd3c-e658-462c-ad32-851fe806beb0"} /-->

                    <!-- wp:social-link {"url":"#","service":"tiktok","ploverBlockID":"9624cfc5-5b96-429f-9fd8-957f991ac57e"} /-->

                    <!-- wp:social-link {"url":"#","service":"github","ploverBlockID":"44878169-ddd7-4c87-aea0-fcab190fe0c6"} /--></ul>
                <!-- /wp:social-links --></div>
            <!-- /wp:group --></div>
        <!-- /wp:column -->

        <!-- wp:column {"width":"60%","ploverBlockID":"5e168d9a-577a-4fdd-ad36-482c02c7f2cd"} -->
        <div class="wp-block-column" style="flex-basis:60%">
            <!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"top"},"ploverBlockID":"45e49213-b2e0-45fc-b666-b7403098441a"} -->
            <div class="wp-block-group">
                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"},"ploverBlockID":"e775e160-68ab-4a5b-bf3a-4513602f6cc5"} -->
                <div class="wp-block-group">
                    <!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"has-medium-font-size","fontFamily":"body","ploverBlockID":"432c92a7-2d23-4ef1-9fa5-b55ea1221f23"} -->
                    <h2 class="wp-block-heading has-medium-font-size has-body-font-family"
                        style="font-style:normal;font-weight:600">
						<?php esc_html_e( 'About', 'plover' ); ?>
                    </h2>
                    <!-- /wp:heading -->

                    <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|10"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"14c19b8d-01dd-4462-a3bd-45692a951bc5"} -->
                    <div class="wp-block-group">
                        <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"},"style":{"typography":{"fontStyle":"normal","fontWeight":"400"},"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"fontSize":"small","ploverBlockID":"3644ddab-0014-4ff5-bb9d-c207e78ecd4d"} -->
                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Team', 'plover' ); ?>","url":"#","ploverBlockID":"7b3ee71e-4aab-4560-a0cd-2c38d4a849b3"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'History', 'plover' ); ?>","url":"#","ploverBlockID":"d8e22927-241b-4662-b35b-ea52d14a2b8b"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Careers', 'plover' ); ?>","url":"#","ploverBlockID":"676f3723-a237-4fd4-a2f4-e2147ccad82e"} /-->
                        <!-- /wp:navigation --></div>
                    <!-- /wp:group --></div>
                <!-- /wp:group -->

                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"},"ploverBlockID":"2f83f087-93b4-4cbe-a349-13afbfa894a5"} -->
                <div class="wp-block-group">
                    <!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"has-medium-font-size","fontFamily":"body","ploverBlockID":"0cb98dcb-be5b-443d-a411-a35839b04314"} -->
                    <h2 class="wp-block-heading has-medium-font-size has-body-font-family"
                        style="font-style:normal;font-weight:600">
						<?php esc_html_e( 'Privacy', 'plover' ); ?>
                    </h2>
                    <!-- /wp:heading -->

                    <!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"6cdf146e-3b88-4a5b-9fe0-29fb2844d3b6"} -->
                    <div class="wp-block-group">
                        <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"},"style":{"typography":{"fontStyle":"normal","fontWeight":"400"},"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"fontSize":"small","ploverBlockID":"090de97c-4f2a-42cd-9a10-5c2b5eeb0cf2"} -->
                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Privacy Policy', 'plover' ); ?>","url":"#","ploverBlockID":"90c8a31e-0ff0-4fe2-a225-18b70a438cf7"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Terms and Conditions', 'plover' ); ?>","url":"#","ploverBlockID":"384ccea6-1e8b-4846-bb7b-c35ba88ee44c"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Contact Us', 'plover' ); ?>","url":"#","ploverBlockID":"c2ed0892-837c-4f76-848c-cb0ed233d4c1"} /-->
                        <!-- /wp:navigation --></div>
                    <!-- /wp:group --></div>
                <!-- /wp:group -->

                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"},"ploverBlockID":"3a9305e5-2045-4dbb-aca2-aa7f2f338c50"} -->
                <div class="wp-block-group">
                    <!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"has-medium-font-size","fontFamily":"body","ploverBlockID":"4cf0f3d1-fcaa-4d78-9809-1ab8a76a6b27"} -->
                    <h2 class="wp-block-heading has-medium-font-size has-body-font-family"
                        style="font-style:normal;font-weight:600">
						<?php esc_html_e( 'Social', 'plover' ); ?>
                    </h2>
                    <!-- /wp:heading -->

                    <!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"ef5b82d8-51c6-48ed-a03b-fdab8249d0bc"} -->
                    <div class="wp-block-group">
                        <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"},"style":{"typography":{"fontStyle":"normal","fontWeight":"400"},"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"fontSize":"small","ploverBlockID":"027035d4-05da-4949-abe0-f2fafb28b9ac"} -->
                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Facebook', 'plover' ); ?>","url":"#","ploverBlockID":"f59e478d-309d-4351-8249-c83eaaf46279"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Instagram', 'plover' ); ?>","url":"#","ploverBlockID":"b0a5e2fc-1dc0-41a1-a720-ba169a743363"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Twitter/X', 'plover' ); ?>","url":"#","ploverBlockID":"e8110ca7-4c32-4814-8799-9d8dbb04153b"} /-->
                        <!-- /wp:navigation --></div>
                    <!-- /wp:group --></div>
                <!-- /wp:group --></div>
            <!-- /wp:group --></div>
        <!-- /wp:column --></div>
    <!-- /wp:columns -->

    <!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"0"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"},"fontSize":"small","ploverBlockID":"28993421-1efa-43ba-b7e9-1941bf541499"} -->
    <div class="wp-block-group alignwide has-small-font-size"
         style="padding-top:var(--wp--preset--spacing--50);padding-bottom:0">
        <!-- wp:paragraph {"ploverBlockID":"95676b0f-7043-4a79-9391-e5b2202a01b5"} -->
        <p>
			<?php
			/* Translators: Theme Author link. */
			$author_link = '<a href="' . esc_url( __( 'https://wpplover.com/', 'plover' ) ) . '" rel="nofollow">WP Plover</a>';
			echo sprintf(
			/* Translators: Designed by WP Plover */
				esc_html__( 'Designed by %1$s', 'plover' ),
				$author_link
			);
			?>
        </p>
        <!-- /wp:paragraph -->

        <!-- wp:paragraph {"ploverBlockID":"76b3cff6-b40a-4873-a8d7-7341110c7043"} -->
        <p>
            <a href="#"><?php
				/* Translators: To Top link. */
				esc_html_e( 'Top ↑', 'plover' );
				?></a>
        </p>
        <!-- /wp:paragraph --></div>
    <!-- /wp:group --></div>
<!-- /wp:group -->

<?php
/**
 * Title: Dark Footer, 4 columns
 * Slug: plover/footer-dark
 * Categories: footer, plover
 * Block Types: core/template-part/footer
 */
?>
<!-- wp:group {"ploverBlockID":"270f792d-68a5-4a2a-8c26-13214e9f2bd0","className":"is-style-dark","style":{"spacing":{"padding":{"top":"0","bottom":"var:preset|spacing|medium"}},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-0","textColor":"neutral-950","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-dark has-neutral-950-color has-neutral-0-background-color has-text-color has-background has-link-color"
	style="padding-top:0;padding-bottom:var(--wp--preset--spacing--medium)">
    <!-- wp:group {"align":"full","gradient":"cool-to-warm-spectrum","layout":{"type":"constrained"},"ploverBlockID":"7e8d3e65-7081-48ef-b710-6c8a6433e3e2"} -->
    <div class="wp-block-group alignfull has-cool-to-warm-spectrum-gradient-background has-background">
        <!-- wp:spacer {"height":"4px","ploverBlockID":"fbd8df0b-22d9-4214-bdc4-cc0863026838"} -->
        <div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer --></div>
    <!-- /wp:group -->

    <!-- wp:columns {"align":"wide","ploverBlockID":"c6ebd774-f619-4bed-9dd7-106a7a8bff99"} -->
    <div class="wp-block-columns alignwide">
        <!-- wp:column {"width":"40%","ploverBlockID":"017fd8dd-964d-4df2-9058-1eaaf8cf14c4"} -->
        <div class="wp-block-column" style="flex-basis:40%">
            <!-- wp:group {"style":{"dimensions":{"minHeight":""},"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"cd4eec58-dfa7-4c1c-8852-4c025de67d00"} -->
            <div class="wp-block-group">
                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","flexWrap":"nowrap"},"ploverBlockID":"7ef275bf-09fc-476f-be89-5b52271813e9"} -->
                <div class="wp-block-group">
                    <!-- wp:site-logo {"width":48,"shouldSyncIcon":true,"style":{"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"f10048a5-bf6e-416a-a5d8-2b75c4ee6b86"} /-->

                    <!-- wp:site-title {"level":0,"style":{"typography":{"textTransform":"uppercase","textDecoration":"none"}},"fontSize":"medium","ploverBlockID":"4e52f3ad-e083-4759-a8a3-f5d2d8c50459"} /--></div>
                <!-- /wp:group -->

                <!-- wp:search {"label":"","showLabel":false,"placeholder":"<?php esc_html_e( 'Search this site', 'plover' ); ?>","width":100,"widthUnit":"%","buttonText":"Search","buttonUseIcon":true,"style":{"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"80b19b60-75b7-4f7f-8317-e31b4906aea3"} /-->

                <!-- wp:social-links {"iconColor":"neutral-600","iconColorValue":"#52525b","size":"has-small-icon-size","style":{"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"margin":{"top":"var:preset|spacing|small","bottom":"var:preset|spacing|small"}}},"className":"is-style-logos-only","ploverBlockID":"ba6db528-f15a-446c-a396-dcffc868b591"} -->
                <ul class="wp-block-social-links has-small-icon-size has-icon-color is-style-logos-only"
                    style="margin-top:var(--wp--preset--spacing--small);margin-bottom:var(--wp--preset--spacing--small)">
                    <!-- wp:social-link {"url":"#","service":"facebook","ploverBlockID":"99525643-3c43-4caa-ae59-552e0c3294bb"} /-->

                    <!-- wp:social-link {"url":"#","service":"x","ploverBlockID":"359386e4-2898-428b-8da3-b0d3025c87f8"} /-->

                    <!-- wp:social-link {"url":"#","service":"instagram","ploverBlockID":"ec6223aa-9139-44e0-b0d7-415dccd79613"} /-->

                    <!-- wp:social-link {"url":"#","service":"tiktok","ploverBlockID":"28bfac15-d7de-4b85-a994-7f0a30c4c702"} /-->

                    <!-- wp:social-link {"url":"#","service":"github","ploverBlockID":"63ad209a-0e08-489c-8a7e-fcbdc4bcacd1"} /--></ul>
                <!-- /wp:social-links --></div>
            <!-- /wp:group --></div>
        <!-- /wp:column -->

        <!-- wp:column {"width":"60%","ploverBlockID":"08e284b0-b839-4a1b-b641-054bf24de2b9"} -->
        <div class="wp-block-column" style="flex-basis:60%">
            <!-- wp:group {"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"top"},"ploverBlockID":"51f24885-0b5a-463b-aabb-7fb45d1645eb"} -->
            <div class="wp-block-group">
                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"},"ploverBlockID":"4d55412c-8a2e-42a4-a8c9-d34f77a94725"} -->
                <div class="wp-block-group">
                    <!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"has-medium-font-size","fontFamily":"body","ploverBlockID":"ce402810-e7cd-4ee9-9562-65283627747d"} -->
                    <h2 class="wp-block-heading has-medium-font-size has-body-font-family"
                        style="font-style:normal;font-weight:600">
						<?php esc_html_e( 'About', 'plover' ); ?>
                    </h2>
                    <!-- /wp:heading -->

                    <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|10"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"eb56141c-bc02-4959-a211-c10665836d5c"} -->
                    <div class="wp-block-group">
                        <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"},"style":{"typography":{"fontStyle":"normal","fontWeight":"400"},"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"fontSize":"small","ploverBlockID":"75f50867-063e-4a07-af7c-0db75e7b2063"} -->
                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Team', 'plover' ); ?>","url":"#","ploverBlockID":"4e1dff1d-a6f9-4459-875a-17338422b0a5"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'History', 'plover' ); ?>","url":"#","ploverBlockID":"bc1a2313-0296-474d-bc99-4f69ae429e6c"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Careers', 'plover' ); ?>","url":"#","ploverBlockID":"ce3e8acb-af46-4993-b00c-46d905447ef6"} /-->
                        <!-- /wp:navigation --></div>
                    <!-- /wp:group --></div>
                <!-- /wp:group -->

                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"},"ploverBlockID":"5f1f9850-3473-4dd5-a7e7-92fce2a7b288"} -->
                <div class="wp-block-group">
                    <!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"has-medium-font-size","fontFamily":"body","ploverBlockID":"8ceb84c6-ffb5-4656-9f95-60003c9dcbe2"} -->
                    <h2 class="wp-block-heading has-medium-font-size has-body-font-family"
                        style="font-style:normal;font-weight:600">
						<?php esc_html_e( 'Privacy', 'plover' ); ?>
                    </h2>
                    <!-- /wp:heading -->

                    <!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"7e676df2-25b1-4e6f-9d1a-56e9b2f304a6"} -->
                    <div class="wp-block-group">
                        <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"},"style":{"typography":{"fontStyle":"normal","fontWeight":"400"},"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"fontSize":"small","ploverBlockID":"081e8cef-2360-47ee-9d3e-e1349581a4bc"} -->
                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Privacy Policy', 'plover' ); ?>","url":"#","ploverBlockID":"883f6d93-fdea-4de6-a271-bad07828aceb"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Terms and Conditions', 'plover' ); ?>","url":"#","ploverBlockID":"4dcdf3e6-539d-4171-b64f-6bf18925ee20"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Contact Us', 'plover' ); ?>","url":"#","ploverBlockID":"b5f83c47-e06b-4b14-b69e-e5503c9a128e"} /-->
                        <!-- /wp:navigation -->
                    </div>
                    <!-- /wp:group --></div>
                <!-- /wp:group -->

                <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch"},"ploverBlockID":"cdeeb8d6-02ce-4114-ac68-5bcc5983bd4e"} -->
                <div class="wp-block-group">
                    <!-- wp:heading {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"has-medium-font-size","fontFamily":"body","ploverBlockID":"3d5878a6-fe9e-46a8-b2b4-6f469ff2db94"} -->
                    <h2 class="wp-block-heading has-medium-font-size has-body-font-family"
                        style="font-style:normal;font-weight:600">
						<?php esc_html_e( 'Social', 'plover' ); ?>
                    </h2>
                    <!-- /wp:heading -->

                    <!-- wp:group {"style":{"spacing":{"blockGap":"0"}},"layout":{"type":"flex","orientation":"vertical"},"ploverBlockID":"ae44f819-08db-41ce-a1c3-c1ceed8e33fd"} -->
                    <div class="wp-block-group">
                        <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"},"style":{"typography":{"fontStyle":"normal","fontWeight":"400"},"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"fontSize":"small","ploverBlockID":"c1902b30-bc3d-48fe-818f-a3ba3215a515"} -->
                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Facebook', 'plover' ); ?>","url":"#","ploverBlockID":"67fc604e-1be4-4857-8235-887f1b9bb8a6"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Instagram', 'plover' ); ?>","url":"#","ploverBlockID":"03e27894-3851-49c1-ae3c-23d37967dc21"} /-->

                        <!-- wp:navigation-link {"label":"<?php esc_html_e( 'Twitter/X', 'plover' ); ?>","url":"#","ploverBlockID":"1db27d41-b92b-43aa-9d12-74674a74c686"} /-->
                        <!-- /wp:navigation --></div>
                    <!-- /wp:group --></div>
                <!-- /wp:group --></div>
            <!-- /wp:group --></div>
        <!-- /wp:column --></div>
    <!-- /wp:columns -->

    <!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"0"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"},"fontSize":"small","ploverBlockID":"75fb74e2-e27a-4d51-b206-058b37b49093"} -->
    <div class="wp-block-group alignwide has-small-font-size"
         style="padding-top:var(--wp--preset--spacing--50);padding-bottom:0">
        <!-- wp:paragraph {"ploverBlockID":"e92e654d-9dfa-41c4-a8c7-dc9d0e39f9ed"} -->
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

        <!-- wp:paragraph {"ploverBlockID":"b5b27af1-c84c-43ce-bff0-b072595157b8"} -->
        <p>
            <a href="#"><?php
				/* Translators: To Top link. */
				esc_html_e( 'Top ↑', 'plover' );
				?></a>
        </p>
        <!-- /wp:paragraph --></div>
    <!-- /wp:group --></div>
<!-- /wp:group -->

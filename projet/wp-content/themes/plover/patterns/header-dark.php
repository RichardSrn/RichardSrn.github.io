<?php
/**
 * Title: Dark Header
 * Slug: plover/header-dark
 * Categories: header, plover
 * Block Types: core/template-part/header
 */
?>
<!-- wp:group {"ploverBlockID":"161415eb-cbfd-4018-9935-5c49fe7e5eb6","align":"wide","className":"is-style-dark","style":{"spacing":{"padding":{"top":"var:preset|spacing|x-small","bottom":"0px"},"blockGap":"var:preset|spacing|x-small"},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-0","textColor":"neutral-950","layout":{"type":"constrained"},"stickyBlock":"no","stickyZIndex":99,"stickyContainer":"document"} -->
<div class="wp-block-group alignwide is-style-dark has-neutral-950-color has-neutral-0-background-color has-text-color has-background has-link-color"
    style="padding-top:var(--wp--preset--spacing--x-small);padding-bottom:0px">
    <!-- wp:group {"align":"wide","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"},"ploverBlockID":"b092acad-d568-4f17-b185-31830b7d43a1"} -->
    <div class="wp-block-group alignwide">
        <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"},"layout":{"selfStretch":"fit","flexSize":null}},"layout":{"type":"flex"},"ploverBlockID":"afaeb12b-6bc7-4004-b226-54743c55bb47"} -->
        <div class="wp-block-group">
            <!-- wp:site-logo {"width":60,"shouldSyncIcon":true,"ploverBlockID":"e9247339-da7b-4670-9d50-51c926dfc989"} /-->

            <!-- wp:group {"style":{"spacing":{"blockGap":"0px"}},"ploverBlockID":"53e0e6f2-f832-4d24-bddd-cd54756ba54c"} -->
            <div class="wp-block-group">
                <!-- wp:site-title {"level":0,"style":{"typography":{"textTransform":"uppercase","textDecoration":"none"}},"ploverBlockID":"b176d896-bc48-41eb-b054-6f0d6807475e"} /-->

                <!-- wp:site-tagline {"ploverBlockID":"6f9fabb9-f561-4517-9e15-0e35a766090e"} /--></div>
            <!-- /wp:group --></div>
        <!-- /wp:group -->

        <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"},"ploverBlockID":"58078666-5da2-4f47-a510-27a2e258cc9e"} -->
        <div class="wp-block-group">
            <!-- wp:navigation {"icon":"menu","layout":{"type":"flex","justifyContent":"right","orientation":"horizontal"},"style":{"spacing":{"margin":{"top":"0"},"blockGap":"var:preset|spacing|x-small"},"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"ad0abaa2-852c-48de-af64-0ec82ddee6b6","cssOrder":{"desktop":"","tablet":1,"mobile":"__INITIAL_VALUE__"}} /-->

            <!-- wp:pattern {"slug":"plover/dark-mode-toggle"} /-->

            <!-- wp:buttons {"ploverBlockID":"46566d73-88b4-4260-992a-d4c3e8200b45","cssDisplay":{"desktop":"","tablet":"none","mobile":"__INITIAL_VALUE__"}} -->
            <div class="wp-block-buttons">
                <!-- wp:button {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.2px"}},"className":"is-style-ghost","fontSize":"x-small","ploverBlockID":"7e1aa71a-3d59-4193-a637-038104e20e89"} -->
                <div class="wp-block-button has-custom-font-size is-style-ghost has-x-small-font-size"
                     style="letter-spacing:1.2px;text-transform:uppercase"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Log In', 'plover' ); ?></a></div>
                <!-- /wp:button -->

                <!-- wp:button {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.2px"}},"fontSize":"x-small","ploverBlockID":"9c620215-4454-4edf-b84e-2d2210bb3150"} -->
                <div class="wp-block-button has-custom-font-size has-x-small-font-size"
                     style="letter-spacing:1.2px;text-transform:uppercase">
                    <a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Sign Up', 'plover' ); ?></a>
                </div>
                <!-- /wp:button --></div>
            <!-- /wp:buttons --></div>
        <!-- /wp:group --></div>
    <!-- /wp:group -->

    <!-- wp:group {"align":"full","gradient":"cool-to-warm-spectrum","layout":{"type":"constrained"},"ploverBlockID":"2bf1dbc1-5c1e-49b9-8e7a-9cdd7a689431"} -->
    <div class="wp-block-group alignfull has-cool-to-warm-spectrum-gradient-background has-background">
        <!-- wp:spacer {"height":"4px","ploverBlockID":"a26bc055-399f-4c76-8e7a-09ee73e5c55e"} -->
        <div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer --></div>
    <!-- /wp:group --></div>
<!-- /wp:group -->

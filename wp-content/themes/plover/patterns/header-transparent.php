<?php
/**
 * Title: Transparent Header
 * Slug: plover/header-transparent
 * Categories: header, plover
 * Block Types: core/template-part/header
 */
?>
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|x-small","bottom":"var:preset|spacing|x-small"},"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"constrained"},"ploverBlockID":"8d24bf6a-e97a-4e6f-821b-7332613b3ef8","stickyBlock":"no","stickyZIndex":99,"stickyContainer":"document"} -->
<div class="wp-block-group alignwide"
     style="padding-top:var(--wp--preset--spacing--x-small);padding-bottom:var(--wp--preset--spacing--x-small)">
    <!-- wp:group {"align":"wide","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"},"ploverBlockID":"4d373cc0-1443-4c33-b90a-7184cd9d86c0"} -->
    <div class="wp-block-group alignwide">
        <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"},"layout":{"selfStretch":"fit","flexSize":null}},"layout":{"type":"flex"},"ploverBlockID":"85ccaab9-d76a-45e8-b865-58ce0fac8ec3"} -->
        <div class="wp-block-group">
            <!-- wp:site-logo {"width":60,"shouldSyncIcon":true,"ploverBlockID":"1a7b5aba-51d3-49dd-9e69-07e9d0ebd40a"} /-->

            <!-- wp:group {"style":{"spacing":{"blockGap":"0px"}},"ploverBlockID":"d4d473bd-689c-4a91-9cff-0cfe2330e492"} -->
            <div class="wp-block-group">
                <!-- wp:site-title {"level":0,"style":{"typography":{"textTransform":"uppercase","textDecoration":"none"}},"ploverBlockID":"27bb37c1-2588-440f-b935-4b06984a6d67"} /-->

                <!-- wp:site-tagline {"ploverBlockID":"09b043d4-c53e-485c-8345-fa50cda27880"} /--></div>
            <!-- /wp:group --></div>
        <!-- /wp:group -->

        <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"},"ploverBlockID":"911259b6-e7f6-4f67-b897-8edf43afa696"} -->
        <div class="wp-block-group">
            <!-- wp:navigation {"icon":"menu","layout":{"type":"flex","justifyContent":"right","orientation":"horizontal"},"style":{"spacing":{"margin":{"top":"0"},"blockGap":"var:preset|spacing|x-small"},"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"ce28004f-6ead-4235-a5d2-0e771f2a1169","cssOrder":{"desktop":"","tablet":1,"mobile":"__INITIAL_VALUE__"}} /-->

            <!-- wp:pattern {"slug":"plover/dark-mode-toggle"} /-->

            <!-- wp:buttons {"ploverBlockID":"b2ed98c6-99f4-435e-8e0b-d00cb8512de6","cssDisplay":{"desktop":"","tablet":"none","mobile":"__INITIAL_VALUE__"}} -->
            <div class="wp-block-buttons">
                <!-- wp:button {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.2px"}},"className":"is-style-ghost","fontSize":"x-small","ploverBlockID":"6ea886d6-bb20-47c5-8373-88bfc9b55c94"} -->
                <div class="wp-block-button has-custom-font-size is-style-ghost has-x-small-font-size"
                     style="letter-spacing:1.2px;text-transform:uppercase"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Log In', 'plover' ); ?></a></div>
                <!-- /wp:button -->

                <!-- wp:button {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.2px"}},"fontSize":"x-small","ploverBlockID":"3adeb481-084d-442e-a31c-8c61c4c6741c"} -->
                <div class="wp-block-button has-custom-font-size has-x-small-font-size"
                     style="letter-spacing:1.2px;text-transform:uppercase">
                    <a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Sign Up', 'plover' ); ?></a>
                </div>
                <!-- /wp:button -->
            </div>
            <!-- /wp:buttons --></div>
        <!-- /wp:group --></div>
    <!-- /wp:group --></div>
<!-- /wp:group -->

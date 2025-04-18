<?php
/**
 * Title: Light Header
 * Slug: plover/header-light
 * Categories: header, plover
 * Block Types: core/template-part/header
 */
?>
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|x-small","bottom":"0px"},"blockGap":"var:preset|spacing|x-small"}},"backgroundColor":"neutral-0","layout":{"type":"constrained"},"ploverBlockID":"57d4aece-1171-4beb-b30b-a06c9eeab6f4","stickyBlock":"no","stickyZIndex":99,"stickyContainer":"document"} -->
<div class="wp-block-group alignwide has-neutral-0-background-color has-background"
     style="padding-top:var(--wp--preset--spacing--x-small);padding-bottom:0px">
    <!-- wp:group {"align":"wide","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"},"ploverBlockID":"aa72db15-44b6-4c13-8122-59cd559f5018"} -->
    <div class="wp-block-group alignwide">
        <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|x-small"},"layout":{"selfStretch":"fit","flexSize":null}},"layout":{"type":"flex"},"ploverBlockID":"c33df657-8188-4b0b-a49f-af2fb337cac6"} -->
        <div class="wp-block-group">
            <!-- wp:site-logo {"width":60,"shouldSyncIcon":true,"ploverBlockID":"e15eed00-9a16-4ee0-86dd-10175cba1806"} /-->

            <!-- wp:group {"style":{"spacing":{"blockGap":"0px"}},"ploverBlockID":"8e692ebe-b232-490b-90d4-43ef6b52bff3"} -->
            <div class="wp-block-group">
                <!-- wp:site-title {"level":0,"style":{"typography":{"textTransform":"uppercase","textDecoration":"none"}},"ploverBlockID":"343e01de-99f7-4661-9d40-5dba7d8aa275"} /-->

                <!-- wp:site-tagline {"ploverBlockID":"a14bf842-69f8-44a2-8f3a-b5fc877dc5ae"} /--></div>
            <!-- /wp:group --></div>
        <!-- /wp:group -->

        <!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|2-x-small"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"left"},"ploverBlockID":"59996d8f-cd1d-4963-b407-3f0cd1c6c335"} -->
        <div class="wp-block-group">
            <!-- wp:navigation {"icon":"menu","layout":{"type":"flex","justifyContent":"right","orientation":"horizontal"},"style":{"spacing":{"margin":{"top":"0"},"blockGap":"var:preset|spacing|x-small"},"layout":{"selfStretch":"fit","flexSize":null}},"ploverBlockID":"80c31023-9a66-454d-8f02-b7126b834d0a","cssOrder":{"desktop":"","tablet":1,"mobile":"__INITIAL_VALUE__"}} /-->

            <!-- wp:pattern {"slug":"plover/dark-mode-toggle"} /-->

            <!-- wp:buttons {"ploverBlockID":"0c8fe95a-e9ce-4eae-9428-23c51d90ee11","cssDisplay":{"desktop":"","tablet":"none","mobile":"__INITIAL_VALUE__"}} -->
            <div class="wp-block-buttons">
                <!-- wp:button {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.2px"}},"className":"is-style-ghost","fontSize":"x-small","ploverBlockID":"6e6f3485-eb4a-4086-81e5-2de52a1df804"} -->
                <div class="wp-block-button has-custom-font-size is-style-ghost has-x-small-font-size"
                     style="letter-spacing:1.2px;text-transform:uppercase"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Log In', 'plover' ); ?></a></div>
                <!-- /wp:button -->

                <!-- wp:button {"style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.2px"}},"fontSize":"x-small","ploverBlockID":"206b6d7a-7dc5-4978-80ae-d3dcd6831610"} -->
                <div class="wp-block-button has-custom-font-size has-x-small-font-size"
                     style="letter-spacing:1.2px;text-transform:uppercase">
                    <a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Sign Up', 'plover' ); ?></a>
                </div>
                <!-- /wp:button --></div>
            <!-- /wp:buttons --></div>
        <!-- /wp:group --></div>
    <!-- /wp:group -->

    <!-- wp:group {"align":"full","gradient":"cool-to-warm-spectrum","layout":{"type":"constrained"},"ploverBlockID":"b65bddbc-e98d-427a-bf4f-493e12300e08"} -->
    <div class="wp-block-group alignfull has-cool-to-warm-spectrum-gradient-background has-background">
        <!-- wp:spacer {"height":"4px","ploverBlockID":"69f346eb-f8f2-4399-a66a-6e363af21d48"} -->
        <div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer --></div>
    <!-- /wp:group --></div>
<!-- /wp:group -->

<?php
/**
 * Title: Header
 * Slug: biralo/header
 * Categories: header
 */
?>

<!-- wp:cover {"url":"<?php echo esc_url( get_template_directory_uri() ) . '/assets/images/header-image.jpg'; ?>","dimRatio":50,"customOverlayColor":"#000000","layout":{"type":"constrained"}} -->
<div class="wp-block-cover"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"
        style="background-color:#000000"></span><img class="wp-block-cover__image-background" alt=""
        src="<?php echo esc_url( get_template_directory_uri() ) . '/assets/images/header-image.jpg'; ?>"
        data-object-fit="cover" />
    <div class="wp-block-cover__inner-container"><!-- wp:group {"layout":{"type":"default"}} -->
        <div class="wp-block-group">
            <!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"8em","top":"8em","left":"0px","right":"0px"},"blockGap":"40px"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} -->
            <div class="wp-block-group alignwide"
                style="padding-top:8em;padding-right:0px;padding-bottom:8em;padding-left:0px">
                <!-- wp:group {"style":{"spacing":{"blockGap":"0"}}} -->
                <div class="wp-block-group"><!-- wp:site-logo {"width":100,"align":"center"} /-->

                    <!-- wp:site-title /-->
                </div>
                <!-- /wp:group -->

                <!-- wp:group {"style":{"spacing":{"blockGap":"10px"}},"layout":{"type":"flex","flexWrap":"nowrap"}} -->
                <div class="wp-block-group">
                    <!-- wp:navigation {"icon":"menu","layout":{"type":"flex","justifyContent":"right"},"style":{"spacing":{"blockGap":"24px"}}} -->
                    <!-- wp:navigation-link {"label":"Home","url":"#","kind":"custom","isTopLevelLink":true} /-->

                    <!-- wp:navigation-link {"label":"About","url":"#","kind":"custom","isTopLevelLink":true} /-->

                    <!-- wp:navigation-link {"label":"Blog","url":"#","kind":"custom","isTopLevelLink":true} /-->

                    <!-- wp:navigation-link {"label":"Contact","url":"#","kind":"custom","isTopLevelLink":true} /-->
                    <!-- /wp:navigation -->
                </div>
                <!-- /wp:group -->
            </div>
            <!-- /wp:group -->
        </div>
        <!-- /wp:group -->
    </div>
</div>
<!-- /wp:cover -->
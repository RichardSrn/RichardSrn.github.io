<?php
/**
 * Title: Big Hero Header, Dark
 * Slug: plover/big-hero-header-dark
 * Categories: plover, header
 * Block Types: core/template-part/header
 */
?>
<!-- wp:group {"metadata":{"name":"Plover: Big Hero Header, Dark"},"ploverBlockID":"405ad874-88ed-4615-b9a8-20e90cfdf0d3","className":"is-style-dark","style":{"spacing":{"blockGap":"var:preset|spacing|large"},"background":{"backgroundImage":{"url":"<?php the_plover_asset_url( 'images/big-hero-background.png' ) ?>","source":"file"}},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-0","textColor":"neutral-950","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-dark has-neutral-950-color has-neutral-0-background-color has-text-color has-background has-link-color">
    <!-- wp:template-part {"slug":"header-transparent","tagName":"header","area":"header","align":"full"} /-->

    <!-- wp:spacer {"height":"48px","ploverBlockID":"5c480ee4-0289-47d0-9e1d-246567ae8a2c"} -->
    <div style="height:48px" aria-hidden="true" class="wp-block-spacer"></div>
    <!-- /wp:spacer -->

    <!-- wp:heading {"textAlign":"center","level":1,"ploverBlockID":"99468279-6321-4ab6-ab5c-5f986ec427fe","style":{"typography":{"lineHeight":"1.25","textTransform":"capitalize","fontSize":"3.5rem"}}} -->
    <h1 class="wp-block-heading has-text-align-center"
        style="font-size:3.5rem;line-height:1.25;text-transform:capitalize">
		<?php esc_html_e( 'Create Beautiful and Awesome website Today', 'plover' ); ?>
    </h1>
    <!-- /wp:heading -->

    <!-- wp:buttons {"ploverBlockID":"237efa2e-73ee-4d7a-a091-35bac16decbd","layout":{"type":"flex","justifyContent":"center"}} -->
    <div class="wp-block-buttons">
        <!-- wp:button {"ploverBlockID":"0bcd937b-806c-4df3-9b52-35f7ce8dc546","style":{"typography":{"textTransform":"uppercase","letterSpacing":"1px"}},"iconLibrary":"plover-core","iconSlug":"arrow-right","iconSvgString":"\u003csvg xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 24 24\u0022 fill=\u0022none\u0022 stroke=\u0022currentColor\u0022 stroke-width=\u00222\u0022 stroke-linecap=\u0022round\u0022 stroke-linejoin=\u0022round\u0022\u003e\u003cline x1=\u00225\u0022 y1=\u002212\u0022 x2=\u002219\u0022 y2=\u002212\u0022\u003e\u003c/line\u003e\u003cpolyline points=\u002212 5 19 12 12 19\u0022\u003e\u003c/polyline\u003e\u003c/svg\u003e"} -->
        <div class="wp-block-button" style="letter-spacing:1px;text-transform:uppercase"><a
                    class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Get Started Today', 'plover' ); ?></a>
        </div>
        <!-- /wp:button -->
    </div>
    <!-- /wp:buttons -->

    <!-- wp:spacer {"height":"124px","ploverBlockID":"77eaf37a-bac7-4ad2-bb7a-42108b52ac22"} -->
    <div style="height:124px" aria-hidden="true" class="wp-block-spacer"></div>
    <!-- /wp:spacer -->

    <!-- wp:group {"ploverBlockID":"9040df91-c04d-4bb1-a8a8-87057b027869","align":"full","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}},"gradient":"primary","layout":{"type":"constrained"},"stickyBlock":"no","stickyOffsetTop":92,"stickyContainer":".wp-site-blocks"} -->
    <div class="wp-block-group alignfull has-primary-gradient-background has-background"
         style="margin-top:0;margin-bottom:0">
        <!-- wp:spacer {"height":"4px","ploverBlockID":"35c8f751-dbe8-4b8e-83ee-0739edb8e94a"} -->
        <div style="height:4px" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer --></div>
    <!-- /wp:group -->
</div>
<!-- /wp:group -->

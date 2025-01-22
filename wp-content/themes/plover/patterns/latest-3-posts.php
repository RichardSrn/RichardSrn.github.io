<?php
/**
 * Title: Latest 3 posts
 * Slug: plover/latest-3-posts
 * Categories: query, plover
 * Block Types: core/query
 */
?>
<!-- wp:group {"metadata":{"name":"Plover: Latest 3 posts"},"ploverBlockID":"9ad9b53e-84d5-4692-abf6-d49b9548403c","align":"full","className":"is-style-dark","style":{"spacing":{"padding":{"top":"var:preset|spacing|2-x-large","bottom":"var:preset|spacing|2-x-large"},"margin":{"top":"0","bottom":"0"}},"elements":{"link":{"color":{"text":"var:preset|color|neutral-950"}}}},"backgroundColor":"neutral-200","textColor":"neutral-950","layout":{"type":"constrained","justifyContent":"center"}} -->
<div class="wp-block-group alignfull is-style-dark has-neutral-950-color has-neutral-200-background-color has-text-color has-background has-link-color"
	style="margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--2-x-large);padding-bottom:var(--wp--preset--spacing--2-x-large)">
    <!-- wp:heading {"textAlign":"center","level":1,"ploverBlockID":"3aad0d6f-9ea2-4e10-a9c8-a63025f7e32f","style":{"typography":{"lineHeight":"1"}}} -->
    <h1 class="wp-block-heading has-text-align-center" style="line-height:1">
		<?php esc_html_e( 'Latest Posts', 'plover' ); ?>
    </h1>
    <!-- /wp:heading -->

    <!-- wp:query {"queryId":1,"query":{"perPage":"3","pages":0,"offset":"0","postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"ploverBlockID":"8f2d5d97-4c98-41ac-8cc2-804f05716e04","align":"wide","layout":{"type":"default"}} -->
    <div class="wp-block-query alignwide">
        <!-- wp:query-no-results {"ploverBlockID":"99fcf8c8-acea-425e-964a-7c7b675161fd"} -->
        <!-- wp:paragraph {"align":"center","ploverBlockID":"7bcf29ba-a2a9-4443-9080-bb3d0f6b757d","style":{"spacing":{"padding":{"top":"var:preset|spacing|large","bottom":"var:preset|spacing|large"}}}} -->
        <p class="has-text-align-center"
           style="padding-top:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--large)">
			<?php esc_html_e( 'No posts were found.', 'plover' ); ?>
        </p>
        <!-- /wp:paragraph -->
        <!-- /wp:query-no-results -->

        <!-- wp:group {"ploverBlockID":"8f010cf5-497d-4be3-82dd-626a76160dc1","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"0","right":"0"},"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"default"}} -->
        <div class="wp-block-group"
             style="margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--50);padding-right:0;padding-bottom:var(--wp--preset--spacing--50);padding-left:0">
            <!-- wp:post-template {"ploverBlockID":"923e03dd-0747-4277-8200-bea137de8a98","align":"full","style":{"spacing":{"blockGap":"var:preset|spacing|medium"}},"layout":{"type":"grid","columnCount":3}} -->
            <!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","ploverBlockID":"029eae52-910a-418d-8f99-5638a7c8e347"} /-->
            <!-- wp:group {"ploverBlockID":"015cedc6-44c0-429d-a568-f0de0bb3a116","style":{"spacing":{"blockGap":"10px","margin":{"top":"var:preset|spacing|20"},"padding":{"top":"0"}}},"layout":{"type":"flex","orientation":"vertical","flexWrap":"nowrap"}} -->
            <div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--20);padding-top:0">
                <!-- wp:spacer {"height":"0px","ploverBlockID":"0db0024f-18c2-40d7-8b04-5555c7fc6f6b","style":{"layout":{"flexSize":"1em","selfStretch":"fixed"}}} -->
                <div style="height:0px" aria-hidden="true" class="wp-block-spacer"></div>
                <!-- /wp:spacer -->

                <!-- wp:post-title {"isLink":true,"ploverBlockID":"e368b86c-8517-4e39-89d3-2a841f6aa231","style":{"layout":{"flexSize":"min(2.5rem, 3vw)","selfStretch":"fixed"}},"fontSize":"3-x-large"} /-->

                <!-- wp:template-part {"slug":"post-meta-simpler"} /-->

                <!-- wp:post-excerpt {"excerptLength":24,"ploverBlockID":"4f2c37eb-40e5-4e86-b69e-6d955249f9a2","style":{"layout":{"flexSize":"min(2.5rem, 3vw)","selfStretch":"fixed"}},"textColor":"contrast-2","fontSize":"small"} /-->

                <!-- wp:spacer {"height":"0px","ploverBlockID":"86c47175-ff61-437b-a1fe-614bd62065b2","style":{"layout":{"flexSize":"1em","selfStretch":"fixed"}}} -->
                <div style="height:0px" aria-hidden="true" class="wp-block-spacer"></div>
                <!-- /wp:spacer --></div>
            <!-- /wp:group -->
            <!-- /wp:post-template -->
        </div>
        <!-- /wp:group -->
    </div>
    <!-- /wp:query -->
</div>
<!-- /wp:group -->

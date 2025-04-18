<?php
/**
 * Title: Sidebar
 * Slug: plover/hidden-sidebar
 * Inserter: no
 */
?>
<!-- wp:group {"ploverBlockID":"dfee58b8-b2e1-46e4-ba69-9e39b2f0fe3c","style":{"spacing":{"blockGap":"var:preset|spacing|medium","padding":{"right":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group" style="padding-right:0;padding-left:0">
    <!-- wp:group {"ploverBlockID":"269eea7d-ae0c-45a1-9b99-d773a06411ae","style":{"spacing":{"blockGap":"var:preset|spacing|small","padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"1rem"}},"backgroundColor":"neutral-200","layout":{"type":"default"}} -->
    <div class="wp-block-group has-neutral-200-background-color has-background"
         style="border-radius:1rem;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)">
        <!-- wp:heading {"ploverBlockID":"86277bee-bfc0-46fb-9243-376851fb5d51","level":3,"fontSize":"2-x-large"} -->
        <h3 class="wp-block-heading has-2-x-large-font-size">
			<?php esc_html_e( 'Search this site', 'plover' ); ?>
        </h3>
        <!-- /wp:heading -->

        <!-- wp:search {"ploverBlockID":"aa4eaa63-f7bc-4620-a36c-8fb87ef2ba62","label":"<?php esc_html_e( 'Search', 'plover' ); ?>","showLabel":false,"placeholder":"<?php esc_html_e( 'Search...', 'plover' ); ?>","width":100,"widthUnit":"%","buttonText":"Search","buttonPosition":"button-inside","buttonUseIcon":true,"style":{"border":{"color":"#72727a29","width":"2px"}},"ploverBlockID":"a7471021-71b2-48f3-9338-cd78b8ea2f09"} /-->
    </div>
    <!-- /wp:group -->

    <!-- wp:group {"ploverBlockID":"5013f61d-08f3-422a-b876-133d3a716117","style":{"spacing":{"blockGap":"var:preset|spacing|small","padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"1rem"}},"backgroundColor":"neutral-200","layout":{"type":"default"}} -->
    <div class="wp-block-group has-neutral-200-background-color has-background"
         style="border-radius:1rem;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)">
        <!-- wp:heading {"ploverBlockID":"cab447c7-67d7-409f-a690-ff4775018a1d","level":3,"fontSize":"2-x-large"} -->
        <h3 class="wp-block-heading has-2-x-large-font-size">
			<?php esc_html_e( 'Popular Categories', 'plover' ); ?>
        </h3>
        <!-- /wp:heading -->

        <!-- wp:categories {"ploverBlockID":"6cf0fff5-c9cc-46a9-9cec-7614d6c2b370","showHierarchy":true,"showPostCounts":true,"style":{"border":{"width":"2px","color":"#e4e4e7"}}} /-->
    </div>
    <!-- /wp:group -->

    <!-- wp:group {"ploverBlockID":"1f4dea96-1728-4034-b8e0-26f4852ff071","style":{"spacing":{"blockGap":"var:preset|spacing|small","padding":{"top":"var:preset|spacing|medium","bottom":"var:preset|spacing|medium","left":"var:preset|spacing|medium","right":"var:preset|spacing|medium"}},"border":{"radius":"1rem"}},"backgroundColor":"neutral-200","layout":{"type":"default"}} -->
    <div class="wp-block-group has-neutral-200-background-color has-background"
         style="border-radius:1rem;padding-top:var(--wp--preset--spacing--medium);padding-right:var(--wp--preset--spacing--medium);padding-bottom:var(--wp--preset--spacing--medium);padding-left:var(--wp--preset--spacing--medium)">
        <!-- wp:heading {"ploverBlockID":"4d8f3838-e155-44be-b06b-72954892919b","level":3,"fontSize":"2-x-large"} -->
        <h3 class="wp-block-heading has-2-x-large-font-size">
			<?php esc_html_e( 'Latest Posts', 'plover' ); ?>
        </h3>
        <!-- /wp:heading -->

        <!-- wp:latest-posts {"ploverBlockID":"c6399ab1-be4b-4e90-9ed4-5cceadb3f732","displayPostDate":true,"featuredImageAlign":"left","featuredImageSizeWidth":36,"featuredImageSizeHeight":36} /-->
    </div>
    <!-- /wp:group --></div>
<!-- /wp:group -->
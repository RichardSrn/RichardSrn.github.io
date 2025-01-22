<?php
/**
 * Title: Post meta
 * Slug: plover/hidden-post-meta
 * Inserter: no
 */
?>

<!-- wp:group {"ploverBlockID":"4ae1bf9a-0616-47ed-830f-f73cb708262b","style":{"spacing":{"blockGap":"0.3em","padding":{"top":"var:preset|spacing|2-x-small","bottom":"var:preset|spacing|2-x-small"}}},"layout":{"type":"flex","justifyContent":"left"}} -->
<div class="wp-block-group"
     style="padding-top:var(--wp--preset--spacing--2-x-small);padding-bottom:var(--wp--preset--spacing--2-x-small)">
    <!-- wp:post-author {"showBio":true,"isLink":true,"ploverBlockID":"38ec6cc5-6068-4cb9-b40e-a1cbed9120e4"} /-->

	<?php if ( ! empty( wp_get_post_categories() ) ): ?>
        <!-- wp:paragraph {"ploverBlockID":"03e3f03b-768f-4410-a34a-631b943d63db","style":{"spacing":{"padding":{"right":"var:preset|spacing|2-x-small","left":"var:preset|spacing|2-x-small"}},"typography":{"lineHeight":"1"}},"fontSize":"2-x-large"} -->
        <p class="has-2-x-large-font-size"
           style="padding-right:var(--wp--preset--spacing--2-x-small);padding-left:var(--wp--preset--spacing--2-x-small);line-height:1"
        >·</p>
        <!-- /wp:paragraph -->

        <!-- wp:post-terms {"term":"category","ploverBlockID":"06247998-b933-4c6e-a708-9b84c6839964"} /-->
	<?php endif; ?>

    <!-- wp:paragraph {"ploverBlockID":"7d174b9d-fc26-4277-af07-a0c376ed8b80","style":{"spacing":{"padding":{"right":"var:preset|spacing|2-x-small","left":"var:preset|spacing|2-x-small"}},"typography":{"lineHeight":"1"}},"fontSize":"2-x-large"} -->
    <p class="has-2-x-large-font-size"
       style="padding-right:var(--wp--preset--spacing--2-x-small);padding-left:var(--wp--preset--spacing--2-x-small);line-height:1">
        ·</p>
    <!-- /wp:paragraph -->

    <!-- wp:post-date {"isLink":true,"ploverBlockID":"31935db0-cdc4-4ce9-b6ff-b457fdfc0fb4"} /--></div>
<!-- /wp:group -->

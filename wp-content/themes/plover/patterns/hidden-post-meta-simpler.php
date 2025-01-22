<?php
/**
 * Title: Post meta simpler
 * Slug: plover/hidden-post-meta-simpler
 * Inserter: no
 */
?>

<!-- wp:group {"ploverBlockID":"82488089-682c-4df3-b23c-a5bf1d419a6b","style":{"spacing":{"blockGap":"0.3em","padding":{"top":"var:preset|spacing|2-x-small","bottom":"var:preset|spacing|2-x-small"}}},"layout":{"type":"flex","justifyContent":"left"},"fontSize":"small"} -->
<div class="wp-block-group has-small-font-size"
     style="padding-top:var(--wp--preset--spacing--2-x-small);padding-bottom:var(--wp--preset--spacing--2-x-small)">
    <!-- wp:post-date {"ploverBlockID":"21ddaee4-eda4-4566-a13b-4e312b532739","format":null,"isLink":true} /-->

	<?php if ( ! empty( wp_get_post_categories() ) ): ?>
        <!-- wp:paragraph {"ploverBlockID":"335e04b6-b545-47d0-bc12-89e997f61c1f","style":{"spacing":{"padding":{"right":"var:preset|spacing|2-x-small","left":"var:preset|spacing|2-x-small"}},"typography":{"lineHeight":"1"}},"fontSize":"2-x-large"} -->
        <p class="has-2-x-large-font-size"
           style="padding-right:var(--wp--preset--spacing--2-x-small);padding-left:var(--wp--preset--spacing--2-x-small);line-height:1"
        >·</p>
        <!-- /wp:paragraph -->

        <!-- wp:post-terms {"ploverBlockID":"d4945e9b-6d97-44c7-87f2-8eec10300e92","term":"category"} /-->
	<?php endif; ?>
</div>
<!-- /wp:group -->

<?php
/**
 * Title: Comments
 * Slug: plover/hidden-comments
 * Inserter: no
 */
?>

<!-- wp:group {"ploverBlockID":"8df40818-e737-4499-b42b-3bc96b37409c","layout":{"type":"default"}} -->
<div class="wp-block-group">

	<?php if ( function_exists( 'comments_open' ) && comments_open() ): ?>
        <!-- wp:separator {"ploverBlockID":"dda9a9d0-8bff-4237-9fa9-87397676550d","style":{"spacing":{"margin":{"top":"var:preset|spacing|large","bottom":"var:preset|spacing|large"}}},"backgroundColor":"contrast-3","className":"is-style-dashed"} -->
        <hr class="wp-block-separator has-text-color has-contrast-3-color has-alpha-channel-opacity has-contrast-3-background-color has-background is-style-dashed"
            style="margin-top:var(--wp--preset--spacing--large);margin-bottom:var(--wp--preset--spacing--large)"/>
        <!-- /wp:separator -->
	<?php endif; ?>

    <!-- wp:post-comments-form {"ploverBlockID":"e95bf810-ec0e-4770-a792-37cc61dce744","style":{"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20"}}}} /-->

    <!-- wp:comments {"ploverBlockID":"bf3f0cd9-2982-4d8f-8230-98391a43d30a","className":"wp-block-comments-query-loop"} -->
    <div class="wp-block-comments wp-block-comments-query-loop">
        <!-- wp:comments-title {"level":3,"ploverBlockID":"b45151b6-858d-4823-a8a5-ae0f1e5be3db","style":{"typography":{"textTransform":"none"}}} /-->

        <!-- wp:comment-template {"ploverBlockID":"f06bc907-e0fc-45bb-ba8a-1ff7e645ec13"} -->
        <!-- wp:group {"ploverBlockID":"04ca7509-151d-4fac-af69-e70ce0f1f41f","style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"top"}} -->
        <div class="wp-block-group">
            <!-- wp:avatar {"size":48,"ploverBlockID":"1150e9f6-7e3b-46e8-a756-015d732db606","style":{"border":{"radius":"100px"}}} /-->

            <!-- wp:group {"ploverBlockID":"f7fdfbb9-986e-4303-96c1-7d4e78d0d749","style":{"spacing":{"blockGap":"var:preset|spacing|x-small"}}} -->
            <div class="wp-block-group">
                <!-- wp:group {"ploverBlockID":"d181cae4-6968-46d4-b852-2670e51bf76e","style":{"spacing":{"blockGap":"0"}}} -->
                <div class="wp-block-group">
                    <!-- wp:comment-author-name {"ploverBlockID":"720bea21-bdb4-4f3e-bc70-01f95985284d","style":{"typography":{"textTransform":"capitalize"}}} /-->

                    <!-- wp:comment-date {"ploverBlockID":"5c83d49a-085e-41aa-8c5b-1d2f356d6a30"} /--></div>
                <!-- /wp:group -->

                <!-- wp:comment-content {"ploverBlockID":"7a1969d1-a8fe-4fef-88d1-7833d8cd772f"} /-->

                <!-- wp:group {"ploverBlockID":"05fdaed9-b080-4b90-a19f-e9733dc15b0a","layout":{"type":"flex","flexWrap":"nowrap"}} -->
                <div class="wp-block-group">
                    <!-- wp:comment-edit-link {"ploverBlockID":"df5a2fc4-6504-46d2-84d4-d7ef4c346440"} /-->

                    <!-- wp:comment-reply-link {"ploverBlockID":"98c7287c-5dfe-4e24-95b8-85b163cb997a"} /--></div>
                <!-- /wp:group --></div>
            <!-- /wp:group --></div>
        <!-- /wp:group -->

        <!-- wp:spacer {"height":"var:preset|spacing|medium","ploverBlockID":"b76e4a9c-124a-411a-9f8b-ca36b84a8a33"} -->
        <div style="height:var(--wp--preset--spacing--medium)" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer -->
        <!-- /wp:comment-template -->

        <!-- wp:spacer {"height":"var:preset|spacing|small","ploverBlockID":"6d28a769-93b9-4e1e-8e70-a6a59b0fe180"} -->
        <div style="height:var(--wp--preset--spacing--small)" aria-hidden="true" class="wp-block-spacer"></div>
        <!-- /wp:spacer -->

        <!-- wp:comments-pagination {"paginationArrow":"arrow","ploverBlockID":"8d6c70e6-4311-4b03-b0da-6b576e1cb1a1","fontSize":"base","layout":{"type":"flex","justifyContent":"space-between"}} -->
        <!-- wp:comments-pagination-previous {"ploverBlockID":"3f271aa8-61b6-498d-adaa-82f10f56463b"} /-->

        <!-- wp:comments-pagination-next {"ploverBlockID":"30da1c95-825d-4e40-b6cf-eb13c8f7f5fb"} /-->
        <!-- /wp:comments-pagination --></div>
    <!-- /wp:comments --></div>
<!-- /wp:group -->

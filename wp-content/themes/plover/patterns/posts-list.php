<?php
/**
 * Title: List of posts, 1 columns
 * Slug: plover/posts-list
 * Categories: query, plover
 * Block Types: core/query
 */
?>
<!-- wp:query {"queryId":3,"query":{"perPage":10,"pages":0,"offset":"0","postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"metadata":{"name":"Plover: List of posts, 1 columns"},"ploverBlockID":"ced05454-6b8d-43ad-a56c-8c5d9438f51d","align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-query alignwide">
	<!-- wp:query-no-results {"ploverBlockID":"6a908439-aab6-4145-999f-70f685f5a996"} -->
	<!-- wp:paragraph {"align":"center","ploverBlockID":"effa3c17-f655-4cef-9edf-03cf26b6477d","style":{"spacing":{"padding":{"top":"var:preset|spacing|large","bottom":"var:preset|spacing|large"}}}} -->
	<p class="has-text-align-center"
		style="padding-top:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--large)">
		<?php esc_html_e( 'No posts were found.', 'plover' ); ?>
	</p>
	<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->

	<!-- wp:group {"ploverBlockID":"7b06ed26-82db-40ce-89ce-06879212c2a2","style":{"spacing":{"padding":{"left":"0","right":"0"},"margin":{"top":"0","bottom":"0"},"blockGap":"0"}},"layout":{"type":"default"}} -->
	<div class="wp-block-group" style="margin-top:0;margin-bottom:0;padding-right:0;padding-left:0">
		<!-- wp:post-template {"ploverBlockID":"8136b202-f251-49b3-9aad-4d6b245b4d5e","align":"full","style":{"spacing":{"blockGap":"0"}},"layout":{"type":"default","columnCount":3}} -->
		<!-- wp:group {"ploverBlockID":"508c22ee-c912-4175-a8e4-e969994a95e4","style":{"spacing":{"blockGap":"var:preset|spacing|small","margin":{"top":"var:preset|spacing|20"},"padding":{"top":"0"}}},"layout":{"type":"default"}} -->
		<div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--20);padding-top:0">
			<!-- wp:post-title {"isLink":true,"ploverBlockID":"4225f946-7913-46c1-ba87-0b9291909e7b","style":{"layout":{"flexSize":"min(2.5rem, 3vw)","selfStretch":"fixed"}}} /-->

			<!-- wp:template-part {"slug":"post-meta"} /-->

			<!-- wp:post-featured-image {"ploverBlockID":"1afdd72b-2e19-4dd7-83b6-f38e19236359"} /-->

			<!-- wp:post-excerpt {"ploverBlockID":"7c2bef76-9820-4af5-b5fa-52aec6be85ee","style":{"layout":{"flexSize":"min(2.5rem, 3vw)","selfStretch":"fixed"}},"textColor":"contrast-2"} /-->

			<!-- wp:spacer {"height":"var:preset|spacing|x-large","ploverBlockID":"833f50b6-6004-4b46-8e4d-16ec33dda1e4"} -->
			<div style="height:var(--wp--preset--spacing--x-large)" aria-hidden="true" class="wp-block-spacer"></div>
			<!-- /wp:spacer -->
		</div>
		<!-- /wp:group -->
		<!-- /wp:post-template -->

		<!-- wp:spacer {"height":"var:preset|spacing|40","ploverBlockID":"f8fca6bc-735d-43ef-8c53-90acf362a07d","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
		<div style="margin-top:0;margin-bottom:0;height:var(--wp--preset--spacing--40)" aria-hidden="true"
			class="wp-block-spacer"></div>
		<!-- /wp:spacer -->

		<!-- wp:query-pagination {"paginationArrow":"arrow","ploverBlockID":"cfd723cf-264f-4f08-bc35-9f15cdca953d","layout":{"type":"flex","justifyContent":"space-between"}} -->
		<!-- wp:query-pagination-previous {"ploverBlockID":"b6bcc1be-dab7-4e8f-99cd-b951c9e85497"} /-->

		<!-- wp:query-pagination-numbers {"ploverBlockID":"dca4a0c6-0d4a-40c2-bc9c-3a890512ab44"} /-->

		<!-- wp:query-pagination-next {"ploverBlockID":"b7904b92-cc41-4113-807e-5d690e6eabf9"} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->

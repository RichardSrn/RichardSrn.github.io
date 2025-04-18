<?php
/**
 * Title: Grid of posts, 2 columns
 * Slug: plover/posts-grid-2-col
 * Categories: query, plover
 * Block Types: core/query
 */
?>

<!-- wp:query {"queryId":1,"query":{"perPage":10,"pages":0,"offset":"0","postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false},"metadata":{"name":"Plover: Grid of posts, 2 columns"},"ploverBlockID":"dfa24247-4313-4a73-8614-41f0747f8d76","align":"wide","layout":{"type":"default"}} -->
<div class="wp-block-query alignwide">
	<!-- wp:query-no-results {"ploverBlockID":"2b556241-4290-4c17-b656-7bb0f45c4650"} -->
	<!-- wp:paragraph {"align":"center","ploverBlockID":"ea20f268-5d18-4996-8218-28a4597cb6ed","style":{"spacing":{"padding":{"top":"var:preset|spacing|large","bottom":"var:preset|spacing|large"}}}} -->
	<p class="has-text-align-center"
		style="padding-top:var(--wp--preset--spacing--large);padding-bottom:var(--wp--preset--spacing--large)">
		<?php esc_html_e('No posts were found.', 'plover'); ?>
	</p>
	<!-- /wp:paragraph -->
	<!-- /wp:query-no-results -->

	<!-- wp:group {"ploverBlockID":"5da5122d-6d1f-4300-b07c-7718be15b75f","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"0","right":"0"},"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"default"}} -->
	<div class="wp-block-group"
		style="margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--50);padding-right:0;padding-bottom:var(--wp--preset--spacing--50);padding-left:0">
		<!-- wp:post-template {"ploverBlockID":"cee4060f-1986-4f74-b420-f766bdc08c1e","align":"full","style":{"spacing":{"blockGap":"var:preset|spacing|medium"}},"layout":{"type":"grid","columnCount":2}} -->
		<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9","ploverBlockID":"48206cb6-c421-4153-9ae3-8cccc45e0801"} /-->

		<!-- wp:group {"ploverBlockID":"42317b17-6e5c-47cf-9871-975a094e044c","style":{"spacing":{"blockGap":"10px","margin":{"top":"var:preset|spacing|20"},"padding":{"top":"0"}}},"layout":{"type":"flex","orientation":"vertical","flexWrap":"nowrap"}} -->
		<div class="wp-block-group" style="margin-top:var(--wp--preset--spacing--20);padding-top:0">
			<!-- wp:spacer {"height":"0px","ploverBlockID":"f6a4e861-ff15-4707-b8a1-cef8958cca35","style":{"layout":{"flexSize":"1em","selfStretch":"fixed"}}} -->
			<div style="height:0px" aria-hidden="true" class="wp-block-spacer"></div>
			<!-- /wp:spacer -->

			<!-- wp:post-title {"isLink":true,"ploverBlockID":"aecb42c3-6a57-4dba-8d60-ab2ad6f7ac91","style":{"layout":{"flexSize":"min(2.5rem, 3vw)","selfStretch":"fixed"}},"fontSize":"3-x-large"} /-->

			<!-- wp:template-part {"slug":"post-meta-simpler"} /-->

			<!-- wp:post-excerpt {"excerptLength":24,"ploverBlockID":"ea50bbac-4c23-4547-8afe-348575cc856c","style":{"layout":{"flexSize":"min(2.5rem, 3vw)","selfStretch":"fixed"}},"textColor":"contrast-2","fontSize":"small"} /-->

			<!-- wp:spacer {"height":"0px","ploverBlockID":"84b37983-f000-4529-a79a-35efa7f64129","style":{"layout":{"flexSize":"1em","selfStretch":"fixed"}}} -->
			<div style="height:0px" aria-hidden="true" class="wp-block-spacer"></div>
			<!-- /wp:spacer -->
		</div>
		<!-- /wp:group -->
		<!-- /wp:post-template -->

		<!-- wp:spacer {"height":"var:preset|spacing|40","ploverBlockID":"5ad98406-8123-4ed4-8e63-cef9bee00f3a","style":{"spacing":{"margin":{"top":"0","bottom":"0"}}}} -->
		<div style="margin-top:0;margin-bottom:0;height:var(--wp--preset--spacing--40)" aria-hidden="true"
			class="wp-block-spacer"></div>
		<!-- /wp:spacer -->

		<!-- wp:query-pagination {"paginationArrow":"arrow","ploverBlockID":"bf9094ab-5637-4191-b3f0-39272cb0bf8a","layout":{"type":"flex","justifyContent":"space-between"}} -->
		<!-- wp:query-pagination-previous {"ploverBlockID":"4b4056bc-f04a-49ec-8285-0b9c4aeed274"} /-->

		<!-- wp:query-pagination-next {"ploverBlockID":"37776d88-a7ff-4f80-b84f-91ca25f73ee1"} /-->
		<!-- /wp:query-pagination -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:query -->
 
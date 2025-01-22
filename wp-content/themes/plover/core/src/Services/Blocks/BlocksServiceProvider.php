<?php

namespace Plover\Core\Services\Blocks;

use Plover\Core\Framework\ServiceProvider;

/**
 * Block repository service provider.
 *
 * @since 1.0.0
 */
class BlocksServiceProvider extends ServiceProvider {

	/**
	 * @var string[]
	 */
	public $singletons = [
		\Plover\Core\Services\Blocks\Blocks::class,
	];

	/**
	 * @var string[]
	 */
	public $aliases = [
		'blocks' => \Plover\Core\Services\Blocks\Blocks::class,
	];

	public function boot() {
		$isWP58OrAbove = version_compare( get_bloginfo( 'version' ), '5.8', '>=' );

		add_filter( 'pre_kses', [ $this, 'pre_kses_block_attributes' ], 11, 3 );
		add_filter( $isWP58OrAbove ? 'block_categories_all' : 'block_categories', array(
			$this,
			'block_categories'
		), PHP_INT_MAX );
	}

	/**
	 * Removes non-allowable HTML from parsed block attributes.
	 *
	 * @param $content
	 * @param $allowed_html
	 * @param $allowed_protocols
	 *
	 * @return string
	 */
	public function pre_kses_block_attributes( $content, $allowed_html, $allowed_protocols ) {
		$result = '';
		$blocks = parse_blocks( $content );

		foreach ( $blocks as $block ) {
			$block  = $this->filter_block_kses( $block, $allowed_html, $allowed_protocols );
			$result .= serialize_block( $block );
		}

		return $result;
	}


	/**
	 * Filters and sanitizes a parsed block to remove non-allowable HTML
	 * from block attribute values.
	 *
	 * @param $block
	 * @param $allowed_html
	 * @param $allowed_protocols
	 *
	 * @return mixed
	 */
	protected function filter_block_kses( $block, $allowed_html, $allowed_protocols ) {
		$block = apply_filters( 'plover_core_filter_block_kses', $block, $allowed_html, $allowed_protocols );

		if ( is_array( $block['innerBlocks'] ) ) {
			foreach ( $block['innerBlocks'] as $i => $inner_block ) {
				$block['innerBlocks'][ $i ] = $this->filter_block_kses(
					$inner_block,
					$allowed_html,
					$allowed_protocols
				);
			}
		}

		return $block;
	}

	/**
	 * Register custom block category.
	 *
	 * @param array $categories All categories.
	 *
	 * @since 1.0.2
	 *
	 * @link https://wordpress.org/gutenberg/handbook/extensibility/extending-blocks/#managing-block-categories
	 */
	public function block_categories( $categories ) {
		return array_merge(
			apply_filters( 'plover_core_filter_block_categories', array(
				array(
					'slug'  => 'plover-blocks',
					'title' => __( 'Plover Blocks', 'plover' ),
				),
				array(
					'slug'  => 'plover-wc-blocks',
					'title' => __( 'Plover WooCommerce Blocks', 'plover' ),
				),
			) ),
			$categories
		);
	}
}

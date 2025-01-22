<?php

namespace Plover\Core\Services\Blocks;

use Plover\Core\Assets\Scripts;
use Plover\Core\Plover;
use Plover\Core\Services\Blocks\Contract\Block;
use Plover\Core\Services\Blocks\Contract\HasBlockStyles;
use Plover\Core\Services\Blocks\Contract\HasSupports;
use Plover\Core\Services\Blocks\Contract\Renderable;
use Plover\Core\Services\Blocks\Contract\RenderableBlock;

/**
 * @since 1.0.0
 */
class Blocks {

	/**
	 * Plover core instance.
	 *
	 * @var Plover
	 */
	protected $core;

	/**
	 * Extended block supports.
	 *
	 * @var array
	 */
	protected $block_supports = [];

	/**
	 * @param Plover $core
	 * @param Scripts $scripts
	 */
	public function __construct( Plover $core, Scripts $scripts ) {
		$this->core = $core;

		$scripts->enqueue_editor_asset( 'plover-block-supports', array(
			'ver'   => 'core',
			'src'   => $core->core_url( 'assets/js/block-supports/index.min.js' ),
			'path'  => $core->core_path( 'assets/js/block-supports/index.min.js' ),
			'asset' => $core->core_path( 'assets/js/block-supports/index.min.asset.php' )
		) );

		add_filter( 'plover_core_editor_data', function ( $data ) {
			$data['blockSupports'] = apply_filters(
				'plover_core_extended_block_supports',
				$this->block_supports
			);

			return $data;
		} );

		// Server side register ploverBlockID attribute
		add_filter( 'register_block_type_args', function ( $args, $name ) {
			if ( isset( $args['attributes'] ) ) {
				$args['attributes'] = array_merge( $args['attributes'], array(
					'ploverBlockID' => array(
						'type' => 'string',
					)
				) );
			}

			return $args;
		}, 10, 2 );
	}

	/**
	 * Extend a block.
	 *
	 * @param  $block
	 *
	 * @return void
	 */
	public function extend( $block ) {
		$blockName = $block instanceof Block ? $block->name() : '';

		if ( $block instanceof HasSupports ) {
			$this->extend_block_supports(
				$blockName,
				$block->supports(),
				$block->override()
			);
		}

		if ( $block instanceof HasBlockStyles ) {
			foreach ( $block->styles() as $style ) {
				register_block_style( $blockName, $style );
			}
		}

		if ( $block instanceof Renderable ) {
			add_filter( 'render_block', [ $block, 'render' ], 11, 2 );
		}

		if ( $block instanceof RenderableBlock ) {
			add_filter( "render_block_{$blockName}", [ $block, 'render' ], 11, 2 );
		}
	}

	/**
	 * Extend block support.
	 *
	 * @param string $blockName
	 * @param  $supports
	 * @param bool $override
	 *
	 * @return void
	 */
	public function extend_block_supports( string $blockName, $supports, bool $override = false ) {
		if ( $override ) {
			$this->block_supports[ $blockName ] = $supports;

			return;
		}

		$this->block_supports[ $blockName ] = array_merge(
			$this->block_supports[ $blockName ] ?? array(),
			$supports
		);
	}
}
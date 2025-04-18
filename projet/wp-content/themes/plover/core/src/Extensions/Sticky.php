<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Html\Document;

/**
 * @since 1.0.0
 */
class Sticky extends Extension {

	const MODULE_NAME = 'plover_block_sticky';

	/**
	 * @return void
	 */
	public function register() {
		$this->modules->register( self::MODULE_NAME, array(
			'label'   => __( 'Block Sticky', 'plover' ),
			'excerpt' => __( 'Make your content in the page visible at all times, making it permanently visible while scrolling.', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/block-sticky.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/block-sticky/',
			'group'   => 'supports',
		) );
	}

	/**
	 * @return void
	 */
	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		// Enqueue sticky editor assets
		$this->scripts->enqueue_editor_asset( 'plover-block-sticky', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-supports/sticky/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-supports/sticky/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-supports/sticky/index.min.asset.php' )
		) );

		$this->scripts->enqueue_asset( 'plover-sticky', array(
			'ver'      => 'core',
			'src'      => $this->core->core_url( 'assets/js/frontend/sticky/index.min.js' ),
			'path'     => $this->core->core_path( 'assets/js/frontend/sticky/index.min.js' ),
			'asset'    => $this->core->core_path( 'assets/js/frontend/sticky/index.min.asset.php' ),
			'keywords' => [ 'plover-is-sticky-block' ],
		) );

		add_filter( 'render_block', [ $this, 'render' ], 11, 2 );
	}

	/**
	 * Render block sticky attributes.
	 *
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( string $block_content, array $block ): string {
		$attrs = $block['attrs'] ?? [];
		if ( ! isset( $attrs['stickyBlock'] ) || $attrs['stickyBlock'] !== 'yes' ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$wrap = $html->get_root_element();
		if ( ! $wrap ) {
			return $block_content;
		}

		$wrap->add_classnames( 'plover-is-sticky-block' );

		$offsetTop = esc_attr( $attrs['stickyOffsetTop'] ?? '' );
		$zIndex    = esc_attr( $attrs['stickyZIndex'] ?? '' );
		$container = esc_attr( $attrs['stickyContainer'] ?? '' );
		if ( $offsetTop ) {
			$wrap->set_attribute( 'data-sticky-offset-top', (int) $offsetTop );
		}
		if ( $zIndex ) {
			$wrap->set_attribute( 'data-sticky-z-index', (int) $zIndex );
		}
		if ( $container ) {
			$wrap->set_attribute( 'data-sticky-container', $container );
		}

		if ( is_user_logged_in() ) {
			$wrap->set_attribute( 'data-sticky-has-admin-bar', true );
		}

		apply_filters( 'plover_core_render_sticky', $wrap, $block );

		return $html->save_html();
	}
}

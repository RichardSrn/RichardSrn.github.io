<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Html\Document;
use Plover\Core\Toolkits\Responsive;

/**
 * @since 1.0.0
 */
class Display extends Extension {

	const MODULE_NAME = 'plover_css_display';

	/**
	 * @return void
	 */
	public function register() {
		$this->modules->register( self::MODULE_NAME, array(
			'label'   => __( 'CSS Display', 'plover' ),
			'excerpt' => __( 'You can set display, visibility, order, overflow and box-sizing css properties for blocks, responsive!', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/css-display.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/css-display/',
			'fields'  => array(),
			'group'   => 'supports',
		) );
	}

	/**
	 * Bootstrap the custom block support.
	 *
	 * @return void
	 */
	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		$devices                = [ 'desktop', 'tablet', 'mobile' ];
		$allowed_display_values = $this->get_allowed_display_values();

		// Enqueue responsive css snippet.
		foreach ( $devices as $device ) {
			foreach ( $allowed_display_values as $display_value ) {
				$this->styles->enqueue_asset( "plover-display-{$display_value}-{$device}", array(
					'raw'      => "body .has-display-{$display_value}-{$device}{display:{$display_value};}",
					'device'   => $device,
					'keywords' => [ "has-display-{$display_value}-{$device}" ],
				) );
			}

			$this->styles->enqueue_asset( "plover-css-order-{$device}", array(
				'raw'      => ".has-css-order-{$device}{order:var(--css-order-{$device});}",
				'device'   => $device,
				'keywords' => [ "has-css-order-{$device}" ],
			) );
		}

		$this->scripts->enqueue_editor_asset( 'plover-block-display', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-supports/display/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-supports/display/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-supports/display/index.min.asset.php' )
		) );

		add_filter( 'render_block', [ $this, 'render' ], 11, 2 );
	}

	/**
	 * Render block display style & classes.
	 *
	 * @param $block_content
	 * @param $block
	 *
	 * @return mixed
	 */
	public function render( $block_content, $block ) {
		$attrs      = $block['attrs'] ?? [];
		$cssDisplay = $attrs['cssDisplay'] ?? '';
		$cssOrder   = $attrs['cssOrder'] ?? '';
		if ( ! apply_filters( 'plover_core_has_css_display_attributes', ( $cssDisplay || $cssOrder ), $attrs ) ) {
			return $block_content;
		}

		if ( ! $block_content ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$wrap = $html->get_root_element();
		if ( ! $wrap ) {
			return $block_content;
		}

		$classnames = array();
		$styles     = array();

		if ( $cssDisplay ) {
			$display         = Responsive::promote_scalar_value_into_responsive( $cssDisplay, true );
			$display_desktop = $this->sanitize_display_value( $display['desktop'] );
			$display_tablet  = $this->sanitize_display_value( $display['tablet'] );
			$display_mobile  = $this->sanitize_display_value( $display['mobile'] );

			if ( $display_desktop ) {
				$classnames[] = "has-display-{$display_desktop}-desktop";
			}
			if ( $display_tablet ) {
				$classnames[] = "has-display-{$display_tablet}-tablet";
			}
			if ( $display_mobile ) {
				$classnames[] = "has-display-{$display_mobile}-mobile";
			}
		}

		if ( $cssOrder ) {
			$order         = Responsive::promote_scalar_value_into_responsive( $cssOrder, true );
			$order_desktop = $this->sanitize_order_value( $order['desktop'] );
			$order_tablet  = $this->sanitize_order_value( $order['tablet'] );
			$order_mobile  = $this->sanitize_order_value( $order['mobile'] );
			if ( $order_desktop !== '' ) {
				$classnames[]                  = 'has-css-order-desktop';
				$styles['--css-order-desktop'] = $order_desktop;
			}
			if ( $order_tablet !== '' ) {
				$classnames[]                 = 'has-css-order-tablet';
				$styles['--css-order-tablet'] = $order_tablet;
			}
			if ( $order_mobile !== '' ) {
				$classnames[]                 = 'has-css-order-mobile';
				$styles['--css-order-mobile'] = $order_mobile;
			}
		}

		$wrap->add_classnames( $classnames );
		$wrap->add_styles( $styles );

		apply_filters( 'plover_core_render_css_display', $wrap, $block, $attrs );

		return $html->save_html();
	}

	/**
	 * @param $value
	 *
	 * @return string
	 */
	protected function sanitize_display_value( $value ) {
		$value          = strtolower( $value );
		$allowed_values = $this->get_allowed_display_values();

		return in_array( $value, $allowed_values ) ? $value : '';
	}

	/**
	 * Allowed display values.
	 *
	 * @return mixed|null
	 */
	protected function get_allowed_display_values() {
		return apply_filters( 'plover_core_allowed_display_values', array(
			'none',
			'block',
			'inline',
			'inline-block',
			'flex',
			'inline-flex',
			'grid',
			'inline-grid',
			'contents'
		) );
	}

	/**
	 * @param $value
	 *
	 * @return int|string
	 */
	protected function sanitize_order_value( $value ) {
		if ( $value === '' ) {
			return '';
		}

		return (int) $value;
	}
}

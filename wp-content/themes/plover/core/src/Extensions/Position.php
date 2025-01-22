<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Blocks\Blocks;
use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Format;
use Plover\Core\Toolkits\Html\Document;
use Plover\Core\Toolkits\Responsive;

/**
 * @since 1.1.0
 */
class Position extends Extension {

	const MODULE_NAME = 'plover_css_position';

	/**
	 * @return void
	 */
	public function register( Blocks $blocks ) {
		$this->modules->register( self::MODULE_NAME, array(
			'recent'  => true,
			'label'   => __( 'CSS Position', 'plover' ),
			'excerpt' => __( 'You can set position and z-index css properties for blocks, responsive!', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/css-position.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/css-position/',
			'fields'  => array(),
			'group'   => 'supports',
		) );

		$support_block_types = $this->support_block_types();
		foreach ( $support_block_types as $block ) {
			$blocks->extend_block_supports( $block, array(
				'ploverPosition' => true,
			) );
		}
	}

	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		$devices                 = [ 'desktop', 'tablet', 'mobile' ];
		$allowed_position_values = $this->get_allowed_position_values();

		// Enqueue responsive css snippet.
		foreach ( $devices as $device ) {
			foreach ( $allowed_position_values as $position_value ) {
				$this->styles->enqueue_asset( "plover-position-{$position_value}-{$device}", array(
					'raw'      => "body .has-position-{$position_value}-{$device}{position:{$position_value};}",
					'device'   => $device,
					'keywords' => [ "has-position-{$position_value}-{$device}" ],
				) );
			}

			$this->styles->enqueue_asset( "plover-css-z-index-{$device}", array(
				'raw'      => ".has-z-index-{$device}{z-index:var(--css-z-index-{$device});}",
				'device'   => $device,
				'keywords' => [ "has-z-index-{$device}" ],
			) );

			foreach ( [ 'top', 'right', 'bottom', 'left' ] as $direction ) {
				$this->styles->enqueue_asset( "plover-css-position-{$direction}-{$device}", array(
					'raw'      => ".has-position-{$direction}-{$device}{{$direction}:var(--css-position-{$direction}-{$device});}",
					'device'   => $device,
					'keywords' => [ "has-position-{$direction}-{$device}" ],
				) );
			}
		}

		$this->scripts->enqueue_editor_asset( 'plover-block-position', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-supports/position/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-supports/position/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-supports/position/index.min.asset.php' )
		) );

		add_filter( 'render_block', [ $this, 'render' ], 11, 2 );
	}

	/**
	 * Render block css position style & classes.
	 *
	 * @param $block_content
	 * @param $block
	 *
	 * @return mixed
	 */
	public function render( $block_content, $block ) {
		$block_name          = $block['blockName'] ?? '';
		$support_block_types = $this->support_block_types();
		if ( ! in_array( $block_name, $support_block_types ) ) {
			return $block_content;
		}

		$attrs           = $block['attrs'] ?? [];
		$cssPosition     = $attrs['cssPosition'] ?? '';
		$positionedValue = $attrs['cssPositionedValue'] ?? [];
		$cssZIndex       = $attrs['cssZIndex'] ?? '';

		if ( ! $cssPosition && ! $cssZIndex ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$wrap = $html->get_root_element();
		if ( ! $wrap ) {
			return $block_content;
		}

		$classnames = array();
		$styles     = array();
		$devices    = [ 'desktop', 'tablet', 'mobile' ];

		if ( $positionedValue ) {
			$positioned = Responsive::promote_scalar_value_into_responsive( $positionedValue, true );
			$positioned = [
				'desktop' => $this->sanitize_positioned_value( $positioned['desktop'] ),
				'tablet'  => $this->sanitize_positioned_value( $positioned['tablet'] ),
				'mobile'  => $this->sanitize_positioned_value( $positioned['mobile'] ),
			];

			foreach ( $positioned as $device => $scalar_positioned ) {
				foreach ( $scalar_positioned as $direction => $positioned_value ) {
					$classnames[]                                    = "has-position-{$direction}-{$device}";
					$styles["--css-position-{$direction}-{$device}"] = $positioned_value;
				}
			}
		}

		if ( $cssPosition ) {
			$position_responsive = Responsive::promote_scalar_value_into_responsive( $cssPosition, true );
			foreach ( $devices as $device ) {
				$position = $this->sanitize_position_value( $position_responsive[ $device ] );
				if ( $position ) {
					$classnames[] = "has-position-{$position}-{$device}";
				}
			}
		}

		if ( $cssZIndex ) {
			$z_index_responsive = Responsive::promote_scalar_value_into_responsive( $cssZIndex, true );
			foreach ( $devices as $device ) {
				$z_index = $this->sanitize_z_index_value( $z_index_responsive[ $device ] );
				if ( $z_index !== '' ) {
					$classnames[]                      = "has-z-index-{$device}";
					$styles["--css-z-index-{$device}"] = $z_index;
				}
			}
		}

		$wrap->add_classnames( $classnames );
		$wrap->add_styles( $styles );

		apply_filters( 'plover_core_render_css_position', $wrap, $block );

		return $html->save_html();
	}

	/**
	 * @param $value
	 *
	 * @return string
	 */
	protected function sanitize_position_value( $value ) {
		$value          = strtolower( $value );
		$allowed_values = $this->get_allowed_position_values();

		return in_array( $value, $allowed_values ) ? $value : '';
	}

	/**
	 * @param $value
	 *
	 * @return array
	 */
	protected function sanitize_positioned_value( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$value = array_intersect_key( $value, array_flip( [
			'top',
			'right',
			'bottom',
			'left'
		] ) );

		foreach ( $value as $direction => $scalar ) {
			$value[ $direction ] = Format::sanitize_unit_value( $scalar );
		}

		return $value;
	}

	/**
	 * @param $value
	 *
	 * @return int|string
	 */
	protected function sanitize_z_index_value( $value ) {
		if ( $value === '' ) {
			return '';
		}

		return (int) $value;
	}

	/**
	 * Allowed position values.
	 *
	 * @return mixed|null
	 */
	protected function get_allowed_position_values() {
		return apply_filters( 'plover_core_allowed_position_values', array(
			'static',
			'relative',
			'fixed',
			'absolute',
			'sticky'
		) );
	}

	/**
	 * @return array
	 */
	protected function support_block_types() {
		return apply_filters( 'plover_core_position_supported_blocks', array(
			'core/group',
			'core/columns',
			'core/cover',
			'core/image',
		) );
	}
}
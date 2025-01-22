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
class ShapeDivider extends Extension {

	const MODULE_NAME = 'plover_shape_divider';

	/**
	 * @return void
	 */
	public function register( Blocks $blocks ) {
		$this->modules->register( self::MODULE_NAME, array(
			'recent'  => true,
			'label'   => __( 'Shape Divider', 'plover' ),
			'excerpt' => __( 'Shape divider is used to create visual separation between different sections of content.', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/shape-divider.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/shape-divider',
			'fields'  => array(),
			'group'   => 'extensions',
		) );
	}

	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		$devices = [ 'desktop', 'tablet', 'mobile' ];

		// Enqueue responsive css snippet.
		foreach ( $devices as $device ) {
			$this->styles->enqueue_asset( "plover-shape-width-{$device}", array(
				'raw'       => ".plover-shape-divider.has-custom-width svg{width:var(--plover-shape-width-{$device});}",
				'device'    => $device,
				'condition' => ! is_admin(),
				'keywords'  => [ 'plover-shape-divider' ],
			) );
			$this->styles->enqueue_asset( "plover-shape-height-{$device}", array(
				'raw'       => ".plover-shape-divider.has-custom-height svg{height:var(--plover-shape-height-{$device});}",
				'device'    => $device,
				'condition' => ! is_admin(),
				'keywords'  => [ 'plover-shape-divider' ],
			) );
		}

		// extension controls and editor preview
		$this->scripts->enqueue_editor_asset( 'plover-shape-divider-extension', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-extensions/shape-divider/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-extensions/shape-divider/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-extensions/shape-divider/index.min.asset.php' )
		) );
		$this->styles->enqueue_editor_asset( 'plover-shape-divider-extension', array(
			'ver'  => 'core',
			'rtl'  => 'replace',
			'src'  => $this->core->core_url( 'assets/js/block-extensions/shape-divider/style.min.css' ),
			'path' => $this->core->core_path( 'assets/js/block-extensions/shape-divider/style.min.css' ),
		) );

		// Frontend styles
		$this->styles->enqueue_asset( 'plover-shape-divider', array(
			'ver'      => 'core',
			'rtl'      => 'replace',
			'src'      => $this->core->core_url( 'assets/css/extensions/shape-divider.css' ),
			'path'     => $this->core->core_path( 'assets/css/extensions/shape-divider.css' ),
			'keywords' => [ 'plover-shape-divider' ]
		) );

		// Render shape divider attrs for core/cover block
		add_filter( 'render_block_core/cover', [ $this, 'render' ], 11, 2 );
		// Send default shape attributes to JavaScript
		add_filter( 'plover_core_editor_data', [ $this, 'localize_editor_data' ] );
	}

	/**
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( $block_content, $block ) {
		if ( is_admin() ) { // don't load in the editor
			return $block_content;
		}

		$attrs      = $block['attrs'] ?? [];
		$shape_data = $this->get_shapes( $attrs['shapeDivider'] ?? 'none' );
		if ( ! $shape_data ) {
			return $block_content;
		}

		$negative = isset( $attrs['invertShape'] ) && $attrs['invertShape'] && in_array( 'shape_invert', $shape_data['options'] );
		$flip     = isset( $attrs['flipShape'] ) && $attrs['flipShape'] && in_array( 'shape_flip', $shape_data['options'] );

		$svg = ( new Document( $shape_data['files'][ $negative ? 'negative' : 'svg' ] ?? '' ) )->get_root_element();
		if ( ! $svg ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$wrap = $html->get_root_element();
		if ( ! $wrap ) {
			return $block_content;
		}


		$wrap->add_classnames( 'plover-shape-divider__block' );
		$shape = $html->create_element( 'div' );
		$shape->set_attribute( 'class', 'plover-shape-divider' );
		$shape->set_attribute( 'data-position', $attrs['shapePosition'] ?? 'bottom' );
		$shape->set_attribute( 'data-negative', $negative ? 'true' : 'false' );
		$shape->set_attribute( 'data-flip', $flip ? 'true' : 'false' );

		$shape_styles = [
			'--plover-shape-color'   => $attrs['shapeColor'] ?? '',
			'--plover-shape-z-index' => $attrs['shapeZIndex'] ?? '',
		];

		if ( isset( $attrs['shapeWidth'] ) && $attrs['shapeWidth'] ) {
			$shape->add_classnames( [ 'has-custom-width' ] );
			$shape_width = Responsive::promote_scalar_value_into_responsive( $attrs['shapeWidth'], true );

			$shape_styles['--plover-shape-width-desktop'] = Format::sanitize_unit_value( $shape_width['desktop'] );
			$shape_styles['--plover-shape-width-tablet']  = Format::sanitize_unit_value( $shape_width['tablet'] );
			$shape_styles['--plover-shape-width-mobile']  = Format::sanitize_unit_value( $shape_width['mobile'] );
		}

		if ( isset( $attrs['shapeHeight'] ) && $attrs['shapeHeight'] ) {
			$shape->add_classnames( [ 'has-custom-height' ] );
			$shape_height = Responsive::promote_scalar_value_into_responsive( $attrs['shapeHeight'], true );

			$shape_styles['--plover-shape-height-desktop'] = Format::sanitize_unit_value( $shape_height['desktop'] );
			$shape_styles['--plover-shape-height-tablet']  = Format::sanitize_unit_value( $shape_height['tablet'] );
			$shape_styles['--plover-shape-height-mobile']  = Format::sanitize_unit_value( $shape_height['mobile'] );
		}

		$shape->set_styles( $shape_styles );

		$imported_svg = $html->get_dom()->importNode( $svg->get_dom_element(), true );
		$shape->get_dom_element()->appendChild( $imported_svg );
		$wrap->append_element( $shape );

		return $html->save_html();
	}

	/**
	 * Localize editor data
	 *
	 * @param $data
	 *
	 * @return array
	 */
	public function localize_editor_data( $data ) {
		$data['extensions']['shapeDivider'] = [
			'shapes' => $this->get_shapes()
		];

		return $data;
	}

	/**
	 * Get all shape dividers
	 *
	 * @return mixed|null
	 */
	protected function get_shapes( $id = null ) {
		$shapes = [
			'none'     => array(
				'title'   => _x( 'None', 'Shapes name', 'plover' ),
				'options' => array(),
			),
			'tilt'     => array(
				'title'   => _x( 'Tilt', 'Shapes name', 'plover' ),
				'options' => array( 'shape_flip' ),
			),
			'triangle' => array(
				'title'   => _x( 'Triangle', 'Shapes name', 'plover' ),
				'options' => array( 'shape_invert' ),
			),
		];

		$shapes = apply_filters( 'plover_core_shape_dividers', $shapes );

		if ( $id !== null ) {
			if ( $id !== 'none' && isset( $shapes[ $id ] ) ) {
				$shape_data          = $shapes[ $id ];
				$shape_data['files'] = $this->get_shape_files( $id, $shapes[ $id ] );

				return $shape_data;
			}

			return null;
		}

		foreach ( $shapes as $shape => $shape_data ) {
			$shapes[ $shape ]['files'] = $this->get_shape_files( $shape, $shape_data );
		}

		return $shapes;
	}

	/**
	 * Get shape files
	 *
	 * @param $shape
	 * @param $shape_data
	 *
	 * @return array
	 */
	protected function get_shape_files( $shape, $shape_data ) {
		$folder_path = $this->core->core_path( 'assets/images/shapes/' );
		$files       = array();

		if ( isset( $shape_data['folder'] ) ) {
			$folder_path = $shape_data['folder'];
		}

		$filepath = trailingslashit( $folder_path ) . $shape . '.svg';
		if ( is_file( $filepath ) && is_readable( $filepath ) ) {
			$files['svg'] = file_get_contents( $filepath );
		}

		if ( in_array( 'shape_invert', $shape_data['options'] ) ) {
			$negative_filepath = trailingslashit( $folder_path ) . $shape . '-negative' . '.svg';
			if ( is_file( $negative_filepath ) && is_readable( $negative_filepath ) ) {
				$files['negative'] = file_get_contents( $negative_filepath );
			}
		}

		return $files;
	}
}
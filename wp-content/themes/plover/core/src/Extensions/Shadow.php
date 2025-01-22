<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Arr;
use Plover\Core\Toolkits\Html\Document;

/**
 * @since 1.0.0
 */
class Shadow extends Extension {

	const MODULE_NAME = 'plover_block_shadow';

	private const IMAGE_BLOCKS = array(
		'core/image',
		'core/featured-image',
	);

	/**
	 * @return void
	 */
	public function register() {
		$this->modules->register( self::MODULE_NAME, array(
			'group'   => 'supports',
			'label'   => __( 'Block shadow', 'plover' ),
			'excerpt' => __( 'Extra text-shadow, drop-shadow, and box-shadow support for core blocks.', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/block-shadow.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/block-shadow/',
			'fields'  => array()
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

		$this->scripts->enqueue_editor_asset( 'plover-block-shadow', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-supports/shadow/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-supports/shadow/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-supports/shadow/index.min.asset.php' )
		) );

		$this->styles->enqueue_editor_asset( 'plover-block-shadow', array(
			'ver'  => 'core',
			'rtl'  => 'replace',
			'src'  => $this->core->core_url( 'assets/js/block-supports/shadow/style.min.css' ),
			'path' => $this->core->core_path( 'assets/js/block-supports/shadow/style.min.css' )
		) );

		add_filter( 'render_block', [ $this, 'render' ], 11, 2 );
		add_filter( 'plover_core_editor_data', [ $this, 'localize_shadow_presets' ] );
		add_filter( 'wp_theme_json_data_user', [ $this, 'add_shadow_presets' ] );
	}

	/**
	 * @param \WP_Theme_JSON_Data $theme_json
	 *
	 * @return \WP_Theme_JSON_Data
	 */
	public function add_shadow_presets( $theme_json ) {
		$presets = $this->get_shadow_presets();

		$data = [
			'version'  => 2,
			'settings' => [
				'custom' => [
					'textShadow' => Arr::pluck( $presets['text-shadow'], 'shadow', 'slug' ),
					'dropShadow' => Arr::pluck( $presets['drop-shadow'], 'shadow', 'slug' ),
					'boxShadow'  => Arr::pluck( $presets['box-shadow'], 'shadow', 'slug' ),
				]
			],
		];


		return $theme_json->update_with( $data );
	}

	/**
	 * @return array|null
	 */
	protected function get_shadow_presets() {
		static $plover_shadow_presets = null;
		if ( $plover_shadow_presets === null ) {
			$plover_shadow_presets = [
				'text-shadow' => apply_filters( 'plover_core_text_shadow_presets', [
					[
						'name'   => 'Solid',
						'slug'   => 'solid',
						'shadow' => '0.1em 0.1em 0 rgba(0,0,0,0.25)',
					],
					[
						'name'   => 'Vintage Newspaper',
						'slug'   => 'vintage-newspaper',
						'shadow' => '0.05em 0.03em 0px #ffffff, 0.12em 0.1em 0px rgba(0, 0, 0, 0.5)',
					],
					[
						'name'   => 'Glowing',
						'slug'   => 'glowing',
						'shadow' => '0 0 0.2em rgba(245,232,54,0.7)',
					]
				] ),
				'drop-shadow' => apply_filters( 'plover_core_drop_shadow_presets', [
					[
						"name"   => "Small",
						"slug"   => "small",
						'shadow' => 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))',
					],
					[
						"name"   => "Base",
						"slug"   => "base",
						'shadow' => 'drop-shadow(0 1px 2px rgba(0,0,0,0.1)) drop-shadow(0 1px 1px rgba(0,0,0,0.06))',
					],
					[
						"name"   => "Medium",
						"slug"   => "medium",
						'shadow' => 'drop-shadow(0 4px 3px rgba(0,0,0,0.07)) drop-shadow(0 2px 2px rgba(0,0,0,0.06))',
					],
					[
						"name"   => "Large",
						"slug"   => "large",
						'shadow' => 'drop-shadow(0 10px 8px rgba(0,0,0,0.04)) drop-shadow(0 4px 3px rgba(0,0,0,0.1))',
					],
					[
						"name"   => "XL",
						"slug"   => "x-large",
						'shadow' => 'drop-shadow(0 20px 13px rgba(0,0,0,0.03)) drop-shadow(0 8px 5px rgba(0,0,0,0.08))',
					],
					[
						"name"   => "2XL",
						"slug"   => "xx-large",
						'shadow' => 'drop-shadow(0 25px 25px rgba(0,0,0,0.15))',
					]
				] ),
				'box-shadow'  => apply_filters( 'plover_core_box_shadow_presets', [
					[
						'name'   => 'Small',
						'slug'   => 'small',
						'shadow' => '0 1px 2px 0 rgba(0,0,0,0.05)'
					],
					[
						'name'   => 'Base',
						'slug'   => 'base',
						'shadow' => '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)'
					],
					[
						'name'   => 'Medium',
						'slug'   => 'medium',
						'shadow' => '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)'
					],
					[
						'name'   => 'Large',
						'slug'   => 'large',
						'shadow' => '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
					],
					[
						'name'   => 'XL',
						'slug'   => 'x-large',
						'shadow' => '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
					],
					[
						'name'   => '2XL',
						'slug'   => 'xx-large',
						'shadow' => '0 25px 50px -12px rgba(0,0,0,0.25)'
					],
					[
						'name'   => 'Inner',
						'slug'   => 'inner',
						'shadow' => 'inset 0 2px 4px 0 rgba(0,0,0,0.05)'
					]
				] )
			];
		}

		return $plover_shadow_presets;
	}

	/**
	 * Shadow presets.
	 *
	 * @param $data
	 *
	 * @return array
	 */
	public function localize_shadow_presets( $data ) {
		$presets = $this->get_shadow_presets();

		$data['theme']['settings']['textShadow'] = [
			'presets' => $presets['text-shadow']
		];

		$data['theme']['settings']['dropShadow'] = [
			'presets' => $presets['drop-shadow']
		];

		$data['theme']['settings']['boxShadow'] = [
			'presets' => $presets['box-shadow']
		];

		return $data;
	}

	/**
	 * Render shadow effect.
	 *
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( string $block_content, array $block ): string {
		$text_shadow = $block['attrs']['textShadow'] ?? '';
		$box_shadow  = $block['attrs']['boxShadow'] ?? '';
		$drop_shadow = $block['attrs']['dropShadow'] ?? '';

		if ( ! $text_shadow && ! $box_shadow && ! $drop_shadow ) {
			return $block_content;
		}

		$html = new \Plover\Core\Toolkits\Html\Document( $block_content );

		if ( $text_shadow ) {
			$this->render_text_shadow( $html, $text_shadow );
		}
		if ( $box_shadow ) {
			$this->render_box_shadow( $block['blockName'] ?? '', $html, $box_shadow );
		}
		if ( $drop_shadow ) {
			$this->render_drop_shadow( $block['blockName'] ?? '', $html, $drop_shadow );
		}

		return $html->save_html();
	}

	/**
	 * Render text shadow styles.
	 *
	 * @param Document $html
	 * @param $text_shadow
	 *
	 * @return void
	 */
	protected function render_text_shadow( $html, $text_shadow ) {
		$wrap = $html->get_root_element();
		if ( ! $wrap ) {
			return;
		}

		if ( str_starts_with( $text_shadow, 'var:custom|textShadow|' ) ) {
			$text_shadow = str_replace(
				               'var:custom|textShadow|',
				               'var(--wp--custom--text-shadow--',
				               $text_shadow
			               ) . ')';
		}

		$wrap->add_styles( [
			'text-shadow' => $text_shadow
		] );
	}

	/**
	 * Render box shadow styles.
	 *
	 * @param $block_name
	 * @param Document $html
	 * @param $box_shadow
	 *
	 * @return void
	 */
	protected function render_box_shadow( $block_name, $html, $box_shadow ) {
		$tags = array( '*' );
		if ( in_array( $block_name, self::IMAGE_BLOCKS ) ) { // If the block is image-based, add the shadow to the figure/image tag.
			$tags = array( 'figure', '*' );
		}

		$wrap = $html->get_element_by_tags_priority( $tags );

		if ( ! $wrap ) {
			return;
		}

		if ( str_starts_with( $box_shadow, 'var:preset|shadow|' ) ) {
			$box_shadow = str_replace(
				              'var:preset|shadow|',
				              'var(--wp--preset--shadow--',
				              $box_shadow
			              ) . ')';
		}

		if ( str_starts_with( $box_shadow, 'var:custom|boxShadow|' ) ) {
			$box_shadow = str_replace(
				              'var:custom|boxShadow|',
				              'var(--wp--custom--box-shadow--',
				              $box_shadow
			              ) . ')';
		}

		$wrap->add_styles( [
			'box-shadow' => $box_shadow
		] );
	}

	/**
	 * Render drop shadow styles.
	 *
	 * @param $block_name
	 * @param Document $html
	 * @param $drop_shadow
	 *
	 * @return void
	 */
	protected function render_drop_shadow( $block_name, $html, $drop_shadow ) {
		$tags = array( '*' );
		if ( in_array( $block_name, self::IMAGE_BLOCKS ) ) { // If the block is image-based, add the shadow to the figure/image tag.
			$tags = array( 'figure', 'img', '*' ); // Take care of Duoton effect
		}

		$wrap = $html->get_element_by_tags_priority( $tags ); // Take care of Duoton effect
		if ( ! $wrap ) {
			return;
		}

		if ( str_starts_with( $drop_shadow, 'var:custom|dropShadow|' ) ) {
			$drop_shadow = str_replace(
				               'var:custom|dropShadow|',
				               'var(--wp--custom--drop-shadow--',
				               $drop_shadow
			               ) . ')';
		}

		$wrap->add_styles( [
			'filter' => $drop_shadow
		] );
	}
}

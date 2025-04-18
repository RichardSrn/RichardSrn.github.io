<?php

namespace Plover\Core\Extensions;

use Plover\Core\Assets\Icons;
use Plover\Core\Router\Auth;
use Plover\Core\Router\Router;
use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Html\Document;
use Plover\Core\Toolkits\StyleEngine;

/**
 * Add icon support for core/button block.
 *
 * @since 1.0.0
 */
class Icon extends Extension {

	const ICON_BUTTON_MODULE_NAME = 'plover_icon_button';
	const ICON_BLOCK_MODULE_NAME = 'plover_icon_block';

	/**
	 * @var Icons
	 */
	protected $icons;

	/**
	 * Supported blocks.
	 */
	protected $supported_blocks = [];

	/**
	 * @return void
	 */
	public function register() {
		$this->modules->register( self::ICON_BUTTON_MODULE_NAME, array(
			'group'   => 'extensions',
			'label'   => __( 'Icon Button', 'plover' ),
			'excerpt' => __( 'Add icon to boring buttons! 2000+ free icons available!', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/icon-button.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/icon-button/',
			'fields'  => array()
		) );
		$this->modules->register( self::ICON_BLOCK_MODULE_NAME, array(
			'group'   => 'extensions',
			'label'   => __( 'Icon Block', 'plover' ),
			'excerpt' => __( 'Introduce an Icon block that allows you to add icons to your design! 2000+ free icons available!', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/icon-block.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/icon-block/',
			'fields'  => array()
		) );
	}

	/**
	 * Bootstrap the extension.
	 *
	 * @return void
	 */
	public function boot( Icons $icons ) {
		$this->icons = $icons;
		if ( $this->settings->checked( self::ICON_BUTTON_MODULE_NAME ) ) {
			$this->supported_blocks[] = 'core/button';
		}
		if ( $this->settings->checked( self::ICON_BLOCK_MODULE_NAME ) ) {
			$this->supported_blocks[] = 'core/paragraph';
		}

		if ( empty( $this->supported_blocks ) ) {
			return;
		}

		// Register rest api for retrieve icons
		add_action( 'rest_api_init', [ $this, 'register_reset_api' ] );

		// Enqueue icon extension assets
		$this->scripts->enqueue_editor_asset( 'plover-icon-extension', array(
			'ver'    => 'core',
			'src'    => $this->core->core_url( 'assets/js/block-extensions/icon/index.min.js' ),
			'path'   => $this->core->core_path( 'assets/js/block-extensions/icon/index.min.js' ),
			'asset'  => $this->core->core_path( 'assets/js/block-extensions/icon/index.min.asset.php' ),
			'footer' => true,
		) );
		$this->styles->enqueue_editor_asset( 'plover-icon-extension', array(
			'ver'  => 'core',
			'rtl'  => 'replace',
			'src'  => $this->core->core_url( 'assets/js/block-extensions/icon/style.min.css' ),
			'path' => $this->core->core_path( 'assets/js/block-extensions/icon/style.min.css' ),
		) );

		// Allow safe svg in post
		add_filter( 'wp_kses_allowed_html', [ $this, 'allow_safe_svg_in_post' ], 11, 2 );
		// Send default icon attributes to JavaScript
		add_filter( 'plover_core_editor_data', [ $this, 'localize_icon_attributes' ] );
		add_filter( 'render_block', [ $this, 'render_with_icon' ], 11, 2 );
		// Add core icons
		add_filter( 'plover_core_icon_primitive_libraries', [ $this, 'add_plover_icon_libraries' ] );
	}

	/**
	 * @param $libraries
	 *
	 * @return mixed
	 */
	public function add_plover_icon_libraries( $libraries ) {
		$libraries[] = array(
			'name'  => __( 'Plover', 'plover' ),
			'slug'  => 'plover-core',
			'icons' => apply_filters( 'plover_core_icon_collection', array(
				array(
					'name' => __( 'star', 'plover' ),
					'slug' => 'star',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"></path></svg>',
					'tags' => [ 'bookmark', 'favorite', 'like', 'star' ],
				),
				array(
					'name' => __( 'star-solid', 'plover' ),
					'slug' => 'star-solid',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>',
					'tags' => [ 'bookmark', 'favorite', 'like', 'star' ],
				),
				array(
					'name' => __( 'moon', 'plover' ),
					'slug' => 'moon',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
					'tags' => [ 'dark', 'night' ],
				),
				array(
					'name' => __( 'sun', 'plover' ),
					'slug' => 'sun',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
					'tags' => [ 'brightness', 'weather', 'light' ],
				),
				array(
					'name' => __( 'search', 'plover' ),
					'slug' => 'search',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
					'tags' => [ 'find', 'magnifier', 'magnifying glass' ],
				),
				array(
					'name' => __( 'arrow-down-left', 'plover' ),
					'slug' => 'arrow-down-left',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-down-right', 'plover' ),
					'slug' => 'arrow-down-right',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="7" x2="17" y2="17"></line><polyline points="17 7 17 17 7 17"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-down', 'plover' ),
					'slug' => 'arrow-down',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-left', 'plover' ),
					'slug' => 'arrow-left',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-right', 'plover' ),
					'slug' => 'arrow-right',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-up-left', 'plover' ),
					'slug' => 'arrow-up-left',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="17" x2="7" y2="7"></line><polyline points="7 17 7 7 17 7"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-up-right', 'plover' ),
					'slug' => 'arrow-up-right',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'arrow-up', 'plover' ),
					'slug' => 'arrow-up',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'alert-circle', 'plover' ),
					'slug' => 'alert-circle',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
					'tags' => [ 'warning', 'alert', 'danger' ],
				),
				array(
					'name' => __( 'alert-triangle', 'plover' ),
					'slug' => 'alert-triangle',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
					'tags' => [ 'warning', 'alert', 'danger' ],
				),
				array(
					'name' => __( 'check-circle', 'plover' ),
					'slug' => 'check-circle',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'check-square', 'plover' ),
					'slug' => 'check-square',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'check', 'plover' ),
					'slug' => 'check',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'chevron-down', 'plover' ),
					'slug' => 'chevron-down',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
					'tags' => [ 'expand' ],
				),
				array(
					'name' => __( 'chevron-left', 'plover' ),
					'slug' => 'chevron-left',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'chevron-right', 'plover' ),
					'slug' => 'chevron-right',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'chevron-up', 'plover' ),
					'slug' => 'chevron-up',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>',
					'tags' => [ 'collapse' ],
				),
				array(
					'name' => __( 'heart', 'plover' ),
					'slug' => 'heart',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
					'tags' => [ 'like', 'love', 'emotion' ],
				),
				array(
					'name' => __( 'help-circle', 'plover' ),
					'slug' => 'help-circle',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
					'tags' => [ 'question mark' ],
				),
				array(
					'name' => __( 'map-pin', 'plover' ),
					'slug' => 'map-pin',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
					'tags' => [ 'location', 'navigation', 'travel', 'marker' ],
				),
				array(
					'name' => __( 'plus', 'plover' ),
					'slug' => 'plus',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
					'tags' => [ 'plus', 'new' ],
				),
				array(
					'name' => __( 'shopping-cart', 'plover' ),
					'slug' => 'shopping-cart',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
					'tags' => [ 'ecommerce', 'cart', 'purchase', 'store' ],
				),
				array(
					'name' => __( 'download-cloud', 'plover' ),
					'slug' => 'download-cloud',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path></svg>',
					'tags' => [],
				),
				array(
					'name' => __( 'download', 'plover' ),
					'slug' => 'download',
					'svg'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
					'tags' => [],
				),
			) ),
		);

		return $libraries;
	}

	/**
	 * @param $allowedposttags
	 * @param $context
	 *
	 * @return array
	 */
	public function allow_safe_svg_in_post( $allowedposttags, $context ) {
		if ( $context !== 'post' ) {
			return $allowedposttags;
		}

		$attributes = \enshrined\svgSanitize\data\AllowedAttributes::getAttributes();
		$attributes = array_fill_keys( array_unique( $attributes ), true );
		$tags       = \enshrined\svgSanitize\data\AllowedTags::getTags();

		// add safe svg support
		return array_merge(
			array_fill_keys( array_unique( $tags ), $attributes ),
			$allowedposttags
		);
	}

	/**
	 * Render button with icon.
	 *
	 * @param $block_content
	 * @param $block
	 *
	 * @return string
	 */
	public function render_with_icon( $block_content, $block ): string {
		if ( ! in_array( $block['blockName'], $this->supported_blocks ) ) {
			return $block_content;
		}

		$attrs        = $block['attrs'] ?? [];
		$icon_library = $attrs['iconLibrary'] ?? '';
		$icon_slug    = $attrs['iconSlug'] ?? '';
		if ( ! ( $icon_library && $icon_slug ) ) {
			return $block_content;
		}

		$icon = $this->icons->get_icon( $icon_library, $icon_slug );
		if ( ! $icon ) {
			return $block_content;
		}

		$svg = ( new Document( $icon ) )->get_root_element();
		if ( ! $svg ) {
			return $block_content;
		}

		$icon_position = $attrs['iconPosition'] ?? 'right';
		$icon_size     = $attrs['iconSize'] ?? '18px';

		if ( $icon_size ) {
			$svg->set_attribute( 'width', $icon_size );
			$svg->set_attribute( 'height', $icon_size );
		}

		// adapt the icon color
		if ( ! $svg->get_attribute( 'fill' ) ) {
			$svg->set_attribute( 'fill', 'currentColor' );
		}
		if ( ! $svg->get_attribute( 'stroke' ) ) {
			$svg->set_attribute( 'stroke', 'currentColor' );
		}

		$html     = new Document( $block_content );
		$imported = $html->get_dom()->importNode( $svg->get_dom_element(), true );

		$el = $html->get_element_by_tags_priority( array( 'button', 'a', '*' ) );
		if ( ! $el ) { // empty content, we need to render button element in server-side
			$wrap  = $html->create_element( 'div' );
			$width = $attrs['width'] ?? null;

			$wrap->set_attribute( 'class', StyleEngine::clsx(
				'wp-block-button',
				$attrs['className'] ?? null,
				array(
					"has-custom-width wp-block-button__width-{$width}" => isset( $width ),
					'has-custom-font-size'                             =>
						array_key_exists( 'fontSize', $attrs ) || isset( $attrs['style']['typography']['fontSize'] ),
				)
			) );

			$el            = $html->create_element( 'a' );
			$button_styles = wp_style_engine_get_styles(
				array(
					'color'   => StyleEngine::get_block_color_styles( $attrs ),
					'border'  => StyleEngine::get_block_border_styles( $attrs ),
					'shadow'  => $attrs['style']['shadow'] ?? array(),
					'spacing' => array(
						'padding' => $attrs['style']['spacing']['padding'] ?? null,
						'margin'  => $attrs['style']['spacing']['margin'] ?? null,
					),
				)
			);

			$el->set_attribute( 'class', StyleEngine::clsx(
				$button_styles['classnames'] ?? null,
				'wp-block-button__link wp-element-button'
			) );
			if ( ! empty( $button_styles['declarations'] ) ) {
				$el->add_styles( $button_styles['declarations'] );
			}

			$wrap->append_element( $el );
			$html->append_element( $wrap );
		}

		// add block gap
		$gap = StyleEngine::get_block_gap_value( $attrs );
		if ( isset( $gap ) ) {
			$el->add_styles( [ '--plover--style--block-gap' => $gap ] );
		}

		if ( $icon_position === 'left' ) {
			$el->get_dom_element()->insertBefore( $imported, $el->get_dom_element()->firstChild );
		} else {
			$el->get_dom_element()->appendChild( $imported );
		}

		return $html->save_html();
	}

	/**
	 * Localize data to JavaScript.
	 *
	 * @param $data
	 *
	 * @return mixed
	 */
	public function localize_icon_attributes( $data ) {
		$data['extensions']['icon'] = [
			'blocks'     => $this->supported_blocks,
			'libraries'  => $this->icons->get_libraries(),
			'attributes' => [
				'iconLibrary'   => [
					'type' => 'string',
				],
				'iconSlug'      => [
					'type' => 'string',
				],
				'iconPosition'  => [
					'type'    => 'string',
					'default' => 'right',
				],
				'iconSize'      => [
					'type'    => 'string',
					'default' => '18px',
				],
				'iconSvgString' => [
					'type' => 'string',
				],
			],
		];

		return $data;
	}

	/**
	 * Register icons rest api.
	 *
	 * @return void
	 */
	public function register_reset_api() {
		$router = Router::v1();

		$router->read( '/icons/(?P<library>[0-9|a-z|_-]+)', array( $this, 'icons_api' ) )
		       ->use( array( Auth::class, 'can_edit_posts' ) );

		$router->register();
	}

	/**
	 *  Rest api for getting icons from library
	 *
	 * @param \WP_REST_Request|null $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function icons_api( ?\WP_REST_Request $request ) {
		$library = strtolower( $request->get_param( 'library' ) );
		$icons   = $this->icons->get_icons( $library );

		if ( ! $icons ) {
			return rest_ensure_response(
				new \WP_Error( '404', __( 'No such icon library.', 'plover' ) )
			);
		}

		return rest_ensure_response( array( 'icons' => $icons ) );
	}
}

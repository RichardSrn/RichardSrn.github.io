<?php

namespace Plover\Core\Services;

use Plover\Core\Framework\ServiceProvider;
use Plover\Core\Services\Blocks\Blocks;
use Plover\Core\Services\Extensions\Extensions;

/**
 * Bootstrap core features.
 *
 * @since 1.0.0
 */
class CoreFeaturesServiceProvider extends ServiceProvider {

	/**
	 * @var \array[][]
	 */
	protected $block_supports = [
		'core/columns'             => [
			'ploverSticky' => true,
		],
		'core/column'              => [
			'shadow'               => false,
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => true,
					'color' => true,
				],
			],
			'ploverSticky'         => true,
			'ploverShadow'         => [
				'box'             => true,
				'defaultControls' => [
					'box' => true,
				]
			]
		],
		'core/list'                => [
			'spacing'              => [
				'padding'  => true,
				'margin'   => true,
				'blockGap' => true,
			],
			'__experimentalLayout' => [
				'allowSwitching'  => false,
				'allowInheriting' => false,
				'default'         => [
					'type'        => 'flex',
					'orientation' => 'vertical',
				],
			],
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => true,
					'color' => true,
				],
			],
		],
		'core/list-item'           => [
			'color'                => [
				'text'       => true,
				'background' => true,
				'link'       => true,
				'gradient'   => true,
			],
			'spacing'              => [
				'padding' => true,
				'margin'  => true,
			],
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => true,
					'color' => true,
				],
			],
		],
		'core/button'              => [
			'spacing'            => [
				'margin'                          => true,
				"padding"                         => [ 'horizontal', 'vertical' ],
				'blockGap'                        => true,
				'__experimentalSkipSerialization' => true,
				"__experimentalDefaultControls"   => [
					'margin'  => true,
					'padding' => true,
				]
			],
			'shadow'             => false,
			'ploverEventHandler' => [
				'onclick'         => true,
				'ondblclick'      => true,
				'onmouseover'     => true,
				'defaultControls' => [
					'onclick' => true,
				],
			],
			'ploverShadow'       => [
				'box'             => true,
				'defaultControls' => [
					'box' => true,
				]
			]
		],
		'core/image'               => [
			'color'        => [
				'gradients'  => true,
				'background' => true,
				'text'       => true, // For SVG currentColor.
			],
			'spacing'      => [
				'margin'  => true,
				'padding' => true,
			],
			'shadow'       => false,
			'ploverShadow' => [
				'drop'            => true,
				'box'             => true,
				'defaultControls' => [
					'drop' => true,
				]
			],
		],
		'core/post-featured-image' => [
			'shadow'       => false,
			'ploverShadow' => [
				'drop'            => true,
				'box'             => true,
				'defaultControls' => [
					'drop' => true,
				]
			],
		],
		'core/paragraph'           => [
			'shadow'               => false,
			'ploverShadow'         => [
				'text'            => true,
				'drop'            => true,
				'defaultControls' => [
					'text' => true,
					'drop' => true,
				]
			],
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => true,
					'color' => true,
				],
			],
		],
		'core/heading'             => [
			'shadow'       => false,
			'ploverShadow' => [
				'text'            => true,
				'defaultControls' => [
					'text' => true,
				]
			],
		],
		'core/post-title'          => [
			'shadow'       => false,
			'ploverShadow' => [
				'text'            => true,
				'defaultControls' => [
					'text' => true,
				]
			],
		],
		'core/post-excerpt'        => [
			'shadow'       => false,
			'ploverShadow' => [
				'text'            => true,
				'defaultControls' => [
					'text' => true,
				]
			],
		],
		'core/cover'               => [
			'shadow'       => false,
			'ploverShadow' => [
				'box'             => true,
				'defaultControls' => [
					'box' => true,
				]
			]
		],
		'core/group'               => [
			'shadow'       => false,
			'ploverSticky' => true,
			'ploverShadow' => [
				'box'             => true,
				'defaultControls' => [
					'box' => true,
				]
			]
		],
		'core/details'             => [
			'shadow'               => false,
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => true,
					'color' => true,
				],
			],
			'ploverShadow'         => [
				'box'             => true,
				'defaultControls' => [
					'box' => true,
				]
			]
		],
	];

	/**
	 * @return void
	 */
	public function register() {
		add_action( 'init', array( $this, 'load_textdomain' ) );

		$this->core->registered( function ( Blocks $blocks, Extensions $extensions ) {
			// extend core blocks
			$blocks->extend( new \Plover\Core\Blocks\SiteLogo() );
			$blocks->extend( new \Plover\Core\Blocks\Code() );
			$blocks->extend( new \Plover\Core\Blocks\CoreList() );
			$blocks->extend( new \Plover\Core\Blocks\PageList() );
			$blocks->extend( new \Plover\Core\Blocks\TagCloud() );
			$blocks->extend( new \Plover\Core\Blocks\PloverDocList() );
			// extend block supports
			foreach ( $this->block_supports as $block_name => $supports ) {
				$blocks->extend_block_supports( $block_name, $supports );
			}

			// register core extensions
			$extensions->register( 'block-shadow', \Plover\Core\Extensions\Shadow::class );
			$extensions->register( 'block-sticky', \Plover\Core\Extensions\Sticky::class );
			$extensions->register( 'block-display', \Plover\Core\Extensions\Display::class );
			$extensions->register( 'block-position', \Plover\Core\Extensions\Position::class );
			$extensions->register( 'code-highlight', \Plover\Core\Extensions\Highlight::class );
			$extensions->register( 'search-enhancement', \Plover\Core\Extensions\Search::class );
			$extensions->register( 'block-event-handler', \Plover\Core\Extensions\EventHandler::class );
			$extensions->register( 'icon', \Plover\Core\Extensions\Icon::class );
			$extensions->register( 'particles-effect', \Plover\Core\Extensions\Particles::class );
			$extensions->register( 'shape-divider', \Plover\Core\Extensions\ShapeDivider::class );
		}, 5 );
	}

	/**
	 * Load core text domain, inherited from the plover theme by default
	 *
	 * @return bool
	 */
	public function load_textdomain() {
		/** @var \WP_Textdomain_Registry $wp_textdomain_registry */
		global $wp_textdomain_registry;

		$domain = 'plover';

		$locale = apply_filters( 'theme_locale', determine_locale(), $domain );

		$mofile = $domain . '-' . $locale . '.mo';

		// Try to load from the plover theme language directory first.
		if ( load_textdomain( $domain, WP_LANG_DIR . '/themes/' . $mofile, $locale ) ) {
			return true;
		}

		// Load own languages files.
		$path = $this->core->core_path( 'languages' );

		$wp_textdomain_registry->set_custom_path( $domain, $path );

		return load_textdomain( $domain, $path . '/' . $locale . '.mo', $locale );
	}
}

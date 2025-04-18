<?php

namespace Plover\Core\Services;

use Plover\Core\Assets\Enqueue;
use Plover\Core\Assets\Scripts;
use Plover\Core\Assets\Styles;
use Plover\Core\Framework\ServiceProvider;
use Plover\Core\Toolkits\Arr;
use Plover\Core\Toolkits\Filesystem;

/**
 * Assets service provider.
 *
 * @since 1.0.0
 */
class AssetsServiceProvider extends ServiceProvider {

	/**
	 * @var array
	 */
	public $singletons = [
		\Plover\Core\Assets\Scripts::class,
		\Plover\Core\Assets\Styles::class,
		\Plover\Core\Assets\Icons::class,
	];

	/**
	 * @var string[]
	 */
	public $aliases = [
		'scripts' => \Plover\Core\Assets\Scripts::class,
		'styles'  => \Plover\Core\Assets\Styles::class,
		'icons'   => \Plover\Core\Assets\Icons::class,
	];

	/**
	 * Bootstrap assets enqueue
	 *
	 * @param Styles $styles
	 * @param Scripts $scripts
	 *
	 * @return void
	 */
	public function boot( Styles $styles, Scripts $scripts ) {
		$this->core->make( Enqueue::class );

		// enqueue all block variations scripts
		$block_variations = \Plover\Core\Toolkits\Filesystem::list_files(
			$this->core->core_path( 'assets/js/block-variations' ), 1
		);
		foreach ( $block_variations as $block_variation ) {
			$variation_name = basename( $block_variation );
			$scripts->enqueue_editor_asset( "plover/{$variation_name}", array(
				'ver'    => 'core',
				'src'    => $this->core->core_url( "assets/js/block-variations/{$variation_name}/index.min.js" ),
				'path'   => $this->core->core_path( "assets/js/block-variations/{$variation_name}/index.min.js" ),
				'asset'  => $this->core->core_path( "assets/js/block-variations/{$variation_name}/index.min.asset.php" ),
				'footer' => true,
			) );
		}

		// enqueue all core block styles
		$blocks = \Plover\Core\Toolkits\Filesystem::list_files(
			$this->core->core_path( 'assets/css/blocks' )
		);

		foreach ( $blocks as $block_style ) {
			$base_name = basename( $block_style, '.css' );
			list( $scope, $name ) = array_pad( explode( '__', $base_name ) ?? [], - 2, '' );

			$styles->enqueue_block_style( $scope ? "{$scope}/{$name}" : $name, array(
				'ver'    => 'core',
				'handle' => "plover-{$scope}-{$name}-block-style",
				'src'    => $this->core->core_url( "assets/css/blocks/{$base_name}.css" ),
				'path'   => $this->core->core_path( "assets/css/blocks/{$base_name}.css" )
			) );
		}

		$block_styles = Filesystem::list_files( $this->core->core_path( 'assets/css/block-styles' ) );
		$style_groups = [
			'elements'     => [
				'button' => [
					'<button',
					'type="button"',
					'type="submit"',
					'type="reset"',
					'nf-form',
					'wp-element-button',
				],
				'figure' => [ '<figure' ]
			],
			'block-styles' => Arr::from_entries( array_map( function ( $block_style_file ) {
				$block_style = basename( $block_style_file, '.css' );

				return [ $block_style, [ "is-style-{$block_style}" ] ];
			}, $block_styles ) )
		];

		foreach ( $style_groups as $group => $style_files ) {
			foreach ( $style_files as $file_name => $keywords ) {
				$styles->enqueue_asset( "plover-{$group}-{$file_name}", array(
					'ver'      => 'core',
					'src'      => $this->core->core_url( "assets/css/{$group}/{$file_name}.css" ),
					'path'     => $this->core->core_path( "assets/css/{$group}/{$file_name}.css" ),
					'keywords' => $keywords,
				) );
			}
		}

		// editor css.
		$styles->enqueue_asset( 'plover-editor-css', array(
			'ver'       => 'core',
			'src'       => $this->core->core_url( "assets/css/editor.css" ),
			'path'      => $this->core->core_path( "assets/css/editor.css" ),
			'keywords'  => [],
			'condition' => is_admin(), // only load in editor
		) );
	}
}
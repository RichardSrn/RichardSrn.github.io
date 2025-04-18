<?php

namespace Plover\Theme\Services;

use Plover\Core\Assets\Scripts;
use Plover\Core\Assets\Styles;
use Plover\Core\Framework\ServiceProvider;
use Plover\Core\Services\Extensions\Extensions;
use Plover\Theme\Extensions\DarkMode;

/**
 * Bootstrap theme features.
 *
 * @since 1.0.0
 */
class ThemeServiceProvider extends ServiceProvider {

	/**
	 * @return void
	 */
	public function boot( Styles $styles, Scripts $scripts, Extensions $extensions ) {
		$app = plover_theme();

		if ( function_exists( 'register_block_pattern_category' ) ) {
			register_block_pattern_category( 'plover', array(
				'label' => __( 'Plover', 'plover' )
			) );
		}

		// theme extensions.
		$extensions->register( 'plover-dark-mode', DarkMode::class );

		// block styles.
		register_block_style( 'core/separator', array(
			'name'  => 'dashed',
			'label' => __( 'Dashed', 'plover' ),
		) );
		register_block_style( 'core/separator', array(
			'name'  => 'waves',
			'label' => __( 'Waves', 'plover' ),
		) );
		register_block_style( 'core/button', array(
			'name'  => 'ghost',
			'label' => __( 'Ghost', 'plover' ),
		) );

		// list styles.
		register_block_style( 'core/list', array(
			'name'  => 'list-none',
			'label' => __( 'None', 'plover' ),
		) );
		register_block_style( 'core/list', array(
			'name'  => 'checklist',
			'label' => __( 'Checklist', 'plover' ),
		) );
		register_block_style( 'core/list', array(
			'name'  => 'check-circle',
			'label' => __( 'Check Circle', 'plover' ),
		) );
		register_block_style( 'core/list', array(
			'name'  => 'check-solid',
			'label' => __( 'Check Solid', 'plover' ),
		) );
		register_block_style( 'core/list', array(
			'name'  => 'check-ghost',
			'label' => __( 'Check Ghost', 'plover' ),
		) );

		// dark-variant blocks
		$dark_variant_blocks = [ 'core/group', 'core/row', 'core/stack', 'core/columns', 'core/cover' ];
		foreach ( $dark_variant_blocks as $block ) {
			register_block_style( $block, array(
				'name'  => 'dark',
				'label' => __( 'Dark', 'plover' ),
			) );
			register_block_style( $block, array(
				'name'  => 'light',
				'label' => __( 'Light', 'plover' ),
			) );
		}

		// dynamic block styles.
		$block_styles = \Plover\Core\Toolkits\Filesystem::list_files(
			$app->app_path( 'assets/css/block-styles' )
		);
		foreach ( $block_styles as $block_style ) {
			$style_name = basename( $block_style, '.css' );
			$styles->enqueue_asset( "plover-theme-block-{$style_name}-style", array(
				'ver'      => $app->is_debug() ? time() : PLOVER_VERSION,
				'src'      => $app->app_url( "assets/css/block-styles/{$style_name}.css" ),
				'path'     => $app->app_path( "assets/css/block-styles/{$style_name}.css" ),
				'keywords' => [ 'is-style-' . $style_name ],
			) );
		}

		// dynamic core block stylesheet.
		$blocks = \Plover\Core\Toolkits\Filesystem::list_files(
			$app->app_path( 'assets/css/blocks' )
		);

		foreach ( $blocks as $block_style ) {
			$base_name = basename( $block_style, '.css' );
			list( $scope, $name ) = array_pad( explode( '__', $base_name ) ?? [], - 2, '' );
			$block_name = $scope ? "{$scope}/{$name}" : $name;

			$styles->enqueue_block_style( $block_name, array(
				'handle' => $app->id( "plover-theme-{$block_name}-css" ),
				'ver'    => $app->is_debug() ? time() : PLOVER_VERSION,
				'src'    => $app->app_url( "assets/css/blocks/{$base_name}.css" ),
				'path'   => $app->app_path( "assets/css/blocks/{$base_name}.css" )
			) );
		}

		$style_groups = [
			'elements'   => [
				'all'      => [],
				'root'     => [],
				'anchor'   => [ '<a' ],
				"button"   => [
					'<button',
					'type="button"',
					'type="submit"',
					'type="reset"',
					'nf-form',
					'wp-element-button',
				],
				'form'     => [
					'<fieldset',
					'<form',
					'<input',
					'nf-form',
					'wp-block-search',
				],
				"checkbox" => [ 'type="checkbox"' ],
				'list'     => [ '<ul', '<ol' ],
				'code'     => [ '<code' ],
			],
			'extensions' => [
				'dark-mode' => [ 'plover-hide-on-dark', 'plover-hide-on-light' ]
			],
		];

		foreach ( $style_groups as $group => $style_files ) {
			foreach ( $style_files as $file_name => $keywords ) {
				$styles->enqueue_asset( "plover-theme-{$group}-{$file_name}", array(
					'ver'      => $app->is_debug() ? time() : PLOVER_VERSION,
					'src'      => $app->app_url( "assets/css/{$group}/{$file_name}.css" ),
					'path'     => $app->app_path( "assets/css/{$group}/{$file_name}.css" ),
					'keywords' => $keywords,
				) );
			}
		}

		// editor content css.
		$styles->enqueue_asset( 'plover-theme-editor-css', array(
			'ver'       => PLOVER_VERSION,
			'src'       => $app->app_url( "assets/css/editor.css" ),
			'path'      => $app->app_path( "assets/css/editor.css" ),
			'keywords'  => [],
			'condition' => is_admin(), // only load in editor
		) );

		// editor sidebar
		$scripts->enqueue_editor_asset( 'plover-theme-editor-sidebar', array(
			'ver'      => PLOVER_VERSION,
			'src'      => plover_asset_url( "js/block-editor-sidebar/index.min.js" ),
			'path'     => plover_asset_path( "js/block-editor-sidebar/index.min.js" ),
			'asset'    => plover_asset_path( "js/block-editor-sidebar/index.min.asset.php" ),
			'keywords' => [],
		) );
	}
}

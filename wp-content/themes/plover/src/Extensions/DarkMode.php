<?php

namespace Plover\Theme\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Services\Settings\Control;
use Plover\Core\Toolkits\Arr;
use Plover\Core\Toolkits\Str;
use Plover\Core\Toolkits\StyleEngine;

/**
 * Dark mode support.
 *
 * This feature is modify from the Blockify theme
 * @see https://wordpress.org/themes/blockify/
 *
 * @since 1.0.0
 */
class DarkMode extends Extension {
	/**
	 * Module name
	 */
	const MODULE_NAME = 'plover_theme_dark_mode';

	/**
	 * Color shade map.
	 *
	 * @since 1.0.0
	 * @since 1.2.0
	 *
	 * @var array
	 */
	private $map = [
		'primary' => [
			'color'  => 'active',
			'active' => 'color',
		],
		'neutral' => [
			950 => 0,
			800 => 200,
			600 => 400,
			400 => 600,
			200 => 800,
			0   => 950,
		]
	];

	/**
	 * Register extension as module.
	 *
	 * @return void
	 * @throws \Exception
	 */
	public function register() {
		$this->modules->register( self::MODULE_NAME, array(
			'label'   => __( 'Dark Mode', 'plover' ),
			'excerpt' => __( 'Adds dark mode support to the theme.', 'plover' ),
			'icon'    => esc_url( plover_theme()->app_url( 'assets/images/dark-mode.png' ) ),
			'group'   => 'theme',
			'fields'  => array(
				'default_mode'  => array(
					'label'        => __( 'Default color mode', 'plover' ),
					'default'      => apply_filters( 'plover_theme_default_color_mode', 'system' ),
					'control'      => Control::T_SELECT,
					'control_args' => array(
						'options' => array(
							array( 'label' => __( 'System', 'plover' ), 'value' => 'system' ),
							array( 'label' => __( 'Dark', 'plover' ), 'value' => 'dark' ),
							array( 'label' => __( 'Light', 'plover' ), 'value' => 'light' )
						)
					)
				),
				'cookie_period' => array(
					'label'        => __( 'Cookie period', 'plover' ),
					'help'         => __( 'The expiration date for visitors to switch color modes, default is session which means expires when browser is closed.', 'plover' ),
					'default'      => apply_filters( 'plover_theme_default_cookie_period', 'session' ),
					'control'      => Control::T_SELECT,
					'control_args' => array(
						'options' => array(
							array( 'label' => __( 'Session', 'plover' ), 'value' => 'session' ),
							array( 'label' => __( '1 Day', 'plover' ), 'value' => '1-day' ),
							array( 'label' => __( '7 Day', 'plover' ), 'value' => '7-days' ),
							array( 'label' => __( '30 Days', 'plover' ), 'value' => '30-days' ),
						)
					)
				)
			)
		) );
	}

	/**
	 * Bootstrap the extension.
	 *
	 * @return void
	 */
	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		//
		// In order to synchronize global style changes,
		// We use a script to dynamically create dark mode variables iIn the Site Editor.
		//
		if ( ! plover_is_site_editor_screen() ) {
			if ( is_plover_core_ge( '1.0.12' ) ) {
				// Delay generation of dark mode css using callbacks to avoid caching issues
				// Callback is raw assets is available since core v1.0.12
				$this->styles->enqueue_asset( 'plover-dark-mode', array(
					'raw'      => function () {
						return $this->get_dark_mode_css();
					},
					'keywords' => [],
				) );
			} else {
				$css = $this->get_dark_mode_css();
				if ( ! empty( $css ) ) {
					$this->styles->enqueue_asset( 'plover-dark-mode', array(
						'raw'      => $css,
						'keywords' => [],
					) );
				}
			}
		}

		// editor extension
		$this->scripts->enqueue_editor_asset( 'plover-dark-mode-extension-js', array(
			'ver'      => PLOVER_VERSION,
			'src'      => plover_asset_url( "js/dark-mode-extension/index.min.js" ),
			'path'     => plover_asset_path( "js/dark-mode-extension/index.min.js" ),
			'asset'    => plover_asset_path( "js/dark-mode-extension/index.min.asset.php" ),
			'keywords' => [],
		) );

		// editor content script
		$this->scripts->enqueue_asset( 'plover-dark-mode-sync-js', array(
			'ver'       => PLOVER_VERSION,
			'src'       => plover_asset_url( "js/dark-mode-sync/index.min.js" ),
			'path'      => plover_asset_path( "js/dark-mode-sync/index.min.js" ),
			'asset'     => plover_asset_path( "js/dark-mode-sync/index.min.asset.php" ),
			'keywords'  => [],
			'condition' => is_admin(), // only load in editor
		) );

		// frontend script
		$this->scripts->enqueue_asset( 'plover-dark-mode-toggle-js', array(
			'ver'      => PLOVER_VERSION,
			'src'      => plover_asset_url( 'js/dark-mode-toggle/index.min.js' ),
			'path'     => plover_asset_path( 'js/dark-mode-toggle/index.min.js' ),
			'asset'    => plover_asset_path( "js/dark-mode-toggle/index.min.asset.php" ),
			'keywords' => [ 'togglePloverThemeMode' ]
		) );

		$this->scripts->enqueue_asset( 'plover-dark-mode-settings', array(
			'ver'      => PLOVER_VERSION,
			'raw'      => 'var ploverDarkModeSettings = ' . json_encode( array(
					'defaultMode'  => $this->settings->get( self::MODULE_NAME, 'default_mode' ),
					'cookiePeriod' => $this->settings->get( self::MODULE_NAME, 'cookie_period' ),
				) ) . ';',
			'keywords' => [ 'togglePloverThemeMode' ]
		) );

		add_filter( 'body_class', [ $this, 'add_dark_mode_body_class' ] );
		add_action( 'enqueue_block_assets', [ $this, 'localize_editor_data' ] );
	}

	/**
	 * @return void
	 */
	public function localize_editor_data() {
		if ( ! is_admin() ) {
			return;
		}

		$settings = wp_get_global_settings();
		$palette  = $settings['color']['palette']['theme'] ?? [];
		$colors   = Arr::pluck( $palette, 'color', 'slug' );

		// Editor localize data
		$localize_handle = 'plover-theme-editor-data';
		wp_register_script( $localize_handle, false, array(), false, true );
		wp_localize_script(
			$localize_handle,
			'PloverTheme',
			apply_filters( 'plover_theme_editor_data', array(
				'darkMode' => array(
					'isSiteEditor'    => plover_is_site_editor_screen(),
					'shadeMap'        => $this->map,
					'colors'          => $colors,
					'customThemeVars' => $this->compute_custom_theme_vars( $settings['custom'] ?? [] ),
					'cookiePeriod'    => $this->settings->get( self::MODULE_NAME, 'cookie_period' ),
					'defaultMode'     => $this->settings->get( self::MODULE_NAME, 'default_mode' ),
					'sessionMode'     => $this->get_session_color_mode()
				)
			) )
		);

		wp_enqueue_script( $localize_handle );
	}

	/**
	 * @return string
	 */
	public function get_dark_mode_css() {
		$settings    = wp_get_global_settings();
		$palette     = $settings['color']['palette']['theme'] ?? [];
		$custom_vars = $this->compute_custom_theme_vars( $settings['custom'] ?? [] );
		$colors      = Arr::pluck( $palette, 'color', 'slug' );
		$system      = [
			'current',
			'currentcolor',
			'currentColor',
			'inherit',
			'initial',
			'transparent',
			'unset',
		];

		$default_mode    = 'light';
		$opposite_mode   = 'dark';
		$default_styles  = $custom_vars;
		$opposite_styles = $custom_vars;

		foreach ( $colors as $slug => $value ) {
			$explode = explode( '-', $slug );
			$name    = $explode[0] ?? '';
			$shade   = $explode[1] ?? '';

			if ( is_null( $shade ) || in_array( $slug, $system, true ) ) {
				continue;
			}

			$default_styles["--wp--preset--color--{$slug}"] = $value;

			$opposite_shade = $this->map[ $name ][ $shade ] ?? '';
			$opposite_value = $colors[ $name . '-' . $opposite_shade ] ?? '';

			if ( $opposite_value ) {
				$opposite_styles["--wp--preset--color--{$slug}"] = $opposite_value;
			}
		}

		$css = "html .is-style-{$default_mode}{" . StyleEngine::compile_css( $default_styles ) . '}';
		$css .= "html .is-style-{$opposite_mode}{" . StyleEngine::compile_css( $opposite_styles ) . '}';
		$css .= "@media (prefers-color-scheme:$opposite_mode){body{" . StyleEngine::compile_css( $opposite_styles ) . "}}";

		if ( is_admin() ) { // Editor without iframe
			$css .= ":root.is-style-{$default_mode}{" . StyleEngine::compile_css( $default_styles ) . '}';
			$css .= ":root.is-style-{$opposite_mode}{" . StyleEngine::compile_css( $opposite_styles ) . '}';
			$css .= ":root .editor-styles-wrapper.is-style-{$default_mode}{" . StyleEngine::compile_css( $default_styles ) . '}';
			$css .= ":root .editor-styles-wrapper.is-style-{$opposite_mode}{" . StyleEngine::compile_css( $opposite_styles ) . '}';
		}

		return $css;
	}

	/**
	 * Sets default body class.
	 *
	 * @param array $classes
	 *
	 * @return array
	 */
	public function add_dark_mode_body_class( $classes ) {
		$session_mode = $this->get_session_color_mode();
		$default_mode = $this->settings->get( self::MODULE_NAME, 'default_mode' );

		if ( ! $session_mode ) { // without cookie
			$classes[] = 'is-style-' . $default_mode;
		} else if ( $session_mode === 'system' ) {
			$default_mode = 'system';
		} else { // have cookie value
			$classes[] = 'is-style-' . $session_mode;
		}

		$classes[] = 'default-mode-' . $default_mode;

		return array_unique( $classes );
	}

	/**
	 * Get color mode from session
	 *
	 * @return string|null
	 */
	protected function get_session_color_mode() {
		$cookie = filter_input( INPUT_COOKIE, 'ploverDarkMode', FILTER_SANITIZE_FULL_SPECIAL_CHARS );

		if ( $cookie === 'true' ) {
			return 'dark';
		} else if ( $cookie === 'false' ) {
			return 'light';
		} else if ( $cookie === 'system' ) {
			return 'system';
		}

		return null;
	}

	/**
	 * Compute custom css vars from theme.json custom settings field
	 *
	 * @return string[]
	 */
	protected function compute_custom_theme_vars( $vars ) {
		$custom_vars   = \Plover\Core\Toolkits\JSON::compute_theme_vars( $vars );
		$custom_styles = [];

		foreach ( $custom_vars as $name => $value ) {
			if ( is_string( $value ) && Str::contains_any( $value, '--wp--preset--color--', '--wp--preset--gradient--' ) ) {
				$custom_styles[ $name ] = $value;
			}
		}

		return $custom_styles;
	}
}
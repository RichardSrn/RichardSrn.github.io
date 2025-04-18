<?php
/**
 * Global helpers function
 *
 * @package Plover
 */

if ( ! function_exists( 'plover_theme' ) ) {
	/**
	 * Get plover theme application instance.
	 *
	 * @return \Plover\Core\Application|null
	 */
	function plover_theme() {
		return plover_app( 'plover' );
	}
}

if ( ! function_exists( 'plover_asset_path' ) ) {
	/**
	 * Get theme asset file path
	 *
	 * @param $path
	 *
	 * @return string
	 */
	function plover_asset_path( $path ) {
		return plover_theme()->app_path( 'assets/' . \Plover\Core\Toolkits\Str::unleadingslashit( $path ) );
	}
}

if ( ! function_exists( 'plover_asset_url' ) ) {
	/**
	 * Get theme asset url
	 *
	 * @param $path
	 *
	 * @return string
	 */
	function plover_asset_url( $path ) {
		return plover_theme()->app_url( 'assets/' . \Plover\Core\Toolkits\Str::unleadingslashit( $path ) );
	}
}

if ( ! function_exists( 'the_plover_asset_url' ) ) {
	/**
	 * Echo version of plover_asset_url
	 *
	 * @param $path
	 *
	 * @return void
	 */
	function the_plover_asset_url( $path ) {
		echo esc_url( plover_asset_url( $path ) );
	}
}

if ( ! function_exists( 'is_plover_core_le' ) ) {
	function is_plover_core_le( $ver ) {
		return version_compare( \Plover\Core\Plover::VERSION, $ver, '<=' );
	}
}

if ( ! function_exists( 'is_plover_core_lt' ) ) {
	function is_plover_core_lt( $ver ) {
		return version_compare( \Plover\Core\Plover::VERSION, $ver, '<' );
	}
}

if ( ! function_exists( 'is_plover_core_ge' ) ) {
	function is_plover_core_ge( $ver ) {
		return version_compare( \Plover\Core\Plover::VERSION, $ver, '>=' );
	}
}

if ( ! function_exists( 'is_plover_core_gt' ) ) {
	function is_plover_core_gt( $ver ) {
		return version_compare( \Plover\Core\Plover::VERSION, $ver, '>' );
	}
}

if ( ! function_exists('') ) {
	function plover_is_site_editor_screen() {
		global $pagenow;
		return $pagenow === 'site-editor.php';
	}
}

if ( ! function_exists( 'plover_upsell_url' ) ) {
	/**
	 * Upsell url
	 *
	 * @return string|null
	 */
	function plover_upsell_url() {
		if ( PLOVER_KIT_ACTIVE ) {
			return admin_url( 'admin.php?page=plover-kit-pricing' );
		}

		$theme = wp_get_theme();

		return 'https://wpplover.com/plugins/plover-kit/#plans?utm_source=' . sanitize_title( $theme->get( 'Name' ) . '-dashboard' );
	}
}

<?php
/**
 * Plover bootstrap
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package Plover
 *
 * @since 1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'PLOVER_VERSION' ) ) {
	// Replace the version number of the theme on each release.
	define( 'PLOVER_VERSION', '1.3.0' );
}

// Plover Kit plugin check
if ( ! defined( 'PLOVER_KIT_ACTIVE' ) ) {
	define( 'PLOVER_KIT_ACTIVE', defined( 'PLOVER_KIT_VERSION' ) );

	if ( ! defined( 'PLOVER_KIT_PREMIUM_ACTIVE' ) ) {
		define( 'PLOVER_KIT_PREMIUM_ACTIVE', defined( 'PLOVER_KIT_PREMIUM' ) && PLOVER_KIT_PREMIUM );
	}
}

// Require plover-core if not loaded.
if ( ! function_exists( 'plover_core' ) ) {
	require get_template_directory() . '/core/vendor/autoload.php';
}

// Require theme vendor autoload file.
require_once get_template_directory() . '/vendor/autoload.php';

// Bootstrap plover core
$bootstrap = \Plover\Core\Bootstrap::make(
	'plover',
	dirname( __FILE__ ),
	version_compare( \Plover\Core\Plover::VERSION, '1.0.6', '>=' )
		? get_template_directory_uri()
		: []
);

$bootstrap->withProviders( [
	\Plover\Core\Services\CoreFeaturesServiceProvider::class,
	\Plover\Theme\Services\ThemeServiceProvider::class,
	\Plover\Theme\Services\DashboardServiceProvider::class,
] );

$bootstrap->boot();

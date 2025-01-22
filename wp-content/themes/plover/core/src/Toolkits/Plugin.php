<?php

namespace Plover\Core\Toolkits;

/**
 * @since 1.0.4
 */
class Plugin {

	/**
	 * Check whether a plugin is installed
	 *
	 * @param $slug
	 *
	 * @return bool
	 */
	public static function is_installed( $slug ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$all_plugins = get_plugins();

		if ( ! empty( $all_plugins[ $slug ] ) ) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Install new plugin
	 *
	 * @param $plugin_zip
	 *
	 * @return array|bool|\WP_Error
	 */
	public static function install_from_zip( $plugin_zip ) {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		wp_cache_flush();

		$upgrader  = new \Plugin_Upgrader();
		$installed = $upgrader->install( $plugin_zip );

		return $installed;
	}

	/**
	 * Upgrade plugin
	 *
	 * @param $slug
	 *
	 * @return array|bool|\WP_Error
	 */
	public static function upgrade( $slug ) {
		include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		wp_cache_flush();

		$upgrader = new \Plugin_Upgrader();
		$upgraded = $upgrader->upgrade( $slug );

		return $upgraded;
	}

	/**
	 * Install and active plugin
	 *
	 * @param $plugins
	 * @param $back_url
	 */
	public static function install( $plugins, $back_url ) {
		echo '<div class="notice notice-warning"><p>';
		echo esc_html__( 'The installation process is starting. This process may take a while on some hosts, so please be patient.', 'plover' );
		echo '</p></div>';

		foreach ( $plugins as $slug => $args ) {
			$args        = is_array( $args ) ? $args : array( 'label' => $args );
			$name        = '<strong>' . ( $args['label'] ?? '' ) . '</strong>';
			$plugin_slug = isset( $args['slug'] ) ? $args['slug'] : "{$slug}/{$slug}.php";
			$plugin_zip  = "https://downloads.wordpress.org/plugin/{$slug}.latest-stable.zip";

			if ( self::is_installed( $plugin_slug ) ) {
				echo '<h4>';
				echo sprintf( esc_html__( 'Upgrading %s ...', 'plover' ), $name );
				echo '</h4>';
				self::upgrade( $plugin_slug );
				$installed = true;
			} else {
				echo '<h4>';
				echo sprintf( esc_html__( 'Installing %s ...', 'plover' ), $name );
				echo '</h4>';
				$installed = self::install_from_zip( $plugin_zip );
			}

			if ( ! is_wp_error( $installed ) && $installed ) {
				echo '<h4>';
				echo sprintf( esc_html__( 'Activating %s ...', 'plover' ), $name );
				echo '</h4>';
				activate_plugin( $plugin_slug );
				echo '<div class="updated"><p>';
				echo sprintf( esc_html__( '%s installed successfully', 'plover' ), $name );
				echo '</p></div>';
			} else {
				echo '<div class="error"><p>';
				echo sprintf( esc_html__( 'Could not install the %s plugin.', 'plover' ), $name );
				echo '</p></div>';
			}

			echo '<br><br>';
		}

		echo '<p>';
		esc_html_e( 'All Done!', 'plover' );
		echo '</p>';
		echo '<p><a href="' . esc_url( $back_url ) . '">' . esc_html__( 'Return To Theme Page', 'plover' ) . '</a></p>';
	}
}
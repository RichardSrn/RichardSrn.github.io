<?php

namespace Plover\Core\Toolkits;

/**
 * Utils for i/o
 *
 * @since 1.0.0
 */
class Filesystem {
	/**
	 * Get WordPress filesystem instance.
	 *
	 * @return \WP_Filesystem_Base
	 * @deprecated
	 */
	public static function get() {
		global $wp_filesystem;
		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			WP_Filesystem();
		}

		return $wp_filesystem;
	}

	/**
	 * @param string $folder
	 * @param bool $abs
	 * @param int $levels
	 * @param array $exclusions
	 *
	 * @return array|false
	 */
	public static function list_files( $folder = '', $levels = 100, $exclusions = array() ) {
		if ( empty( $folder ) || ! is_dir( $folder ) ) {
			return array();
		}

		if ( ! $levels ) {
			return array();
		}

		$folder = trailingslashit( $folder );

		$files = array();

		$dir = @opendir( $folder );

		if ( $dir ) {
			while ( ( $file = readdir( $dir ) ) !== false ) {
				// Skip current and parent folder links.
				if ( in_array( $file, array( '.', '..' ), true ) ) {
					continue;
				}

				// Skip hidden and excluded files.
				if ( '.' === $file[0] || in_array( $file, $exclusions, true ) ) {
					continue;
				}

				if ( is_dir( $folder . $file ) ) {
					$files2 = static::list_files( $folder . $file, $levels - 1 );
					if ( ! empty( $files2 ) ) {
						$files = array_merge( $files, $files2 );
					} else {
						$files[] = $folder . $file . '/';
					}
				} else {
					$files[] = $folder . $file;
				}
			}

			closedir( $dir );
		}

		return $files;
	}
}

<?php

namespace Plover\Core\Toolkits;

/**
 * @since 1.0.0
 */
class Path {
	/**
	 * Extracts specific number of segments from a path as string.
	 *
	 * @param string $path The input path.
	 * @param int $number Positive for first segments, negative for last segments.
	 * @param bool $wrap Whether to wrap in leading and trailing slashes.
	 *
	 * @return string
	 */
	public static function get_segment( string $path, int $number, bool $wrap = false ): string {
		$segments  = explode( ( DIRECTORY_SEPARATOR ?: '/' ), trim( $path, ( DIRECTORY_SEPARATOR ?: '/' ) ) );
		$extracted = $number > 0 ? array_slice( $segments, 0, $number ) : array_slice( $segments, $number );
		$slash     = $wrap ? '/' : ''; // DIRECTORY_SEPARATOR breaks in Windows.

		return $slash . implode( '/', $extracted ) . $slash;
	}

	/**
	 * Convert normal asset file path to rtl asset path.
	 *
	 * @param $path
	 *
	 * @return string
	 */
	public static function rtl_asset_path( $path ) {
		if ( ! is_string( $path ) ) {
			return '';
		}

		$last_dot = strrpos( $path, '.' );

		return substr( $path, 0, $last_dot ) . '-rtl' . substr( $path, $last_dot );
	}
}

<?php
/**
 * Core helpers
 *
 * @since 1.0.0
 */

if ( ! function_exists( 'plover_core' ) ) {
	/**
	 * Get global container instance or any bindings.
	 *
	 * @param $abs
	 *
	 * @return mixed|null
	 */
	function plover_core( $abs = null ) {
		$core = \Plover\Core\Plover::get_instance();
		if ( ! $core ) {
			return null;
		}

		return $abs !== null ? $core->get( $abs ) : $core;
	}
}

if ( ! function_exists( 'plover_app' ) ) {
	/**
	 * Get application instance.
	 *
	 * @param $id
	 *
	 * @return \Plover\Core\Application|null
	 */
	function plover_app( $id ) {
		return \Plover\Core\Application::get_app( $id );
	}
}

if ( ! function_exists( 'plover_block_id' ) ) {
	/**
	 * Get unique block id form block attrs.
	 *
	 * @param $attrs
	 *
	 * @return mixed|string
	 */
	function plover_block_id( $attrs ) {
		if ( isset( $attrs['ploverBlockID'] ) && $attrs['ploverBlockID'] ) {
			return sanitize_title( $attrs['ploverBlockID'] );
		}

		// fallback method.
		return wp_generate_uuid4();
	}
}

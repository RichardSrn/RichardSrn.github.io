<?php

namespace Plover\Core\Router;

/**
 * @since 1.0.0
 */
class Auth {
	/**
	 * API Auth
	 *
	 * @param $request
	 * @param $next
	 *
	 * @return mixed|\WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public static function can_edit_posts( $request, $next ) {
		if ( ! current_user_can( 'edit_posts' ) && ! current_user_can( 'edit_pages' ) ) {
			return rest_ensure_response( new \WP_Error( 403, __( 'Forbidden', 'plover' ) ) );
		}

		return $next( $request );
	}

	/**
	 * API Auth
	 *
	 * @param $request
	 * @param $next
	 *
	 * @return mixed|\WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public static function can_manage_options( $request, $next ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return rest_ensure_response( new \WP_Error( 403, __( 'Forbidden', 'plover' ) ) );
		}

		return $next( $request );
	}
}
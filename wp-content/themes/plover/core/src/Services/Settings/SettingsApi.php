<?php

namespace Plover\Core\Services\Settings;

use Plover\Core\Router\Auth;
use Plover\Core\Router\Router;

/**
 * @since 1.0.0
 */
class SettingsApi {

	/**
	 * Setting store.
	 *
	 * @var Settings
	 */
	protected $settings;

	/**
	 * Create rest api for settings.
	 *
	 * @param Settings $settings
	 */
	public function __construct( Settings $settings ) {
		$this->settings = $settings;

		// Register rest api for settings.
		add_action( 'rest_api_init', [ $this, 'register_reset_api' ] );
	}

	public function register_reset_api() {
		$router = Router::v1();

		$router->create( '/settings/(?P<group>[0-9|a-z|_-]+)', array( $this, 'update_setting_fields' ) )
		       ->use( array( Auth::class, 'can_manage_options' ) );
		$router->create( '/settings', array( $this, 'update_setting_groups' ) )
		       ->use( array( Auth::class, 'can_manage_options' ) );
		$router->delete( '/settings', array( $this, 'reset_settings' ) )
		       ->use( array( Auth::class, 'can_manage_options' ) );

		$router->register();
	}

	/**
	 * Update setting groups
	 *
	 * @param \WP_REST_Request|null $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function update_setting_groups( ?\WP_REST_Request $request ) {
		$groups = $request->get_params();
		if ( ! is_array( $groups ) ) {
			$groups = array();
		}

		$saved = array();

		foreach ( $groups as $group => $enabled ) {
			if ( $this->settings->update( $group, null, $enabled ) ) {
				$saved[ $group ] = $enabled;
			}
		}

		return rest_ensure_response( $saved );
	}

	/**
	 * Update setting fields.
	 *
	 * @param $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function update_setting_fields( ?\WP_REST_Request $request ) {
		$group  = strtolower( $request->get_param( 'group' ) );
		$fields = $request->get_params();
		$saved  = array();

		foreach ( $fields as $id => $value ) {
			if ( $this->settings->update( $group, $id, $value ) ) {
				$saved[ $id ] = $value;
			}
		}

		return rest_ensure_response( $saved );
	}

	/**
	 * Reset settings.
	 *
	 * @param \WP_REST_Request|null $request
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	public function reset_settings( ?\WP_REST_Request $request ) {
		$group = $request->get_param( 'group' );
		$this->settings->reset( $group );

		return rest_ensure_response( [
			'status' => 'ok'
		] );
	}
}
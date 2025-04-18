<?php

namespace Plover\Core\Assets;

use Plover\Core\Framework\Container\EntryNotFoundException;
use Plover\Core\Plover;

/**
 * @since 1.0.0
 */
abstract class Assets {

	/**
	 * Plover core instance.
	 *
	 * @var Plover
	 */
	protected $core;

	/**
	 * Assets files.
	 *
	 * @var array
	 */
	protected $assets = [];

	/**
	 * Editor assets files.
	 *
	 * @var array
	 */
	protected $editor_assets = [];

	/**
	 * Dashboard assets files.
	 *
	 * @var array
	 */
	protected $dashboard_assets = [];

	/**
	 * Asset type.
	 *
	 * @var string
	 */
	protected $asset_type;

	/**
	 * Create scripts instance.
	 *
	 * @param Plover $core
	 */
	public function __construct( Plover $core ) {
		$this->core       = $core;
		$this->asset_type = str_contains( static::class, 'Style' ) ? 'style' : 'script';

		if ( method_exists( $this, 'boot' ) ) {
			$this->boot();
		}
	}

	/**
	 * Enqueue the asset file in fronted and editor.
	 *
	 * @param string $handle
	 * @param array $args
	 *
	 * @return void
	 */
	public function enqueue_asset( string $handle, array $args ) {
		$this->assets[ $handle ] = $this->parse_asset_args( $args );
	}

	/**
	 * Parse asset args.
	 *
	 * @param $args
	 * @param $extra_deps
	 *
	 * @return array
	 */
	protected function parse_asset_args( $args, $extra_deps = array() ) {
		$args = wp_parse_args( $args, array(
			'raw'       => '',      // inline code
			'device'    => 'all',   // responsive option, css only
			'src'       => '',
			'path'      => '',
			'deps'      => array(),
			'ver'       => false,
			'keywords'  => [],
			'condition' => true,
		) );

		if ( isset( $args['asset'] ) && is_file( $args['asset'] ) ) {
			$asset        = require $args['asset'];
			$args['deps'] = array_merge(
				$args['deps'] ?? array(),
				$asset['dependencies'] ?? array()
			);

			$args['ver'] = $asset['version'] ?? $this->asset_version( $args['ver'] );
		}

		$args['deps'] = array_merge( $args['deps'], ( $extra_deps[ $this->asset_type ] ?? array() ) );
		$args['ver']  = $this->asset_version( $args['ver'] );

		return $args;
	}

	/**
	 * App asset version.
	 *
	 * @return int|mixed|object|null
	 * @throws EntryNotFoundException
	 */
	protected function asset_version( $ver ) {
		if ( $ver === 'core' ) {
			return $this->core->is_debug() ? time() : $this->core->get( 'core.version' );
		}

		return $ver;
	}

	/**
	 * Enqueue the asset file in editor only.
	 *
	 * @param string $handle
	 * @param array $args
	 *
	 * @return void
	 */
	public function enqueue_editor_asset( string $handle, array $args ) {
		if ( ! is_admin() ) {
			return;
		}

		$this->editor_assets[ $handle ] = $this->parse_asset_args( $args, [
			'script' => [
				'plover-editor-data'
			],
		] );
	}

	/**
	 * Enqueue the asset file in admin dashboard.
	 *
	 * @param string $handle
	 * @param array $args
	 *
	 * @return void
	 */
	public function enqueue_dashboard_asset( string $handle, array $args ) {
		if ( ! is_admin() ) {
			return;
		}

		$has_localize = apply_filters( 'plover_core_should_localize_dashboard_data', false );

		$this->dashboard_assets[ $handle ] = $this->parse_asset_args( $args, [
			'script' => $has_localize ? array( 'plover-dashboard-data' ) : array()
		] );
	}

	/**
	 * Get all asset files.
	 *
	 * @return array
	 */
	public function get_assets() {
		return apply_filters( 'plover_core_' . $this->asset_type . '_assets', $this->assets );
	}

	/**
	 * Get all editor asset files.
	 *
	 * @return array
	 */
	public function get_editor_assets() {
		return apply_filters( 'plover_core_' . $this->asset_type . '_editor_assets', $this->editor_assets );
	}

	/**
	 * Get all dashboard asset files.
	 *
	 * @return array
	 */
	public function get_dashboard_assets() {
		return apply_filters( 'plover_core_' . $this->asset_type . '_dashboard_assets', $this->dashboard_assets );
	}
}
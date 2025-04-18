<?php

namespace Plover\Core\Services\Settings;

use Plover\Core\Plover;

/**
 * @since 1.0.0
 */
class Modules {
	/**
	 * All registered modules.
	 *
	 * @var array
	 */
	protected $modules = [];

	/**
	 * All registered module groups.
	 *
	 * @var array
	 */
	protected $groups = [];

	/**
	 * @var Plover
	 */
	protected $core;

	/**
	 * @var Settings
	 */
	protected $settings;

	/**
	 * Create modules instance.
	 *
	 * @param Plover $core
	 */
	public function __construct( Plover $core, Settings $settings ) {
		$this->core     = $core;
		$this->settings = $settings;

		$this->register_group( 'theme', array(
			'label'       => __( 'Theme', 'plover' ),
			'description' => __( 'Extensions provided by the active theme.', 'plover' ),
		) );
		$this->register_group( 'default', array(
			'label'       => __( 'Modules', 'plover' ),
			'description' => __( 'Standalone feature, similar to a WordPress plugin.', 'plover' ),
		) );
		$this->register_group( 'blocks', array(
			'label'       => __( 'Blocks', 'plover' ),
			'description' => __( 'Blocks or block variations provided by this plugin.', 'plover' ),
		) );
		$this->register_group( 'extensions', array(
			'label'       => __( 'Block Extensions', 'plover' ),
			'description' => __( 'Extensions to specific core blocks.', 'plover' ),
		) );
		$this->register_group( 'supports', array(
			'label'       => __( 'Block Supports', 'plover' ),
			'description' => __( 'Features that can be shared by multiple block types.', 'plover' ),
		) );

		add_filter( 'plover_core_dashboard_data', function ( $data ) {
			$data['modules']       = array_map( function ( $module ) {
				$module['label']       = esc_html( $module['label'] );
				$module['excerpt']     = esc_html( $module['excerpt'] );
				$module['order']       = absint( $module['order'] );
				$module['description'] = wp_kses_post( $module['description'] );

				return $module;
			}, $this->modules );
			$data['module_groups'] = $this->groups;

			return $data;
		} );
	}

	/**
	 * Register a module group.
	 *
	 * @param $slug
	 * @param array $args
	 *
	 * @return void
	 */
	public function register_group( $slug, $args = array() ) {
		static $order = 0;

		$args = wp_parse_args( $args, array(
			'label'       => '',
			'description' => '',
			'order'       => $order ++,
		) );

		if ( ! empty( $args['label'] ) ) {
			$this->groups[ $slug ] = array(
				'label'       => esc_html( $args['label'] ),
				'description' => esc_html( $args['description'] ),
				'order'       => absint( $args['order'] ),
			);
		}
	}

	/**
	 * Register module.
	 *
	 * @param $id
	 * @param $args
	 *
	 * @return void
	 * @throws \Exception
	 */
	public function register( $id, $args = array() ) {
		if ( isset( $this->modules[ $id ] ) ) {
			return;
		}

		static $order = 0;

		$args = wp_parse_args( $args, array(
			'recent'      => false,
			'premium'     => false,
			'group'       => 'default',
			'label'       => '',
			'enabled'     => 'yes',
			'excerpt'     => '',
			'icon'        => '',
			'description' => '',
			'fields'      => array(),
			'order'       => $order ++,
		) );

		$this->settings->add_group( $id, array(
			'default' => $args['enabled'],
		) );

		$fields          = $args['fields'] ?? array();
		$args['enabled'] = $this->settings->get( $id );
		$args['fields']  = array();

		$this->modules[ $id ] = $args;

		foreach ( $fields as $field => $field_args ) {
			$this->add_field( $id, $field, $field_args );
		}
	}

	/**
	 * Add a field to exists module.
	 *
	 * @param $module
	 * @param $field
	 * @param $args
	 *
	 * @return void
	 */
	public function add_field( $module, $field, $args = array() ) {
		if ( ! isset( $this->modules[ $module ] ) ) {
			return;
		}

		$field_args = wp_parse_args( $args, array(
			'label'   => '',
			'default' => '',
			'control' => Control::T_TEXT,
		) );

		$this->settings->add_field( $module, $field, array(
			'default'  => $field_args['default'],
			'sanitize' => Control::sanitize(
				$field_args['control'],
				array_merge(
					$field_args['control_args'] ?? array(),
					array( 'default' => $field_args['default'] )
				)
			),
		) );

		$field_args['value'] = $this->settings->get( $module, $field );

		$this->modules[ $module ]['fields'][ $field ] = $field_args;
	}

	/**
	 * Get registered field args
	 *
	 * @param $module
	 * @param $field
	 *
	 * @return mixed|null
	 */
	public function get_field( $module, $field ) {
		return $this->modules[ $module ]['fields'][ $field ] ?? null;
	}

	/**
	 * Unregister exists module.
	 *
	 * @param $slug
	 *
	 * @return void
	 */
	public function unregister( $slug ) {
		unset( $this->modules[ $slug ] );
	}
}
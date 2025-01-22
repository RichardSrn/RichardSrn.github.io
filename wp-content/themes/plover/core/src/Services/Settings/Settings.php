<?php

namespace Plover\Core\Services\Settings;

use Plover\Core\Toolkits\Arr;
use Plover\Core\Toolkits\Format;

/**
 * @since 1.0.0
 */
class Settings {

	/**
	 * All setting groups.
	 *
	 * @var array
	 */
	protected $groups = array();

	/**
	 * Add a new setting group.
	 *
	 * @param $id
	 * @param array $args
	 *
	 * @return void
	 */
	public function add_group( $id, array $args = array() ) {
		$args = wp_parse_args( $args, array(
			'default' => 'yes',
			'fields'  => array(),
		) );

		if ( ! isset( $this->groups[ $id ] ) ) {
			$this->groups[ $id ] = array(
				'default' => $args['default'],
				'value'   => get_option( $id . '_enabled', $args['default'] ),
				'fields'  => array(),
			);
		}

		foreach ( $args['fields'] as $field_id => $field_args ) {
			$this->add_field( $id, $field_id, $field_args );
		}
	}

	/**
	 * Add a setting field to an existed setting group.
	 *
	 * @param $group
	 * @param $field_id
	 * @param $field_args
	 *
	 * @return array|false
	 */
	public function add_field( $group, $field_id, $field_args ) {
		if ( ! isset( $this->groups[ $group ] ) ) {
			return false;
		}

		$field_args = wp_parse_args( $field_args, array(
			'default'  => '',
			'sanitize' => 'sanitize_text_field',
		) );

		$fields_data = get_option( $group . '_fields', array() );

		$field_args['value'] = $fields_data[ $field_id ] ?? $field_args['default'];

		$this->groups[ $group ]['fields'][ $field_id ] = $field_args;

		return $field_args;
	}

	/**
	 * Get setting group data.
	 *
	 * @param $id
	 *
	 * @return mixed|null
	 */
	public function group( $id ) {
		return $this->groups[ $id ] ?? null;
	}

	/**
	 * Save setting
	 *
	 * @param $group
	 * @param $field
	 * @param $value
	 *
	 * @return bool
	 */
	public function update( $group, $field, $value ) {
		if ( ! isset( $this->groups[ $group ] ) ) {
			return false;
		}

		// update group it self
		if ( $field === null ) {
			$value = Format::sanitize_checkbox( $value );

			$this->groups[ $group ]['value'] = $value;
			update_option( $group . '_enabled', $value );

			return true;
		}

		// illegal field
		if ( ! isset( $this->groups[ $group ]['fields'][ $field ] ) ) {
			return false;
		}

		$sanitize = $this->groups[ $group ]['fields'][ $field ]['sanitize'] ?? null;
		if ( $sanitize ) {
			$value = call_user_func( $sanitize, $value );
		}

		$field_values           = Arr::pluck( $this->groups[ $group ]['fields'], 'value' );
		$field_values[ $field ] = $value;

		$this->groups[ $group ]['fields'][ $field ]['value'] = $value;
		update_option( $group . '_fields', $field_values );

		return true;
	}

	/**
	 * @param $group
	 * @param $field
	 * @param $default
	 *
	 * @return bool
	 */
	public function checked( $group, $field = null, $default = null ) {
		$v = $this->get( $group, $field, $default );

		return $v === 'yes' || $v === true;
	}

	/**
	 * Get group/field saved value.
	 *
	 * @param $group
	 * @param null $field
	 * @param null $default
	 *
	 * @return mixed|null
	 */
	public function get( $group, $field = null, $default = null ) {
		$group_data = $this->groups[ $group ] ?? null;
		if ( ! $group_data ) {
			return $default;
		}

		if ( $field === null ) {
			return $group_data['value'] ?? $default;
		}

		return $group_data['fields'][ $field ]['value'] ?? $default;
	}

	/**
	 * Get all setting groups.
	 *
	 * @return array
	 */
	public function all() {
		return $this->groups;
	}

	/**
	 * Reset setting groups.
	 *
	 * @param $group
	 *
	 * @return void
	 */
	public function reset( $group = null ) {
		if ( $group !== null ) {
			$this->reset_group( $group );
		} else {
			foreach ( $this->groups as $group => $args ) {
				$this->reset_group( $group );
			}
		}
	}

	/**
	 * Reset a group.
	 *
	 * @param $group
	 *
	 * @return void
	 */
	protected function reset_group( $group ) {
		if ( ! isset( $this->groups[ $group ] ) ) {
			return;
		}

		delete_option( $group . '_enabled' );
		delete_option( $group . '_fields' );

		$this->groups[ $group ]['value'] = $this->groups[ $group ]['default'] ?? null;
		foreach ( $this->groups[ $group ]['fields'] as $field => $args ) {
			$this->groups[ $group ]['fields'][ $field ]['value'] = $this->groups[ $group ]['fields'][ $field ]['default'] ?? null;
		}
	}
}
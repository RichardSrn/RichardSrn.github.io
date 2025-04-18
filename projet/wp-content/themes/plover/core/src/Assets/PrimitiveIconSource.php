<?php

namespace Plover\Core\Assets;

use Plover\Core\Assets\Contract\IconSource;
use Plover\Core\Toolkits\Format;

/**
 * @since 1.0.0
 */
class PrimitiveIconSource implements IconSource {

	/**
	 * Cached libraries.
	 *
	 * @var null
	 */
	protected $libraries = null;

	/**
	 * Get a library.
	 *
	 * @param $slug
	 *
	 * @return mixed|null
	 */
	public function get_library( $slug ) {
		$libraries = $this->get_primitive_libraries();
		foreach ( $libraries as $library ) {
			if ( isset( $library['slug'] ) && $library['slug'] === $slug ) {
				return $library;
			}
		}

		return null;
	}

	/**
	 * Get primitive libraries.
	 *
	 * @return mixed|null
	 */
	public function get_libraries() {
		$libraries = array_map( function ( $library ) {
			if ( ! is_array( $library ) || ! isset( $library['slug'] ) ) {
				return null;
			}

			return array(
				'name' => isset( $library['name'] ) ? $library['name'] : $library['slug'],
				'slug' => $library['slug'],
			);

		}, $this->get_primitive_libraries() );

		return array_filter( $libraries );
	}

	/**
	 * Get all icons from library.
	 *
	 * @param $library
	 *
	 * @return array|mixed|null
	 */
	public function get_icons( $library ) {
		$library_data = $this->get_library( $library );
		if ( ! $library_data ) {
			return null;
		}

		$icons = isset( $library_data['icons'] ) ? $library_data['icons'] : [];

		return array_filter( array_map( [ $this, 'sanitize_icon' ], $icons ) );
	}

	/**
	 * Get specific icon from a library.
	 *
	 * @param $library
	 * @param $slug
	 *
	 * @return mixed|null
	 */
	public function get_icon( $library, $slug ) {
		$icons = $this->get_icons( $library );
		if ( is_array( $icons ) ) {
			foreach ( $icons as $icon ) {
				if ( isset( $icon['slug'] ) && $icon['slug'] === $slug ) {
					return $icon['svg'] ?? null;
				}
			}
		}

		return null;
	}

	/**
	 * @param $icon
	 *
	 * @return null
	 */
	public function sanitize_icon( $icon ) {
		if ( ! is_array( $icon ) || ! isset( $icon['slug'] ) ) {
			return null;
		}

		$icon['svg'] = isset( $icon['svg'] ) ? Format::sanitize_svg( $icon['svg'] ) : '';

		return $icon['svg'] ? $icon : null;
	}

	/**
	 * Get primitive libraries.
	 *
	 * @return mixed|null
	 */
	protected function get_primitive_libraries() {
		if ( ! $this->libraries ) {
			$this->libraries = apply_filters( 'plover_core_icon_primitive_libraries', [] );
		}

		return $this->libraries;
	}
}
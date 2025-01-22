<?php

namespace Plover\Core\Assets;

use Plover\Core\Assets\Contract\IconSource;
use Plover\Core\Plover;
use Plover\Core\Toolkits\Arr;
use Plover\Core\Toolkits\Format;

/**
 * Icon library and icons handler.
 *
 * @since 1.0.0
 */
class Icons {

	/**
	 * Plover core.
	 *
	 * @var Plover
	 */
	protected $core;

	/**
	 * Registered icon sources.
	 *
	 * @var array
	 */
	protected $sources = [];

	/**
	 * Create icons instance.
	 *
	 * @param Plover $core
	 */
	public function __construct( Plover $core ) {
		$this->core = $core;

		$this->register_icon_source( new PrimitiveIconSource(), 11 );
	}

	/**
	 * @param IconSource $source
	 * @param int $priority
	 *
	 * @return void
	 */
	public function register_icon_source( IconSource $source, int $priority = 10 ) {
		$this->sources[ $priority ][] = $source;
	}

	/**
	 * @param $library
	 * @param $slug
	 *
	 * @return string|null
	 */
	public function get_icon( $library, $slug ) {
		$svg = $this->retrieve_from_icon_source( 'get_icon', $library, $slug );
		if ( ! is_string( $svg ) ) {
			return null;
		}

		return Format::sanitize_svg( $svg );
	}

	/**
	 * Get library info.
	 *
	 * @param $library
	 *
	 * @return mixed|null
	 */
	public function get_library( $library ) {
		return $this->retrieve_from_icon_source( 'get_library', $library );
	}

	/**
	 * Get all libraries.
	 *
	 * @return array|mixed|null
	 */
	public function get_libraries() {
		$libraries = $this->retrieve_all_from_icon_source( 'get_libraries' );

		return apply_filters( 'plover_core_icon_libraries', $libraries );
	}

	/**
	 * @param $library
	 *
	 * @return array|null
	 */
	public function get_icons( $library ) {
		$icons = $this->retrieve_from_icon_source( 'get_icons', $library );
		if ( ! is_array( $icons ) ) {
			$icons = [];
		}

		return apply_filters( "plover_core_{$library}_icons", $icons );
	}

	/**
	 * Retrieve data from the icon sources in order of priority.
	 *
	 * @param $method
	 * @param ...$args
	 *
	 * @return mixed|null
	 */
	protected function retrieve_from_icon_source( $method, ...$args ) {
		$priorities = array_keys( $this->sources );
		sort( $priorities );

		foreach ( $priorities as $priority ) {
			foreach ( $this->sources[ $priority ] as $source ) {
				$data = call_user_func_array( [ $source, $method ], $args );
				if ( $data ) {
					return $data;
				}
			}
		}

		return null;
	}

	/**
	 * Retrieve all data from each icon source in order of priority.
	 *
	 * @param $method
	 * @param ...$args
	 *
	 * @return mixed|null
	 */
	protected function retrieve_all_from_icon_source( $method, ...$args ) {
		$priorities = array_keys( $this->sources );
		sort( $priorities );
		$result = [];

		foreach ( $priorities as $priority ) {
			foreach ( $this->sources[ $priority ] as $source ) {
				$data = call_user_func_array( [ $source, $method ], $args );
				if ( is_array( $data ) ) {
					$result = array_merge( $result, $data );
				} else if ( $data ) {
					$result[] = $data;
				}
			}
		}

		return $result;
	}
}
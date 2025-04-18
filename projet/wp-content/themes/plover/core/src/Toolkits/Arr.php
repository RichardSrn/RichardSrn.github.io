<?php

namespace Plover\Core\Toolkits;

/**
 * @since 1.0.0
 */
class Arr {

	/**
	 * Pluck an array of values from an array.
	 *
	 * @param array $array
	 * @param string $value
	 * @param $key
	 *
	 * @return array
	 */
	public static function pluck( array $array, string $value, $key = null ) {
		$result = [];

		foreach ( $array as $origin_key => $item ) {
			if ( $key && isset( $item[ $key ] ) ) {
				$result[ $item[ $key ] ] = $item[ $value ];
			} else {
				$result[ $origin_key ] = $item[ $value ];
			}
		}

		return $result;
	}

	/**
	 * Just like Object.fromEntries in JavaScript
	 *
	 * @param array $array
	 *
	 * @return array
	 */
	public static function from_entries( array $array ) {
		$result = [];
		foreach ( $array as $item ) {
			if ( isset( $item[0] ) ) {
				$result[ $item[0] ] = $item[1] ?? null;
			}
		}

		return $result;
	}
}
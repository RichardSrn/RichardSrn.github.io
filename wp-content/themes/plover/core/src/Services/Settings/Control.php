<?php

namespace Plover\Core\Services\Settings;

use Plover\Core\Toolkits\Format;

/**
 * @since 1.0.0
 */
class Control {

	const T_PLACEHOLDER = 'placeholder';
	const T_TEXT = 'text';
	const T_SELECT = 'select';
	const T_SWITCH = 'switch';
	const T_TAGS = 'tags';
	const T_NUMBER = 'number';

	/**
	 * @param $control
	 * @param $args
	 *
	 * @return mixed|string|string[]
	 */
	public static function sanitize( $control, $args, $default = 'sanitize_text_field' ) {
		if ( method_exists( Format::class, "sanitize_{$control}" ) ) {
			return [ Format::class, "sanitize_{$control}" ];
		}

		if ( method_exists( Format::class, "create_{$control}_sanitizer" ) ) {
			return call_user_func( [ Format::class, "create_{$control}_sanitizer" ], $args );
		}

		return $default;
	}
}

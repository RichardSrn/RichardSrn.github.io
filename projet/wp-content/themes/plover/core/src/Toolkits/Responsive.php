<?php

namespace Plover\Core\Toolkits;

/**
 * Utils for responsive design.
 *
 * @since 1.0.0
 */
class Responsive {

	/**
	 * @param $value
	 * @param bool $fill
	 *
	 * @return array
	 */
	public static function promote_scalar_value_into_responsive( $value, bool $fill = false ) {
		if ( is_array( $value ) && isset( $value['desktop'] ) ) {
			$valueWithResponsive = $value;
		} else {
			$valueWithResponsive = array(
				'desktop' => $value,
				'tablet'  => '__INITIAL_VALUE__',
				'mobile'  => '__INITIAL_VALUE__',
			);
		}

		if ( $fill ) {
			if ( ! isset( $valueWithResponsive['tablet'] ) || $valueWithResponsive['tablet'] === '__INITIAL_VALUE__' ) {
				$valueWithResponsive['tablet'] = $valueWithResponsive['desktop'];
			}
			if ( ! isset( $valueWithResponsive['mobile'] ) || $valueWithResponsive['mobile'] === '__INITIAL_VALUE__' ) {
				$valueWithResponsive['mobile'] = $valueWithResponsive['tablet'];
			}
		}

		return $valueWithResponsive;
	}

	/**
	 * @param $value
	 * @param $device
	 *
	 * @return mixed
	 */
	public static function get_scalar_value_by_device( $value, $device = 'desktop' ) {
		return self::promote_scalar_value_into_responsive( $value, true )[ $device ];
	}

	/**
	 * Wrap desktop only css with media query.
	 *
	 * @param $css
	 *
	 * @return string
	 */
	public static function desktop_css( $css ) {
		return $css; // desktop first, don't need any media query.
	}

	/**
	 * Get tablet breakpoint
	 *
	 * @return mixed|null
	 */
	public static function tablet_breakpoint( $mobileFirst = false ) {
		$breakpoint = apply_filters( 'plover_core_css_tablet_breakpoint', 782 );
		if ( ! $mobileFirst ) {
			$breakpoint --;
		}

		return $breakpoint . 'px';
	}

	/**
	 * Wrap tablet only css with media query.
	 *
	 * @param $css
	 *
	 * @return string
	 */
	public static function tablet_css( $css ) {
		return '@media (max-width: ' . self::tablet_breakpoint() . ') {' . $css . '}';
	}

	/**
	 * Get mobile breakpoint
	 *
	 * @return mixed|null
	 */
	public static function mobile_breakpoint( $mobileFirst = false ) {
		$breakpoint = apply_filters( 'plover_core_css_mobile_breakpoint', 600 );
		if ( ! $mobileFirst ) {
			$breakpoint --;
		}

		return $breakpoint . 'px';
	}

	/**
	 * Wrap mobile only css with media query.
	 *
	 * @param $css
	 *
	 * @return string
	 */
	public static function mobile_css( $css ) {
		return '@media (max-width: ' . self::mobile_breakpoint() . ') {' . $css . '}';
	}
}
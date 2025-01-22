<?php

namespace Plover\Core\Toolkits;

use enshrined\svgSanitize\data\AllowedAttributes;
use Plover\Core\Toolkits\Html\Document;

/**
 * Sanitize and escape utils.
 *
 * @since 1.0.0
 */
class Format {

	const ALL_UNITS = [
		'px'    => [
			'value' => 'px',
			'step'  => 1,
		],
		'%'     => [
			'value' => '%',
			'step'  => 0.1,
		],
		'em'    => [
			'value' => 'em',
			'step'  => 0.01,
		],
		'rem'   => [
			'value' => 'rem',
			'step'  => 0.01,
		],
		'vw'    => [
			'value' => 'vw',
			'step'  => 0.1,
		],
		'vh'    => [
			'value' => 'vh',
			'step'  => 0.1,
		],
		'vmin'  => [
			'value' => 'vmin',
			'step'  => 0.1,
		],
		'vmax'  => [
			'value' => 'vmax',
			'step'  => 0.1,
		],
		'ch'    => [
			'value' => 'ch',
			'step'  => 0.01,
		],
		'ex'    => [
			'value' => 'ex',
			'step'  => 0.01,
		],
		'cm'    => [
			'value' => 'cm',
			'step'  => 0.001,
		],
		'mm'    => [
			'value' => 'mm',
			'step'  => 0.1,
		],
		'in'    => [
			'value' => 'in',
			'step'  => 0.001,
		],
		'pc'    => [
			'value' => 'pc',
			'step'  => 1,
		],
		'pt'    => [
			'value' => 'pt',
			'step'  => 1,
		],
		'svw'   => [
			'value' => 'svw',
			'step'  => 0.1,
		],
		'svh'   => [
			'value' => 'svh',
			'step'  => 0.1,
		],
		'svi'   => [
			'value' => 'svi',
			'step'  => 0.1,
		],
		'svb'   => [
			'value' => 'svb',
			'step'  => 0.1,
		],
		'svmin' => [
			'value' => 'svmin',
			'step'  => 0.1,
		],
		'lvw'   => [
			'value' => 'lvw',
			'step'  => 0.1,
		],
		'lvh'   => [
			'value' => 'lvh',
			'step'  => 0.1,
		],
		'lvi'   => [
			'value' => 'lvi',
			'step'  => 0.1,
		],
		'lvb'   => [
			'value' => 'lvb',
			'step'  => 0.1,
		],
		'lvmin' => [
			'value' => 'lvmin',
			'step'  => 0.1,
		],
		'dvw'   => [
			'value' => 'dvw',
			'step'  => 0.1,
		],
		'dvh'   => [
			'value' => 'dvh',
			'step'  => 0.1,
		],
		'dvi'   => [
			'value' => 'dvi',
			'step'  => 0.1,
		],
		'dvb'   => [
			'value' => 'dvb',
			'step'  => 0.1,
		],
		'dvmin' => [
			'value' => 'dvmin',
			'step'  => 0.1,
		],
		'dvmax' => [
			'value' => 'dvmax',
			'step'  => 0.1,
		],
		'svmax' => [
			'value' => 'svmax',
			'step'  => 0.1,
		],
		'lvmax' => [
			'value' => 'lvmax',
			'step'  => 0.1,
		],
	];

	/**
	 * Generates a closure to sanitize a fixed set of values.
	 *
	 * @param $args
	 *
	 * @return \Closure
	 */
	public static function create_select_sanitizer( $args = array() ) {
		return function ( $input ) use ( $args ) {
			// Get list of choices from the control associated with the setting.
			$options = $args['options'] ?? array();

			// If the input is valid, return it; otherwise, return the default.
			return in_array( $input, Arr::pluck( $options, 'value' ) ) ? $input : ( $args['default'] ?? null );
		};
	}

	/**
	 * Generates a closure to sanitize tags value.
	 *
	 * @param $args
	 *
	 * @return \Closure
	 */
	public static function create_tags_sanitizer( $args = array() ) {
		return function ( $input ) use ( $args ) {
			if ( is_string( $input ) ) {
				$input = explode( ',', $input );
			}

			if ( ! is_array( $input ) ) {
				return [];
			}

			if ( isset( $args['suggestions'] ) && ( $args['validate'] ?? false ) ) {
				$input = array_filter( $input, function ( $item ) use ( $args ) {
					return in_array( $item, $args['suggestions'] );
				} );
			}

			return $input;
		};
	}

	/**
	 * @param $str
	 *
	 * @return string
	 */
	public static function sanitize_text( $str ) {
		return sanitize_text_field( $str );
	}

	/**
	 * Alias for sanitize_checkbox.
	 *
	 * @param $checked
	 *
	 * @return string
	 */
	public static function sanitize_switch( $checked ) {
		return static::sanitize_checkbox( $checked );
	}

	/**
	 * Checkbox value sanitization callback.
	 *
	 * Sanitization callback for 'checkbox' type controls. This callback sanitizes `$checked`
	 * as a boolean value, either TRUE or FALSE.
	 *
	 * @param $checked
	 *
	 * @return string
	 */
	public static function sanitize_checkbox( $checked ) {
		return ( $checked === 'yes' || $checked === true ) ? 'yes' : 'no';
	}

	/**
	 * Sanitize raw SVG string.
	 *
	 * @param string $svg
	 *
	 * @return string
	 */
	public static function sanitize_svg( $svg ) {
		static $sanitizer = null;

		if ( is_null( $sanitizer ) ) {
			$sanitizer = new \enshrined\svgSanitize\Sanitizer();
			$sanitizer->minify( true );
			$sanitizer->removeXMLTag( true );
		}

		$dom    = new Document( $svg );
		$svg_el = $dom->get_element_by_tag_name( 'svg' );
		if ( ! $svg_el ) {
			return '';
		}

		// Removing attributes that affect custom style for SVG element.
		$svg_el->remove_attribute( 'width' );
		$svg_el->remove_attribute( 'height' );
		$svg_el->remove_attribute( 'style' );
		$svg_el->remove_attribute( 'class' );
		$svg = $dom->save_html();

		$svg = $sanitizer->sanitize( $svg );

		// Remove comments and spaces to minify store size.
		$svg = preg_replace( '/<!--(.|\s)*?-->/', '', $svg );
		$svg = preg_replace( '/\s+/', ' ', $svg );
		$svg = preg_replace( '/\t+/', '', $svg );
		$svg = preg_replace( '/>\s+</', '><', $svg );
		// Correct viewBox.
		$svg = str_replace( 'viewbox=', 'viewBox=', $svg );

		return $svg;
	}

	/**
	 * Sanitize value with unit
	 *
	 * @param $value
	 * @param $default_unit
	 *
	 * @return string
	 */
	public static function sanitize_unit_value( $value, $default_unit = 'px' ) {
		list( $quantity, $unit ) = self::parse_quantity_and_unit_from_raw_value( $value );

		if ( $quantity === null ) {
			return '';
		}

		$unit = $unit ? $unit : $default_unit;

		return "{$quantity}{$unit}";
	}

	/**
	 * @param $raw_value
	 * @param $allowed_units
	 *
	 * @return array
	 */
	public static function parse_quantity_and_unit_from_raw_value( $raw_value, $allowed_units = [] ) {
		if ( empty( $allowed_units ) ) {
			$allowed_units = Arr::pluck( array_values( self::ALL_UNITS ), 'value' );
		}

		$trimmedValue = isset( $raw_value ) ? trim( (string) $raw_value ) : '';
		if ( empty( $trimmedValue ) ) {
			return [ null, null ];
		}

		$parsedQuantity   = floatval( $trimmedValue );
		$quantityToReturn = is_finite( $parsedQuantity ) ? $parsedQuantity : null;

		$unitMatch   = preg_match( '/[\d.\-\+]*\s*(.*)/', $trimmedValue, $matches ) ? $matches : null;
		$matchedUnit = isset( $unitMatch[1] ) ? strtolower( $unitMatch[1] ) : null;

		$unitToReturn = in_array( $matchedUnit, $allowed_units ) ? $matchedUnit : null;

		return [ $quantityToReturn, $unitToReturn ];
	}

	/**
	 * Format inline JavaScript code.
	 *
	 * @param string $js
	 *
	 * @return string
	 */
	public static function inline_js( $js ) {
		$js = str_replace( '"', "'", $js );
		$js = trim( rtrim( $js, ';' ) );
		$js = Str::reduce_whitespace( $js );
		$js = Str::remove_line_breaks( $js );

		return apply_filters( 'plover_core_format_inline_js', $js );
	}

	/**
	 * Format inline CSS code.
	 *
	 * @param string $css
	 *
	 * @return string
	 */
	public static function inline_css( $css ) {
		return StyleEngine::compile_css(
			StyleEngine::css_to_declarations( $css )
		);
	}
}
<?php

namespace Plover\Core\Toolkits;

/**
 * Handle block css string & declarations
 *
 * @since 1.0.0
 */
class StyleEngine {

	/**
	 * A utility for constructing className strings conditionally.
	 *
	 * @param ...$args
	 *
	 * @return string
	 */
	public static function clsx( ...$args ) {
		$classNames = array();

		foreach ( $args as $arg ) {
			if ( is_string( $arg ) && $arg !== '' ) {
				$classNames[] = $arg;
			} elseif ( is_array( $arg ) ) {
				foreach ( $arg as $k => $v ) {
					if ( is_string( $v ) ) {
						$classNames[] = $v;
					} elseif ( is_bool( $v ) && $v === true ) {
						$classNames[] = $k;
					}
				}
			}
		}

		return implode( ' ', $classNames );
	}

	/**
	 * Converts string of CSS rules to an array.
	 *
	 * @param string $css
	 *
	 * @return array
	 */
	public static function css_to_declarations( string $css ): array {
		$array = [];

		// Prevent svg url strings from being split.
		$css = str_replace( 'xml;', 'xml$', $css );

		$elements = explode( ';', $css );

		foreach ( $elements as $element ) {
			$parts = explode( ':', $element, 2 );
			if ( isset( $parts[1] ) ) {
				$property = $parts[0];
				$value    = $parts[1];

				if ( $value !== '' && $value !== 'null' ) {
					$value = str_replace( 'xml$', 'xml;', $value );

					if ( $value !== '' && $value !== 'null' ) {
						$array[ $property ] = $value;
					}
				}
			}
		}

		return $array;
	}

	/**
	 * Compile css declarations to string
	 *
	 * @param array $declarations
	 *
	 * @return string
	 */
	public static function compile_css( array $declarations ): string {
		return \WP_Style_Engine::compile_css( $declarations, '' );
	}

	/**
	 * @param $attrs
	 *
	 * @return array
	 */
	public static function get_block_color_styles( $attrs ): array {
		$color_styles = array();
		// Text color.
		$preset_text_color    = array_key_exists( 'textColor', $attrs ) ? "var:preset|color|{$attrs['textColor']}" : null;
		$custom_text_color    = $attrs['style']['color']['text'] ?? null;
		$color_styles['text'] = $preset_text_color ? $preset_text_color : $custom_text_color;
		// Background Color.
		$preset_background_color    = array_key_exists( 'backgroundColor', $attrs ) ? "var:preset|color|{$attrs['backgroundColor']}" : null;
		$custom_background_color    = $attrs['style']['color']['background'] ?? null;
		$color_styles['background'] = $preset_background_color ? $preset_background_color : $custom_background_color;

		return $color_styles;
	}

	/**
	 * @param $attrs
	 *
	 * @return array
	 */
	public static function get_block_border_styles( $attrs ): array {
		$border_styles = array();
		$sides         = array( 'top', 'right', 'bottom', 'left' );

		// Border radius.
		if ( isset( $attrs['style']['border']['radius'] ) ) {
			$border_styles['radius'] = $attrs['style']['border']['radius'];
		}

		// Border style.
		if ( isset( $attrs['style']['border']['style'] ) ) {
			$border_styles['style'] = $attrs['style']['border']['style'];
		}

		// Border width.
		if ( isset( $attrs['style']['border']['width'] ) ) {
			$border_styles['width'] = $attrs['style']['border']['width'];
		}

		// Border color.
		$preset_color           = array_key_exists( 'borderColor', $attrs ) ? "var:preset|color|{$attrs['borderColor']}" : null;
		$custom_color           = $attrs['style']['border']['color'] ?? null;
		$border_styles['color'] = $preset_color ? $preset_color : $custom_color;

		// Individual border styles e.g. top, left etc.
		foreach ( $sides as $side ) {
			$border                 = $attrs['style']['border'][ $side ] ?? null;
			$border_styles[ $side ] = array(
				'color' => isset( $border['color'] ) ? $border['color'] : null,
				'style' => isset( $border['style'] ) ? $border['style'] : null,
				'width' => isset( $border['width'] ) ? $border['width'] : null,
			);
		}

		return $border_styles;
	}

	/**
	 * @return array|mixed
	 */
	public static function get_block_shadow_styles() {
		$shadow_attributes = isset( $attrs['style']['shadow'] ) ? $attrs['style']['shadow'] : null;
		if ( isset( $shadow_attributes ) && ! empty( $shadow_attributes ) ) {

			// since 6.1.0
			$shadow_styles = wp_style_engine_get_styles( array( 'shadow' => $shadow_attributes ) );

			if ( ! empty( $shadow_styles['declarations'] ) ) {
				return $shadow_styles['declarations'];
			}
		}

		return array();
	}

	/**
	 * @param $attrs
	 *
	 * @return null|string
	 */
	public static function get_block_gap_value( $attrs ) {
		$gap = $attrs['style']['spacing']['blockGap'] ?? null;
		// Skip if gap value contains unsupported characters.
		// Regex for CSS value borrowed from `safecss_filter_attr`, and used here
		// because we only want to match against the value, not the CSS attribute.
		if ( is_array( $gap ) ) {
			foreach ( $gap as $key => $value ) {
				// Make sure $value is a string to avoid PHP 8.1 deprecation error in preg_match() when the value is null.
				$value = is_string( $value ) ? $value : '';
				$value = $value && preg_match( '%[\\\(&=}]|/\*%', $value ) ? null : $value;

				// Get spacing CSS variable from preset value if provided.
				if ( is_string( $value ) && str_contains( $value, 'var:preset|spacing|' ) ) {
					$index_to_splice = strrpos( $value, '|' ) + 1;
					$slug            = Str::to_kebab_case( substr( $value, $index_to_splice ) );
					$value           = "var(--wp--preset--spacing--$slug)";
				}

				$gap[ $key ] = $value;
			}
		} else {
			// Make sure $gap is a string to avoid PHP 8.1 deprecation error in preg_match() when the value is null.
			$gap = is_string( $gap ) ? $gap : '';
			$gap = $gap && preg_match( '%[\\\(&=}]|/\*%', $gap ) ? null : $gap;

			// Get spacing CSS variable from preset value if provided.
			if ( is_string( $gap ) && str_contains( $gap, 'var:preset|spacing|' ) ) {
				$index_to_splice = strrpos( $gap, '|' ) + 1;
				$slug            = Str::to_kebab_case( substr( $gap, $index_to_splice ) );
				$gap             = "var(--wp--preset--spacing--$slug)";
			}
		}

		if ( is_array( $gap ) ) {
			$gap_row    = isset( $gap['top'] ) ? $gap['top'] : '';
			$gap_column = isset( $gap['left'] ) ? $gap['left'] : '';
			$gap        = $gap_row === $gap_column ? $gap_row : $gap_row . ' ' . $gap_column;
		}

		return $gap;
	}
}

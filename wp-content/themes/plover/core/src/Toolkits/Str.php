<?php

namespace Plover\Core\Toolkits;

/**
 * Utils for string.
 *
 * @since 1.0.0
 */
class Str {

	/**
	 * @param string $string
	 * @param array $search
	 *
	 * @return string
	 */
	public static function to_title_case( string $string, array $search = [ '-', '_' ] ): string {
		return trim( ucwords( str_replace( $search, ' ', $string ) ) );
	}

	/**
	 * Checks if any of the given needles are in the haystack.
	 *
	 * @param string $haystack
	 * @param ...$needles
	 *
	 * @return bool
	 */
	public static function contains_any( string $haystack, ...$needles ): bool {
		foreach ( $needles as $needle ) {
			if ( str_contains( $haystack, $needle ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Replaces multiple whitespace with single.
	 *
	 * @param string $string The string to search.
	 *
	 * @return string
	 *
	 */
	public static function reduce_whitespace( string $string ): string {
		return preg_replace( '/\s+/', ' ', $string );
	}

	/**
	 * Removes line breaks from a string.
	 *
	 * @param string $string
	 *
	 * @return string
	 */
	public static function remove_line_breaks( string $string ): string {
		// Remove zero width spaces and other invisible characters.
		$string = preg_replace( '/^[\pZ\pC]+|[\pZ\pC]+$/u', '', $string );

		// Replace line breaks.
		str_replace( [ "\r", "\n", PHP_EOL, ], '', $string );

		return trim( $string );
	}

	/**
	 * Prepends a leading slash.
	 *
	 * Will remove leading forward and backslashes if it exists already before adding
	 * a leading forward slash. This prevents double slashing a string or path.
	 *
	 * The primary use of this is for paths and thus should be used for paths. It is
	 * not restricted to paths and offers no specific path support.
	 *
	 * @param string $string What to add the leading slash to.
	 *
	 * @return string String with leading slash added.
	 */
	public static function leadingslashit( string $string ): string {
		return '/' . static::unleadingslashit( $string );
	}

	/**
	 * Removes leading forward slashes and backslashes if they exist.
	 *
	 * The primary use of this is for paths and thus should be used for paths. It is
	 * not restricted to paths and offers no specific path support.
	 *
	 * @param string $string What to remove the leading slashes from.
	 *
	 * @return string String without the leading slashes.
	 */
	public static function unleadingslashit( string $string ): string {
		return ltrim( $string, '/\\' );
	}

	/**
	 * @param $input_string
	 *
	 * @return string
	 * @see https://developer.wordpress.org/reference/functions/_wp_to_kebab_case/
	 */
	public static function to_kebab_case( $input_string ) {
		/*
		 * Some notable things we've removed compared to the lodash version are:
		 *
		 * - non-alphanumeric characters: rsAstralRange, rsEmoji, etc
		 * - the groups that processed the apostrophe, as it's removed before passing the string to preg_match: rsApos, rsOptContrLower, and rsOptContrUpper
		 *
		 */
		/** Used to compose unicode character classes. */
		$rsLowerRange       = 'a-z\\xdf-\\xf6\\xf8-\\xff';
		$rsNonCharRange     = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf';
		$rsPunctuationRange = '\\x{2000}-\\x{206f}';
		$rsSpaceRange       = ' \\t\\x0b\\f\\xa0\\x{feff}\\n\\r\\x{2028}\\x{2029}\\x{1680}\\x{180e}\\x{2000}\\x{2001}\\x{2002}\\x{2003}\\x{2004}\\x{2005}\\x{2006}\\x{2007}\\x{2008}\\x{2009}\\x{200a}\\x{202f}\\x{205f}\\x{3000}';
		$rsUpperRange       = 'A-Z\\xc0-\\xd6\\xd8-\\xde';
		$rsBreakRange       = $rsNonCharRange . $rsPunctuationRange . $rsSpaceRange;

		/** Used to compose unicode capture groups. */
		$rsBreak  = '[' . $rsBreakRange . ']';
		$rsDigits = '\\d+'; // The last lodash version in GitHub uses a single digit here and expands it when in use.
		$rsLower  = '[' . $rsLowerRange . ']';
		$rsMisc   = '[^' . $rsBreakRange . $rsDigits . $rsLowerRange . $rsUpperRange . ']';
		$rsUpper  = '[' . $rsUpperRange . ']';

		/** Used to compose unicode regexes. */
		$rsMiscLower = '(?:' . $rsLower . '|' . $rsMisc . ')';
		$rsMiscUpper = '(?:' . $rsUpper . '|' . $rsMisc . ')';
		$rsOrdLower  = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])';
		$rsOrdUpper  = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])';

		$regexp = '/' . implode(
				'|',
				array(
					$rsUpper . '?' . $rsLower . '+' . '(?=' . implode( '|', array( $rsBreak, $rsUpper, '$' ) ) . ')',
					$rsMiscUpper . '+' . '(?=' . implode( '|', array( $rsBreak, $rsUpper . $rsMiscLower, '$' ) ) . ')',
					$rsUpper . '?' . $rsMiscLower . '+',
					$rsUpper . '+',
					$rsOrdUpper,
					$rsOrdLower,
					$rsDigits,
				)
			) . '/u';

		preg_match_all( $regexp, str_replace( "'", '', $input_string ), $matches );

		return strtolower( implode( '-', $matches[0] ) );
	}

	/**
	 * Converts a string to camelCase.
	 *
	 * @param string $string The string to convert.
	 *
	 * @return string
	 */
	public static function to_camel_case( string $string ): string {
		return lcfirst(
			str_replace(
				' ', '',
				ucwords(
					str_replace(
						[ '-', '_' ],
						' ',
						$string
					)
				)
			)
		);
	}
}
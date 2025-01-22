<?php

namespace Plover\Core\Assets;

/**
 * Facade for enqueue and dequeue styles.
 *
 * @since 1.0.0
 */
class Styles extends Assets {

	/**
	 * Registered block styles for specific block.
	 *
	 * @var array
	 */
	protected $block_styles = [];

	/**
	 * Enqueues a stylesheet for a specific block.
	 *
	 * @param string $block_name
	 * @param array $args
	 *
	 * @return void
	 */
	public function enqueue_block_style( string $block_name, array $args ) {
		$args = wp_parse_args( $args, array(
			'handle' => 'plover-' . str_replace( '/', '-', $block_name ),
			'ver'    => $this->core->is_debug() ? time() : false,
		) );

		$args['ver'] = $this->asset_version( $args['ver'] );

		// We allow enqueue multiple stylesheets for a specific block.
		if ( ! isset( $this->block_styles[ $block_name ] ) ) {
			$this->block_styles[ $block_name ] = [];
		}
		$this->block_styles[ $block_name ][] = $args;
	}

	/**
	 * Get all specific block styles.
	 *
	 * @return mixed|null
	 */
	public function all_block_styles() {
		return apply_filters( 'plover_core_all_block_styles', $this->block_styles );
	}

	/**
	 * Assets bootstrap.
	 *
	 * @return void
	 */
	protected function boot() {
		// Add allowed safe css rule.
		add_filter( 'safe_style_css', function ( array $rules ) {
			return array_merge( $rules, array(
				'box-shadow',
				'text-shadow',
			) );
		} );

		// Add allowed safe css attrs.
		add_filter( 'safecss_filter_attr_allow_css', function ( $allow_css, $css_test_string ) {
			if ( ! $allow_css ) {
				/*
				 * Add CSS filter functions drop-shadow() and rgb,rgba color to whitelist by removing them from the test string.
				 */
				$css_test_string = preg_replace(
					'/\b(?:drop-shadow|rgb|rgba)(\((?:[^()]|(?1))*\))/',
					'',
					$css_test_string
				);

				/*
				 * Disallow CSS containing \ ( & } = or comments, except for within url(), var(), calc(), etc.
				 * which were removed from the test string above.
				 */
				$allow_css = ! preg_match( '%[\\\(&=}]|/\*%', $css_test_string );
			}

			return $allow_css;
		}, 10, 2 );
	}
}

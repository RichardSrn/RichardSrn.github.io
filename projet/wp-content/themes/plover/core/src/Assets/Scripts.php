<?php

namespace Plover\Core\Assets;

/**
 * Facade for enqueue and dequeue scripts.
 *
 * @since 1.0.0
 */
class Scripts extends Assets {

	/**
	 * @param $args
	 * @param $extra_deps
	 *
	 * @return array
	 */
	protected function parse_asset_args( $args, $extra_deps = array() ) {
		$asset_args           = parent::parse_asset_args( $args, $extra_deps );
		$asset_args['device'] = 'all'; // make sure device option is 'all' for script.

		return $asset_args;
	}
}

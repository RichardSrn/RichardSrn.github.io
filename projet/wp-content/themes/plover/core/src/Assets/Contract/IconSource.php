<?php

namespace Plover\Core\Assets\Contract;

/**
 * @since 1.0.0
 */
interface IconSource {

	/**
	 * @param $slug
	 *
	 * @return mixed
	 */
	public function get_library( $slug );

	/**
	 * @return mixed
	 */
	public function get_libraries();

	/**
	 * @param $library
	 *
	 * @return mixed
	 */
	public function get_icons( $library );

	/**
	 * @param $library
	 * @param $slug
	 *
	 * @return mixed
	 */
	public function get_icon( $library, $slug );
}

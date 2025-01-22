<?php

namespace Plover\Core\Services\Extensions;

use Plover\Core\Plover;
use Plover\Core\Services\Extensions\Contract\Extension;

/**
 * @since 1.0.0
 */
class Extensions {

	/**
	 * @var bool
	 */
	protected $booted = false;

	/**
	 * All registered extensions.
	 *
	 * @var array
	 */
	protected $extensions = [];

	/**
	 * @var Plover
	 */
	protected $core;

	/**
	 * Create extensions instance.
	 *
	 * @param array $extensions
	 */
	public function __construct( Plover $core ) {
		$this->core = $core;
	}

	/**
	 * Register an extension.
	 *
	 * @param string $abs
	 * @param $extension
	 * @param $override
	 *
	 * @return mixed|object|string|null
	 */
	public function register( string $abs, $extension = null, $override = false ) {
		if ( is_null( $extension ) ) {
			$extension = $abs;
		}

		if ( isset( $this->extensions[ $abs ] ) && ! $override ) {
			return $this->extensions[ $abs ];
		}

		if ( is_string( $extension ) ) {
			$extension = $this->core->make( $extension );
		}

		if ( method_exists( $extension, 'register' ) ) {
			$this->core->call( [ $extension, 'register' ] );
		}

		if ( $this->is_booted() ) {
			$this->boot_extension( $extension );
		}

		$this->extensions[ $abs ] = $extension;

		return $extension;
	}

	/**
	 * Determine if all extensions has booted.
	 *
	 * @return bool
	 */
	public function is_booted(): bool {
		return $this->booted;
	}

	/**
	 * Boot the given extension.
	 *
	 * @param $extension
	 *
	 * @return void
	 */
	protected function boot_extension( $extension ) {
		if ( method_exists( $extension, 'boot' ) ) {
			$this->core->call( [ $extension, 'boot' ] );
		}
	}

	/**
	 * Unregister exists extension.
	 *
	 * @param $abs
	 *
	 * @return void
	 */
	public function unregister( $abs ) {
		unset( $this->extensions[ $abs ] );
	}

	/**
	 * Boot all extensions.
	 *
	 * @return void
	 */
	public function boot() {
		if ( $this->is_booted() ) {
			return;
		}

		foreach ( $this->extensions as $abs => $extension ) {
			if ( method_exists( $extension, 'boot' ) ) {
				$this->core->call( [ $extension, 'boot' ] );
			}
		}

		$this->booted = true;
	}
}

<?php

namespace Plover\Core\Framework;

use Plover\Core\Plover;

/**
 * @since 1.0.0
 */
abstract class ServiceProvider {

	/**
	 * The core instance.
	 *
	 * @var Plover
	 */
	protected $core;

	/**
	 * All the registered booting callbacks.
	 *
	 * @var array
	 */
	protected $booting_callbacks = [];

	/**
	 * All the registered booted callbacks.
	 *
	 * @var array
	 */
	protected $booted_callbacks = [];

	/**
	 * Create a new service provider instance.
	 *
	 * @param Plover $core
	 */
	public function __construct( Plover $core ) {
		$this->core = $core;
	}

	/**
	 * Register any core services.
	 *
	 * @return void
	 */
	public function register() {
		//
	}

	/**
	 * Register a booting callback to be run before the "boot" method is called.
	 *
	 * @param \Closure $callback
	 *
	 * @return void
	 */
	public function booting( \Closure $callback ) {
		$this->booted_callbacks[] = $callback;
	}

	/**
	 * Register a booted callback to be run after the "boot" method is called.
	 *
	 * @param \Closure $callback
	 *
	 * @return void
	 */
	public function booted( \Closure $callback ) {
		$this->booted_callbacks[] = $callback;
	}

	/**
	 * Call the registered booting callbacks.
	 *
	 * @return void
	 */
	public function call_booting_callbacks() {
		$index = 0;

		while ( $index < count( $this->booting_callbacks ) ) {
			$this->core->call( $this->booting_callbacks[ $index ] );

			$index ++;
		}
	}

	/**
	 * Call the registered booted callbacks.
	 *
	 * @return void
	 */
	public function call_booted_callbacks() {
		$index = 0;

		while ( $index < count( $this->booted_callbacks ) ) {
			$this->core->call( $this->booted_callbacks[ $index ] );

			$index ++;
		}
	}

}
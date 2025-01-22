<?php

namespace Plover\Core\Router;

/**
 * @since 1.0.0
 */
class Endpoint {

	/**
	 * Http method
	 *
	 * @var string
	 */
	protected $method;

	/**
	 * Endpoint path
	 *
	 * @var
	 */
	protected $path;

	/**
	 * Endpoint callback
	 *
	 * @var mixed
	 */
	protected $action;

	/**
	 * All middlewares
	 *
	 * @var array
	 */
	protected $middlewares = [];

	/**
	 * Endpoint args
	 *
	 * @var array
	 */
	protected $args = [];

	/**
	 * Create new endpoint
	 *
	 * @param $method
	 * @param $path
	 * @param $action
	 * @param $args
	 * @param array $middlewares
	 */
	public function __construct( string $method, string $path, $action, array $args = [], array $middlewares = [] ) {
		$this->method = $method;
		$this->path   = $path;
		$this->args   = $args;

		$this->action = function ( $request ) use ( $action ) {
			return call_user_func( $action, $request );
		};

		foreach ( $middlewares as $middleware ) {
			$this->use( $middleware );
		}
	}

	/**
	 * Add a middleware to this endpoint
	 *
	 * @param $middleware
	 *
	 * @return Endpoint $this
	 */
	public function use( $middleware ): Endpoint {

		$this->middlewares[] = function ( $next ) use ( $middleware ) {
			return function ( $request ) use ( $middleware, $next ) {
				return call_user_func( $middleware, $request, $next );
			};
		};

		return $this;
	}

	/**
	 * Get endpoint args
	 *
	 * @return array
	 */
	public function getArgs(): array {
		return $this->args;
	}

	/**
	 * @param $args
	 *
	 * @return $this
	 */
	public function setArgs( $args ) {
		$this->args = $args;

		return $this;
	}

	/**
	 * Handle middlewares and action
	 *
	 * @param $request
	 *
	 * @return mixed
	 */
	public function handle( $request ) {

		$handler = $this->action;

		foreach ( array_reverse( $this->middlewares ) as $middleware ) {
			$handler = $middleware( $handler );
		}

		return $handler( $request );
	}
}

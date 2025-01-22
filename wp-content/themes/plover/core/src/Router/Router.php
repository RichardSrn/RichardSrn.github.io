<?php

namespace Plover\Core\Router;

use Plover\Core\Router\Exception\EndpointExistedException;

/**
 * @since 1.0.0
 */
class Router {

	/**
	 * Global namespace
	 *
	 * @var mixed|string
	 */
	protected $namespace;

	/**
	 * Registered routes
	 *
	 * @var array
	 */
	protected $routes = [];

	/**
	 * Global middlewares
	 *
	 * @var array
	 */
	protected $middlewares = [];

	/**
	 * Create new router instance
	 *
	 * @param $namespace
	 */
	public function __construct( $namespace ) {
		$this->namespace = $namespace;
	}

	/**
	 * Create router instance with v1 namespace.
	 *
	 * @return self
	 */
	public static function v1() {
		return new self( 'plover/v1' );
	}

	/**
	 * Add read endpoint
	 *
	 * @param string $path
	 * @param $action
	 * @param array $args
	 *
	 * @return Endpoint
	 * @throws EndpointExistedException
	 */
	public function read( string $path, $action, array $args = [] ): Endpoint {
		return $this->add_endpoint( \WP_REST_Server::READABLE, $path, $action, $args );
	}

	/**
	 * Add an endpoint
	 *
	 * @param string $method
	 * @param string $path
	 * @param $action
	 * @param array $args
	 *
	 * @return Endpoint
	 * @throws EndpointExistedException
	 */
	protected function add_endpoint( string $method, string $path, $action, array $args ): Endpoint {
		if ( ! isset( $this->routes[ $path ] ) ) {
			$this->routes[ $path ] = [];
		}

		if ( isset( $this->routes[ $path ][ $method ] ) ) {
			throw new EndpointExistedException( $this->namespace, $method, $path );
		}

		$this->routes[ $path ][ $method ] = new Endpoint( $method, $path, $action, $args, $this->middlewares );

		return $this->routes[ $path ][ $method ];
	}

	/**
	 * Add create endpoint
	 *
	 * @param string $path
	 * @param $action
	 * @param array $args
	 *
	 * @return Endpoint
	 * @throws EndpointExistedException
	 */
	public function create( string $path, $action, array $args = [] ): Endpoint {
		return $this->add_endpoint( \WP_REST_Server::CREATABLE, $path, $action, $args );
	}

	/**
	 * Add edit endpoint
	 *
	 * @param string $path
	 * @param $action
	 * @param array $args
	 *
	 * @return Endpoint
	 * @throws EndpointExistedException
	 */
	public function edit( string $path, $action, array $args = [] ): Endpoint {
		return $this->add_endpoint( \WP_REST_Server::EDITABLE, $path, $action, $args );
	}

	/**
	 * Add delete endpoint
	 *
	 * @param string $path
	 * @param $action
	 * @param array $args
	 *
	 * @return Endpoint
	 * @throws EndpointExistedException
	 */
	public function delete( string $path, $action, array $args = [] ): Endpoint {
		return $this->add_endpoint( \WP_REST_Server::DELETABLE, $path, $action, $args );
	}

	/**
	 * Add a global middleware
	 *
	 * @param $middleware
	 *
	 * @return $this
	 */
	public function use( $middleware ): Router {

		$this->middlewares[] = $middleware;

		return $this;
	}

	/**
	 * Register all endpoints
	 */
	public function register() {
		foreach ( $this->routes as $path => $endpoints ) {

			$args = [];

			foreach ( $endpoints as $method => $endpoint ) {
				$args[] = [
					'methods'             => $method,
					'callback'            => [ $endpoint, 'handle' ],
					'permission_callback' => '__return_true',
					'args'                => $endpoint->getArgs(),
				];
			}

			register_rest_route( $this->namespace, $path, $args );
		}
	}


}

<?php

namespace Plover\Core;

use Plover\Core\Toolkits\Path;
use Plover\Core\Toolkits\Str;

/**
 * Proxy of \Plover\Core\Plover
 *
 * The application instance hold the global container instance (core),
 * and provide extra project relative methods.
 *
 * @method \Plover\Core\Framework\ServiceProvider register( $provider, $force = false )
 * @method \Plover\Core\Framework\ServiceProvider get_provider( $provider )
 * @method string core_url( string $path = '' )
 * @method string core_path( string $path = '' )
 * @method register_providers( $providers )
 * @method registered( $callback )
 * @method booting( $callback )
 * @method booted( $callback )
 * @method bool is_booted()
 * @method boot()
 * @method string version( $callback )
 * @method bool is_debug()
 * @method mixed get( string $id )
 * @method string getAlias( string $abstract )
 * @method bool isAlias( string $name )
 * @method mixed make( string $abstract, array $parameters = [] )
 * @method bool has( string $id )
 * @method bool bound( string $abstract )
 * @method void singleton( string $abstract, $concrete = null )
 * @method void bind( string $abstract, $concrete = null, bool $shared = false )
 * @method bool resolved( string $abstract )
 * @method void alias( string $alias, string $abstract )
 * @method mixed instance( string $abstract, $instance )
 * @method mixed call( $callback, array $parameters = [], $defaultMethod = null )
 *
 * @since 1.0.0
 */
class Application {

	/**
	 * Saved application instances.
	 *
	 * @var array
	 */
	protected static $instances = [];

	/**
	 * Global container instance.
	 *
	 * @var Plover
	 */
	protected $core;

	/**
	 * The identifier of current application instance.
	 *
	 * @var string
	 */
	protected $app_id;

	/**
	 * Current project root dir.
	 *
	 * @var string
	 */
	protected $app_path;

	/**
	 * Current project url.
	 *
	 * @var string
	 */
	protected $app_url;

	/**
	 * Create application instance.
	 *
	 * @param string $id
	 * @param string $base_path
	 * @param Plover $plover
	 * @param bool $ver
	 */
	public function __construct( $id, $base_path, $base_url, $plover, $ver = false ) {
		$this->app_id             = $id;
		$this->app_path           = untrailingslashit( $base_path );
		$this->app_url            = $base_url ?: content_url( Path::get_segment( $this->app_path, - 2 ) );
		$this->core               = $plover;
		static::$instances[ $id ] = $this;
	}

	/**
	 * Get application instance.
	 *
	 * @param $id
	 *
	 * @return mixed|null
	 */
	public static function get_app( $id ) {
		return static::$instances[ $id ] ?? null;
	}

	/**
	 * Get app asset url.
	 *
	 * @param string $path
	 *
	 * @return string
	 */
	public function app_url( string $path = '' ): string {
		return $this->app_url . Str::leadingslashit( $path );
	}

	/**
	 * Get app asset url.
	 *
	 * @param string $path
	 *
	 * @return string
	 */
	public function app_path( string $path = '' ): string {
		return $this->app_path . Str::leadingslashit( $path );
	}

	/**
	 * 'do_action' wrapper that prefixes the hook name with id.
	 *
	 * @param string $hook_name
	 * @param ...$args
	 */
	public function do_action( string $hook_name, ...$args ) {
		do_action( $this->id( $hook_name, '_' ), ...$args );
	}

	/**
	 * Get prefixed id.
	 *
	 * @param string $id
	 * @param string $sep
	 *
	 * @return string
	 */
	public function id( string $id, string $sep = '-' ): string {
		if ( empty( $this->app_id ) ) {
			return $id;
		}

		return $this->app_id . $sep . $id;
	}

	/**
	 * 'add_action' wrapper that prefixes the hook name with id.
	 *
	 * @param string $hook_name
	 * @param mixed $callback
	 * @param int $priority
	 * @param int $accepted_args
	 */
	public function add_action( string $hook_name, $callback, int $priority = 10, int $accepted_args = 1 ) {
		add_action( $this->id( $hook_name, '_' ), $callback, $priority, $accepted_args );
	}

	/**
	 * 'apply_filters' wrapper that prefixes the hook name with id.
	 *
	 * @param string $hook_name
	 * @param mixed $value
	 *
	 * @return mixed|null
	 */
	public function apply_filters( string $hook_name, $value ) {
		return apply_filters( $this->id( $hook_name, '_' ), $value );
	}

	/**
	 * 'add_filter' wrapper that prefixes the hook name with id.
	 *
	 * @param string $hook_name
	 * @param mixed $callback
	 * @param mixed ...$args
	 */
	public function add_filter( string $hook_name, $callback, ...$args ) {
		add_filter( $this->id( $hook_name, '_' ), $callback, ...$args );
	}

	/**
	 * Proxy all undefined methods to core.
	 *
	 * @param $method
	 * @param $arguments
	 *
	 * @return mixed
	 */
	public function __call( $method, $arguments ) {
		return call_user_func_array( array( $this->core, $method ), $arguments );
	}
}

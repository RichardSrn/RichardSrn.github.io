<?php

namespace Plover\Core;

use Plover\Core\Framework\Container\Container;
use Plover\Core\Framework\ServiceProvider;
use Plover\Core\Services\AssetsServiceProvider;
use Plover\Core\Services\Blocks\BlocksServiceProvider;
use Plover\Core\Services\Extensions\ExtensionsServiceProvider;
use Plover\Core\Services\Settings\SettingsServiceProvider;
use Plover\Core\Toolkits\Path;
use Plover\Core\Toolkits\Str;

/**
 * @since 1.0.0
 */
class Plover extends Container {

	/**
	 * The plover/core framework version.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const VERSION = '1.1.0';

	/**
	 * The core instance.
	 *
	 * @var Plover|null
	 */
	protected static $core_instance = null;

	/**
	 * Indicates if the core has "booted".
	 *
	 * @var bool
	 */
	protected $booted = false;

	/**
	 * All the registered service providers.
	 *
	 * @var array<string, \Plover\Core\Framework\ServiceProvider>
	 */
	protected $service_provides = [];

	/**
	 * The names of the loaded service providers.
	 *
	 * @var array
	 */
	protected $loaded_providers = [];

	/**
	 * The array of registered callbacks.
	 *
	 * @var callable[]
	 */
	protected $registered_callbacks = [];

	/**
	 * The array of booting callbacks.
	 *
	 * @var array callable[]
	 */
	protected $booting_callbacks = [];

	/**
	 * The array of booted callbacks.
	 *
	 * @var array callable[]
	 */
	protected $booted_callbacks = [];

	/**
	 * Create a new plover core instance.
	 *
	 * @param $base_path
	 * @param $base_url
	 */
	public function __construct( $base_path, $base_url ) {
		$this->bind_paths_in_container( $base_path, $base_url );
		$this->register_base_bindings();
		$this->register_base_service_providers();
		$this->register_core_container_aliases();
	}

	/**
	 * Bind all the app & core paths in the container.
	 *
	 * @param string $base_path
	 *
	 * @return $this
	 */
	protected function bind_paths_in_container( string $base_path, string $base_url ): Plover {
		$app_path = untrailingslashit( $base_path );
		// TODO: A generic approach to get core path.
		$core_path = untrailingslashit( dirname( __DIR__ ) );
		$app_url   = $base_url ?: content_url( Path::get_segment( $app_path, - 2 ) );
		$core_url  = $app_url . str_replace( $app_path, '', $core_path );

		$this->instance( 'core.path', $core_path );
		$this->instance( 'core.url', $core_url );

		return $this;
	}

	/**
	 * Register the basic bindings into the container.
	 *
	 * @return void
	 */
	protected function register_base_bindings() {
		static::set_instance( $this );

		$this->instance( 'core.version', static::VERSION );
		$this->instance( 'core', $this );
		$this->instance( Plover::class, $this );
		$this->instance( Container::class, $this );
	}

	/**
	 * Set the shared instance of plover/core.
	 *
	 * @param Plover $core
	 *
	 * @return Plover
	 */
	protected static function set_instance( Plover $core ): Plover {
		return static::$core_instance = $core;
	}

	/**
	 * Register all the base service providers.
	 *
	 * @return void
	 */
	protected function register_base_service_providers() {
		$this->register( new SettingsServiceProvider( $this ) );
		$this->register( new AssetsServiceProvider( $this ) );
		$this->register( new ExtensionsServiceProvider( $this ) );
		$this->register( new BlocksServiceProvider( $this ) );
	}

	/**
	 * Register a service provider with the core.
	 *
	 * @param $provider
	 * @param $force
	 *
	 * @return \Plover\Core\Framework\ServiceProvider
	 */
	public function register( $provider, $force = false ) {
		if ( ( $registered = $this->get_provider( $provider ) ) && ! $force ) {
			return $registered;
		}

		// If the given "provider" is a string, we will resolve it, passing in the
		// application instance automatically. This is simply
		// a more convenient way of specifying our service provider classes.
		if ( is_string( $provider ) ) {
			$provider = $this->resolve_provider( $provider );
		}

		$provider->register();

		// If there are bindings / singletons / aliases set as properties on the provider we
		// will spin through them and register them with the application, which
		// serves as a convenience layer while registering a lot of bindings.
		if ( property_exists( $provider, 'bindings' ) ) {
			foreach ( $provider->bindings as $key => $value ) {
				$this->bind( $key, $value );
			}
		}

		if ( property_exists( $provider, 'singletons' ) ) {
			foreach ( $provider->singletons as $key => $value ) {
				$key = is_int( $key ) ? $value : $key;

				$this->singleton( $key, $value );
			}
		}

		if ( property_exists( $provider, 'aliases' ) ) {
			foreach ( $provider->aliases as $key => $value ) {
				$key = is_int( $key ) ? $value : $key;

				$this->alias( $key, $value );
			}
		}

		$this->mark_as_registered( $provider );

		// If the application has already booted, we will call this boot method on
		// the provider class so it has an opportunity to do its boot logic.
		if ( $this->is_booted() ) {
			$this->boot_provider( $provider );
		}

		return $provider;
	}

	/**
	 * Get the registered service provider if it exists.
	 *
	 * @param $provider
	 *
	 * @return \Plover\Core\Framework\ServiceProvider|null
	 */
	public function get_provider( $provider ) {
		$name = is_string( $provider ) ? $provider : get_class( $provider );

		return $this->service_provides[ $name ] ?? null;
	}

	/**
	 * Resolve a service provider instance from the class name.
	 *
	 * @param string $provider
	 *
	 * @return \Plover\Core\Framework\ServiceProvider
	 */
	protected function resolve_provider( $provider ) {
		return new $provider( $this );
	}

	/**
	 * Mark the given provider as registered.
	 *
	 * @param \Plover\Core\Framework\ServiceProvider $provider
	 *
	 * @return void
	 */
	protected function mark_as_registered( $provider ) {
		$class = get_class( $provider );

		$this->service_provides[ $class ] = $provider;

		$this->loaded_providers[ $class ] = true;
	}

	/**
	 * Determine if the core has booted.
	 *
	 * @return bool
	 */
	public function is_booted() {
		return $this->booted;
	}

	/**
	 * Boot the given service provider.
	 *
	 * @param ServiceProvider $provider
	 *
	 * @return void
	 */
	protected function boot_provider( ServiceProvider $provider ) {
		$provider->call_booting_callbacks();

		if ( method_exists( $provider, 'boot' ) ) {
			$this->call( [ $provider, 'boot' ] );
		}

		$provider->call_booted_callbacks();
	}

	/**
	 * Register the core class aliases in the container.
	 *
	 * @return void
	 */
	protected function register_core_container_aliases() {
		foreach (
			[
				'core' => [ self::class, Container::class ]
			] as $key => $aliases
		) {
			foreach ( $aliases as $alias ) {
				$this->alias( $key, $alias );
			}
		}
	}

	/**
	 * Get the saved globally available instance of plover/core.
	 *
	 * @return mixed|null
	 */
	public static function get_instance() {
		return static::$core_instance;
	}

	/**
	 * Get core asset url.
	 *
	 * @param string $path
	 *
	 * @return string
	 */
	public function core_url( string $path = '' ): string {
		return $this->get( 'core.url' ) . Str::leadingslashit( $path );
	}

	/**
	 * Get core asset path.
	 *
	 * @param string $path
	 *
	 * @return string
	 */
	public function core_path( string $path = '' ): string {
		return $this->get( 'core.path' ) . Str::leadingslashit( $path );
	}

	/**
	 * Register all the configured providers.
	 *
	 * @return void
	 */
	public function register_providers( $providers ) {
		foreach ( $providers as $provider ) {
			$this->register( $provider );
		}

		$this->fire_callbacks( $this->registered_callbacks );
	}

	/**
	 * Call the booting callbacks for the application.
	 *
	 * @param callable[] $callbacks
	 *
	 * @return void
	 */
	protected function fire_callbacks( array &$callbacks ) {
		$priorities = array_keys( $callbacks );
		sort( $priorities );

		foreach ( $priorities as $priority ) {
			foreach ( $callbacks[ $priority ] as $callback ) {
				$this->call( $callback );
			}
		}
	}

	/**
	 * Register a new registered listener.
	 *
	 * @param callable $callback
	 * @param $priority
	 *
	 * @return void
	 */
	public function registered( $callback, $priority = 10 ) {
		$this->registered_callbacks[ $priority ][] = $callback;
	}

	/**
	 * Register a new boot listener.
	 *
	 * @param callable $callback
	 * @param $priority
	 *
	 * @return void
	 */
	public function booting( $callback, $priority = 10 ) {
		$this->booting_callbacks[ $priority ][] = $callback;
	}

	/**
	 * Register a new "booted" listener.
	 *
	 * @param callable $callback
	 * @param $priority
	 *
	 * @return void
	 */
	public function booted( $callback, $priority = 10 ) {
		$this->booted_callbacks[ $priority ][] = $callback;

		if ( $this->is_booted() ) {
			$callback( $this );
		}
	}

	/**
	 * Get the version number of the core framework.
	 *
	 * @return string
	 */
	public function version(): string {
		return static::VERSION;
	}

	/**
	 * Boot the container's service providers.
	 *
	 * @return void
	 */
	public function boot() {
		if ( $this->is_booted() ) {
			return;
		}

		$this->fire_callbacks( $this->booting_callbacks );

		array_walk( $this->service_provides, function ( $p ) {
			$this->boot_provider( $p );
		} );

		$this->booted = true;

		$this->fire_callbacks( $this->booted_callbacks );
	}

	/**
	 * Is debug mode on or not.
	 *
	 * @return bool
	 * @todo project-related switches
	 */
	public function is_debug(): bool {
		return defined( 'WP_DEBUG' ) && WP_DEBUG;
	}
}

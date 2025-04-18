<?php

namespace Plover\Core\Framework\Container;

/**
 * @since 1.0.0
 */
class BoundMethod {
	/**
	 * Call the given Closure / class@method and inject its dependencies.
	 *
	 * @param Container $container
	 * @param callable|string $callback
	 * @param array $parameters
	 * @param string|null $defaultMethod
	 *
	 * @return mixed
	 *
	 * @throws \ReflectionException
	 * @throws \InvalidArgumentException
	 */
	public static function call( $container, $callback, array $parameters = [], $defaultMethod = null ) {
		if ( is_string( $callback ) && ! $defaultMethod && method_exists( $callback, '__invoke' ) ) {
			$defaultMethod = '__invoke';
		}

		if ( static::isCallableWithAtSign( $callback ) || $defaultMethod ) {
			return static::callClass( $container, $callback, $parameters, $defaultMethod );
		}

		return $callback( ...array_values( static::getMethodDependencies( $container, $callback, $parameters ) ) );
	}

	/**
	 * Determine if the given string is in Class@method syntax.
	 *
	 * @param mixed $callback
	 *
	 * @return bool
	 */
	protected static function isCallableWithAtSign( $callback ) {
		return is_string( $callback ) && strpos( $callback, '@' ) !== false;
	}

	/**
	 * Call a string reference to a class using Class@method syntax.
	 *
	 * @param Container $container
	 * @param string $target
	 * @param array $parameters
	 * @param string|null $defaultMethod
	 *
	 * @return mixed
	 *
	 * @throws \InvalidArgumentException
	 */
	protected static function callClass( $container, $target, array $parameters = [], $defaultMethod = null ) {
		$segments = explode( '@', $target );

		// We will assume an @ sign is used to delimit the class name from the method
		// name. We will split on this @ sign and then build a callable array that
		// we can pass right back into the "call" method for dependency binding.
		$method = count( $segments ) === 2
			? $segments[1] : $defaultMethod;

		if ( is_null( $method ) ) {
			throw new \InvalidArgumentException( 'Method not provided.' );
		}

		return static::call(
			$container, [ $container->make( $segments[0] ), $method ], $parameters
		);
	}

	/**
	 * Get all dependencies for a given method.
	 *
	 * @param Container $container
	 * @param callable|string $callback
	 * @param array $parameters
	 *
	 * @return array
	 *
	 * @throws \ReflectionException
	 */
	protected static function getMethodDependencies( $container, $callback, array $parameters = [] ) {
		$dependencies = [];

		foreach ( static::getCallReflector( $callback )->getParameters() as $parameter ) {
			static::addDependencyForCallParameter( $container, $parameter, $parameters, $dependencies );
		}

		return array_merge( $dependencies, array_values( $parameters ) );
	}

	/**
	 * Get the proper reflection instance for the given callback.
	 *
	 * @param callable|string $callback
	 *
	 * @return \ReflectionFunctionAbstract
	 *
	 * @throws \ReflectionException
	 */
	protected static function getCallReflector( $callback ) {
		if ( is_string( $callback ) && strpos( $callback, '::' ) !== false ) {
			$callback = explode( '::', $callback );
		} elseif ( is_object( $callback ) && ! $callback instanceof \Closure ) {
			$callback = [ $callback, '__invoke' ];
		}

		return is_array( $callback )
			? new \ReflectionMethod( $callback[0], $callback[1] )
			: new \ReflectionFunction( $callback );
	}

	/**
	 * Get the dependency for the given call parameter.
	 *
	 * @param Container $container
	 * @param \ReflectionParameter $parameter
	 * @param array $parameters
	 * @param array $dependencies
	 *
	 * @return void
	 */
	protected static function addDependencyForCallParameter(
		$container, $parameter,
		array &$parameters, &$dependencies
	) {
		if ( array_key_exists( $paramName = $parameter->getName(), $parameters ) ) {
			$dependencies[] = $parameters[ $paramName ];

			unset( $parameters[ $paramName ] );
		} elseif ( ! is_null( $className = Util::getParameterClassName( $parameter ) ) ) {
			if ( array_key_exists( $className, $parameters ) ) {
				$dependencies[] = $parameters[ $className ];

				unset( $parameters[ $className ] );
			} else {
				$dependencies[] = $container->make( $className );
			}
		} elseif ( $parameter->isDefaultValueAvailable() ) {
			$dependencies[] = $parameter->getDefaultValue();
		} elseif ( ! $parameter->isOptional() && ! array_key_exists( $paramName, $parameters ) ) {
			$message = "Unable to resolve dependency [{$parameter}] in class {$parameter->getDeclaringClass()->getName()}";

			throw new BindingResolutionException( $message );
		}
	}

	/**
	 * Normalize the given callback into a Class@method string.
	 *
	 * @param callable $callback
	 *
	 * @return string
	 */
	protected static function normalizeMethod( $callback ) {
		$class = is_string( $callback[0] ) ? $callback[0] : get_class( $callback[0] );

		return "{$class}@{$callback[1]}";
	}
}
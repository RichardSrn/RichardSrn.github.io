<?php

namespace Plover\Core\Services\Extensions;

use Plover\Core\Framework\ServiceProvider;
use Plover\Core\Services\Extensions\Contract\Extension;

/**
 * Extensions service provider.
 *
 * @since 1.0.0
 */
class ExtensionsServiceProvider extends ServiceProvider {

	/**
	 * @var string[]
	 */
	public $singletons = [
		\Plover\Core\Services\Extensions\Extensions::class,
	];

	/**
	 * @var string[]
	 */
	public $aliases = [
		'extensions' => \Plover\Core\Services\Extensions\Extensions::class,
	];

	public function boot() {
		$this->core->booted( function ( Extensions $extensions ) {
			$extensions->boot();
		}, 5 );
	}
}

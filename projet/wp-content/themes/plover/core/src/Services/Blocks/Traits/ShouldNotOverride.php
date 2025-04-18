<?php

namespace Plover\Core\Services\Blocks\Traits;

/**
 * @since 1.0.0
 */
trait ShouldNotOverride {

	public function override(): bool {
		return false;
	}
}

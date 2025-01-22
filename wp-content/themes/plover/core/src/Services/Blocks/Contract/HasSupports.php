<?php

namespace Plover\Core\Services\Blocks\Contract;

/**
 * @since 1.0.0
 */
interface HasSupports extends Block {

	/**
	 * Extend supports.
	 *
	 * @return array
	 */
	public function supports(): array;

	/**
	 * Override exists supports or not.
	 *
	 * @return bool
	 */
	public function override(): bool;

}
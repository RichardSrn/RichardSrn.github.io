<?php

namespace Plover\Core\Services\Blocks\Contract;

/**
 * @since 1.0.0
 */
interface HasBlockStyles extends Block {

	/**
	 * Block styles.
	 *
	 * @return array
	 */
	public function styles(): array;

}

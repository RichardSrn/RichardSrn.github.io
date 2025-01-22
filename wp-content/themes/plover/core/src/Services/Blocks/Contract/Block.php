<?php

namespace Plover\Core\Services\Blocks\Contract;

interface Block {
	/**
	 * Block name.
	 *
	 * @return string
	 */
	public function name(): string;
}
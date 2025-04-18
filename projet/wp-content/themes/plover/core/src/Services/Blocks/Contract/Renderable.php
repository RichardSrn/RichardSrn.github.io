<?php

namespace Plover\Core\Services\Blocks\Contract;

interface Renderable {

	/**
	 * Rerender block
	 *
	 * @param $block_content
	 * @param $block
	 *
	 * @return string
	 */
	public function render( $block_content, $block ): string;
}

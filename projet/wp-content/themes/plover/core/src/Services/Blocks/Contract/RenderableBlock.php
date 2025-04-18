<?php

namespace Plover\Core\Services\Blocks\Contract;

/**
 * @since 1.0.0
 */
interface RenderableBlock extends Block {

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
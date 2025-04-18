<?php

namespace Plover\Core\Blocks;

use Plover\Core\Services\Blocks\Contract\HasBlockStyles;

/**
 * @since 1.0.0
 */
class Code implements HasBlockStyles {

	/**
	 * @inheritDoc
	 */
	public function name(): string {
		return 'core/code';
	}

	/**
	 * @inheritDoc
	 */
	public function styles(): array {
		return [
			array(
				'name'  => 'text-nowrap',
				'label' => __( 'No Wrap', 'plover' ),
			)
		];
	}
}
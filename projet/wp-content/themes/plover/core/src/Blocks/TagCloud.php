<?php

namespace Plover\Core\Blocks;

use Plover\Core\Services\Blocks\Contract\HasSupports;
use Plover\Core\Services\Blocks\Contract\RenderableBlock;
use Plover\Core\Services\Blocks\Traits\ShouldNotOverride;
use Plover\Core\Toolkits\Html\Document;
use Plover\Core\Toolkits\StyleEngine;

/**
 * @since 1.0.4
 */
class TagCloud implements HasSupports, RenderableBlock {

	use ShouldNotOverride;

	/**
	 * @inheritDoc
	 */
	public function name(): string {
		return 'core/tag-cloud';
	}

	/**
	 * @inheritDoc
	 */
	public function supports(): array {
		return [
			'color'   => [
				'link'       => true,
				'text'       => false,
				'background' => false,
				'gradient'   => false,
			],
			'spacing' => [
				'padding'  => true,
				'margin'   => true,
				'blockGap' => true,
			],
		];
	}

	/**
	 * @inheritDoc
	 */
	public function render( $block_content, $block ): string {
		$attrs = $block['attrs'] ?? [];
		$html  = new Document( $block_content );
		$root  = $html->get_root_element();
		if ( ! $root ) {
			return $block_content;
		}

		$gap = StyleEngine::get_block_gap_value( $attrs );
		// add block gap
		if ( isset( $gap ) ) {
			$root->add_styles( [ '--plover--style--block-gap' => $gap ] );
		}

		return $html->save_html();
	}
}
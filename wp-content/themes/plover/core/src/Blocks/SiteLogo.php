<?php

namespace Plover\Core\Blocks;

use Plover\Core\Services\Blocks\Contract\HasSupports;
use Plover\Core\Services\Blocks\Contract\RenderableBlock;
use Plover\Core\Services\Blocks\Traits\ShouldNotOverride;

/**
 * @since 1.0.0
 */
class SiteLogo implements HasSupports, RenderableBlock {

	use ShouldNotOverride;

	/**
	 * @inheritDoc
	 */
	public function name(): string {
		return 'core/site-logo';
	}

	/**
	 * @inheritDoc
	 */
	public function supports(): array {
		return [
			'color'                => [
				'background' => true,
				'gradients'  => true,
				'link'       => false,
				'text'       => true,
			],
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => false,
					'color' => false,
				],
			],
			'ploverShadow'         => [
				'drop' => true,
				'box'  => true,
			]
		];
	}

	/**
	 * @inheritDoc
	 */
	public function render( $block_content, $block ): string {
		$attrs = $block['attrs'] ?? [];
		$html  = new \Plover\Core\Toolkits\Html\Document( $block_content );
		$wrap  = $html->get_root_element();
		if ( ! $wrap ) {
			return $block_content;
		}

		$block_styles = wp_style_engine_get_styles(
			array(
				'color'  => \Plover\Core\Toolkits\StyleEngine::get_block_color_styles( $attrs ),
				'border' => \Plover\Core\Toolkits\StyleEngine::get_block_border_styles( $attrs )
			)
		);

		if ( ! empty( $block_styles['classnames'] ) ) {
			$wrap->add_classnames( $block_styles['classnames'] );
		}
		if ( ! empty( $block_styles['declarations'] ) ) {
			$wrap->add_styles( $block_styles['declarations'] );
		}

		return $html->save_html();
	}
}

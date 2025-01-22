<?php

namespace Plover\Core\Blocks;

use Plover\Core\Services\Blocks\Contract\HasSupports;
use Plover\Core\Services\Blocks\Contract\RenderableBlock;
use Plover\Core\Services\Blocks\Traits\ShouldNotOverride;
use Plover\Core\Toolkits\Html\Document;
use Plover\Core\Toolkits\StyleEngine;

/**
 * @since 1.0.0
 */
class PageList implements HasSupports, RenderableBlock {

	use ShouldNotOverride;

	/**
	 * @inheritDoc
	 */
	public function name(): string {
		return 'core/page-list';
	}

	/**
	 * @inheritDoc
	 */
	public function supports(): array {
		return [
			'spacing' => [
				'padding'                       => true,
				'margin'                        => [ 'top', 'bottom' ],
				'blockGap'                      => true,
				'__experimentalDefaultControls' => [
					'padding'  => true,
					'margin'   => false,
					'blockGap' => true,
				],
			],

			'color'                => [
				'gradients'                     => true,
				'link'                          => true,
				'__experimentalDefaultControls' => [
					'background' => true,
					'text'       => true
				]
			],
			'__experimentalBorder' => [
				'radius'                        => true,
				'width'                         => true,
				'color'                         => true,
				'style'                         => true,
				'__experimentalDefaultControls' => [
					'width' => true,
					'color' => true,
				],
			],
			'ploverShadow'         => [
				'text'            => true,
				'box'             => true,
				'defaultControls' => [
					'text' => true,
				]
			],
		];
	}

	/**
	 * @inheritDoc
	 */
	public function render( $block_content, $block ): string {
		$attrs = $block['attrs'] ?? [];
		$html  = new Document( $block_content );
		$list  = $html->get_element_by_tags_priority( array( 'ul', 'ol' ) );
		if ( ! $list ) {
			return $block_content;
		}

		$list_styles = wp_style_engine_get_styles(
			array(
				'color'   => StyleEngine::get_block_color_styles( $attrs ),
				'border'  => StyleEngine::get_block_border_styles( $attrs ),
				'spacing' => array(
					'padding' => $attrs['style']['spacing']['padding'] ?? null,
					'margin'  => $attrs['style']['spacing']['margin'] ?? null,
				),
			)
		);

		if ( ! empty( $list_styles['classnames'] ) ) {
			$list->add_classnames( $list_styles['classnames'] );
		}
		if ( ! empty( $list_styles['declarations'] ) ) {
			$list->add_styles( $list_styles['declarations'] );
		}

		$gap = StyleEngine::get_block_gap_value( $attrs );
		// add block gap
		if ( isset( $gap ) ) {
			$list->add_styles( [ '--plover--style--block-gap' => $gap ] );
		}

		return $html->save_html();
	}
}
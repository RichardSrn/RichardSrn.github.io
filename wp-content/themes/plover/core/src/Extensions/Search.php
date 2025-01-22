<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Html\Document;

/**
 * Search block enhancement
 *
 * @since 1.0.0
 */
class Search extends Extension {

	/**
	 * Bootstrap the extension.
	 *
	 * @return void
	 */
	public function boot() {
		// Enqueue search extension assets
		$this->scripts->enqueue_editor_asset( 'plover-search-enhancement', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-extensions/search/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-extensions/search/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-extensions/search/index.min.asset.php' ),
		) );

		// Render search fields for core/search block
		add_filter( 'render_block_core/search', [ $this, 'render' ], 11, 2 );
	}

	/**
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( string $block_content, array $block ): string {
		$post_type = esc_attr( $block['attrs']['postType'] ?? get_query_var( 'post_type' ) );
		if ( ! $post_type ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$form = $html->get_element_by_tag_name( 'form' );
		if ( ! $form ) {
			return $block_content;
		}

		$post_type_field = $html->create_element( 'input' );
		$post_type_field->set_attribute( 'type', 'hidden' );
		$post_type_field->set_attribute( 'name', 'post_type' );
		$post_type_field->set_attribute( 'value', $post_type );

		$form->append_element( $post_type_field );

		return $html->save_html();
	}
}

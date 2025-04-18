<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Services\Settings\Control;
use Plover\Core\Toolkits\Filesystem;
use Plover\Core\Toolkits\Html\Document;
use Plover\Core\Toolkits\Str;

/**
 * Add highlight feature to core/code block.
 *
 * @since 1.0.0
 */
class Highlight extends Extension {

	/**
	 * Module name
	 */
	const MODULE_NAME = 'plover_code_highlight';

	/**
	 * All prism theme files
	 *
	 * @var array
	 */
	protected $prism_theme_files = [];

	/**
	 * Register extension as module.
	 *
	 * @return void
	 * @throws \Exception
	 */
	public function register() {
		$this->prism_theme_files = Filesystem::list_files( $this->core->core_path( 'assets/css/prism-themes' ) );

		$this->modules->register( self::MODULE_NAME, array(
			'label'   => __( 'Code highlight', 'plover' ),
			'excerpt' => __( 'Add out-of-the-box code highlighting features for core/code block.', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/code-highlight.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/code-highlight/',
			'group'   => 'extensions',
			'fields'  => array(
				'default_style'    => array(
					'label'        => __( 'Enabled by default', 'plover' ),
					'default'      => 'highlight',
					'control'      => Control::T_SELECT,
					'control_args' => array(
						'options' => array(
							array( 'label' => __( 'Yes', 'plover' ), 'value' => 'highlight' ),
							array( 'label' => __( 'No', 'plover' ), 'value' => 'none' )
						)
					)
				),
				'default_theme'    => array(
					'label'        => __( 'Default theme', 'plover' ),
					'default'      => 'github-dark',
					'control'      => Control::T_SELECT,
					'control_args' => array(
						'options' => $this->get_support_themes()
					)
				),
				'default_language' => array(
					'label'        => __( 'Default language', 'plover' ),
					'default'      => 'clike',
					'control'      => Control::T_SELECT,
					'control_args' => array(
						'options' => $this->support_languages()
					)
				),
				'upsell'           => array(
					'control' => Control::T_PLACEHOLDER,
				),
			)
		) );
	}

	/**
	 * Bootstrap the extension.
	 *
	 * @return void
	 */
	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		// Enqueue all prism themes
		foreach ( $this->prism_theme_files as $theme_file ) {
			$theme = basename( $theme_file, '.css' );

			$this->styles->enqueue_asset( "plover-prism-{$theme}-theme", array(
				'ver'      => 'core',
				'src'      => $this->core->core_url( "assets/css/prism-themes/{$theme}.css" ),
				'path'     => $this->core->core_path( "assets/css/prism-themes/{$theme}.css" ),
				'keywords' => [ "prism-{$theme}-theme" ],
			) );
		}

		// Enqueue prism dependency
		$this->scripts->enqueue_asset( 'plover-prism', array(
			'ver'      => 'core',
			'src'      => $this->core->core_url( 'assets/vendor/prism/prism.min.js' ),
			'path'     => $this->core->core_path( 'assets/vendor/prism/prism.min.js' ),
			'keywords' => [ 'plover-prism' ],
		) );

		// Enqueue highlight extension assets
		$this->scripts->enqueue_editor_asset( 'plover-highlight-extension', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-extensions/highlight/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-extensions/highlight/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-extensions/highlight/index.min.asset.php' ),
		) );

		// Render highlight attrs for core/code block
		add_filter( 'render_block_core/code', [ $this, 'render' ], 11, 2 );
		// Send default highlight attributes to JavaScript
		add_filter( 'plover_core_editor_data', [ $this, 'localize_highlight_attributes' ] );
	}

	/**
	 * Support themes.
	 *
	 * @return mixed|null
	 */
	protected function get_support_themes() {
		$prism_themes = [];
		foreach ( $this->prism_theme_files as $theme_file ) {
			$theme          = basename( $theme_file, '.css' );
			$prism_themes[] = [ 'label' => Str::to_title_case( $theme ), 'value' => $theme ];
		}

		return apply_filters( 'plover_core_highlight_themes', $prism_themes );
	}

	/**
	 * Support languages.
	 *
	 * @return mixed|null
	 */
	protected function support_languages() {
		$languages = [
			[ 'label' => 'C-Like', 'value' => 'clike' ],
			[ 'label' => 'Markup', 'value' => 'markup' ],
			[ 'label' => 'HTML', 'value' => 'html' ],
			[ 'label' => 'XML', 'value' => 'xml' ],
			[ 'label' => 'SVG', 'value' => 'svg' ],
			[ 'label' => 'CSS', 'value' => 'css' ],
			[ 'label' => 'JavaScript', 'value' => 'javascript' ],
			[ 'label' => 'TypeScript', 'value' => 'typescript' ],
			[ 'label' => 'React JSX', 'value' => 'jsx' ],
			[ 'label' => 'React TSX', 'value' => 'tsx' ],
			[ 'label' => 'Go', 'value' => 'go' ],
			[ 'label' => 'C', 'value' => 'c' ],
			[ 'label' => 'C#', 'value' => 'cs' ],
			[ 'label' => 'C++', 'value' => 'cpp' ],
			[ 'label' => 'PHP', 'value' => 'php' ],
			[ 'label' => 'JSON', 'value' => 'json' ],
			[ 'label' => 'Python', 'value' => 'python' ],
			[ 'label' => 'Rust', 'value' => 'rust' ],
		];

		return apply_filters( 'plover_core_highlight_languages', $languages );
	}

	/**
	 * Localize data to JavaScript.
	 *
	 * @param $data
	 *
	 * @return array
	 */
	public function localize_highlight_attributes( $data ) {
		$data['extensions']['highlight'] = [
			'attributes'        => apply_filters( 'plover_core_highlight_attributes', [
				'highlight' => [
					'type'    => 'string',
					'default' => $this->settings->get( self::MODULE_NAME, 'default_style' ),
				],
				'theme'     => [
					'type'    => 'string',
					'default' => $this->settings->get( self::MODULE_NAME, 'default_theme' ),
				],
				'language'  => [
					'type'    => 'string',
					'default' => $this->settings->get( self::MODULE_NAME, 'default_language' ),
				],
			] ),
			'support_themes'    => $this->get_support_themes(),
			'support_languages' => $this->support_languages(),
		];

		return $data;
	}

	/**
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( $block_content, $block ) {
		$attrs     = $block['attrs'] ?? [];
		$highlight = strtolower( $attrs['highlight'] ?? $this->settings->get( self::MODULE_NAME, 'default_style' ) );

		if ( $highlight === 'none' ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$wrap = $html->get_element_by_tag_name( 'pre' );
		if ( ! $wrap ) {
			return $block_content;
		}

		$theme = $attrs['theme'] ?? $this->settings->get( self::MODULE_NAME, 'default_theme' );
		$lang  = $attrs['language'] ?? $this->settings->get( self::MODULE_NAME, 'default_language' );

		$wrap->add_classnames( "plover-prism prism-{$theme}-theme language-{$lang}" );

		$html = apply_filters( 'plover_core_render_highlight', $html, $block );

		return $html->save_html();
	}
}


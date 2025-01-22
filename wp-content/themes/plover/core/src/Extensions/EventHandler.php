<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Services\Settings\Control;
use Plover\Core\Toolkits\Format;

/**
 * @since 1.0.0
 */
class EventHandler extends Extension {

	const MODULE_NAME = 'plover_block_event_handler';

	/**
	 * @return void
	 * @throws \Exception
	 */
	public function register() {
		$this->modules->register( self::MODULE_NAME, array(
			'label'   => __( 'Block event handler', 'plover' ),
			'excerpt' => __( 'Adding event handler to blocks to execute custom JavaScript snippets.', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/block-event-handler.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/block-event-handler/',
			'group'   => 'supports',
			'fields'  => array(
				'allowed_roles'  => array(
					'label'        => __( 'Allowed roles', 'plover' ),
					'help'         => __(
						'Only users who are granted the allowed roles can add event handlers.',
						'plover'
					),
					'default'      => array( 'administrator', 'editor' ),
					'control'      => Control::T_TAGS,
					'control_args' => array(
						'suggestions' => array( 'administrator', 'editor', 'author', 'contributor' )
					)
				),
				'allowed_events' => array(
					'label'        => __( 'Allowed events', 'plover' ),
					'default'      => array( 'onclick', 'onmouseover' ),
					'control'      => Control::T_TAGS,
					'control_args' => array(
						'validate'    => true,
						'suggestions' => array_keys( $this->supported_event_handlers() )
					)
				)
			)
		) );
	}

	/**
	 * Allowed event handlers
	 *
	 * @return mixed|null
	 */
	public function supported_event_handlers() {
		return apply_filters( 'plover_core_supported_event_handlers', array(
			'onclick'     => array( 'label' => __( 'on click event', 'plover' ) ),
			'ondblclick'  => array( 'label' => __( 'on db click event', 'plover' ) ),
			'onmouseover' => array( 'label' => __( 'on mouse over event', 'plover' ) ),
		) );
	}

	/**
	 * Bootstrap the event-handler block support.
	 *
	 * @return void
	 */
	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		add_filter( 'plover_core_filter_block_kses', [ $this, 'kses_block_attributes' ], 10, 3 );
		add_filter( 'render_block', [ $this, 'render' ], 99, 2 );

		if ( $this->current_user_can_add_event_handler() ) {
			$this->scripts->enqueue_editor_asset( 'plover-block-event-handler', array(
				'ver'   => 'core',
				'src'   => $this->core->core_url( 'assets/js/block-supports/event-handler/index.min.js' ),
				'path'  => $this->core->core_path( 'assets/js/block-supports/event-handler/index.min.js' ),
				'asset' => $this->core->core_path( 'assets/js/block-supports/event-handler/index.min.asset.php' ),
				'deps'  => array( 'wp-codemirror' )
			) );

			$this->styles->enqueue_editor_asset( 'plover-block-event-handler', array(
				'ver'  => 'core',
				'rtl'  => 'replace',
				'src'  => $this->core->core_url( 'assets/js/block-supports/event-handler/style.min.css' ),
				'path' => $this->core->core_path( 'assets/js/block-supports/event-handler/style.min.css' )
			) );

			add_filter( 'plover_core_editor_data', [ $this, 'localize_allowed_event_handler' ] );
		}
	}

	/**
	 * Check if current user can add event handler or not.
	 *
	 * @return bool
	 */
	protected function current_user_can_add_event_handler() {
		$user          = wp_get_current_user();
		$allowed_roles = $this->settings->get( self::MODULE_NAME, 'allowed_roles' );

		return ! ! array_intersect( $allowed_roles, $user->roles );
	}

	/**
	 * @param $data
	 *
	 * @return array
	 */
	public function localize_allowed_event_handler( $data ) {
		$data['customBlockSupports']['eventHandler'] = [
			'allowedEvents' => $this->allowed_event_handlers()
		];

		return $data;
	}

	/**
	 * Get allowed event handlers.
	 *
	 * @return mixed|null
	 */
	public function allowed_event_handlers() {
		$supported = $this->supported_event_handlers();
		$allowed   = $this->settings->get( self::MODULE_NAME, 'allowed_events' );

		return array_intersect_key( $supported, array_flip( $allowed ) );
	}

	/**
	 * Remove non-allowed event-handler based on user role
	 *
	 * @param $block
	 *
	 * @return mixed
	 */
	public function kses_block_attributes( $block ) {
		$attrs = $block['attrs'] ?? array();

		if ( ! $this->current_user_can_add_event_handler() ) {
			foreach ( $this->allowed_event_handlers() as $event => $args ) {
				unset( $attrs[ $event ] );
			}
		}

		$block['attrs'] = $attrs;

		return $block;
	}

	/**
	 * Add JavaScript event-handler
	 *
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( string $block_content, array $block ) {
		$allowed_events = $this->allowed_event_handlers();
		$block_events   = array_intersect_key( $block['attrs'] ?? array(), $allowed_events );

		if ( empty( $block_events ) ) {
			return $block_content;
		}

		$html = new \Plover\Core\Toolkits\Html\Document( $block_content );
		$el   = $html->get_element_by_tags_priority( array( 'button', 'a', '*' ) );
		if ( ! $el ) {
			return $block_content;
		}

		if ( $el->get_dom_element()->tagName === 'a' ) {
			$url = $block['attrs']['url'] ?? $el->get_attribute( 'href' );
			if ( ! $url ) {
				$el->transfer_to( 'button' );
				$el->remove_attribute( 'href' );
			}
		}

		foreach ( $block_events as $event => $js ) {
			$el->set_attribute( $event, Format::inline_js( $js ) );
		}

		return $html->save_html();
	}
}
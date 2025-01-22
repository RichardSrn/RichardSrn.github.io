<?php

namespace Plover\Core\Extensions;

use Plover\Core\Services\Blocks\Blocks;
use Plover\Core\Services\Extensions\Contract\Extension;
use Plover\Core\Toolkits\Html\Document;

/**
 * @since 1.1.0
 */
class Particles extends Extension {

	const MODULE_NAME = 'plover_particles_effect';

	/**
	 * @return void
	 */
	public function register( Blocks $blocks ) {
		$this->modules->register( self::MODULE_NAME, array(
			'recent'  => true,
			'label'   => __( 'Particles Effect', 'plover' ),
			'excerpt' => __( 'Add cool particle effects to your designs!', 'plover' ),
			'icon'    => esc_url( $this->core->core_url( 'assets/images/particles-effect.png' ) ),
			'doc'     => 'https://wpplover.com/docs/plover-kit/modules/particles-effect',
			'fields'  => array(),
			'group'   => 'extensions',
		) );
	}

	public function boot() {
		// module is disabled.
		if ( ! $this->settings->checked( self::MODULE_NAME ) ) {
			return;
		}

		// extension controls and editor preview
		$this->scripts->enqueue_editor_asset( 'plover-particles-effect-extension', array(
			'ver'   => 'core',
			'src'   => $this->core->core_url( 'assets/js/block-extensions/particles/index.min.js' ),
			'path'  => $this->core->core_path( 'assets/js/block-extensions/particles/index.min.js' ),
			'asset' => $this->core->core_path( 'assets/js/block-extensions/particles/index.min.asset.php' )
		) );
		$this->styles->enqueue_editor_asset( 'plover-particles-effect-extension', array(
			'ver'  => 'core',
			'rtl'  => 'replace',
			'src'  => $this->core->core_url( 'assets/js/block-extensions/particles/style.min.css' ),
			'path' => $this->core->core_path( 'assets/js/block-extensions/particles/style.min.css' ),
		) );

		// frontend script and style
		$this->scripts->enqueue_asset( 'plover-particles-effect', array(
			'ver'      => 'core',
			'src'      => $this->core->core_url( 'assets/js/frontend/particles/index.min.js' ),
			'path'     => $this->core->core_path( 'assets/js/frontend/particles/index.min.js' ),
			'asset'    => $this->core->core_path( 'assets/js/frontend/particles/index.min.asset.php' ),
			'keywords' => [ 'plover-particles__block' ]
		) );
		$this->styles->enqueue_asset( 'plover-particles-effect', array(
			'ver'      => 'core',
			'rtl'      => 'replace',
			'src'      => $this->core->core_url( 'assets/js/frontend/particles/style.min.css' ),
			'path'     => $this->core->core_path( 'assets/js/frontend/particles/style.min.css' ),
			'keywords' => [ 'plover-particles__block' ]
		) );

		// Render particles attrs for core/cover block
		add_filter( 'render_block_core/cover', [ $this, 'render' ], 11, 2 );
		// Send default particles attributes to JavaScript
		add_filter( 'plover_core_editor_data', [ $this, 'localize_editor_data' ] );
	}

	/**
	 * @param string $block_content
	 * @param array $block
	 *
	 * @return string
	 */
	public function render( $block_content, $block ) {
		if ( is_admin() ) { // don't load in the editor
			return $block_content;
		}

		$attrs     = $block['attrs'] ?? [];
		$particles = isset( $attrs['particles'] ) && $attrs['particles'];
		if ( ! $particles ) {
			return $block_content;
		}

		$html = new Document( $block_content );
		$wrap = $html->get_root_element();
		if ( ! $wrap ) {
			return $block_content;
		}

		$wrap->add_classnames( 'plover-particles__block' );
		$id     = plover_block_id( $attrs );
		$canvas = $html->create_element( 'div' );
		$canvas->set_attribute( 'id', "plover-particles__canvas-{$id}" );
		$canvas->set_attribute( 'class', 'plover-particles__canvas' );
		$wrap->append_element( $canvas );

		$script = $this->get_particle_scripts( "plover-particles__canvas-{$id}", $attrs );
		if ( ! empty( $script ) ) {
			$this->scripts->enqueue_asset( "plover-particles-{$id}", array(
				'ver'  => $id,
				'raw'  => $script,
				'deps' => [ 'plover-particles-effect' ]
			) );
		}

		return $html->save_html();
	}

	/**
	 * Localize editor data
	 *
	 * @param $data
	 *
	 * @return array
	 */
	public function localize_editor_data( $data ) {
		$data['extensions']['particles'] = [
			'presets' => $this->get_particle_presets()
		];

		return $data;
	}

	/**
	 * @param $id
	 * @param $attrs
	 *
	 * @return string
	 */
	protected function get_particle_scripts( $id, $attrs ) {
		$options = $this->get_particle_options( $attrs );
		if ( ! is_array( $options ) || empty( $options ) ) {
			return '';
		}

		$options = wp_json_encode( $options );
		if ( ! $options ) {
			return '';
		}

		$override_options = $attrs['particleOverrideOptions'] ?? array();
		$override_options = is_array( $override_options ) && ! empty( $override_options )
			? wp_json_encode( $override_options )
			: '{}';

		return "ploverParticles.load('$id',{$options},{$override_options});";
	}

	/**
	 * Get particle options
	 *
	 * @param $attrs
	 *
	 * @return array
	 */
	protected function get_particle_options( $attrs ) {
		$presets = $this->get_particle_presets();
		$preset  = $presets[ $attrs['particlePreset'] ?? 'basic' ] ?? $presets['basic'];
		$options = $preset['options'] ?? '';
		$options = is_string( $options ) ? json_decode( $options, true ) : array();

		return apply_filters( 'plover_core_particle_options', $options, $attrs );
	}

	/**
	 * Particles presets
	 *
	 * @return array
	 */
	protected function get_particle_presets() {
		return apply_filters( 'plover_core_particle_presets', [
			'basic'            => [
				'label'   => __( 'Basic', 'plover' ),
				'options' => '{"interactivity":{"detectsOn":"window","events":{"onClick":{"enable":true,"mode":"push"},"onHover":{"enable":true,"mode":"repulse"},"resize":{"delay":0.5,"enable":true}},"modes":{"push":{"default":true,"groups":[],"quantity":4},"repulse":{"distance":200,"duration":0.4,"factor":100,"speed":1,"maxSpeed":50,"easing":"ease-out-quad","divs":{"distance":200,"duration":0.4,"factor":100,"speed":1,"maxSpeed":50,"easing":"ease-out-quad","selectors":{}}}}},"particles":{"bounce":{"horizontal":{"value":1},"vertical":{"value":1}},"color":{"value":"#ffffff"},"effect":{"close":true,"fill":true,"options":{},"type":{}},"move":{"angle":{"offset":0,"value":90},"center":{"x":50,"y":50,"mode":"percent","radius":0},"decay":0,"distance":{},"direction":"none","drift":0,"enable":true,"outModes":{"default":"out","bottom":"out","left":"out","right":"out","top":"out"},"random":false,"size":false,"speed":3,"straight":false,"vibrate":false,"warp":false},"number":{"density":{"enable":true,"width":1920,"height":1080},"limit":{"mode":"delete","value":0},"value":160},"opacity":{"value":0.5},"reduceDuplicates":false,"shape":{"close":true,"fill":true,"options":{},"type":"circle"},"size":{"value":{"min":1,"max":3}},"stroke":{"width":0},"zIndex":{"value":0,"opacityRate":1,"sizeRate":1,"velocityRate":1},"destroy":{"bounds":{},"mode":"none","split":{"count":1,"factor":{"value":3},"rate":{"value":{"min":4,"max":9}},"sizeOffset":true,"particles":{}}},"links":{"blink":true,"color":{"value":"#ffffff"},"consent":false,"distance":150,"enable":true,"frequency":1,"opacity":0.25,"width":1,"warp":false},"repulse":{"value":0,"enabled":false,"distance":1,"duration":1,"factor":1,"speed":1}}}',
			],
			'snow'             => [
				'label'   => __( 'Snow', 'plover' ),
				'options' => '{"interactivity":{"detectsOn":"window","events":{"onClick":{"enable":true,"mode":"repulse"},"onHover":{"enable":true,"mode":"bubble"},"resize":{"delay":0.5,"enable":true}},"modes":{"bubble":{"distance":400,"duration":0.3,"mix":false,"opacity":1,"size":5}}},"particles":{"color":{"value":"#ffffff"},"number":{"value":400},"move":{"direction":"bottom","enable":true,"random":false,"straight":false,"speed":6},"opacity":{"value":{"min":0.1,"max":0.5}},"size":{"value":{"min":1,"max":4}},"wobble":{"distance":20,"enable":true,"speed":{"min":-5,"max":5}}}}',
			],
			'nasa'             => [
				'label'   => __( 'NASA', 'plover' ),
				'options' => '{"interactivity":{"detectsOn":"window","events":{"onClick":{"enable":true,"mode":"repulse"},"onHover":{"enable":true,"mode":"bubble"},"resize":{"delay":0.5,"enable":true}},"modes":{"trail":{"delay":1,"pauseOnStop":false,"quantity":1},"attract":{"distance":200,"duration":0.4,"easing":"ease-out-quad","factor":1,"maxSpeed":50,"speed":1},"bounce":{"distance":200},"bubble":{"distance":250,"duration":2,"mix":false,"opacity":0,"size":0,"divs":{"distance":200,"duration":0.4,"mix":false,"selectors":{}}},"connect":{"distance":80,"links":{"opacity":0.5},"radius":60},"grab":{"distance":400,"links":{"blink":false,"consent":false,"opacity":1}},"push":{"default":true,"groups":[],"quantity":4},"remove":{"quantity":2},"repulse":{"distance":400,"duration":0.4,"factor":100,"speed":1,"maxSpeed":50,"easing":"ease-out-quad","divs":{"distance":200,"duration":0.4,"factor":100,"speed":1,"maxSpeed":50,"easing":"ease-out-quad","selectors":{}}},"slow":{"factor":3,"radius":200},"particle":{"replaceCursor":false,"pauseOnStop":false,"stopDelay":0},"light":{"area":{"gradient":{"start":{"value":"#ffffff"},"stop":{"value":"#000000"}},"radius":1000},"shadow":{"color":{"value":"#000000"},"length":2000}}}},"particles":{"bounce":{"horizontal":{"value":1},"vertical":{"value":1}},"color":{"value":"#ffffff"},"effect":{"close":true,"fill":true,"options":{},"type":{}},"move":{"angle":{"offset":0,"value":90},"center":{"x":50,"y":50,"mode":"percent","radius":0},"decay":0,"distance":{},"direction":"none","drift":0,"enable":true,"outModes":{"default":"out","bottom":"out","left":"out","right":"out","top":"out"},"random":false,"size":false,"speed":{"min":0.1,"max":1},"straight":false,"vibrate":false,"warp":false},"number":{"density":{"enable":true,"width":1920,"height":1080},"limit":{"mode":"delete","value":0},"value":160},"opacity":{"value":{"min":0.1,"max":1},"animation":{"count":0,"enable":true,"speed":1,"decay":0,"delay":0,"sync":false,"mode":"auto","startValue":"random","destroy":"none"}},"shape":{"close":true,"fill":true,"options":{},"type":"circle"},"size":{"value":{"min":1,"max":3}},"stroke":{"width":0},"zIndex":{"value":0,"opacityRate":1,"sizeRate":1,"velocityRate":1},"destroy":{"bounds":{},"mode":"none","split":{"count":1,"factor":{"value":3},"rate":{"value":{"min":4,"max":9}},"sizeOffset":true,"particles":{}}},"roll":{"mode":"vertical","speed":25},"life":{"count":0,"delay":{"value":0,"sync":false},"duration":{"value":0,"sync":false}}}}',
			],
			'colorful-bubbles' => [
				'label'   => __( 'Colorful Bubbles', 'plover' ),
				'options' => '{"interactivity":{"detectsOn":"window","events":{"resize":{"delay":0.5,"enable":true}},"modes":{"trail":{"delay":1,"pauseOnStop":false,"quantity":1},"attract":{"distance":200,"duration":0.4,"easing":"ease-out-quad","factor":1,"maxSpeed":50,"speed":1},"bounce":{"distance":200},"bubble":{"distance":200,"duration":0.4,"mix":false},"connect":{"distance":80,"links":{"opacity":0.5},"radius":60},"grab":{"distance":100,"links":{"blink":false,"consent":false,"opacity":1}},"push":{"default":true,"groups":[],"quantity":4},"remove":{"quantity":2},"repulse":{"distance":200,"duration":0.4,"factor":100,"speed":1,"maxSpeed":50,"easing":"ease-out-quad"},"slow":{"factor":3,"radius":200},"particle":{"replaceCursor":false,"pauseOnStop":false,"stopDelay":0},"light":{"area":{"gradient":{"start":{"value":"#ffffff"},"stop":{"value":"#000000"}},"radius":1000},"shadow":{"color":{"value":"#000000"},"length":2000}}}},"manualParticles":[],"particles":{"bounce":{"horizontal":{"value":1},"vertical":{"value":1}},"color":{"value":["#5bc0eb","#fde74c","#9bc53d","#e55934","#fa7921"]},"effect":{"close":true,"fill":true,"options":{},"type":{}},"move":{"angle":{"offset":0,"value":90},"center":{"x":50,"y":50,"mode":"percent","radius":0},"direction":"top","enable":true,"outModes":{"default":"out","bottom":"out","left":"out","right":"out","top":"out"},"random":true,"size":false,"speed":6,"straight":false,"vibrate":false,"warp":false},"number":{"limit":{"mode":"delete","value":0},"value":20},"opacity":{"value":{"min":0.1,"max":0.3}},"reduceDuplicates":false,"shape":{"close":true,"fill":true,"options":{},"type":["circle","triangle","edge","polygon"]},"size":{"value":{"min":20,"max":40}},"stroke":{"width":0},"zIndex":{"value":0,"opacityRate":1,"sizeRate":1,"velocityRate":1},"destroy":{"bounds":{},"mode":"none","split":{"count":1,"factor":{"value":3},"rate":{"value":{"min":4,"max":9}},"sizeOffset":true,"particles":{}}},"roll":{"mode":"vertical","speed":25},"life":{"count":0,"delay":{"value":0,"sync":false},"duration":{"value":0,"sync":false}},"rotate":{"value":90,"animation":{"enable":true,"speed":6,"decay":0,"sync":true},"direction":"clockwise","path":false}}}',
			]
		] );
	}
}
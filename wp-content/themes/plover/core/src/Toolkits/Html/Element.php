<?php

namespace Plover\Core\Toolkits\Html;

use DOMElement;
use Plover\Core\Toolkits\StyleEngine;

/**
 * Wrapper for DOMElement
 *
 * @since 1.0.0
 */
class Element {

	/**
	 * @var DOMElement
	 */
	protected $el;

	/**
	 * @param DOMElement $el
	 */
	public function __construct( DOMElement $el ) {
		$this->el = $el;
	}

	/**
	 * @return DOMElement
	 */
	public function get_dom_element() {
		return $this->el;
	}

	/**
	 * @param Element $element
	 *
	 * @return void
	 */
	public function append_element( Element $element ) {
		$this->el->appendChild( $element->get_dom_element() );
	}

	/**
	 * @param string $qualified_name
	 * @param string $value
	 *
	 * @return void
	 */
	public function set_attribute( string $qualified_name, string $value ) {
		$this->el->setAttribute( $qualified_name, $value );
	}

	/**
	 * @param string $qualified_name
	 *
	 * @return void
	 */
	public function remove_attribute( string $qualified_name ) {
		$this->el->removeAttribute( $qualified_name );
	}

	/**
	 * Change current element's tag name
	 *
	 * @param string $tag
	 *
	 * @return void|null
	 */
	public function transfer_to( string $tag ) {
		if ( ! $this->el->ownerDocument ) {
			return null;
		}

		$child_nodes = [];

		foreach ( $this->el->childNodes as $child ) {
			$child_nodes[] = $child;
		}

		$new_element = $this->el->ownerDocument->createElement( $tag );

		foreach ( $child_nodes as $child ) {
			$child2 = $this->el->ownerDocument->importNode( $child, true );
			$new_element->appendChild( $child2 );
		}

		foreach ( $this->el->attributes as $attr_node ) {
			$attr_name  = $attr_node->nodeName;
			$attr_value = $attr_node->nodeValue;

			$new_element->setAttribute( $attr_name, $attr_value );
		}

		if ( $this->el->parentNode ) {
			$this->el->parentNode->replaceChild( $new_element, $this->el );
		}

		$this->el = $new_element;
	}

	/**
	 * Add classnames to element.
	 *
	 * @param $classnames
	 *
	 * @return void
	 */
	public function add_classnames( $classnames ) {
		$this->el->setAttribute( 'class',
			implode( ' ',
				array_unique(
					array_merge(
						$this->classnames_to_array( $this->get_attribute( 'class' ) ),
						$this->classnames_to_array( $classnames )
					)
				) ) );
	}

	/**
	 * Convert classnames string to array
	 *
	 * @param $classnames
	 *
	 * @return array
	 */
	protected function classnames_to_array( $classnames ) {
		if ( is_string( $classnames ) ) {
			return array_map( 'trim', explode( ' ', $classnames ) );
		}

		return is_array( $classnames ) ? $classnames : [];
	}

	/**
	 * @param string $qualified_name
	 *
	 * @return string
	 */
	public function get_attribute( string $qualified_name ): string {
		return $this->el->getAttribute( $qualified_name );
	}

	/**
	 * Remove classnames from element.
	 *
	 * @param $classnames
	 *
	 * @return void
	 */
	public function remove_classnames( $classnames ) {
		$this->el->setAttribute( 'class',
			implode( ' ',
				array_diff(
					$this->classnames_to_array( $this->get_attribute( 'class' ) ),
					$this->classnames_to_array( $classnames )
				) ) );
	}

	/**
	 * Append inline-styles.
	 *
	 * @param $css
	 *
	 * @return void
	 */
	public function add_styles( $css ) {
		if ( ! is_array( $css ) ) {
			$css = StyleEngine::css_to_declarations( $css );
		}

		$this->el->setAttribute( 'style',
			StyleEngine::compile_css(
				array_merge(
					StyleEngine::css_to_declarations( $this->get_attribute( 'style' ) ),
					$css
				)
			) );
	}

	/**
	 * Get some inline-styles properties.
	 *
	 * @param $properties
	 *
	 * @return array
	 */
	public function get_styles( $properties = array() ) {
		$styles = StyleEngine::css_to_declarations( $this->get_attribute( 'style' ) );
		if ( empty( $properties ) ) {
			return $styles;
		}

		return array_intersect_key( $styles, array_flip( $properties ) );
	}

	/**
	 * Remove some inline-styles properties.
	 *
	 * @param $properties
	 *
	 * @return array
	 */
	public function remove_styles( $properties = array() ) {
		$styles = StyleEngine::css_to_declarations( $this->get_attribute( 'style' ) );
		if ( empty( $properties ) ) {
			return $styles;
		}

		$this->set_styles( array_diff_key( $styles, array_flip( $properties ) ) );

		return array_intersect_key( $styles, array_flip( $properties ) );
	}

	/**
	 * Replace inline-styles.
	 *
	 * @param $css
	 *
	 * @return void
	 */
	public function set_styles( $css ) {
		if ( ! is_array( $css ) ) {
			$css = StyleEngine::css_to_declarations( $css );
		}

		$this->el->setAttribute( 'style', StyleEngine::compile_css( $css ) );
	}
}

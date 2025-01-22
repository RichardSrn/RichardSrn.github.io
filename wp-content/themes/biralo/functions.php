<?php
/**
 * Functions and definitions
 *
 * @package Biralo
 */
 function biralo_setup() {
	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	// Let WordPress manage the document title.
	add_theme_support( 'title-tag' );

	// Enable support for Post Thumbnails.
	add_theme_support( 'post-thumbnails' );
    
    // Make theme available for translation.
	load_theme_textdomain( 'biralo' );

	// Admin editor styles.
	add_theme_support( 'editor-styles' );

	// Switch default core markup for different forms to output valid HTML5.
	add_theme_support( 'html5', array( 'comment-form', 'comment-list' ) );

	// Add support for responsive embeds.
	add_theme_support( 'responsive-embeds' );

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	// Enable block styles.
	add_theme_support( 'wp-block-styles' );

	// Enqueue editor styles.
	add_editor_style();
}

add_action( 'after_setup_theme', 'biralo_setup' );

/**
 * Enqueue scripts and styles.
 *
 * @since 1.0.0
 */
function biralo_scripts() {
	wp_enqueue_style( 'biralo-style', get_stylesheet_uri(), array());
}

add_action( 'wp_enqueue_scripts', 'biralo_scripts' );

/**
 * Register block patterns category.
 *
 * @since 1.0.0
 */
function biralo_register_block_patterns_category() {
	register_block_pattern_category(
		'biralo',
		array(
			'label' => esc_html__( 'Biralo', 'biralo' ),
		)
	);
}

add_action( 'init', 'biralo_register_block_patterns_category', 9 );

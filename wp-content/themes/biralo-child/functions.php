<?php
function biralo_child_enqueue_styles() {
    wp_enqueue_style('parent-style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('child-style', get_stylesheet_directory_uri() . '/style.css', array('parent-style'));
}
add_action('wp_enqueue_scripts', 'biralo_child_enqueue_styles');

function enqueue_custom_scripts() {
    wp_enqueue_script('custom-scripts', get_stylesheet_directory_uri() . '/custom.js', array(), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_custom_scripts');
?>

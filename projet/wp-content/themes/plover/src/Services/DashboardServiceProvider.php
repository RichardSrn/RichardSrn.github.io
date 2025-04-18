<?php

namespace Plover\Theme\Services;

use Plover\Core\Assets\Scripts;
use Plover\Core\Assets\Styles;
use Plover\Core\Framework\ServiceProvider;
use Plover\Core\Toolkits\Plugin;

/**
 * @since 1.1.0
 */
class DashboardServiceProvider extends ServiceProvider {

	public function boot( Styles $styles, Scripts $scripts ) {
		if ( is_plover_core_ge( '1.0.4' ) ) { // Plugin installation toolkit introduced since v1.0.4
			add_action( 'admin_action_install_plover_kit', [ $this, 'install_plover_kit' ] );
		}

		add_action( 'admin_init', [ $this, 'dismiss_notice' ] );
		add_action( 'admin_notices', [ $this, 'get_start_notice' ] );
		add_action( 'admin_menu', [ $this, 'add_theme_admin_menu' ] );

		$styles->enqueue_dashboard_asset( 'plover-theme-dashboard-styles', array(
			'src'  => plover_asset_url( 'css/dashboard.css' ),
			'path' => plover_asset_path( 'css/dashboard.css' ),
			'ver'  => $this->core->is_debug() ? time() : PLOVER_VERSION,
		) );

		$scripts->enqueue_dashboard_asset( 'plover-theme-dashboard-scripts', array(
			'src'   => plover_asset_url( 'js/dashboard/index.min.js' ),
			'path'  => plover_asset_path( 'js/dashboard/index.min.js' ),
			'asset' => plover_asset_path( 'js/dashboard/index.min.asset.php' ),
			'ver'   => $this->core->is_debug() ? time() : PLOVER_VERSION,
		) );
	}

	/**
	 * Install plover kit plugin ajax url
	 *
	 * @return string
	 */
	protected function install_plover_kit_url() {
		// Plugin installation toolkit introduced since v1.0.4
		if ( is_plover_core_ge( '1.0.4' ) ) {
			return add_query_arg( array(
				'action'   => 'install_plover_kit',
				'_wpnonce' => wp_create_nonce( 'install_plover_kit' )
			), admin_url( 'admin.php' ) );
		}

		return admin_url( 'plugin-install.php?s=Plover%2520Kit&tab=search&type=term' );
	}

	/**
	 * Install plover kit plugin
	 *
	 * @return void
	 */
	public function install_plover_kit() {
		check_ajax_referer( 'install_plover_kit' );

		if ( ! current_user_can( 'activate_plugins' ) ) {
			wp_die(
				'<h1>' . __( 'You need a higher level of permission.', 'plover' ) . '</h1>' .
				'<p>' . __( 'Sorry, you are not allowed to activate plugins on this site.', 'plover' ) . '</p>',
				403
			);
		}

		require_once ABSPATH . 'wp-admin/admin-header.php';

		?>
        <div class="wrap">
			<?php
			Plugin::install( [
				'plover-kit' => esc_html__( 'Plover Kit', 'plover' ),
			], admin_url( 'themes.php' ) );
			?>
        </div>
		<?php
	}

	/**
	 * Dismiss admin notice
	 *
	 * @return void
	 */
	public function dismiss_notice() {

		global $current_user;

		$user_id = $current_user->ID;

		$dismiss_option = esc_html( $_GET['plover_dismiss'] ?? '' );
		if ( is_string( $dismiss_option ) && in_array( $dismiss_option, array( 'get_start' ) ) ) {
			check_ajax_referer( 'plover_dismiss' );

			if ( isset( $_GET['revert'] ) ) {
				delete_user_meta( $user_id, "plover_dismissed_$dismiss_option", 'true', true );
			} else {
				add_user_meta( $user_id, "plover_dismissed_$dismiss_option", 'true', true );
			}
			wp_die( '', '', array( 'response' => 200 ) );
		}
	}

	/**
	 * Show get start notice
	 *
	 * @return void
	 */
	public function get_start_notice() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( PLOVER_KIT_ACTIVE ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! in_array( $screen->base, array( 'dashboard', 'themes' ) ) ) {
			return;
		}

		global $current_user;
		$user_id = $current_user->ID;

		if ( get_user_meta( $user_id, 'plover_dismissed_get_start' ) ) {
			return;
		}

		$dismiss_url = add_query_arg(
			array(
				'plover_dismiss' => 'get_start',
				'_wpnonce'       => wp_create_nonce( 'plover_dismiss' )
			), admin_url()
		);

		$theme            = wp_get_theme();
		$theme_name       = apply_filters( 'plover_welcome_theme_name', $theme->get( 'Name' ) );
		$theme_screenshot = apply_filters( 'plover_welcome_theme_screenshot', get_template_directory_uri() . '/screenshot.png' );
		?>
        <div
                data-dismiss-url="<?php echo esc_url( $dismiss_url ) ?>"
                class="plover-theme-notice plover-admin-page notice notice-info is-dismissible"
                id="plover-welcome-panel"
        >
            <div class="panel-body">
                <span class="plover-admin-badge is-style-ghost"><?php esc_html_e( 'Welcome', 'plover' ); ?></span>
                <h2>
					<?php
					echo sprintf(
					/* Translators: %s Name of current theme name */
						esc_html__( 'Explore the full potential of WordPress with %s and Plover Kit', 'plover' ),
						$theme_name
					)
					?>
                </h2>
                <p>
					<?php esc_html_e( 'Plover Kit has pluggable modules that enhance the Gutenberg core blocks and provide extended features. It also has a weekly growing pattern library to make your website design fly.', 'plover' ); ?>
                </p>
                <div class="plover-admin-buttons">
                    <a href="<?php echo esc_url( 'https://wpplover.com/plugins/plover-kit/?utm_source=' . sanitize_title( $theme_name . '-welcome' ) ) ?>"
                       class="plover-admin-button is-style-ghost"
                       target="_blank"
                    >
						<?php esc_html_e( 'Learn More', 'plover' ); ?>
                    </a>
                    <a href="<?php echo esc_url( $this->install_plover_kit_url() ) ?>"
                       class="plover-admin-button is-style-primary">
						<?php esc_html_e( 'Install & Activate', 'plover' ); ?>
                    </a>
                </div>
            </div>
            <a href="#" class="plover-notice-dismiss text-sm">
				<?php esc_html_e( "Dismiss", 'plover' ); ?>
            </a>
            <img class="plover-admin-screenshot" src="<?php echo esc_url( $theme_screenshot ) ?>" alt="">
        </div>
		<?php
	}

	/**
	 * Add admin menu page
	 *
	 * @return void
	 */
	public function add_theme_admin_menu() {
		$theme_data = wp_get_theme();

		add_theme_page(
			sprintf(
			/* Translators: %s is current theme name */
				esc_html_x( '%s Settings', 'Current theme name', 'plover' ), $theme_data->get( 'Name' )
			),
			sprintf(
			/* Translators: %s is current theme name */
				esc_html_x( '%s Settings', 'Current theme name', 'plover' ), $theme_data->get( 'Name' )
			),
			'edit_theme_options',
			'plover-theme',
			[ $this, 'show_theme_admin_page' ]
		);
	}

	/**
	 * Show admin page
	 *
	 * @return void
	 */
	public function show_theme_admin_page() {

		$site_editor_url = admin_url( 'site-editor.php' );

		$customizer_items = apply_filters( 'plover_theme_dashboard_customize_items', [
			[
				'label' => __( 'Edit Home Page', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.672 1.984c1.728 0 3.2 1.216 3.328 2.784v22.24c0 1.6-1.376 2.88-3.104 2.976l-0.224 0.032h-25.344c-1.728 0-3.2-1.216-3.328-2.784v-22.24c0-1.6 1.376-2.88 3.104-2.976l0.224-0.032h25.344zM28.672 3.328h-25.344c-1.056 0-1.888 0.672-1.984 1.504v22.176c0 0.832 0.768 1.568 1.792 1.632l0.192 0.032h25.344c1.056 0 1.888-0.672 1.984-1.504v-22.176c0-0.832-0.768-1.568-1.792-1.632l-0.192-0.032zM15.552 20.672c0.256 0 0.448 0.192 0.448 0.448v5.76c0 0.256-0.192 0.448-0.448 0.448h-12.448c-0.224 0-0.448-0.192-0.448-0.448v-5.76c0-0.256 0.224-0.448 0.448-0.448h12.448zM28.672 25.984c0.384 0 0.672 0.32 0.672 0.672s-0.256 0.608-0.544 0.672h-10.784c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.224-0.576 0.544-0.64l0.128-0.032h10.656zM14.656 21.984h-10.656v4h10.656v-4zM28.672 23.328c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.256 0.608-0.544 0.64l-0.128 0.032h-10.656c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.224-0.608 0.544-0.64l0.128-0.032h10.656zM28.672 20.672c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.256 0.576-0.544 0.64h-10.784c-0.384 0-0.672-0.288-0.672-0.64s0.224-0.608 0.544-0.672h10.784zM28.896 4.672c0.224 0 0.448 0.192 0.448 0.448v13.76c0 0.256-0.224 0.448-0.448 0.448h-25.792c-0.224 0-0.448-0.192-0.448-0.448v-13.76c0-0.256 0.224-0.448 0.448-0.448h25.792zM20.64 10.304l-5.28 5.44c-0.192 0.16-0.448 0.256-0.704 0.16l-0.096-0.064-3.936-2.304-4.896 4.448h21.472l-6.56-7.68zM28 5.984h-24v11.776l6.080-5.536c0.192-0.16 0.448-0.224 0.672-0.128l0.128 0.064 3.904 2.272 5.44-5.568c0.224-0.256 0.608-0.256 0.896-0.064l0.096 0.096 6.784 7.968v-10.88zM8 7.328c1.12 0 2.016 0.896 2.016 2.016s-0.896 1.984-2.016 1.984-1.984-0.896-1.984-1.984 0.864-2.016 1.984-2.016zM8 8.672c-0.384 0-0.672 0.288-0.672 0.672s0.288 0.64 0.672 0.64 0.672-0.288 0.672-0.64-0.288-0.672-0.672-0.672z"></path></svg>',
				'url'   => $site_editor_url,
			],
			[
				'label' => __( 'Edit Menu', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M30.656 5.344h-29.312c-0.384 0-0.672 0.288-0.672 0.64v4c0 0.384 0.288 0.672 0.672 0.672h8.672v15.328c0 0.384 0.288 0.672 0.64 0.672h13.344c0.384 0 0.672-0.288 0.672-0.672v-15.328h5.984c0.384 0 0.672-0.288 0.672-0.672v-4c0-0.352-0.288-0.64-0.672-0.64zM20.672 9.344h-9.344v-2.688h9.344v2.688zM2.016 6.656h8v2.688h-8v-2.688zM23.328 25.344h-12v-14.688h12v14.688zM30.016 9.344h-8v-2.688h8v2.688zM13.344 13.344c-0.384 0-0.672 0.288-0.672 0.64s0.288 0.672 0.672 0.672h8c0.352 0 0.672-0.288 0.672-0.672s-0.32-0.64-0.672-0.64h-8zM21.344 17.344h-8c-0.384 0-0.672 0.288-0.672 0.64s0.288 0.672 0.672 0.672h8c0.352 0 0.672-0.288 0.672-0.672s-0.32-0.64-0.672-0.64zM21.344 21.344h-8c-0.384 0-0.672 0.288-0.672 0.64s0.288 0.672 0.672 0.672h8c0.352 0 0.672-0.288 0.672-0.672s-0.32-0.64-0.672-0.64z"></path></svg>',
				'url'   => admin_url( 'site-editor.php?postType=wp_navigation' ),
			],
			[
				'label' => __( 'Site Logo', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M30.656 8h-29.312v20.544c0 1.184 0.896 2.112 1.984 2.112h25.344c1.088 0 1.984-0.928 1.984-2.112v-20.544zM30.656 6.656v-1.856c0-1.184-0.896-2.144-1.984-2.144h-25.344c-1.088 0-1.984 0.96-1.984 2.144v1.856h29.312zM32 28.544c0 1.888-1.472 3.456-3.328 3.456h-25.344c-1.856 0-3.328-1.568-3.328-3.456v-23.744c0-1.92 1.472-3.456 3.328-3.456h25.344c1.856 0 3.328 1.536 3.328 3.456v23.744zM4 4.672c0 0.352-0.288 0.672-0.672 0.672s-0.672-0.32-0.672-0.672 0.32-0.672 0.672-0.672 0.672 0.288 0.672 0.672M6.656 4.672c0 0.352-0.288 0.672-0.64 0.672s-0.672-0.32-0.672-0.672 0.288-0.672 0.672-0.672 0.64 0.288 0.64 0.672M9.344 4.672c0 0.352-0.288 0.672-0.672 0.672s-0.672-0.32-0.672-0.672 0.288-0.672 0.672-0.672c0.384 0 0.672 0.288 0.672 0.672M5.728 17.408h0.352c0.192 0 0.384 0.192 0.384 0.416v3.296c0 0.224 0.192 0.384 0.416 0.384h0.96c0.224 0 0.416 0.192 0.416 0.416v0.32c0 0.224-0.16 0.384-0.416 0.384 0 0 0 0 0 0h-2.080c-0.224 0-0.416-0.16-0.416-0.384v-4.416c0-0.224 0.16-0.416 0.384-0.416zM13.184 20c0-0.512-0.16-0.928-0.448-1.248-0.32-0.288-0.736-0.448-1.248-0.448s-0.896 0.16-1.216 0.448c-0.32 0.32-0.48 0.736-0.48 1.248s0.16 0.928 0.48 1.248c0.32 0.288 0.704 0.448 1.216 0.448s0.928-0.16 1.248-0.448c0.32-0.32 0.448-0.736 0.448-1.248zM9.504 21.92c-0.544-0.512-0.832-1.152-0.832-1.92s0.288-1.408 0.832-1.92 1.216-0.736 2.016-0.736 1.472 0.256 2.016 0.736c0.544 0.512 0.8 1.152 0.8 1.92s-0.256 1.408-0.8 1.92c-0.544 0.48-1.216 0.736-2.016 0.736s-1.472-0.256-2.016-0.736zM14.912 20c0-0.768 0.288-1.408 0.832-1.92 0.544-0.48 1.216-0.736 2.016-0.736 0.576 0 1.12 0.128 1.6 0.416 0.448 0.288 0.8 0.736 0.896 1.12 0.032 0.256-0.256 0.32-0.704 0.32-0.128 0-0.256-0.096-0.352-0.224-0.256-0.448-0.864-0.704-1.472-0.704-0.512 0-0.896 0.16-1.216 0.48-0.32 0.288-0.48 0.704-0.48 1.248 0 0.512 0.16 0.928 0.48 1.216 0.32 0.32 0.704 0.48 1.152 0.48s0.8-0.128 1.088-0.32c0.288-0.192 0.384-0.384 0.448-0.64h-1.44c-0.192 0-0.384-0.16-0.384-0.384 0 0 0-0.032 0-0.032v-0.224c0.032-0.192 0.192-0.384 0.416-0.384l2.208 0.032c0.224 0 0.384 0.16 0.384 0.416v0.32c-0.096 0.576-0.32 1.088-0.832 1.504-0.512 0.448-1.12 0.64-1.888 0.64s-1.408-0.224-1.952-0.736c-0.544-0.48-0.8-1.12-0.8-1.888zM25.536 20c0-0.512-0.16-0.928-0.48-1.248-0.32-0.288-0.736-0.448-1.216-0.448-0.512 0-0.928 0.16-1.248 0.448-0.32 0.32-0.448 0.736-0.448 1.248s0.16 0.928 0.448 1.248c0.32 0.288 0.736 0.448 1.248 0.448 0.48 0 0.896-0.16 1.216-0.448 0.32-0.32 0.48-0.736 0.48-1.248zM21.824 21.92c-0.544-0.512-0.8-1.152-0.8-1.92s0.256-1.408 0.832-1.92 1.184-0.736 1.984-0.736c0.8 0 1.472 0.256 2.016 0.736 0.544 0.512 0.832 1.152 0.832 1.92s-0.288 1.408-0.832 1.92c-0.544 0.48-1.216 0.736-2.016 0.736s-1.472-0.256-2.016-0.736zM27.328 25.344h-22.656c-0.384 0-0.672-0.32-0.672-0.672s0.288-0.672 0.672-0.672h22.656c0.384 0 0.672 0.288 0.672 0.672s-0.288 0.672-0.672 0.672zM27.328 16h-22.656c-0.384 0-0.672-0.288-0.672-0.672s0.288-0.672 0.672-0.672h22.656c0.384 0 0.672 0.288 0.672 0.672s-0.288 0.672-0.672 0.672z"></path></svg>',
				'url'   => $site_editor_url,
			],
			[
				'label' => __( 'Edit Styles', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74 74"><g><path d="M37.024 71.565a35.15 35.15 0 0 1-10.359-1.548 9.74 9.74 0 0 1-6.443-6.333 10.03 10.03 0 0 1 1.431-9.07l3.483-4.745a5.377 5.377 0 0 0 .12-6.355 5.607 5.607 0 0 0-6.244-2.236L11.09 43.7A7.035 7.035 0 0 1 2 36.977C2 17.93 17.712 2.435 37.024 2.435A34.8 34.8 0 0 1 72 36.976a34.823 34.823 0 0 1-34.976 34.589zM20.6 39.069a7.561 7.561 0 0 1 6.3 3.316 7.413 7.413 0 0 1-.159 8.667L23.265 55.8a7.923 7.923 0 0 0-1.144 7.259 7.765 7.765 0 0 0 5.133 5.05 33.16 33.16 0 0 0 9.77 1.459A32.821 32.821 0 0 0 70 36.976 32.8 32.8 0 0 0 37.024 4.435C18.814 4.435 4 19.033 4 36.976a5.035 5.035 0 0 0 6.506 4.809l7.956-2.429a8.284 8.284 0 0 1 2.138-.287z"></path><path d="M36.976 21.839a6.526 6.526 0 1 1 6.55-6.5 6.51 6.51 0 0 1-6.55 6.5zm0-11.052a4.526 4.526 0 1 0 4.55 4.55 4.531 4.531 0 0 0-4.55-4.55zM55.492 32.5a6.526 6.526 0 1 1 6.55-6.5 6.51 6.51 0 0 1-6.55 6.5zm0-11.052A4.526 4.526 0 1 0 60.042 26a4.531 4.531 0 0 0-4.55-4.555zM55.492 54.643a6.526 6.526 0 1 1 6.55-6.5 6.51 6.51 0 0 1-6.55 6.5zm0-11.052a4.526 4.526 0 1 0 4.55 4.55 4.531 4.531 0 0 0-4.55-4.55zM35.857 63.873a6.526 6.526 0 1 1 6.55-6.5 6.509 6.509 0 0 1-6.55 6.5zm0-11.051a4.526 4.526 0 1 0 4.55 4.55 4.531 4.531 0 0 0-4.55-4.55zM18.9 33.616a6.526 6.526 0 1 1 6.55-6.5 6.509 6.509 0 0 1-6.55 6.5zm0-11.052a4.526 4.526 0 1 0 4.55 4.55 4.531 4.531 0 0 0-4.55-4.55z"></path></g></svg>',
				'url'   => admin_url( 'site-editor.php?path=%2Fwp_global_styles' ),
			],
			[
				'label' => __( 'Edit Site Header', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.672 1.984c1.728 0 3.2 1.216 3.328 2.816v22.272c0 1.6-1.344 2.944-3.072 2.944h-25.6c-1.728 0-3.2-1.216-3.328-2.816v-22.272c0-1.6 1.344-2.944 3.072-2.944h25.6zM30.656 8.672h-29.312v18.4c0 0.8 0.8 1.6 1.856 1.6h25.472c1.056 0 1.856-0.672 1.984-1.472v-18.528zM28.672 3.328h-25.344c-1.056 0-1.856 0.672-1.984 1.472v2.528h29.312v-2.4c0-0.8-0.8-1.6-1.856-1.6h-0.128z"></path></svg>',
				'url'   => $site_editor_url,
			],
			[
				'label' => __( 'Edit Footer', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.672 1.984c1.856 0 3.328 1.344 3.328 2.944v22.016c0 1.728-1.472 2.912-3.328 2.912h-25.344c-1.856 0-3.328-1.312-3.328-2.912v-22.016c0-1.728 1.472-2.944 3.328-2.944h25.344zM30.656 23.328h-29.312v3.744c0 0.928 0.928 1.6 1.984 1.6h25.344c1.056 0 1.984-0.8 1.984-1.6v-3.744zM28.672 3.328h-25.344c-1.056 0-1.984 0.8-1.984 1.6v17.056h29.312v-17.056c0-0.8-0.928-1.6-1.984-1.6z"></path></svg>',
				'url'   => $site_editor_url,
			],
			[
				'label' => __( 'Change Site Title', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="M298.305 1h-84.609L23.539 511h96.056l48.472-130h175.867l48.472 130h96.056zm59.517 360H154.178l-48.472 130H52.342L227.584 21h56.832l175.242 470h-53.364z"></path><path d="M172.82 311h166.36L256 87.917zm28.803-20L256 145.163 310.377 291z"></path></g></svg>',
				'url'   => $site_editor_url,
			],
			[
				'label' => __( 'Add New Page', 'plover' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M28.672 1.984c1.728 0 3.2 1.216 3.328 2.784v22.24c0 1.6-1.376 2.88-3.104 2.976l-0.224 0.032h-25.344c-1.728 0-3.2-1.216-3.328-2.784v-22.24c0-1.6 1.376-2.88 3.104-2.976l0.224-0.032h25.344zM28.672 3.328h-25.344c-1.056 0-1.888 0.672-1.984 1.504v22.176c0 0.832 0.768 1.568 1.792 1.632l0.192 0.032h25.344c1.056 0 1.888-0.672 1.984-1.504v-22.176c0-0.832-0.768-1.568-1.792-1.632l-0.192-0.032zM26.656 23.328c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.224 0.608-0.544 0.64l-0.128 0.032h-21.312c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.224-0.608 0.544-0.64l0.128-0.032h21.312zM26.656 19.328c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.224 0.608-0.544 0.64l-0.128 0.032h-21.312c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.224-0.608 0.544-0.64l0.128-0.032h21.312zM9.248 7.648l0.032 0.128 3.36 9.344c0.096 0.32-0.064 0.704-0.416 0.832-0.288 0.128-0.64-0.032-0.8-0.288l-0.064-0.096-0.8-2.24h-3.808l-0.8 2.24c-0.096 0.288-0.416 0.48-0.736 0.416h-0.096c-0.32-0.128-0.48-0.448-0.448-0.736l0.032-0.128 3.328-9.344c0.224-0.544 0.928-0.576 1.216-0.128zM26.656 15.328c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.224 0.608-0.544 0.64l-0.128 0.032h-10.656c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.256-0.608 0.544-0.64l0.128-0.032h10.656zM8.672 9.984l-1.44 4h2.848l-1.408-4zM26.656 11.328c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.224 0.608-0.544 0.64l-0.128 0.032h-10.656c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.256-0.608 0.544-0.64l0.128-0.032h10.656zM26.656 7.328c0.384 0 0.672 0.288 0.672 0.672 0 0.32-0.224 0.608-0.544 0.64l-0.128 0.032h-10.656c-0.384 0-0.672-0.288-0.672-0.672 0-0.32 0.256-0.608 0.544-0.64l0.128-0.032h10.656z"></path></svg>',
				'url'   => admin_url( 'edit.php?post_type=page' ),
			],
		] );

		$modules = apply_filters( 'plover_theme_dashboard_plugin_module', [
			[
				'label'       => __( 'Dark Mode', 'plover' ),
				'description' => __( 'Theme dark mode global settings.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-theme/dark-mode/global-dark-mode-settings/',
				'icon'        => plover_asset_url( 'images/dark-mode.png' ),
			],
			[
				'label'       => __( 'Pattern library', 'plover' ),
				'description' => __( 'Add beautiful, ready-to-go layouts to your site with one click.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/pattern-library/',
				'icon'        => plover_asset_url( 'images/pattern-library.png' ),
			],
			[
				'label'       => __( 'Table of Contents', 'plover' ),
				'description' => __( 'Introduce a Table of Contents block to your posts and pages.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/table-of-contents/',
				'icon'        => plover_asset_url( 'images/table-of-contents.png' ),
			],
			[
				'label'       => __( 'Code Snippets', 'plover' ),
				'description' => __( 'Insert code snippets to site header or footer section like Google Analytics code, AdSense Code, Facebook Pixels code, and more.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/code-snippets/',
				'icon'        => plover_asset_url( 'images/code-snippets.png' ),
			],
			[
				'label'       => __( 'Shape Divider', 'plover' ),
				'description' => __( 'Shape divider is used to create visual separation between different sections of content.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/shape-divider',
				'icon'        => plover_asset_url( 'images/shape-divider.png' ),
			],
			[
				'label'       => __( 'Particles Effect', 'plover' ),
				'description' => __( 'Add cool particle effects to your designs!', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/particles-effect',
				'icon'        => plover_asset_url( 'images/particles-effect.png' ),
			],
			[
				'label'       => __( 'Icon library', 'plover' ),
				'description' => __( 'Icon library allows you to manage icon libraries and upload your custom svg icons.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/icon-library/',
				'icon'        => plover_asset_url( 'images/icon-library.png' ),
			],
			[
				'label'       => __( 'Icon Block', 'plover' ),
				'description' => __( 'Add icons to your design! 2000+ free icons available!', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/icon-block/',
				'icon'        => plover_theme()->core_url( 'assets/images/icon-block.png' ),
			],
			[
				'label'       => __( 'Code highlight', 'plover' ),
				'description' => __( 'Add out-of-the-box code highlighting features for core/code block.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/code-highlight/',
				'icon'        => plover_theme()->core_url( 'assets/images/code-highlight.png' ),
			],
			[
				'label'       => __( 'Block event handler', 'plover' ),
				'description' => __( 'Adding event handler to blocks to execute custom JavaScript snippets.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/block-event-handler/',
				'icon'        => plover_theme()->core_url( 'assets/images/code-highlight.png' ),
			],
			[
				'label'       => __( 'Block Sticky', 'plover' ),
				'description' => __( 'Make your content in the page visible at all times, making it permanently visible while scrolling.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/block-sticky/',
				'icon'        => plover_theme()->core_url( 'assets/images/block-sticky.png' ),
			],
			[
				'label'       => __( 'Block shadow', 'plover' ),
				'description' => __( 'Extra text-shadow, drop-shadow, and box-shadow support for core blocks.', 'plover' ),
				'doc'         => 'https://wpplover.com/docs/plover-kit/modules/block-shadow/',
				'icon'        => plover_theme()->core_url( 'assets/images/block-shadow.png' ),
			]
		] );

		$widgets = apply_filters( 'plover_theme_dashboard_widgets', [
			[
				'title'   => __( 'Install Plover Kit', 'plover' ),
				'content' => __( "Plover Kit has pluggable modules that enhance the Gutenberg core blocks and provide extended features. It also has a weekly growing pattern library to make your website design fly.", 'plover' ),
				'icon'    => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c13-21.9 36.5-35.3 61.9-35.3l82.3 0c2.4-4 4.8-7.7 7.2-11.3C289.1-4.1 411.1-8.1 483.9 5.3c11.6 2.1 20.6 11.2 22.8 22.8c13.4 72.9 9.3 194.8-111.4 276.7c-3.5 2.4-7.3 4.8-11.3 7.2v82.3c0 25.4-13.4 49-35.3 61.9l-88.5 52.5c-7.4 4.4-16.6 4.5-24.1 .2s-12.1-12.2-12.1-20.9V380.8c-14.1 4.9-26.4 8.9-35.7 11.9c-11.2 3.6-23.4 .5-31.8-7.8zM384 168c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40z"/></svg>',
				'url'     => esc_url( $this->install_plover_kit_url() ),
				'label'   => __( 'Install & Active', 'plover' ),
				'enable'  => ! PLOVER_KIT_ACTIVE
			],
			[
				'title'   => __( 'Upgrade to Premium', 'plover' ),
				'content' => __( 'Upgrade to Premium Edition to support our development and get more features and functionality to help you create powerful and feature-rich websites.', 'plover' ),
				'icon'    => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M378.7 32H133.3L256 182.7L378.7 32zM512 192l-107.4-141.3L289.6 192H512zM107.4 50.67L0 192h222.4L107.4 50.67zM244.3 474.9C247.3 478.2 251.6 480 256 480s8.653-1.828 11.67-5.062L510.6 224H1.365L244.3 474.9z"/></svg>',
				'url'     => plover_upsell_url(),
				'label'   => __( 'Upgrade', 'plover' ),
				'target'  => '_blank',
				'enable'  => PLOVER_KIT_ACTIVE && ! PLOVER_KIT_PREMIUM_ACTIVE
			],
			[
				'title'   => __( 'Support Forum', 'plover' ),
				'content' => __( "If you have any question about using this theme, feel free to create a new topic in the support forum.", 'plover' ),
				'icon'    => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M416 176C416 78.8 322.9 0 208 0S0 78.8 0 176c0 39.57 15.62 75.96 41.67 105.4c-16.39 32.76-39.23 57.32-39.59 57.68c-2.1 2.205-2.67 5.475-1.441 8.354C1.9 350.3 4.602 352 7.66 352c38.35 0 70.76-11.12 95.74-24.04C134.2 343.1 169.8 352 208 352C322.9 352 416 273.2 416 176zM599.6 443.7C624.8 413.9 640 376.6 640 336C640 238.8 554 160 448 160c-.3145 0-.6191 .041-.9336 .043C447.5 165.3 448 170.6 448 176c0 98.62-79.68 181.2-186.1 202.5C282.7 455.1 357.1 512 448 512c33.69 0 65.32-8.008 92.85-21.98C565.2 502 596.1 512 632.3 512c3.059 0 5.76-1.725 7.02-4.605c1.229-2.879 .6582-6.148-1.441-8.354C637.6 498.7 615.9 475.3 599.6 443.7z"/></svg>',
				'url'     => apply_filters( 'plover_theme_support_forum_url', 'https://wordpress.org/support/theme/plover/' ),
				'target'  => '_blank',
				'label'   => __( 'Create a Topic', 'plover' ),
				'enable'  => true
			],
		] );

		$links = apply_filters( 'plover_theme_dashboard_links', [
			[
				'title' => __( 'Homepage', 'plover' ),
				'url'   => 'https://wpplover.com/',
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M511.8 287.6L512.5 447.7C512.5 450.5 512.3 453.1 512 455.8V472C512 494.1 494.1 512 472 512H456C454.9 512 453.8 511.1 452.7 511.9C451.3 511.1 449.9 512 448.5 512H392C369.9 512 352 494.1 352 472V384C352 366.3 337.7 352 320 352H256C238.3 352 224 366.3 224 384V472C224 494.1 206.1 512 184 512H128.1C126.6 512 125.1 511.9 123.6 511.8C122.4 511.9 121.2 512 120 512H104C81.91 512 64 494.1 64 472V360C64 359.1 64.03 358.1 64.09 357.2V287.6H32.05C14.02 287.6 0 273.5 0 255.5C0 246.5 3.004 238.5 10.01 231.5L266.4 8.016C273.4 1.002 281.4 0 288.4 0C295.4 0 303.4 2.004 309.5 7.014L416 100.7V64C416 46.33 430.3 32 448 32H480C497.7 32 512 46.33 512 64V185L564.8 231.5C572.8 238.5 576.9 246.5 575.8 255.5C575.8 273.5 560.8 287.6 543.8 287.6L511.8 287.6z"/></svg>',
			],
			[
				'title' => __( 'Documentation', 'plover' ),
				'url'   => apply_filters( 'plover_theme_documentation_url', 'https://wpplover.com/docs/plover-theme/' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" /><path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.711 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" /><path d="M4.462 19.462c.42-.419.753-.89 1-1.395.453.214.902.435 1.347.662a6.742 6.742 0 0 1-1.286 1.794.75.75 0 0 1-1.06-1.06Z" /></svg>',
			],
			[
				'title' => __( 'Support Forum', 'plover' ),
				'url'   => apply_filters( 'plover_theme_support_forum_url', 'https://wordpress.org/support/theme/plover/' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>',
			],
			[
				'title' => __( 'Rate Us 5 Stars', 'plover' ),
				'url'   => apply_filters( 'plover_theme_rate_us_url', 'https://wordpress.org/support/theme/plover/reviews/?rate=5#new-post' ),
				'icon'  => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"/></svg>',
			],
		] );

		?>
        <div class="plover-dashboard-wrap wrap plover-admin-page">
            <div class="plover-dashboard-body">
                <div class="plover-dashboard-main">
                    <div class="plover-dashboard-content">
                        <div class="dashboard-header">
                            <h2><?php esc_html_e( 'Customize', 'plover' ); ?></h2>
                            <a href="<?php echo esc_url( $site_editor_url ) ?>"><?php esc_html_e( 'Go To Site Editor', 'plover' ); ?></a>
                        </div>
                        <div class="customize-settings">
							<?php foreach ( $customizer_items as $item ): ?>
                                <div class="customize-setting-wrap">
                                    <a class="customize-setting"
                                       target="_blank"
                                       href="<?php echo esc_url( $item['url'] ) ?>">
                                        <div class="customize-setting-icon">
											<?php echo wp_kses_post( $item['icon'] ); ?>
                                        </div>
                                        <span class="item-label"><?php echo esc_html( $item['label'] ); ?></span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                            <path d="M502.6 278.6l-128 128c-12.51 12.51-32.76 12.49-45.25 0c-12.5-12.5-12.5-32.75 0-45.25L402.8 288H32C14.31 288 0 273.7 0 255.1S14.31 224 32 224h370.8l-73.38-73.38c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l128 128C515.1 245.9 515.1 266.1 502.6 278.6z"/>
                                        </svg>
                                    </a>
                                </div>
							<?php endforeach; ?>
                        </div>
                    </div>

                    <div class="plover-dashboard-plugin-modules">
                        <div class="dashboard-header">
                            <h2><?php esc_html_e( 'Featured Plover Kit Modules', 'plover' ); ?></h2>
                        </div>

                        <div class="plover-dashboard-module-list">
							<?php foreach ( $modules as $module ): ?>
                                <div class="plover-dashboard-module plover-dashboard-module-card">
                                    <div class="plover-dashboard-module-panel">
                                        <figure class="plover-dashboard-module-icon">
                                            <img src="<?php echo esc_url( $module['icon'] ) ?>"
                                                 alt="<?php echo esc_html( $module['label'] ) ?>"/>
                                        </figure>
                                        <div class="plover-dashboard-module-body">
                                            <div class="plover-dashboard-module-title">
                                                <h3><?php echo esc_html( $module['label'] ) ?></h3>
                                            </div>
                                            <span><?php echo esc_html( $module['description'] ) ?></span>
                                        </div>
                                    </div>
                                    <div class="plover-dashboard-module-footer">
                                        <a href="<?php echo esc_url( $module['doc'] ) ?>"
                                           class="plover-admin-button is-style-ghost text-sm"
                                           target="_blank"
                                        >
											<?php esc_html_e( 'Documentation', 'plover' ); ?>
                                        </a>
										<?php if ( ! PLOVER_KIT_ACTIVE ): ?>
                                            <a href="<?php echo esc_url( $this->install_plover_kit_url() ) ?>"
                                               class="plover-admin-button text-sm">
												<?php esc_html_e( 'Install & Active', 'plover' ); ?>
                                            </a>
										<?php endif; ?>
                                    </div>
                                </div>
							<?php endforeach; ?>
                        </div>

                        <div class="plover-dashboard-more-modules">
                            <a href="<?php echo esc_url( PLOVER_KIT_ACTIVE ? admin_url( 'admin.php?page=plover-kit' ) : 'https://wpplover.com/plugins/plover-kit/' ) ?>"
                               class="plover-admin-button is-style-link"
                            >
								<?php esc_html_e( 'More Modules', 'plover' ); ?>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                     stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                          d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="plover-dashboard-sidebar">
                    <div class="dashboard-widgets-area">
                        <div class="dashboard-widget">
                            <h3 class="widget-title">
								<?php esc_html_e( 'Useful Links', 'plover' ); ?>
                            </h3>
                            <div class="widget-content">
                                <ul class="links">
									<?php foreach ( $links as $link ): ?>
                                        <li class="link-item">
											<?php echo wp_kses_post( $link['icon'] ) ?>
                                            <a href="<?php echo esc_url( $link['url'] ) ?>" target="_blank">
												<?php echo esc_html( $link['title'] ); ?>
                                            </a>
                                        </li>
									<?php endforeach; ?>
                                </ul>
                            </div>
                        </div>
						<?php foreach ( $widgets as $widget ): ?>
							<?php if ( isset( $widget['enable'] ) && $widget['enable'] ): ?>
                                <div class="dashboard-widget">
                                    <h3 class="widget-title">
										<?php echo esc_html( $widget['title'] ); ?>
                                    </h3>
                                    <p class="widget-content">
										<?php echo esc_html( $widget['content'] ); ?>
                                    </p>
                                    <a class="widget-link plover-admin-button is-style-primary"
                                       href="<?php echo esc_url( $widget['url'] ) ?>"
                                       target="<?php echo esc_attr( $widget['target'] ?? '_self' ) ?>">
										<?php echo wp_kses_post( $widget['icon'] ); ?>
                                        <span><?php echo esc_html( $widget['label'] ); ?></span>
                                    </a>
                                </div>
							<?php endif; ?>
						<?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>
		<?php
	}
}


function base_ext_init() {
}

function base_ext_render() {
    if (context_raw.frame == 2) {
		util_render_make_material_preview();
		ui_base_hwnds[tab_area_t.SIDEBAR1].redraws = 2;

		base_init_undo_layers();
    }
}

function base_ext_init_config(raw: config_t) {

}

function base_ext_update() {

}

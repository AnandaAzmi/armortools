
let ui_toolbar_default_w: i32 = 36;
let ui_toolbar_handle: ui_handle_t = ui_handle_create();
let ui_toolbar_last_tool: i32 = 0;
let ui_toolbar_tool_names: string[] = [
	_tr("Brush"),
	_tr("Eraser"),
	_tr("Fill"),
	_tr("Decal"),
	_tr("Text"),
	_tr("Clone"),
	_tr("Blur"),
	_tr("Smudge"),
	_tr("Particle"),
	_tr("ColorID"),
	_tr("Picker"),
	_tr("Bake"),
	_tr("Gizmo"),
	_tr("Material"),
];

let _ui_toolbar_i: i32;

function ui_toolbar_init() {
}

function ui_toolbar_draw_tool(i: i32, img: gpu_texture_t, icon_accent: i32, keys: string[]) {
	ui._x += 2;
	if (context_raw.tool == i) {
		ui_toolbar_draw_highlight();
	}
	let tile_y: i32 = math_floor(i / 12);
	let tile_x: i32 = tile_y % 2 == 0 ? i % 12 : (11 - (i % 12));
	let rect: rect_t = resource_tile50(img, tile_x, tile_y);
	let _y: i32 = ui._y;

	let visible: bool = true;
	if (config_raw.layout[layout_size_t.HEADER] == 0) {
		let statush: i32 = config_raw.layout[layout_size_t.STATUS_H];
		let statusy: i32 = iron_window_height() - statush;
		visible = ui._y + ui._w * 2 < statusy;
	}

	let image_state: ui_state_t = ui_sub_image(img, icon_accent, -1.0, rect.x, rect.y, rect.w, rect.h);
	if (image_state == ui_state_t.STARTED && visible) {
		_ui_toolbar_i = i;
		sys_notify_on_next_frame(function() {
			context_select_tool(_ui_toolbar_i);
		});
	}
	else if (image_state == ui_state_t.RELEASED && config_raw.layout[layout_size_t.HEADER] == 0 && visible) {
		if (ui_toolbar_last_tool == i) {
			ui_toolbar_tool_properties_menu();
		}
		ui_toolbar_last_tool = i;
	}

	if (i == tool_type_t.COLORID && context_raw.colorid_picked) {
		let rt: render_target_t = map_get(render_path_render_targets, "texpaint_colorid");
		draw_scaled_sub_image(rt._image, 0, 0, 1, 1, 0, _y + 1.5 * UI_SCALE(), 5 * UI_SCALE(), 34 * UI_SCALE());
	}

	if (ui.is_hovered) {
		let key: string = keys[i];
		if (key.length > 0) {
			ui_tooltip(tr(ui_toolbar_tool_names[i]) + " " + key);
		}
		else {
			ui_tooltip(tr(ui_toolbar_tool_names[i]));
		}
	}
	ui._x -= 2;
	ui._y += 2;
}

function ui_toolbar_w(screen_size_request: bool = false): i32 {
	if (screen_size_request && context_is_floating_toolbar()) {
		return 0;
	}

	let w: i32 = 0;
	if (config_raw.touch_ui) {
		w = ui_toolbar_default_w + 6;
	}
	else {
		w = ui_toolbar_default_w;
	}
	w = math_floor(w * config_raw.window_scale);
	return w;
}

function ui_toolbar_x(): i32 {
	return 5 * UI_SCALE();
}

function ui_toolbar_render_ui() {
	let x: i32 = 0;
	let y: i32 = ui_header_h;
	let h: i32 = iron_window_height() - ui_header_h;
	let _WINDOW_BG_COL: i32 = ui.ops.theme.WINDOW_BG_COL;

	if (context_is_floating_toolbar()) {
		x += ui_toolbar_x();
		y += ui_toolbar_x() + 3 * UI_SCALE();
		h = (ui_toolbar_tool_names.length + 1) * (ui_toolbar_w() + 2);
		ui.ops.theme.WINDOW_BG_COL = ui.ops.theme.SEPARATOR_COL;
	}

	if (ui_window(ui_toolbar_handle, x, y, ui_toolbar_w(), h)) {
		ui._y -= 4 * UI_SCALE();

		ui.image_scroll_align = false;
		let img: gpu_texture_t = resource_get("icons.k");

		let col: u32 = ui.ops.theme.WINDOW_BG_COL;
		let light: bool = col > 0xff666666;
		let icon_accent: i32 = light ? 0xff666666 : -1;

		// Properties icon
		if (config_raw.layout[layout_size_t.HEADER] == 1) {
			let rect: rect_t = resource_tile50(img, 7, 1);
			if (ui_sub_image(img, light ? 0xff666666 : ui.ops.theme.BUTTON_COL, -1.0, rect.x, rect.y, rect.w, rect.h) == ui_state_t.RELEASED) {
				config_raw.layout[layout_size_t.HEADER] = 0;
			}
		}
		// Draw ">>" button if header is hidden
		else {
			let _ELEMENT_H: i32 = ui.ops.theme.ELEMENT_H;
			let _BUTTON_H: i32 = ui.ops.theme.BUTTON_H;
			let _BUTTON_COL: i32 = ui.ops.theme.BUTTON_COL;
			let _fontOffsetY: i32 = ui.font_offset_y;
			ui.ops.theme.ELEMENT_H = math_floor(ui.ops.theme.ELEMENT_H * 1.5);
			ui.ops.theme.BUTTON_H = ui.ops.theme.ELEMENT_H;
			ui.ops.theme.BUTTON_COL = ui.ops.theme.WINDOW_BG_COL;
			let font_height: i32 = draw_font_height(ui.ops.font, ui.font_size);
			ui.font_offset_y = (UI_ELEMENT_H() - font_height) / 2;
			let _w: i32 = ui._w;
			ui._w = ui_toolbar_w();

			if (ui_button(">>")) {
				ui_toolbar_tool_properties_menu();
			}

			ui._w = _w;
			ui.ops.theme.ELEMENT_H = _ELEMENT_H;
			ui.ops.theme.BUTTON_H = _BUTTON_H;
			ui.ops.theme.BUTTON_COL = _BUTTON_COL;
			ui.font_offset_y = _fontOffsetY;
		}
		if (ui.is_hovered) {
			ui_tooltip(tr("Toggle header"));
		}
		ui._y -= 4 * UI_SCALE();

		let vars_brush: map_t<string, string> = map_create();
		map_set(vars_brush, "key", map_get(config_keymap, "brush_ruler"));
		map_set(vars_brush, "action_paint", map_get(config_keymap, "action_paint"));

		let vars_decal: map_t<string, string> = map_create();
		map_set(vars_decal, "key", map_get(config_keymap, "decal_mask"));

		let vars_clone: map_t<string, string> = map_create();
		map_set(vars_clone, "key", map_get(config_keymap, "set_clone_source"));

		let key_tool_brush: string = map_get(config_keymap, "tool_brush");
		let key_tool_eraser: string = map_get(config_keymap, "tool_eraser");
		let key_tool_fill: string = map_get(config_keymap, "tool_fill");
		let key_tool_decal: string = map_get(config_keymap, "tool_decal");
		let key_tool_text: string = map_get(config_keymap, "tool_text");
		let key_tool_clone: string = map_get(config_keymap, "tool_clone");
		let key_tool_blur: string = map_get(config_keymap, "tool_blur");
		let key_tool_smudge: string = map_get(config_keymap, "tool_smudge");
		let key_tool_particle: string = map_get(config_keymap, "tool_particle");
		let key_tool_colorid: string = map_get(config_keymap, "tool_colorid");
		let key_tool_picker: string = map_get(config_keymap, "tool_picker");
		let key_tool_bake: string = map_get(config_keymap, "tool_bake");
		let key_tool_gizmo: string = map_get(config_keymap, "tool_gizmo");
		let key_tool_material: string = map_get(config_keymap, "tool_material");

		key_tool_brush = "(" + key_tool_brush + ") - " + tr("Hold {action_paint} to paint\nHold {key} and press {action_paint} to paint a straight line (ruler mode)", vars_brush);
		key_tool_eraser = "(" + key_tool_eraser + ") - " + tr("Hold {action_paint} to erase\nHold {key} and press {action_paint} to erase a straight line (ruler mode)", vars_brush);
		key_tool_fill = "(" + key_tool_fill + ")";
		key_tool_decal = "(" + key_tool_decal + ") - " + tr("Hold {key} to paint on a decal mask", vars_decal);
		key_tool_text = "(" + key_tool_text + ") - " + tr("Hold {key} to use the text as a mask", vars_decal);
		key_tool_clone = "(" + key_tool_clone + ") - " + tr("Hold {key} to set source", vars_clone);
		key_tool_blur = "(" + key_tool_blur + ")";
		key_tool_smudge = "(" + key_tool_smudge + ")";
		key_tool_particle = "(" + key_tool_particle + ")";
		key_tool_colorid = "(" + key_tool_colorid + ")";
		key_tool_picker = "(" + key_tool_picker + ")";
		key_tool_bake = "(" + key_tool_bake + ")";
		key_tool_gizmo = "(" + key_tool_gizmo + ")";
		key_tool_material = "(" + key_tool_material + ")";

		let keys: string[] = [
			key_tool_brush,
			key_tool_eraser,
			key_tool_fill,
			key_tool_decal,
			key_tool_text,
			key_tool_clone,
			key_tool_blur,
			key_tool_smudge,
			key_tool_particle,
			key_tool_colorid,
			key_tool_picker,
			key_tool_bake,
			key_tool_gizmo,
			key_tool_material
		];

		// Erase the () in case no shortcut is assigned
		for(let i: i32 = 0; i < keys.length; ++i) {
			let key: string = keys[i];
			if(key.length == 2)
				keys[i] = "";
			else if(char_at(key,1) ==  ")") {
				keys[i] = substring(key,5,key.length);
			}
		}

		ui_toolbar_ext_draw_tools(img, icon_accent, keys);

		ui.image_scroll_align = true;
	}

	if (context_is_floating_toolbar()) {
		ui.ops.theme.WINDOW_BG_COL = _WINDOW_BG_COL;
	}

	if (config_raw.touch_ui) {
		// Hide scrollbar
		let _SCROLL_W: i32 = ui.ops.theme.SCROLL_W;
		ui.ops.theme.SCROLL_W = 0;
		ui_end_window();
		ui.ops.theme.SCROLL_W = _SCROLL_W;
	}
}

function ui_toolbar_tool_properties_menu() {
	ui_menu_draw(function () {
		ui.changed = false;

		ui_header_draw_tool_properties();

		if (ui.changed || ui.is_typing) {
			ui_menu_keep_open = true;
		}

		if (ui_button(tr("Pin to Header"), ui_align_t.LEFT)) {
			config_raw.layout[layout_size_t.HEADER] = 1;
		}
	}, math_floor(ui._x + ui._w + 6 * UI_SCALE()), math_floor(ui._y - 2 * UI_SCALE()));
}

function ui_toolbar_draw_highlight() {
	let size: i32 = ui_toolbar_w() - 4;
	draw_set_color(ui.ops.theme.HIGHLIGHT_COL);
	ui_draw_rect(true, ui._x + -1,  ui._y + 2, size + 2, size + 2);
}


function ui_toolbar_ext_draw_tools(img: gpu_texture_t, icon_accent: i32, keys: string[]) {
	ui_toolbar_draw_tool(tool_type_t.BRUSH, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.ERASER, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.FILL, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.DECAL, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.TEXT, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.CLONE, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.BLUR, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.SMUDGE, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.PARTICLE, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.COLORID, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.PICKER, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.BAKE, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.MATERIAL, img, icon_accent, keys);
	ui_toolbar_draw_tool(tool_type_t.GIZMO, img, icon_accent, keys);
}


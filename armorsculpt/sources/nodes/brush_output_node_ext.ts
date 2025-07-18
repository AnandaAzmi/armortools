
type brush_output_node_t = {
	base?: logic_node_t;
	raw?: ui_node_t;
};

function brush_output_node_create_ext(n: brush_output_node_t) {
	context_raw.brush_output_node_inst = n;
}

function brush_output_node_parse_inputs(self: brush_output_node_t) {

	let last_mask: gpu_texture_t = context_raw.brush_mask_image;
	let last_stencil: gpu_texture_t = context_raw.brush_stencil_image;

	let input0: logic_node_value_t = logic_node_input_get(self.base.inputs[0]);
	let input1: logic_node_value_t = logic_node_input_get(self.base.inputs[1]);
	let input2: logic_node_value_t = logic_node_input_get(self.base.inputs[2]);
	let input3: logic_node_value_t = logic_node_input_get(self.base.inputs[3]);
	let input4: logic_node_value_t = logic_node_input_get(self.base.inputs[4]);

	context_raw.paint_vec = input0._vec4;
	context_raw.brush_nodes_radius = input1._f32;

	let opac: logic_node_value_t = input2; // Float or texture name
	if (opac == null) {
		opac = { _f32: 1.0 };
	}
	if (opac._str != null) { // string
		context_raw.brush_mask_image_is_alpha = ends_with(opac._str, ".a");
		opac._str = substring(opac._str, 0, string_last_index_of(opac._str, "."));
		context_raw.brush_nodes_opacity = 1.0;
		let index: i32 = array_index_of(project_asset_names, opac._str);
		let asset: asset_t = project_assets[index];
		context_raw.brush_mask_image = project_get_image(asset);
	}
	else {
		context_raw.brush_nodes_opacity = opac._f32;
		context_raw.brush_mask_image = null;
	}

	context_raw.brush_nodes_hardness = input3._f32;

	let stencil: logic_node_value_t = input4; // Float or texture name
	if (stencil == null) {
		stencil = { _f32: 1.0 };
	}
	if (stencil._str != null) { // string
		context_raw.brush_stencil_image_is_alpha = ends_with(stencil._str, ".a");
		stencil._str = substring(stencil._str, 0, string_last_index_of(stencil._str, "."));
		let index: i32 = array_index_of(project_asset_names, stencil._str);
		let asset: asset_t = project_assets[index];
		context_raw.brush_stencil_image = project_get_image(asset);
	}
	else {
		context_raw.brush_stencil_image = null;
	}

	if (last_mask != context_raw.brush_mask_image ||
		last_stencil != context_raw.brush_stencil_image) {
		make_material_parse_paint_material();
	}

	context_raw.brush_directional = self.raw.buttons[0].default_value[0] > 0.0;
}

function brush_output_node_run(self: brush_output_node_t, from: i32) {
	let left: f32 = 0.0;
	let right: f32 = 1.0;
	let top: f32 = 0.0;
	let bottom: f32 = 1.0;

	if (context_raw.paint2d) {
		left = 1.0;
		right = (context_raw.split_view ? 2.0 : 1.0) + ui_view2d_ww / base_w();
	}

	// Do not paint over floating toolbar
	if (context_is_floating_toolbar()) {
		let w: i32 = ui_toolbar_x() + ui_toolbar_w();
		left += w / sys_w();
		top += w / sys_h();
	}

	// First time init
	if (context_raw.last_paint_x < 0 || context_raw.last_paint_y < 0) {
		context_raw.last_paint_vec_x = context_raw.paint_vec.x;
		context_raw.last_paint_vec_y = context_raw.paint_vec.y;
	}

	// Paint bounds
	if (context_raw.paint_vec.x < left ||
		context_raw.paint_vec.x > right ||
		context_raw.paint_vec.y < top ||
		context_raw.paint_vec.y > bottom) {
		return;
	}

	// Do not paint over fill layer
	let fill_layer: bool = context_raw.layer.fill_layer != null;
	if (fill_layer) {
		return;
	}

	// Do not paint over groups
	if (slot_layer_is_group(context_raw.layer)) {
		return;
	}

	if (!slot_layer_is_visible(context_raw.layer) && !context_raw.paint2d) {
		return;
	}

	if (ui_base_ui.is_hovered ||
		base_is_dragging ||
		base_is_resizing ||
		base_is_scrolling() ||
		base_is_combo_selected()) {
		return;
	}

	brush_output_paint(self);

	if (ui_base_ui.is_hovered ||
		base_is_dragging ||
		base_is_resizing ||
		base_is_scrolling() ||
		base_is_combo_selected()) {
		return;
	}

	brush_output_paint(self);
}

function brush_output_paint(self: brush_output_node_t) {
	let down: bool = mouse_down() || pen_down();

	// Prevent painting the same spot
	let same_spot: bool = context_raw.paint_vec.x == context_raw.last_paint_x && context_raw.paint_vec.y == context_raw.last_paint_y;
	let lazy: bool = context_raw.tool == workspace_tool_t.BRUSH && context_raw.brush_lazy_radius > 0;
	if (down && (same_spot || lazy)) {
		context_raw.painted++;
	}
	else {
		context_raw.painted = 0;
	}
	context_raw.last_paint_x = context_raw.paint_vec.x;
	context_raw.last_paint_y = context_raw.paint_vec.y;

	if (context_raw.tool == workspace_tool_t.PARTICLE) {
		context_raw.painted = 0; // Always paint particles
	}

	if (context_raw.painted == 0) {
		brush_output_node_parse_inputs(self);
	}

	if (context_raw.painted == 0) {
		context_raw.pdirty = 1;
		context_raw.rdirty = 2;
		history_push_undo2 = true; ////
	}
}

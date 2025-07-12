
let render_path_paint_live_layer: slot_layer_t = null;
let render_path_paint_live_layer_locked: bool = false;
let render_path_paint_live_layer_drawn: i32 = 0; ////

function render_path_paint_init() {

	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_blend0";
		t.width = config_get_texture_res_x();
		t.height = config_get_texture_res_y();
		t.format = "R8";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_blend1";
		t.width = config_get_texture_res_x();
		t.height = config_get_texture_res_y();
		t.format = "R8";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_nor_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_pack_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}
	{
		let t: render_target_t = render_target_create();
		t.name = "texpaint_uv_picker";
		t.width = 1;
		t.height = 1;
		t.format = "RGBA32";
		render_path_create_render_target(t);
	}

	render_path_load_shader("shader_datas/copy_mrt3_pass/copy_mrt3_pass");
}

function render_path_paint_commands_paint(dilation: bool = true) {
	let tid: string = "";

	if (context_raw.pdirty > 0) {

		if (context_raw.tool == workspace_tool_t.PICKER) {
				let additional: string[] = ["texpaint_nor_picker", "texpaint_pack_picker", "texpaint_uv_picker"];
				render_path_set_target("texpaint_picker", additional);
				render_path_bind_target("gbuffer2", "gbuffer2");
				// tid = context_raw.layer.id;
				render_path_bind_target("texpaint" + tid, "texpaint");
				render_path_bind_target("texpaint_nor" + tid, "texpaint_nor");
				render_path_bind_target("texpaint_pack" + tid, "texpaint_pack");
				render_path_draw_meshes("paint");
				ui_header_handle.redraws = 2;

				let texpaint_picker: render_target_t = map_get(render_path_render_targets, "texpaint_picker");
				let texpaint_nor_picker: render_target_t = map_get(render_path_render_targets, "texpaint_nor_picker");
				let texpaint_pack_picker: render_target_t = map_get(render_path_render_targets, "texpaint_pack_picker");
				let texpaint_uv_picker: render_target_t = map_get(render_path_render_targets, "texpaint_uv_picker");
				let a: buffer_t = gpu_get_texture_pixels(texpaint_picker._image);
				let b: buffer_t = gpu_get_texture_pixels(texpaint_nor_picker._image);
				let c: buffer_t = gpu_get_texture_pixels(texpaint_pack_picker._image);
				let d: buffer_t = gpu_get_texture_pixels(texpaint_uv_picker._image);

				if (context_raw.color_picker_callback != null) {
					context_raw.color_picker_callback(context_raw.picked_color);
				}

				// Picked surface values
				// ///if (arm_metal || arm_vulkan)
				// context_raw.picked_color.base.Rb = a.get(2);
				// context_raw.picked_color.base.Gb = a.get(1);
				// context_raw.picked_color.base.Bb = a.get(0);
				// context_raw.picked_color.normal.Rb = b.get(2);
				// context_raw.picked_color.normal.Gb = b.get(1);
				// context_raw.picked_color.normal.Bb = b.get(0);
				// context_raw.picked_color.occlusion = c.get(2) / 255;
				// context_raw.picked_color.roughness = c.get(1) / 255;
				// context_raw.picked_color.metallic = c.get(0) / 255;
				// context_raw.picked_color.height = c.get(3) / 255;
				// context_raw.picked_color.opacity = a.get(3) / 255;
				// context_raw.uvx_picked = d.get(2) / 255;
				// context_raw.uvy_picked = d.get(1) / 255;
				// ///else
				// context_raw.picked_color.base.Rb = a.get(0);
				// context_raw.picked_color.base.Gb = a.get(1);
				// context_raw.picked_color.base.Bb = a.get(2);
				// context_raw.picked_color.normal.Rb = b.get(0);
				// context_raw.picked_color.normal.Gb = b.get(1);
				// context_raw.picked_color.normal.Bb = b.get(2);
				// context_raw.picked_color.occlusion = c.get(0) / 255;
				// context_raw.picked_color.roughness = c.get(1) / 255;
				// context_raw.picked_color.metallic = c.get(2) / 255;
				// context_raw.picked_color.height = c.get(3) / 255;
				// context_raw.picked_color.opacity = a.get(3) / 255;
				// context_raw.uvx_picked = d.get(0) / 255;
				// context_raw.uvy_picked = d.get(1) / 255;
				// ///end
		}
		else {
			let texpaint: string = "texpaint_node_target";

			render_path_set_target("texpaint_blend1");
			render_path_bind_target("texpaint_blend0", "tex");
			render_path_draw_shader("shader_datas/copy_pass/copyR8_pass");

			let additional: string[] = ["texpaint_nor" + tid, "texpaint_pack" + tid, "texpaint_blend0"];
			render_path_set_target(texpaint, additional);

			render_path_bind_target("main", "gbufferD");

			render_path_bind_target("texpaint_blend1", "paintmask");

			// Read texcoords from gbuffer
			let read_tc: bool = context_raw.tool == workspace_tool_t.CLONE ||
								context_raw.tool == workspace_tool_t.BLUR ||
								context_raw.tool == workspace_tool_t.SMUDGE;
			if (read_tc) {
				render_path_bind_target("gbuffer2", "gbuffer2");
			}

			render_path_draw_meshes("paint");
		}
	}
}

function render_path_paint_commands_cursor() {
	let tool: workspace_tool_t = context_raw.tool;
	if (tool != workspace_tool_t.ERASER &&
		tool != workspace_tool_t.CLONE &&
		tool != workspace_tool_t.BLUR &&
		tool != workspace_tool_t.SMUDGE) {
		return;
	}

	let nodes: ui_nodes_t = ui_nodes_get_nodes();
	let canvas: ui_node_canvas_t = ui_nodes_get_canvas(true);
	let inpaint: bool = nodes.nodes_selected_id.length > 0 && ui_get_node(canvas.nodes, nodes.nodes_selected_id[0]).type == "inpaint_node";

	if (!base_ui_enabled || base_is_dragging || !inpaint) {
		return;
	}

	let mx: f32 = context_raw.paint_vec.x;
	let my: f32 = 1.0 - context_raw.paint_vec.y;
	if (context_raw.brush_locked) {
		mx = (context_raw.lock_started_x - sys_x()) / sys_w();
		my = 1.0 - (context_raw.lock_started_y - sys_y()) / sys_h();
	}
	let radius: f32 = context_raw.brush_radius;
	render_path_paint_draw_cursor(mx, my, radius / 3.4);
}

function render_path_paint_draw_cursor(mx: f32, my: f32, radius: f32, tint_r: f32 = 1.0, tint_g: f32 = 1.0, tint_b: f32 = 1.0) {
	let plane: mesh_object_t = scene_get_child(".Plane").ext;
	let geom: mesh_data_t = plane.data;

	render_path_set_target("");
	gpu_set_pipeline(pipes_cursor);
	let rt: render_target_t = map_get(render_path_render_targets, "main");
	let main: gpu_texture_t = rt._image;
	gpu_set_texture(pipes_cursor_gbufferd, main);
	gpu_set_float2(pipes_cursor_mouse, mx, my);
	gpu_set_float2(pipes_cursor_tex_step, 1 / main.width, 1 / main.height);
	gpu_set_float(pipes_cursor_radius, radius);
	let right: vec4_t = vec4_norm(camera_object_right_world(scene_camera));
	gpu_set_float3(pipes_cursor_camera_right, right.x, right.y, right.z);
	gpu_set_float3(pipes_cursor_tint, tint_r, tint_g, tint_b);
	gpu_set_matrix4(pipes_cursor_vp, scene_camera.vp);
	let inv_vp: mat4_t = mat4_inv(scene_camera.vp);
	gpu_set_matrix4(pipes_cursor_inv_vp, inv_vp);
	gpu_set_vertex_buffer(geom._.vertex_buffer);
	gpu_set_index_buffer(geom._.index_buffers[0]);
	gpu_draw();
	render_path_end();
}

function render_path_paint_paint_enabled(): bool {
	return !context_raw.foreground_event;
}

function render_path_paint_begin() {
	if (!render_path_paint_paint_enabled()) {
		return;
	}
}

function render_path_paint_end() {
	context_raw.ddirty--;
	context_raw.rdirty--;

	if (!render_path_paint_paint_enabled()) {
		return;
	}
	context_raw.pdirty--;
}

function render_path_paint_draw() {
	if (!render_path_paint_paint_enabled()) {
		return;
	}

	render_path_paint_commands_paint();

	if (context_raw.brush_blend_dirty) {
		context_raw.brush_blend_dirty = false;
		render_path_set_target("texpaint_blend0", null, null, clear_flag_t.COLOR, 0x00000000);
		render_path_set_target("texpaint_blend1", null, null, clear_flag_t.COLOR, 0x00000000);
		render_path_end();
	}
}

function render_path_paint_bind_layers() {
	let image: gpu_texture_t = null;
	let nodes: ui_nodes_t = ui_nodes_get_nodes();
	let canvas: ui_node_canvas_t = ui_nodes_get_canvas(true);
	if (nodes.nodes_selected_id.length > 0) {
		let node: ui_node_t = ui_get_node(canvas.nodes, nodes.nodes_selected_id[0]);
		let brush_node: logic_node_ext_t = parser_logic_get_logic_node(node);
		if (brush_node != null) {
			image = logic_node_get_cached_image(brush_node.base);
		}
	}
	if (image != null) {
		if (map_get(render_path_render_targets, "texpaint_node") == null) {
			let t: render_target_t = render_target_create();
			t.name = "texpaint_node";
			t.width = config_get_texture_res_x();
			t.height = config_get_texture_res_y();
			t.format = "RGBA32";
			map_set(render_path_render_targets, t.name, t);
		}
		if (map_get(render_path_render_targets, "texpaint_node_target") == null) {
			let t: render_target_t = render_target_create();
			t.name = "texpaint_node_target";
			t.width = config_get_texture_res_x();
			t.height = config_get_texture_res_y();
			t.format = "RGBA32";
			map_set(render_path_render_targets, t.name, t);
		}
		let texpaint_node_rt: render_target_t = map_get(render_path_render_targets, "texpaint_node");
		texpaint_node_rt._image = image;
		render_path_bind_target("texpaint_node", "texpaint");
		render_path_bind_target("texpaint_nor_empty", "texpaint_nor");
		render_path_bind_target("texpaint_pack_empty", "texpaint_pack");

		let nodes: ui_nodes_t = ui_nodes_get_nodes();
		let canvas: ui_node_canvas_t = ui_nodes_get_canvas(true);
		let node: ui_node_t = ui_get_node(canvas.nodes, nodes.nodes_selected_id[0]);
		let inpaint: bool = node.type == "inpaint_node";
		if (inpaint) {
			let texpaint_node_target_rt: render_target_t = map_get(render_path_render_targets, "texpaint_node_target");
			texpaint_node_target_rt._image = inpaint_node_get_target();
		}
	}
	else {
		render_path_bind_target("texpaint", "texpaint");
		render_path_bind_target("texpaint_nor", "texpaint_nor");
		render_path_bind_target("texpaint_pack", "texpaint_pack");
	}
}

function render_path_paint_unbind_layers() {

}

function render_path_paint_use_live_layer(use: bool) {
}

function render_path_paint_set_plane_mesh() {
}

function render_path_paint_restore_plane_mesh() {
}

function render_path_paint_dilate(base: bool, nor_pack: bool) {
}

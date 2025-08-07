
let plugin = plugin_create();

// Register custom viewport shader
context_set_viewport_shader(function(shader) {
	// node_shader_add_constant(shader, "light_dir: float3", "_light_dir");
	node_shader_write_frag(shader, " \
		var light_dir: float3 = float3(0.5, 0.5, -0.5);\
		var dotnl: float = max(dot(n, light_dir), 0.0); \
		output_color = basecol * step(0.5, dotnl) + basecol; \
	");
});

plugin_notify_on_delete(plugin, function() {
	context_set_viewport_shader(null);
});

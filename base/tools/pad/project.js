
let flags = globalThis.flags;
flags.name = "ArmorPad";
flags.package = "org.armorpad";
flags.with_nfd = true;
flags.with_iron = true;

let project = new Project("ArmorPad");
project.add_tsfiles("sources");

let root = "../../../";
project.add_shaders(root + "base/shaders/draw/*.glsl",);
project.add_assets(root + "base/assets/font_mono.ttf", { destination: "data/{name}" });
project.add_assets(root + "base/assets/text_coloring.json", { destination: "data/{name}" });
project.add_tsfiles(root + "base/sources/file.ts");
project.add_tsfiles(root + "base/sources/path.ts");

project.add_define("IDLE_SLEEP");
project.add_project(root + "base");

return project;

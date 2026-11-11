use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
let b = tauri::Builder::default();
#[cfg(desktop)]
let b = b.plugin(tauri_plugin_single_instance::init(|app, _a, _c| {
if let Some(w) = app.get_webview_window("main") {
let _ = w.unminimize();
let _ = w.show();
let _ = w.set_focus();
}
}));
b.run(tauri::generate_context!()).expect("parley failed to start");
}

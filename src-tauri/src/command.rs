use rand::Rng;
use regex::{Regex, RegexBuilder};
use std::fs;
use std::path::Path;
use std::time::SystemTime;
use walkdir::WalkDir;

fn matches_filter(path: &Path, re: &Regex, time_filter: bool) -> Option<String> {
    // Get filename and check if it matches the regex
    let file_name = path.file_name()?.to_str()?;
    if !re.is_match(file_name) {
        return None;
    }

    // Apply time filter if enabled
    if time_filter {
        if let Ok(metadata) = path.metadata() {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                    let modified_year = 1970 + (duration.as_secs() / 31_557_600) as i32; // approximate years since 1970
                    let current_year = 1970
                        + (SystemTime::now()
                            .duration_since(SystemTime::UNIX_EPOCH)
                            .ok()?
                            .as_secs()
                            / 31_557_600) as i32;
                    let delta = current_year - modified_year;

                    let mut r = 0.5_f64.powi(delta);
                    if r < 0.01 {
                        r = 0.01;
                    }

                    let random_val: f64 = rand::thread_rng().gen();
                    if r < random_val {
                        return None; // Filter out this file
                    }
                }
            }
        }
    }

    // Return full path only if it's valid UTF-8
    path.to_str().map(|s| s.to_string())
}

#[tauri::command]
pub fn get_file_list(
    folder_path: &str,
    filter: &str,
    recursive: bool,
    time_filter: bool,
) -> Result<Vec<String>, String> {
    let mut files = Vec::new();

    // Compile regex pattern with case-insensitive matching
    let re = RegexBuilder::new(filter)
        .case_insensitive(true)
        .build()
        .map_err(|e| format!("Invalid regex pattern: {}", e))?;

    if recursive {
        for entry in WalkDir::new(folder_path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                if let Some(file_path) = matches_filter(entry.path(), &re, time_filter) {
                    files.push(file_path);
                }
            }
        }
    } else {
        let entries = fs::read_dir(folder_path)
            .map_err(|e| format!("Error reading directory {}: {}", folder_path, e))?;
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_path) = matches_filter(&path, &re, time_filter) {
                    files.push(file_path);
                }
            }
        }
    }

    Ok(files)
}

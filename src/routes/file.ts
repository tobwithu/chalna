import { invoke } from '@tauri-apps/api/core'
import { join, basename } from '@tauri-apps/api/path'
import { readDir, stat } from '@tauri-apps/plugin-fs'

export async function getFolderList(
  folderPath: string,
  includeSubDirectories: boolean,
): Promise<string[]> {
  const folders: string[] = []
  await getFolders(folders, folderPath, includeSubDirectories)
  return folders
}

async function getFolders(
  folders: string[],
  curFolderPath: string,
  includeSubDirectories: boolean,
): Promise<void> {
  try {
    folders.push(curFolderPath)
    const entries = await readDir(curFolderPath)
    for (const entry of entries) {
      if (entry.isDirectory) {
        if (includeSubDirectories) {
          await getFolders(
            folders,
            await join(curFolderPath, entry.name),
            includeSubDirectories,
          )
        }
      }
    }
  } catch (error) {
    console.log('Error reading directory: ' + error)
  }
}

export async function getFileList(
  folderPath: string,
  recursive: boolean,
  timeFilter: boolean,
): Promise<string[]> {
  try {
    return await invoke<string[]>('get_file_list', {
      folderPath,
      filter: '\\.(jpg|jpeg|jpe|gif|png|bmp)$',
      recursive,
      timeFilter,
    })
  } catch (error) {
    console.log('Error getting folder list: ' + error)
    return []
  }
}

// Get file modification time using Tauri
export async function getFileModificationTime(
  filePath: string,
): Promise<number> {
  try {
    const stats = await stat(filePath)
    return stats.mtime?.getTime() ?? Date.now()
  } catch (error: any) {
    console.log('Error getting file stats: ' + error)
    return Date.now()
  }
}

export async function getFileName(filePath: string): Promise<string> {
  return basename(filePath)
}

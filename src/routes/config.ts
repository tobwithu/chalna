import {
  readTextFile,
  writeTextFile,
  BaseDirectory,
  mkdir,
  exists,
} from '@tauri-apps/plugin-fs'
import { pictureDir, appConfigDir } from '@tauri-apps/api/path'

// Config management
export interface Config {
  imageFolder: string
  secondsToShow: number
  includeSubDirectories: boolean
  timeFilter: boolean
}

const CONFIG_FILE = 'config.json'

export async function loadConfig(): Promise<Config> {
  // Config doesn't exist, create default
  const defaultConfig: Config = {
    imageFolder: await pictureDir(),
    secondsToShow: 15,
    includeSubDirectories: true,
    timeFilter: false,
  }

  try {
    const configData = await readTextFile(CONFIG_FILE, {
      baseDir: BaseDirectory.AppConfig,
    })
    const config = JSON.parse(configData)

    let needsSave = false
    for (const key of Object.keys(defaultConfig)) {
      if (!(key in config)) {
        ;(config as any)[key] = (defaultConfig as any)[key]
        needsSave = true
      }
    }
    for (const key of Object.keys(config)) {
      if (!(key in defaultConfig)) {
        delete (config as any)[key]
        needsSave = true
      }
    }

    if (needsSave) {
      await saveConfig(config)
    }

    return config
  } catch (error) {
    await saveConfig(defaultConfig)
    return defaultConfig
  }
}

export async function saveConfig(config: Config): Promise<void> {
  try {
    const configPath = await appConfigDir()
    if (!(await exists(configPath))) {
      await mkdir(configPath, { recursive: true })
    }
    await writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
      baseDir: BaseDirectory.AppConfig,
    })
  } catch (error) {
    console.error('Error saving config: ' + error)
  }
}

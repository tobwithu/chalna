<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog'
  import type { Config } from './config'
  let { close, config, saveConfig } = $props<{
    close: (saved: boolean) => void
    config: Config
    saveConfig: (config: Config) => Promise<void>
  }>()

  const originalConfig = JSON.stringify(config)

  async function handleClose() {
    const hasChanged = JSON.stringify(config) !== originalConfig
    if (hasChanged) {
      await saveConfig(config)
    }
    close(hasChanged)
  }

  async function selectFolder() {
    const result = await open({
      directory: true,
      multiple: false,
      defaultPath: config.imageFolder,
    })

    if (typeof result === 'string') {
      config.imageFolder = result
    }
  }
</script>

<div
  class="backdrop"
  onclick={handleClose}
  onkeydown={(e) => e.key === 'Escape' && handleClose()}
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div
    class="dialog"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="presentation"
  >
    <div class="title-bar">
      <div class="title">설정</div>
      <button class="close-btn control-btn" aria-label="닫기" onclick={handleClose}>
        <img src="/images/close.svg" alt="닫기" />
      </button>
    </div>
    <div class="content">
      <div class="field">
        <span>이미지 폴더</span>
        <input
          type="text"
          id="imageFolder"
          bind:value={config.imageFolder}
          readonly
        />
        <button class="control-btn" onclick={selectFolder}>
          <img src="/images/folder.svg" alt="찾아보기" />
        </button>
      </div>
      <div class="field">
        <span>표시 시간</span>
        <input type="number" id="secondsToShow" bind:value={config.secondsToShow} />
        <span>초</span>
    </div>
      <div class="field">
        <span>하위 폴더 포함</span>
        <input type="checkbox" id="includeSubDirectories" bind:checked={config.includeSubDirectories} />
      </div>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }

  .dialog {
    background: #303030;
    border-radius: 8px;
    color: #f0f0f0;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(100, 100, 100, 0.4);
    overflow: hidden;
  }

  .content {
    padding: 24px;
    font-size: 10pt;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .field > span {
    flex-shrink: 0;
  }

  .field > input {
    background-color: #2a2a2a;
    border: 1px solid var(--border-color);
    color: #f0f0f0;
    padding: 4px 8px;
    border-radius: 4px;
  }

  #imageFolder {
    flex: 1;
  }
  #secondsToShow {
    width: 4em;
  }
</style>

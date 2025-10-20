<svelte:options runes={true} />

<script lang="ts">
  import { openPath } from '@tauri-apps/plugin-opener'
  import { getCurrentWindow } from '@tauri-apps/api/window'
  import { convertFileSrc } from '@tauri-apps/api/core'
  import type { UnlistenFn } from '@tauri-apps/api/event'
  import { start, stop } from 'tauri-plugin-keepawake-api'
  import SettingsDialog from './SettingsDialog.svelte'
  import { loadConfig, saveConfig, type Config } from './config'
  import { getFileName, getFileList, getFileModificationTime } from './file'
  import { getTimeString, randomSort, setWindowPosition } from './utils'

  let config: Config = $state({} as Config)
  let curImg = 0
  let imagePathAndName = $state('')
  let fileList: string[] = []
  let increment = 0
  let timer: any = null
  let progTimer: any = null
  let startTime = 0
  let fileName = $state('')
  let image1 = $state('')
  let image2 = $state('')
  let time1 = $state('')
  let time2 = $state('')
  let progress = $state(0)
  let isPlaying = $state(false)
  let logMessages: string[] = $state([])
  let image1Opacity = $state(0)
  let image2Opacity = $state(0)
  let showSettings = $state(false)
  let unlisten: UnlistenFn | null = null

  // Utility functions
  function log(s: string | null): void {
    if (s != null) {
      logMessages.unshift(s)
      if (logMessages.length > 50) {
        logMessages.pop()
      }
    } else {
      logMessages.length = 0
    }
    console.log(s)
  }

  // Load image function with opacity transition
  async function loadImage(src: string): Promise<void> {
    fileName = await getFileName(src)
    //log('Loading image: ' + src)
    curImg = (curImg + 1) % 2

    try {
      const dataUrl = convertFileSrc(src)

      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = dataUrl
      })

      // Get file modification time
      const modTime = await getFileModificationTime(src)
      const timeString = getTimeString(new Date(modTime))

      if (curImg === 0) {
        image1 = dataUrl
        time1 = timeString
        image1Opacity = 1
        image2Opacity = 0
      } else {
        image2 = dataUrl
        time2 = timeString
        image2Opacity = 1
        image1Opacity = 0
      }
    } catch (error) {
      console.log('Error getting file:', src, error)
    }
  }

  // Image list management
  async function makePicList(): Promise<void> {
    fileList.sort(randomSort)
  }

  async function playSlides(notTimer?: boolean): Promise<void> {
    if (notTimer) await _playSlides()
    else {
      // show 100% progress for a while
      progress = 100
      setTimeout(() => {
        _playSlides()
      }, 25)
    }
  }

  async function _playSlides(): Promise<void> {
    if (startTime != 0) {
      const now = new Date().getTime()
      if (now - startTime > (60 + config.secondsToShow) * 1000) {
        // handle suspend and resume
        if (timer) clearTimeout(timer)
        timer = setTimeout(playSlides, config.secondsToShow * 1000)
        startTime = now
        return
      }
    }

    let retry = true
    let remadeList = false

    while (retry) {
      if (increment >= fileList.length) {
        if (!remadeList) {
          await makePicList()
          increment = 0
          remadeList = true
        } else {
          fileList = []
        }
      } else if (increment < 0) {
        if (!remadeList) {
          await makePicList()
          increment = fileList.length - 1
          remadeList = true
        } else {
          fileList = []
        }
      }

      if (fileList.length > 0) {
        imagePathAndName = fileList[increment]
        // Check if file exists using Tauri
        try {
          increment++
          retry = false
          try {
            await loadImage(imagePathAndName)
            retry = false

            if (isPlaying) {
              startTime = new Date().getTime()
              clearTimeout(timer)
              timer = setTimeout(playSlides, config.secondsToShow * 1000)
            }
          } catch (e) {
            increment--
            fileList.splice(increment, 1)
            retry = true
          }
        } catch (_) {
          fileList.splice(increment, 1)
          retry = true
        }
      } else {
        retry = false
        break
      }
    }
  }

  async function startTimer(): Promise<void> {
    if (timer) clearTimeout(timer)
    if (progTimer) clearInterval(progTimer)
    startTime = 0
    isPlaying = true
    await playSlides(true)
    progTimer = setInterval(onProgress, 20)
  }

  async function stopTimer(): Promise<void> {
    if (timer) clearTimeout(timer)
    if (progTimer) clearInterval(progTimer)
    startTime = 0
    progress = 0
    isPlaying = false
  }

  function onProgress(): void {
    let r = 0
    if (startTime != 0) {
      const now = new Date().getTime()
      r = (now - startTime) / config.secondsToShow / 10
      if (r > 100) r = 100
    }
    progress = r
  }

  // Action handlers
  async function onAction(action: string): Promise<void> {
    switch (action) {
      case 'prev':
        increment -= 2
        if (increment < 0) increment = fileList.length - 1
        await playSlides(true)
        break
      case 'play':
        await startTimer()
        break
      case 'pause':
        await stopTimer()
        break
      case 'next':
        await playSlides(true)
        break
      case 'open':
        //await stopTimer()
        await openFile()
        break
    }
  }

  async function openFile(): Promise<void> {
    if (imagePathAndName) {
      try {
        await openPath(imagePathAndName)
      } catch (error) {
        log('Error opening file: ' + error)
      }
    }
  }

  async function keyNavigate(event: KeyboardEvent): Promise<void> {
    try {
      switch (event.key) {
        case 'ArrowLeft':
          await onAction('prev')
          break
        case 'ArrowRight':
          await onAction('next')
          break
        case ' ':
          await onAction(isPlaying ? 'pause' : 'play')
          break
        case 'Escape':
          await onAction('pause')
          break
      }
    } catch (error) {
      log('Error during key navigation: ' + error)
    }
  }

  async function handleDoubleClick(): Promise<void> {
    const window = getCurrentWindow()
    if (await window.isMaximized()) {
      await window.unmaximize()
      return
    }
    if (await window.isFullscreen()) {
      await window.setFullscreen(false)
      await setWindowPosition(window, 'right', 'top')
    } else {
      await window.setFullscreen(true)
    }
  }

  async function updateMaximizedState(): Promise<void> {
    const window = getCurrentWindow()
    if (await window.isFullscreen()) {
      await start({ display: true, idle: true, sleep: true })
    } else {
      await stop()
    }
  }

  async function restartSlideshow() {
    await stopTimer()
    fileList = await getFileList(
      config.imageFolder,
      config.includeSubDirectories,
      config.timeFilter
    )
    await makePicList()
    increment = 0
    await onAction('play')
  }

  // Initialize the application
  async function init(): Promise<void> {
    const window = getCurrentWindow()
    await setWindowPosition(window, 'right', 'top')
    unlisten = await window.onResized(async ({ payload: size }) => {
      try {
        await updateMaximizedState()
      } catch (error) {
        console.log('Error on resize: ' + error)
      }
    })

    try {
      // Load config
      Object.assign(config, await loadConfig())
      // Start the slide show
      await restartSlideshow()
    } catch (error: any) {
      log('Error initializing: ' + error.message)
    }
  }

  // This code runs once when the component is first created.
  init()

  // Svelte 5 uses the return function of an $effect for component cleanup,
  // similar to onDestroy in previous versions. This effect has no dependencies,
  // so it runs once to set up the cleanup, which then runs when the component is unmounted.
  $effect(() => {
    return () => {
      if (timer) clearTimeout(timer)
      if (progTimer) clearInterval(progTimer)
      if (unlisten) unlisten()
    }
  })
</script>

<svelte:head>
  <style>
  </style>
</svelte:head>

<svelte:window onkeydown={keyNavigate} />

{#if showSettings}
  <SettingsDialog
    {config}
    {saveConfig}
    close={(saved) => {
      showSettings = false
      if (saved) {
        restartSlideshow()
      }
    }}
  />
{/if}

<div id="slideshow-container" class="slideshow-container" role="application">
  <div class="log" class:hidden={logMessages.length === 0}>
    {#each logMessages as message}
      <div>{message}</div>
    {/each}
  </div>

  <div class="image-container">
    <img
      src={image1}
      alt="1"
      class="slide-image image1"
      style="opacity: {image1Opacity}"
      draggable="false"
    />
    <img
      src={image2}
      alt="2"
      class="slide-image image2"
      style="opacity: {image2Opacity}"
      draggable="false"
    />
  </div>

  <div class="overlay">
    <div class="title-bar" title={imagePathAndName}>
      <div class="title" data-tauri-drag-region>{fileName}</div>
      <button
        id="settings"
        class="control-btn"
        aria-label="설정"
        onclick={() => (showSettings = true)}
      >
        <img src="images/setting.svg" alt="설정" />
      </button>
    </div>
    <div ondblclick={handleDoubleClick} role="group"></div>
    <div class="panel">
      <div class="bar">
        <button
          class="control-btn"
          id="prev"
          title="이전"
          aria-label="이전"
          onclick={() => onAction('prev')}
          onkeydown={(e) => e.key === 'Enter' && onAction('prev')}
        >
          <img src="/images/prev.svg" alt="이전" />
        </button>
        <button
          class="control-btn"
          id={isPlaying ? 'pause' : 'play'}
          title={isPlaying ? '일시 중지' : '재생'}
          aria-label={isPlaying ? '일시 중지' : '재생'}
          onclick={() => onAction(isPlaying ? 'pause' : 'play')}
          onkeydown={(e) =>
            e.key === 'Enter' && onAction(isPlaying ? 'pause' : 'play')}
        >
          <img
            src={isPlaying ? '/images/pause.svg' : '/images/play.svg'}
            alt={isPlaying ? '일시 중지' : '재생'}
          />
        </button>
        <button
          class="control-btn"
          id="next"
          title="다음"
          aria-label="다음"
          onclick={() => onAction('next')}
          onkeydown={(e) => e.key === 'Enter' && onAction('next')}
        >
          <img src="/images/next.svg" alt="다음" />
        </button>
        <div id="separator"></div>
        <button
          class="control-btn"
          id="open"
          title="보기"
          aria-label="보기"
          onclick={() => onAction('open')}
          onkeydown={(e) => e.key === 'Enter' && onAction('open')}
        >
          <img src="/images/open.svg" alt="보기" />
        </button>
      </div>
      <div class="timeBar">
        <div class="time-display" style="opacity: {image1Opacity}">{time1}</div>
        <div class="time-display" style="opacity: {image2Opacity}">{time2}</div>
      </div>
      <div class="progressBar" style="width: {progress}%"></div>
    </div>
  </div>
</div>

<style>
  .slideshow-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #303030;
    margin: 0;
    padding: 0;
    overflow: hidden;
    user-select: none;
  }

  .log {
    position: absolute;
    height: 300px;
    overflow: auto;
    color: gold;
    z-index: 10;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 5px;
    max-width: 300px;
  }

  .log.hidden {
    display: none;
  }

  .overlay {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
  }
  .overlay > div:nth-child(2) {
    flex: 1;
  }

  .title-bar {
    position: absolute;
    top: 0px;
    left: 0px;
    opacity: 0.5;
    transition: opacity 0.25s ease-in-out;
  }
  .title-bar:hover {
    opacity: 0.75;
  }

  .image-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .slide-image {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: opacity 0.5s ease-in-out;
  }

  .panel {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
    text-align: center;
    opacity: 0.75;
    transition: opacity 0.25s ease-in-out;
  }

  .panel:hover {
    opacity: 0.75;
  }

  :root {
    --border-color: rgba(100, 100, 100, 0.4);
  }

  .bar {
    height: 24px;
    width: fit-content;
    padding: 0px 12px;
    box-sizing: border-box;
    background-color: rgba(31, 48, 67, 0.7);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin: 5px auto;
  }

  #separator {
    width: 1px;
    height: 12px;
    background-color: var(--border-color);
    margin: 0px 5px;
  }

  .timeBar {
    background-color: #a0a0a0;
    opacity: 0.75;
    width: 150px;
    height: 20px;
    line-height: 20px;
    margin: auto;
    border-radius: 3px;
    margin-bottom: 5px;
    font-family: sans-serif;
    font-size: 11pt;
    position: relative;
  }

  .time-display {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.5s ease-in-out;
  }

  .progressBar {
    background-color: #ffffff;
    opacity: 0.75;
    height: 3px;
    width: 0%;
  }
</style>

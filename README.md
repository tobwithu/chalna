# 🖼️ Chalna (찰나) - Your Personal Desktop Slideshow

**Chalna** (찰나, *chal-na*, a Korean word for "a moment" or "an instant") is a sleek and minimalist desktop application that turns your favorite photos into a beautiful, continuous slideshow. It's perfect for your second monitor, a digital photo frame, or simply for enjoying a stream of memories right on your desktop.

<img width="446" height="346" alt="Chalna" src="https://github.com/user-attachments/assets/6bdbdde0-e412-42e2-b14f-16760a50a1b2" />

## ✨ Features

- **Seamless Slideshow**: Enjoy your photos with smooth cross-fade transitions.
- **Full Control**: Play, pause, and navigate through your images with on-screen controls or keyboard shortcuts (`←`, `→`, `Space`).
- **Customizable Source**: Easily select any folder on your computer as the image source. Chalna can also scan subdirectories.
- **Adjustable Timing**: Set how long each photo is displayed to your liking.
- **Minimalist UI**: Controls and title bar gracefully fade out when not in use, providing an immersive, distraction-free viewing experience.
- **File Info**: Instantly see the filename and modification date of the current photo.
- **Quick Access**: Open the currently displayed image in your default viewer with a single click.

## 🛠️ Tech Stack

This project is built with a modern and powerful stack:

- [**Tauri**](https://tauri.app/): For creating robust, secure, and performant cross-platform desktop applications.
- [**Svelte 5**](https://svelte.dev/): A radical new approach to building user interfaces.
- [**TypeScript**](https://www.typescriptlang.org/): For type-safe and scalable code.
- [**Vite**](https://vitejs.dev/): Next-generation frontend tooling that provides a fast and lean development experience.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [Rust](https://www.rust-lang.org/tools/install) and its required toolchain for Tauri development.

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tobwithu/chalna.git
    cd chalna
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run in development mode:**
    This will start the application with hot-reloading for both the frontend and the Rust core.
    ```bash
    npm run tauri dev
    ```

4.  **Build the application:**
    To build a distributable, production-ready executable, run:
    ```bash
    npm run tauri build
    ```

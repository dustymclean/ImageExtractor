# 🖼️ ImageExtractor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ollama](https://img.shields.io/badge/AI-Ollama-blue)](https://ollama.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb)](https://react.dev/)

**ImageExtractor** is a professional-grade, privacy-first tool designed to crawl websites, extract image assets, and provide intelligent analysis—all running locally on your hardware. No cloud APIs, no data leaks, just raw performance.

## ✨ Features

- **Local AI Analysis:** Powered by **Ollama** and the **Moondream2** vision model to intelligently describe and categorize images.
- **Deep Scraping:** Uses **Cheerio** to find images in `<img>` tags, CSS background properties, meta tags, and direct source links.
- **Batch Processing:** Download all discovered assets in a single, organized **.zip** file.
- **Modern Stack:** Built with **React 19**, **Vite**, **Tailwind CSS**, and **Framer Motion** for a sleek, responsive experience.
- **Privacy First:** Entirely self-hosted. Your scraping activity and AI analysis never leave your machine.

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js, Express, Cheerio.
- **AI Engine:** Ollama (Model: Moondream2).

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Ollama** (Download at [ollama.com](https://ollama.com))

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dustymclean/ImageExtractor.git
   cd ImageExtractor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Prepare the AI:**
   Ensure Ollama is running and pull the vision model:
   ```bash
   ollama pull moondream
   ```

4. **Launch the app:**
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📖 Usage

1. Enter a target URL in the search bar.
2. Click **Extract** to let the backend crawl the site and Moondream2 analyze the assets.
3. Preview the images and their AI-generated descriptions.
4. Click **Download All (.zip)** to save your assets locally.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
**Author:** [Dusty McLean](https://github.com/dustymclean)

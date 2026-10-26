# Chrome Profile Transfer

A lightweight Chrome extension for transferring website data between different Chrome profiles.

Easily move your saved website preferences, configurations, and locally stored settings without setting everything up again.

## Features

- 🌐 **Works with any website** — Supports HTTP and HTTPS websites.
- 📦 **Export & Import** — Transfer LocalStorage and IndexedDB data using JSON files.
- 🔍 **Automatic Domain Detection** — Detects the currently active website.
- 🔒 **Privacy First** — All operations happen locally. No external servers or data collection.
- 🛡️ **Domain Protection** — Prevents importing data into the wrong website.
- 🔑 **Login Safety** — Does not transfer authentication cookies.
- ⚡ **Simple & Lightweight** — No account, API key, or external service required.

## Installation

1. Download the repository as a ZIP file and extract it.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted extension folder.

## How to Use

**Export from Profile 1**

1. Open the website containing your saved settings.
2. Click the Chrome Profile Transfer extension.
3. Click **Export** to download your website data as a JSON file.

**Import into Profile 2**

1. Install the extension in your second Chrome profile.
2. Open the same website.
3. Click **Import** and select your exported JSON file.
4. Refresh the website to apply the transferred settings.

## Limitations

- Only locally stored website data is transferred.
- Server-side settings and account data are not included.
- Authentication cookies are not transferred.
- Some websites may require additional storage mechanisms that are not supported.

## Privacy

Chrome Profile Transfer runs entirely within your browser. No tracking, analytics, cloud storage, or third-party services.

Exported JSON files may contain sensitive website data. Keep them private.

## License

Free to use and modify.

---

**Chrome Profile Transfer** — Move your website settings, not your entire browser profile.

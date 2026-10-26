# Chrome Profile Transfer

Transfer a website's localStorage and IndexedDB data between Chrome profiles with a JSON export/import. Runs locally, with no external server requests.

## Features
- Works on the active HTTP/HTTPS website
- English interface by default, with a Persian option in the popup
- Remembers your language choice separately in each Chrome profile
- Exports localStorage and optionally IndexedDB
- Blocks imports into a different website origin
- Does not transfer cookies, sessionStorage, cached data or server-side settings

## Installation
1. Extract the ZIP file.
2. Go to `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the extracted `chrome-profile-transfer` folder.

## Usage
1. Open the website in the source profile and choose **Export**.
2. Open the same website in the destination profile, preferably after signing in.
3. Back up destination data, then choose **Import** and select your JSON file.
4. Refresh the website.

The language selector is at the top right of the popup (top left in Persian mode). Language selection does not affect the exported JSON format. Keep exported files private; they can contain sensitive information.

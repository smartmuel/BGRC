# BG Resource Counter

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Deployed-blue?style=for-the-badge&logo=github-pages)](https://smartmuel.github.io/BGRC/) <!-- Replace with your actual GitHub Pages URL -->

A versatile web application to track resources for board games, tabletop RPGs, or any game requiring counters. Features customizable counters, image support, dice rolling, data export/import, and server/client synchronization via Firebase.

**[✨ Live Demo](https://smartmuel.github.io/BGRC/) ✨** <!-- Replace with your actual GitHub Pages URL -->

## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Adding Resources](#adding-resources)
  - [Managing Counters](#managing-counters)
  - [Dice Rolling](#dice-rolling)
  - [Settings](#settings)
  - [Server/Client Mode](#serverclient-mode)
  - [Data Options](#data-options)
- [Server/Client Synchronization (Firebase)](#serverclient-synchronization-firebase)
  - [Setting up Firebase](#setting-up-firebase)
  - [Server Mode](#server-mode)
  - [Client Mode](#client-mode)
  - [Local Mode](#local-mode)
- [Data Persistence](#data-persistence)
- [Customization Options](#customization-options)
- [Running Locally](#running-locally)
- [GitHub Pages Deployment](#github-pages-deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Resource Counters:** Create and manage multiple resource counters with names and images.
- **Customizable Increments:** Set custom increment/decrement values for each counter.
- **Counter Limits:** Define minimum and maximum values for individual counters and a global counter limit for all resources. You can also set a game-specific counter limit.
- **Image Support:**  Upload custom images for each resource to visually represent them.
- **Dice Rolling:** Integrated dice roller with customizable dice types (d6, d custom values), number of dice, and animation.
- **Settings Panel:**
    - **User Preferences:** Dark Mode, Disable Animations, Show/Hide Settings, Funny Names, Hide All Images.
    - **Game Settings:** Global Counter Limit.
    - **Data Options:** Export/Import game data as JSON files.
    - **Server/Client Settings:** Firebase configuration, Server/Client mode selection, Session Management.
- **Server/Client Synchronization (Firebase):**
    - Real-time synchronization of resource counts across multiple clients in a session.
    - Server and Client modes for collaborative resource tracking.
    - Session ID management for easy connection.
    - SDK Configuration export/import for simplified client joining.
- **Data Export and Import:** Save and load your resource configurations as JSON files for backup or sharing.
- **Example Games:** Load pre-configured resource sets for popular board games as a starting point.
- **Responsive Design:** Works seamlessly on desktop and mobile browsers.
- **Status Window:** Displays real-time client status in server/client modes.
- **QR Code Generation:** Generates a QR code for easy session sharing in server mode.
- **Funny Names (Optional):**  Enjoy a lighthearted touch with automatically generated funny names for clients (can be disabled).
- **Hide Counter for Others (Resource Specific):**  Control visibility of individual counters to other clients in server/client mode.

## Usage

### Adding Resources

1. **Image Upload (Optional):** Click on the file input field (initially labeled "No file chosen") to upload an image for your resource. Accepted formats: JPEG, PNG, GIF.
2. **Resource Name:** Enter a name for your resource in the "Resource Name" text field.
3. **Add Resource Button:** Click the "Add Resource" button. Your new resource counter will be created below.

### Managing Counters

- **Increment/Decrement Buttons:** Use the "+/-" buttons with different increment values (default: +/-1, +/-3, +/-5) to adjust the counter value.
- **Counter Display:** The current count is displayed prominently between the increment/decrement buttons.
- **Custom Increments:**  You can customize the increment values in the resource settings (see [Settings](#settings)).
- **Counter Limits:**  Counters respect defined minimum, maximum, and global counter limits.

### Dice Rolling

- **Dice Button (🎲):** If enabled in the resource settings, a dice button will appear. Click it to roll the dice.
- **Roll Result:** The dice roll result will be displayed next to the dice button.
- **Result Toggle:**  For standard dice rolls (d6, etc.), you can click on the result to toggle between showing the detailed roll (individual dice values) and the sum.
- **Dice Settings:** Customize dice type, number of dice, and animation in the resource settings (see [Settings](#settings)).

### Settings

Click the **⚙️ (Gear)** icon in the top right corner to open the Global Settings panel.

**User Preferences:**

- **Show All Settings:**  Expands the settings for each resource to display all customization options.
- **Disable All Animations:**  Turns off dice roll animations for faster performance or if you prefer no animations.
- **Dark Mode:** Toggles between light and dark themes for comfortable viewing in different environments.
- **Globally Hide Funny Names:**  Disables the use of funny names for clients, reverting to standard client names.
- **Globally Hide All Images:** Hides all resource images to reduce visual clutter or improve performance.

**Game Settings:**

- **Enable Global Counter Limit:** Activates a limit on the total sum of all resource counters.
- **Global Counter Limit:**  Sets the maximum total count allowed across all resources when the global limit is enabled.

**Data Options:**

- **Export Data:** Downloads your current resource configuration and counter values as a `resources.json` file.
- **Import Data:** Allows you to upload a `resources.json` file to load previously saved configurations.

### Server/Client Mode

Click the **🌐 (Globe)** icon in the top right corner to open the Server/Client Settings panel.

- **Client Name:** Enter a name for yourself to be identified in server/client sessions.
- **Mode:** Select the operating mode:
    - **Client:** Join an existing server session to synchronize resource counts with others.
    - **Server:** Start a new session and act as the server, allowing clients to connect and synchronize.
    - **Local:**  Use the application in standalone mode, without server synchronization.

**Session Management (Server/Client Modes):**

- **Session ID (Client Mode):** Enter the Session ID provided by the server to join a session.
- **Connect Button (Client Mode):** Click to connect to the server session.
- **Start New Session Button (Server Mode):** Click to start a new server session and generate a unique Session ID.
- **Session ID Display (Server Mode):** Displays the generated Session ID for your server session.
- **Export SDK Config (Server Mode):** Exports a JSON file (`sdk-config.json`) containing Firebase configuration and Session ID, simplifying client connection.
- **Import SDK Config & Join (Client Mode):** Allows clients to import an `sdk-config.json` file to automatically configure Firebase and join a session.
- **QR Code (Server Mode):** A QR code is generated in server mode that clients can scan to easily join the session.

### Data Options

- **Export Data:** Downloads your current resource configuration and counter values as a `resources.json` file.
- **Import Data:** Allows you to upload a `resources.json` file to load previously saved configurations.

## Server/Client Synchronization (Firebase)

The BG Resource Counter utilizes Firebase Realtime Database for real-time synchronization in Server and Client modes.

### Setting up Firebase

To use Server and Client modes, you need to configure Firebase:

1. **Create a Firebase Project:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Click "Add project" and follow the steps to create a new project.
2. **Get Firebase Configuration:**
   - In your Firebase project, go to "Project settings" (gear icon next to "Project Overview").
   - Scroll down to the "Your apps" section and click the web icon (`</>`).
   - Register your app (you can use a placeholder name).
   - In the "Add Firebase SDK" step, select "CDN" and copy the **"Config"** object.
   - Paste the configuration details into the corresponding input fields in the "Server/Client Settings" panel within the BG Resource Counter:
     - `apiKey`
     - `authDomain`
     - `databaseURL`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`
3. **Save Firebase Config:** Click the "Save Firebase Config" button.

**Important:** Ensure that your Firebase Realtime Database rules are set to allow read and write access for authenticated users or public access for testing purposes. **Be mindful of security implications when setting database rules.**

### Server Mode

1. **Configure Firebase (as described above).**
2. **Select "Server" mode in the "Server/Client Settings" panel.**
3. **Click "Start New Session".**
4. **Share the Session ID:** Provide the displayed Session ID or the QR code to clients who want to join your session.
5. **Manage Resources:** As the server, you can add, modify, and remove resources. These changes will be synchronized with connected clients.
6. **Counter Updates:** When you update a counter, the changes will be reflected in real-time for all connected clients.

### Client Mode

1. **Configure Firebase (as described above) or import an SDK Config file.**
2. **Select "Client" mode in the "Server/Client Settings" panel.**
3. **Enter the Session ID provided by the server.**
4. **Click "Connect".**
5. **Synchronized Counters:** Once connected, your resource counters will be synchronized with the server and other clients in the session. Counter updates from any client will be reflected on your screen in real-time.

### Local Mode

- **Select "Local" mode in the "Server/Client Settings" panel.**
- In Local mode, all data is stored in your browser's local storage. Server synchronization is disabled.
- This mode is suitable for single-player use or when real-time collaboration is not required.

## Data Persistence

- **Local Storage:** In Local mode and for global settings, data is stored in your browser's local storage. This means your resources and settings will be preserved across browser sessions on the same device.
- **Firebase Realtime Database:** In Server and Client modes, resource configurations and counter values are stored in Firebase Realtime Database, enabling real-time synchronization and cross-device access for session participants.

## Customization Options

- **Dark Mode:**  Enable Dark Mode for a visually darker theme.
- **Disable Animations:** Turn off dice roll animations for faster loading and performance.
- **Funny Names:**  Enable or disable the use of humorous, automatically generated names for clients in server/client modes.
- **Hide All Images:**  Option to globally hide all resource images for a cleaner interface.
- **Global Counter Limit:**  Set a limit to the total sum of all resource counters.
- **Resource-Specific Settings:**  Each resource can be further customized with options like:
    - Image visibility
    - Counter visibility
    - Increment/decrement values
    - Minimum/Maximum counts
    - Dice rolling settings
    - Funny name usage
    - Counter visibility to other players

## Running Locally

To run the BG Resource Counter locally:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd BG-Resource-Counter

# BG Resource Counter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A versatile web application for tracking board game resources, complete with customizable counters, image support, dice rolling, and server/client synchronization.**

[**Live Demo**](Replace with your live demo URL if you have one)

![Project Screenshot](Replace with a screenshot of your project if you have one)

## Description

The BG Resource Counter is designed to enhance your board gaming experience by providing a digital tool to manage in-game resources.  Whether you're tracking tokens, currency, or victory points, this application offers a flexible and customizable interface. It's built to be used locally or collaboratively with server/client modes for synchronized gameplay.

**Key Features:**

*   **Resource Counters:**  Easily add and manage multiple resources with individual counters.
*   **Customizable Increments:** Set different increment values for each counter for quick adjustments.
*   **Image Support:**  Visually represent resources by uploading custom images.
*   **Dice Rolling:** Integrated dice roller with customizable dice types and results display.
*   **Global Settings:**  Personalize your experience with dark mode, animation controls, and more.
*   **Server/Client Mode:**
    *   **Local Mode:** Use the counter offline and save data locally in your browser.
    *   **Server Mode:** Host a session and share the counter state with connected clients using Firebase Realtime Database.
    *   **Client Mode:** Join a server session to synchronize resource counts in real-time with other players.
*   **Data Import/Export:** Save and load your resource configurations as JSON files for easy backup and sharing.
*   **Firebase Configuration Import/Export:**  Manage your Firebase settings separately for easy setup and sharing of server configurations.
*   **SDK Configuration Export/Import (Server Mode):** Export a configuration file containing Firebase credentials and session ID for easy client connection via QR code or file import.
*   **QR Code Session Sharing (Server Mode):** Generate a QR code to quickly share session details with clients.
*   **Status Window:** Monitor client connections and resource counts in server/client modes.
*   **Funny Names (Optional):**  Toggleable funny names for resources and clients for a lighthearted experience (can be globally hidden).
*   **Global Counter Limit (Optional):**  Set a game-wide limit for the total sum of all counters.
*   **Hide Counter for Others (Resource Level):** Control visibility of individual counters for other clients in server/client mode.
*   **Responsive Design:** Works seamlessly on various screen sizes.

## Technologies Used

*   **HTML5:**  For structuring the web page.
*   **CSS3:** For styling and visual presentation (with custom CSS variables for theming).
*   **JavaScript:** For application logic, user interactions, and Firebase integration.
*   **Firebase Realtime Database:** For real-time data synchronization in server/client modes.
*   **qrcodejs:** JavaScript library for generating QR codes.

## Setup and Installation

1.  **Clone the Repository:**
    ```bash
    git clone [repository-url]
    cd BG-Resource-Counter
    ```

2.  **Open `index.html` in your web browser:**  For local mode, simply open the `index.html` file directly in your browser.

3.  **(Optional) Firebase Setup for Server/Client Modes:**
    *   **Create a Firebase Project:**
        *   Go to the [Firebase Console](https://console.firebase.google.com/).
        *   Click "Add project" and follow the steps to create a new project.
    *   **Set up Realtime Database:**
        *   In your Firebase project, navigate to "Realtime Database".
        *   Create a Realtime Database instance.
        *   **Security Rules:** For initial testing, you can set your database rules to public read/write access. **However, for production use, you should configure secure rules.**  For example, you can use the following (adjust as needed for your security requirements):
            ```json
            {
              "rules": {
                "sessions": {
                  "$sessionId": {
                    ".read": true, // Adjust read rules as needed
                    ".write": true // Adjust write rules as needed
                  }
                }
              }
            }
            ```
        *   **Get Firebase Configuration:**
            *   In your Firebase project settings, find the "Config" section (usually under "Project settings" > "General" > "Web apps").
            *   Copy the Firebase configuration object (it looks like a JSON object with `apiKey`, `authDomain`, `databaseURL`, etc.).
    *   **Enter Firebase Configuration in the Application:**
        *   Open `index.html` in your browser.
        *   Click the "🌐" (Server/Client Settings) button.
        *   Check the "Show Firebase Config Fields" checkbox.
        *   Paste the Firebase configuration details from your Firebase project into the corresponding input fields (`apiKey`, `authDomain`, `databaseURL`, etc.).
        *   Click the "Save Firebase Config" button. This saves the configuration in your browser's local storage for future use.

## Usage

1.  **Adding Resources:**
    *   In the "Controls" section:
        *   Enter a "Resource Name".
        *   Optionally, choose an image file using the "Choose File" input.
        *   Click "Add Resource".
    *   The new resource will appear in the "Resources" area.

2.  **Interacting with Counters:**
    *   Each resource card has:
        *   **Counter Display:** Shows the current count.
        *   **Increment Buttons:**  `+` and `-` buttons to adjust the count by the default increment (initially 1).
        *   **(Optional) Additional Increment Buttons:** If "Keep one Modifier" is unchecked in settings, you'll see more increment buttons for different values.

3.  **Dice Rolling:**
    *   If "Show Roll Dice" is enabled in a resource's settings:
        *   Click the "🎲" dice button to roll the dice.
        *   The result will be displayed next to the dice button.
        *   Click on the result to toggle between the detailed dice roll and the sum (if applicable).

4.  **Customizing Resources (Settings Button "⚙️"):**
    *   Click the "⚙️" (Global Settings) button to toggle the global settings panel.
    *   Check "Show All Settings" to reveal detailed settings for each resource.
    *   For each resource, you can customize:
        *   **Name:**  Change the resource name.
        *   **Image:** Change or hide the resource image.
        *   **Counter Display:** Hide or show the counter.
        *   **Increment Values:** Adjust the increment values for the counter buttons.
        *   **Minimum/Maximum Count:** Set limits for the counter.
        *   **Dice Roller:** Configure dice rolling parameters (min, max, increment, number of dice, custom dice values, animation).
        *   **Funny Name:** Enable and set a funny name for the resource (globally hidden by default).
        *   **Hide Counter for Others:** In server/client mode, hide this counter's value from other connected clients.
        *   **Remove Resource:** Delete the resource.

5.  **Global Settings ("⚙️" button):**
    *   **User Preferences:**
        *   **Show All Settings:** Toggles visibility of detailed resource settings.
        *   **Disable All Animations:** Turns off dice roll animations.
        *   **Dark Mode:**  Switches between light and dark themes.
        *   **Globally Hide Funny Names:** Hides all funny resource names.
        *   **Globally Hide All Images:** Hides all resource images.
    *   **Game Settings:**
        *   **Enable Global Counter Limit:** Activates a limit on the total sum of all resource counters.
        *   **Global Counter Limit:** Set the maximum total count when the global limit is enabled.
    *   **Data Options:**
        *   **Export Data:** Downloads your current resource configuration as a `resources.json` file.
        *   **Import Data:**  Allows you to upload a `resources.json` file to load a saved configuration.

6.  **Server/Client Settings ("🌐" button):**
    *   **Firebase Credentials:** (Visible when "Show Firebase Config Fields" is checked)
        *   Input fields to enter your Firebase configuration details.
        *   **Save Firebase Config:** Saves the entered Firebase configuration to local storage.
        *   **Export Firebase Config:** Downloads the current Firebase config as `firebase-config.json`.
        *   **Import Firebase Config:**  Allows uploading a `firebase-config.json` file to load Firebase settings.
    *   **Client Name:** Enter a name for yourself in server/client sessions.
    *   **Mode:** Select between "Client", "Server", and "Local" modes.
        *   **Client Mode:**
            *   **Session ID:** Enter the Session ID of the server you want to join.
            *   **Connect:** Connect to the server session.
            *   **Import SDK Config & Join:** Import an SDK configuration file (`sdk-config.json`) to automatically set Firebase config and Session ID and join the session.
        *   **Server Mode:**
            *   **Start New Session:** Creates a new server session and generates a Session ID.
            *   **Session ID Display:** Shows the current Session ID.
            *   **Export SDK Config:**  Downloads an `sdk-config.json` file containing Firebase config and Session ID for easy client connection.
            *   **QR Code:** Displays a QR code that clients can scan to easily join the session.
        *   **Local Mode:** Disconnects from any server session and operates locally.

7.  **Status Window ("📊" button):**
    *   Click the "📊" (Status Window) button to toggle the status window.
    *   In server/client modes, it displays a list of connected clients and their resource counts (if not hidden by the resource settings).

## Server/Client Mode Explanation

*   **Local Mode:** This is the default mode. All data is stored locally in your browser's local storage. No Firebase connection is used. Ideal for solo play or offline use.
*   **Server Mode:** When you start a server session, your browser becomes the server. It uses Firebase Realtime Database to host the game state. Other players can join as clients. You are responsible for saving and managing the game configuration on the server.
*   **Client Mode:** In client mode, you connect to a server session hosted by another player. Your resource counts are synchronized with the server and other clients in real-time. You cannot modify the game configuration directly; you only interact with the counters.

## Data Import and Export

*   **Export Data:** Use the "Export Data" button in the Global Settings to download your current resource setup as a `resources.json` file. This file can be used as a backup or to share your setup with others.
*   **Import Data:** Use the "Import Data" button in the Global Settings to upload a `resources.json` file. This will replace your current resource configuration with the data from the imported file.

## Customization

*   **CSS Variables:** The `style.css` file uses CSS variables (`:root`) at the beginning for easy customization of colors, fonts, and button styles. Modify these variables to change the overall look and feel of the application.
*   **Images:** Use custom images for resources to visually represent them in your game.
*   **Funny Names:**  Add humorous names to resources for a more playful experience.
*   **Settings:** Utilize the various settings options to tailor the application to your specific gaming needs and preferences.

## Contributing

[If you want to encourage contributions, add a section like this:]

Contributions are welcome! If you have suggestions for new features, improvements, or bug fixes, please feel free to:

1.  Fork the repository.
2.  Create a new branch for your feature or fix.
3.  Make your changes and commit them.
4.  Submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Enjoy using the BG Resource Counter for your board games!**

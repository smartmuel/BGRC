// ====== JavaScript Constants ======
const STATIC_ASSET_URL = 'https://smartmuel.github.io/BGRC_Resources';
const DEFAULT_INCREMENT = 1;
const DEFAULT_INCREMENT_2 = 3;
const DEFAULT_INCREMENT_3 = 5;
const DICE_DEFAULT_MIN = 1;
const DICE_DEFAULT_MAX = 6;
const ANIMATION_DURATION_MS = 500;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const LOCAL_STORAGE_RESOURCES_KEY = 'boardGameResources';
const LOCAL_STORAGE_GLOBAL_CONFIG_KEY = 'globalConfig';
const LOCAL_STORAGE_DARK_MODE_KEY = 'darkMode';
const LOCAL_STORAGE_CLIENT_NAME_KEY = 'clientName';
const STATIC_ASSET_DEFAULT_IMAGE = `${STATIC_ASSET_URL}/default-image.png`;
const DICE_ROLL_SOUND_URL = `${STATIC_ASSET_URL}/sound/rolling_dice.mp3`;
const BRAINROT_NAMES = ["Simp", "Gooner", "Gyatt", "Rizzler", "Sigma", "Beta", "Skibidi", "Ohio", "Fanum", "Based", "Cringe", "NPC", "Chad", "Soyjak", "Doomer", "Bloomer", "Zoomer", "Boomer"];


// ====== Global Variables ======
let usedBrainrotNames = new Set();
let db; // Firebase database instance
let resources = [];
let unnamedCounter = 1;
let hasUnsavedChanges = false;
let showSettingsGlobal = false;
let globalSettingsVisible = false;
let hideAllExceptResources = false;
let inactivityTimer;
let disableAllAnimations = false;
let globalCounterLimit = 100;
let enableGlobalCounterLimit = false;
let diceSound = null;
let globalHideFunnyNames = true;
let previousFunnyNameStates = {};
let serverClientSettingsVisible = false;
let serverClientMode = 'client';
let sessionId = null;
let clientId = generateClientId();
let serverListeners = {};
let clientListeners = {};
let exampleDropdownPopulated = false;
let clientName = localStorage.getItem(LOCAL_STORAGE_CLIENT_NAME_KEY) || '';
let configSavedToServer = false;
let initialLoad = true;
let statusWindowVisible = false;
let clientsInSession = {};
let funnyNamesInUseSession = new Set();
let sdkExported = false;
let qrcode = null;
let otherClientsResourceCounts = {};
let globalHideAllImages = false;


// ====== Utility Functions ======
function getRandomBrainrotName() {
    let availableNames = BRAINROT_NAMES.filter(name => !usedBrainrotNames.has(name));
    if (availableNames.length === 0) {
        usedBrainrotNames.clear();
        availableNames = BRAINROT_NAMES.slice();
    }
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedBrainrotNames.add(name);
    return name;
}

function generateClientId() {
    return 'client-' + Math.random().toString(36).substring(2, 15);
}

function generateSessionId() {
    return 'session-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ====== UI Status and Feedback Functions ======
function displayStatusMessage(message, isError = false, timeout = 3000) {
    const statusArea = document.getElementById('statusMessageArea');
    statusArea.textContent = message;
    statusArea.style.color = isError ? 'red' : 'green'; // Example error color
    if (timeout) {
        setTimeout(() => {
            statusArea.textContent = '';
        }, timeout);
    }
}

// ====== Status Window Functions ======
function toggleStatusWindowVisibility() {
    statusWindowVisible = !statusWindowVisible;
    document.getElementById('statusWindow').style.display = statusWindowVisible ? 'block' : 'none';
    if (statusWindowVisible && serverClientMode !== 'local') {
        fetchAndDisplayClientStatus();
    }
}

async function fetchAndDisplayClientStatus() {
    if (!sessionId || !['client', 'server'].includes(serverClientMode)) {
        console.warn("Client status not available in local mode or without a session.");
        document.getElementById('statusWindow').innerHTML = "<p>Status not available in local mode or without a session.</p>";
        return;
    }

    const statusWindowContent = document.getElementById('statusWindow');
    statusWindowContent.innerHTML = "<p>Loading client status...</p>";

    try {
        const clientCountsSnapshot = await db.ref(`sessions/${sessionId}/client_counts`).get();
        const clientCountsData = clientCountsSnapshot.val() || {};
        const configSnapshot = await db.ref(`sessions/${sessionId}/config`).get();
        const configData = configSnapshot.val() || {};


        let statusHTML = '';
        for (const clientFirebaseId in clientCountsData) {
            if (clientFirebaseId === clientId) continue;
            const clientCounts = clientCountsData[clientFirebaseId];
            const currentClientName = clientsInSession[clientFirebaseId] || 'Unknown Client';

            statusHTML += `<div class="status-item"><h4>Client: ${currentClientName}</h4><ul>`;

            for (const resourceIndex in configData) {
                if (configData.hasOwnProperty(resourceIndex)) {
                    const count = clientCounts ? clientCounts[resourceIndex] : undefined;
                    const resource = configData[resourceIndex];

                    if (resource) {
                        const resourceDisplayName = !globalHideFunnyNames && resource.useFunnyName && resource.funnyName ? resource.funnyName : resource.name;
                        statusHTML += `<li>${resourceDisplayName}: ${count !== undefined ? count : 'N/A'}</li>`;
                    }
                }
            }
            statusHTML += `</ul></div>`;
        }

        if (statusHTML === '') {
            statusHTML = "<p>No other clients connected or no data available.</p>";
        }

        statusWindowContent.innerHTML = statusHTML;

    } catch (error) {
        console.error("Error fetching client status:", error);
        statusWindowContent.innerHTML = "<p>Error loading client status.</p>";
    }
}


// ====== Server/Client Settings Functions ======
function toggleServerClientSettingsVisibility() {
    serverClientSettingsVisible = !serverClientSettingsVisible;
    document.getElementById('serverClientContent').style.display = serverClientSettingsVisible ? 'block' : 'none';
}

function toggleFirebaseConfigVisibility() {
    const firebaseFields = document.querySelectorAll('.firebase-fields');
    const showFirebaseFieldsToggle = document.getElementById('showFirebaseFieldsToggle');
    const displayStyle = showFirebaseFieldsToggle.checked ? 'block' : 'none';
    firebaseFields.forEach(field => {
        field.style.display = displayStyle;
    });
}

function saveFirebaseConfigToCache(config) {
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
}

function loadFirebaseConfigFromCache() {
    const cachedConfig = localStorage.getItem('firebaseConfig');
    if (cachedConfig) {
        const config = JSON.parse(cachedConfig);
        document.getElementById('apiKey').value = config.apiKey || '';
        document.getElementById('authDomain').value = config.authDomain || '';
        document.getElementById('databaseURL').value = config.databaseURL || '';
        document.getElementById('projectId').value = config.projectId || '';
        document.getElementById('storageBucket').value = config.storageBucket || '';
        document.getElementById('messagingSenderId').value = config.messagingSenderId || '';
        document.getElementById('appId').value = config.appId || '';
    }
}

function exportFirebaseConfig() {
    const firebaseConfig = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        databaseURL: document.getElementById('databaseURL').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId').value,
        appId: document.getElementById('appId').value
    };

    const configStr = JSON.stringify(firebaseConfig, null, 2);
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firebase-config.json';
    a.click();
    URL.revokeObjectURL(url);
}

function triggerImportFirebaseConfig() {
    document.getElementById('importFirebaseFile').click();
}

function importFirebaseConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedConfig = JSON.parse(e.target.result);
            if (typeof importedConfig === 'object' &&
                importedConfig.apiKey && importedConfig.authDomain && importedConfig.databaseURL &&
                importedConfig.projectId && importedConfig.appId) {

                document.getElementById('apiKey').value = importedConfig.apiKey || '';
                document.getElementById('authDomain').value = importedConfig.authDomain || '';
                document.getElementById('databaseURL').value = importedConfig.databaseURL || '';
                document.getElementById('projectId').value = importedConfig.projectId || '';
                document.getElementById('storageBucket').value = importedConfig.storageBucket || '';
                document.getElementById('messagingSenderId').value = importedConfig.messagingSenderId || '';
                document.getElementById('appId').value = importedConfig.appId || '';

                displayStatusMessage("Firebase configuration imported successfully!");
                if (initializeFirebaseWithUserInput()) {
                    console.log("Firebase re-initialized after import.");
                }
            } else {
                displayStatusMessage("Invalid Firebase configuration file.", true);
                console.warn("Invalid Firebase configuration file.");
            }
        } catch (error) {
            displayStatusMessage("Error importing Firebase configuration.", true);
            console.warn("Error importing Firebase configuration.");
            console.error("Firebase config import error:", error);
        }
    };
    reader.onerror = function(error) {
        displayStatusMessage("Error reading the Firebase configuration file.", true);
        console.warn("Error reading the Firebase configuration file.");
        console.error("File read error:", error);
    };
    reader.readAsText(file);
}

function initializeFirebaseWithUserInput() {
    const firebaseConfigFromInput = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        databaseURL: document.getElementById('databaseURL').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId').value,
        appId: document.getElementById('appId').value
    };

    const missingFields = Object.entries(firebaseConfigFromInput)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingFields.length > 0) {
        displayStatusMessage(`Firebase configuration missing fields: ${missingFields.join(', ')}`, true);
        console.warn(`Firebase configuration missing fields: ${missingFields.join(', ')}`);
        return false;
    }

    try {
        firebase.initializeApp(firebaseConfigFromInput);
        db = firebase.database();
        console.log("Firebase Initialized Successfully with user credentials.");
        saveFirebaseConfigToCache(firebaseConfigFromInput);
        displayStatusMessage("Firebase Initialized Successfully!", false);
        return true;
    } catch (error) {
        displayStatusMessage("Firebase Initialization Error.", true);
        console.error("Firebase Initialization Error:", error);
        console.warn("Firebase Initialization Failed. Check console for details.");
        return false;
    }
}

function exportSdkConfig() {
    const firebaseConfig = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        databaseURL: document.getElementById('databaseURL').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId').value,
        appId: document.getElementById('appId').value
    };

    const sdkConfig = {
        firebaseConfig: firebaseConfig,
        sessionDetails: {
            sessionId: sessionId
        }
    };

    const configStr = JSON.stringify(sdkConfig, null, 2);
    const blob = new Blob([configStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sdk-config.json';
    a.click();
    URL.revokeObjectURL(url);
    displayStatusMessage("SDK configuration exported to sdk-config.json!");
}


// ====== Dice Roll Sound ======
async function createDiceRollSound() {
    const audioContext = new(window.AudioContext || window.webkitContext)();
    let buffer;

    try {
        const response = await fetch(DICE_ROLL_SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        buffer = decodedBuffer;
        return {
            play: () => {
                if (buffer) {
                    const source = audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioContext.destination);
                    source.start(0);
                }
            }
        };
    } catch (error) {
        console.error('Error loading dice roll sound:', error);
        displayStatusMessage("Error loading dice roll sound.", true);
        return null;
    }
}

// ====== Local Storage Functions ======
function saveToLocalStorage() {
    if (serverClientMode === 'local') {
        const globalConfig = {
            showSettingsGlobal,
            hideAllExceptResources,
            disableAllAnimations,
            globalHideFunnyNames,
            previousFunnyNameStates,
            serverClientMode,
            clientName,
            globalHideAllImages,
        };
        localStorage.setItem(LOCAL_STORAGE_RESOURCES_KEY, JSON.stringify(resources));
        localStorage.setItem('unnamedCounter', unnamedCounter);
        localStorage.setItem(LOCAL_STORAGE_GLOBAL_CONFIG_KEY, JSON.stringify(globalConfig));
        localStorage.setItem(LOCAL_STORAGE_CLIENT_NAME_KEY, clientName);
    } else if (serverClientMode === 'server' || serverClientMode === 'client') {
        const globalConfig = {
            showSettingsGlobal,
            hideAllExceptResources,
            disableAllAnimations,
            globalHideFunnyNames,
            previousFunnyNameStates,
            serverClientMode,
            clientName,
            globalHideAllImages,
        };
        localStorage.setItem(LOCAL_STORAGE_GLOBAL_CONFIG_KEY,  JSON.stringify(globalConfig));
        localStorage.setItem(LOCAL_STORAGE_CLIENT_NAME_KEY, clientName);
    }

    saveGlobalSettingsToLocalStorage();
}

function loadFromLocalStorage() {
    const savedGlobalConfig = localStorage.getItem(LOCAL_STORAGE_GLOBAL_CONFIG_KEY);
    if (serverClientMode === 'local') {
        const savedResources = localStorage.getItem(LOCAL_STORAGE_RESOURCES_KEY);

        if (savedResources) {
            resources = JSON.parse(savedResources).map(processResourceData);
            unnamedCounter = parseInt(localStorage.getItem('unnamedCounter')) || 1;
            if (savedGlobalConfig) {
                const config = JSON.parse(savedGlobalConfig);
                applyGlobalConfig(config);
                previousFunnyNameStates = config.previousFunnyNameStates || {};
                if (config.serverClientMode) {
                    serverClientMode = config.serverClientMode;
                    document.getElementById('serverClientMode').value = serverClientMode;
                    updateServerClientUI();
                }
                if (config.clientName) {
                    clientName = config.clientName;
                    document.getElementById('clientNameInput').value = clientName;
                }
                if (config.globalHideAllImages !== undefined) {
                    globalHideAllImages = config.globalHideAllImages;
                    document.getElementById('globalHideAllImages').checked = globalHideAllImages;
                }
            }
            renderResources();
            updateVisibility();
        }
    } else if ((serverClientMode === 'client' || serverClientMode === 'server') && sessionId) {
        loadConfigFromServer();
    } else {
        if (savedGlobalConfig) {
            const config = JSON.parse(savedGlobalConfig);
            applyGlobalConfig(config);
            if (config.serverClientMode) {
                serverClientMode = config.serverClientMode;
                document.getElementById('serverClientMode').value = serverClientMode;
                updateServerClientUI();
            }
            if (config.clientName) {
                clientName = config.clientName;
                document.getElementById('clientNameInput').value = clientName;
            }
            if (config.globalHideAllImages !== undefined) {
                globalHideAllImages = config.globalHideAllImages;
                document.getElementById('globalHideAllImages').checked = globalHideAllImages;
            }
        }
        updateServerClientUI();
    }

    checkGlobalCounterLimit();
    loadGlobalSettingsFromLocalStorage();
    loadFirebaseConfigFromCache();
}

function saveGlobalSettingsToLocalStorage() {
    localStorage.setItem('showSettingsGlobal', document.getElementById('showSettingsGlobal').checked);
    localStorage.setItem('disableAllAnimations', document.getElementById('disableAllAnimations').checked);
    localStorage.setItem('globalHideFunnyNames', document.getElementById('globalHideFunnyNames').checked);
    localStorage.setItem('serverClientMode', serverClientMode);
    localStorage.setItem('globalHideAllImages', document.getElementById('globalHideAllImages').checked);
}

function loadGlobalSettingsFromLocalStorage() {
    document.getElementById('showSettingsGlobal').checked = localStorage.getItem('showSettingsGlobal') === 'true';
    document.getElementById('disableAllAnimations').checked = localStorage.getItem('disableAllAnimations') === 'true';
    document.getElementById('globalHideFunnyNames').checked = localStorage.getItem('globalHideFunnyNames') !== 'false';
    const savedServerClientMode = localStorage.getItem('serverClientMode');
    if (savedServerClientMode) {
        serverClientMode = savedServerClientMode;
        document.getElementById('serverClientMode').value = serverClientMode;
    }
    document.getElementById('globalHideAllImages').checked = localStorage.getItem('globalHideAllImages') === 'true';

    document.getElementById('showFirebaseFieldsToggle').checked = false;

    toggleGlobalSettings();
    toggleAllAnimations();
    toggleGlobalHideFunnyNames();
    toggleGlobalHideAllImages();
    toggleFirebaseConfigVisibility();
}

function processResourceData(resourceData) {
    return {
        ...resourceData,
        count: typeof resourceData.count === 'number' ? resourceData.count : 0,
        customIncrement1: typeof resourceData.customIncrement1 === 'number' ? resourceData.customIncrement1 : DEFAULT_INCREMENT,
        customIncrement2: typeof resourceData.customIncrement2 === 'number' ? resourceData.customIncrement2 : DEFAULT_INCREMENT_2,
        customIncrement3: typeof resourceData.customIncrement3 === 'number' ? resourceData.customIncrement3 : DEFAULT_INCREMENT_3,
        minCount: typeof resourceData.minCount === 'number' ? resourceData.minCount : 0,
        maxCount: resourceData.maxCount == null ? Infinity : resourceData.maxCount,
        maxGameCounterLimit: resourceData.maxGameCounterLimit == null ? Infinity : resourceData.maxGameCounterLimit, // Added maxGameCounterLimit
        image: resourceData.image || STATIC_ASSET_DEFAULT_IMAGE,
        hideImage: typeof resourceData.hideImage === 'boolean' ? resourceData.hideImage : true,
        hideCounter: typeof resourceData.hideCounter === 'boolean' ? resourceData.hideCounter : false,
        keepOneModifier: typeof resourceData.keepOneModifier === 'boolean' ? resourceData.keepOneModifier : true,
        showRollDice: typeof resourceData.showRollDice === 'boolean' ? resourceData.showRollDice : false,
        rollDiceMin: typeof resourceData.rollDiceMin === 'number' ? resourceData.rollDiceMin : DICE_DEFAULT_MIN,
        rollDiceMax: typeof resourceData.rollDiceMax === 'number' ? resourceData.rollDiceMax : DICE_DEFAULT_MAX,
        rollDiceIncrement: typeof resourceData.rollDiceIncrement === 'number' ? resourceData.rollDiceIncrement : 1,
        enableDiceAnimation: typeof resourceData.enableDiceAnimation === 'boolean' ? resourceData.enableDiceAnimation : true,
        numberOfDice: typeof resourceData.numberOfDice === 'number' ? resourceData.numberOfDice : 1,
        rollDiceCustomValues: Array.isArray(resourceData.rollDiceCustomValues) ? resourceData.rollDiceCustomValues : [],
        useCustomDiceValues: typeof resourceData.useCustomDiceValues === 'boolean' ? resourceData.useCustomDiceValues : false,
        useFunnyName: typeof resourceData.useFunnyName === 'boolean' ? resourceData.useFunnyName : false,
        funnyName: resourceData.funnyName || "",
        previousUseFunnyName: typeof resourceData.previousUseFunnyName === 'boolean' ? resourceData.previousUseFunnyName : false,
        firebaseKey: resourceData.firebaseKey
    };
}

function applyGlobalConfig(globalConfig) {
    showSettingsGlobal = globalConfig.showSettingsGlobal;
    hideAllExceptResources = globalConfig.hideAllExceptResources;
    disableAllAnimations = globalConfig.disableAllAnimations;
    globalHideFunnyNames = globalConfig.globalHideFunnyNames === undefined ? true : globalConfig.globalHideFunnyNames;
    previousFunnyNameStates = globalConfig.previousFunnyNameStates || {};
    clientName = globalConfig.clientName || '';
    serverClientMode = globalConfig.serverClientMode || 'client';
    globalHideAllImages = globalConfig.globalHideAllImages === undefined ? false : globalConfig.globalHideAllImages;

    document.getElementById('showSettingsGlobal').checked = showSettingsGlobal;
    document.getElementById('disableAllAnimations').checked = disableAllAnimations;
    document.getElementById('globalHideFunnyNames').checked = globalHideFunnyNames;
    document.getElementById('clientNameInput').value = clientName;
    document.getElementById('serverClientMode').value = serverClientMode;
    document.getElementById('globalHideAllImages').checked = globalHideAllImages;
    toggleGlobalCounterLimit();
}


// ====== Resource Management Functions ======
function addResource() {
    const file = document.getElementById('imageUpload').files[0];
    let name = document.getElementById('resourceName').value.trim() || `Resource ${unnamedCounter++}`;

    const resource = {
        name,
        image: file ? URL.createObjectURL(file) : STATIC_ASSET_DEFAULT_IMAGE,
        count: 0,
        customIncrement1: DEFAULT_INCREMENT,
        customIncrement2: DEFAULT_INCREMENT_2,
        customIncrement3: DEFAULT_INCREMENT_3,
        minCount: 0,
        maxCount: Infinity,
        maxGameCounterLimit: Infinity, // Initialize maxGameCounterLimit
        hideImage: true,
        hideCounter: false,
        keepOneModifier: true,
        showRollDice: false,
        rollDiceMin: DICE_DEFAULT_MIN,
        rollDiceMax: DICE_DEFAULT_MAX,
        rollDiceIncrement: 1,
        enableDiceAnimation: true,
        numberOfDice: 1,
        rollDiceCustomValues: [],
        useCustomDiceValues: false,
        useFunnyName: false,
        funnyName: "",
        previousUseFunnyName: false
    };

    const firebaseResource = { ...resource, maxCount: resource.maxCount === Infinity ? null : resource.maxCount, maxGameCounterLimit: resource.maxGameCounterLimit === Infinity ? null : resource.maxGameCounterLimit }; // Also handle maxGameCounterLimit for Firebase

    if (serverClientMode === 'server' && sessionId) {
        const newResourceRef = db.ref(`sessions/${sessionId}/config`).push();
        firebaseResource.firebaseKey = newResourceRef.key;

        newResourceRef.set(firebaseResource).then(() => {
            resources.push(resource);
            hasUnsavedChanges = true;
            renderResources();
            checkGlobalCounterLimit();
            document.getElementById('resourceName').value = "";
            saveConfigToServer();
            displayStatusMessage("Resource added successfully!");
        });
    } else {
        resources.push(resource);
        hasUnsavedChanges = true;
        renderResources();
        saveToLocalStorage();
        checkGlobalCounterLimit();
        document.getElementById('resourceName').value = "";
        displayStatusMessage("Resource added locally.");
    }
}

function renderResource(resource, index) {
    const container = document.getElementById('resources');
    const existingElement = container.querySelector(`.resource[data-resource-index="${index}"]`);
    if (!existingElement) {
        container.insertAdjacentHTML('beforeend', createResourceHTML(resource, index));
    } else {
        existingElement.outerHTML = createResourceHTML(resource, index);
    }
    updateOtherClientsCountsDisplay(index);
}

function renderResources() {
    document.getElementById('resources').innerHTML = '';
    resources.forEach((resource, index) => renderResource(resource, index));
    document.getElementById('exportButton').disabled = resources.length === 0;
    updateVisibility();
    attachEventListeners();
}

function generateModifierToggle(resource, index) {
    if (resource.hideCounter) return `<div class="modifier-toggle-container"></div>`; // Empty container if hidden
    const modifierIcon = resource.keepOneModifier ? '➕' : '➖';
    return `<div class="modifier-toggle-container"><div class="modifier-toggle" data-resource-index="${index}" onclick="toggleKeepOneModifier(event, ${index})">${modifierIcon}</div></div>`}

function generateResourceImage(resource) {
    if (globalHideAllImages) return `<div class="resource-image-container-wrapper"></div>`; // Empty wrapper if hidden
    return resource.hideImage ? `<div class="resource-image-container-wrapper"></div>` : `<div class="resource-image-container-wrapper"><div class="resource-image-container">
    <img src="${resource.image}" alt="${resource.name}" class="resource-image">
</div></div>`;
}

function generateResourceNameContainer(resource, index) {
    let displayName = resource.name;
    if (!globalHideFunnyNames && resource.useFunnyName && resource.funnyName) {
        displayName = resource.funnyName;
    }

    return `<div class="resource-name-container-wrapper"><div class="resource-name-container">
            ${showSettingsGlobal
                ? (resource.useFunnyName
                    ? `<input type="text" placeholder="Funny Resource Name" value="${resource.funnyName}" onblur="updateFunnyName(${index}, this.value)">`
                    : `<input type="text" placeholder="Resource Name" value="${resource.name}" onblur="updateName(${index}, this.value)">`
                  )
                : `<span class="resource-name">${displayName}</span>`
            }
        </div></div>`
}

function generateCounter(resource, index) {
    if (resource.hideCounter) return `<div class="counter-container"></div>`; //Empty container if hidden
    return `
        <div class="counter-container"><div class="counter">
            ${!resource.keepOneModifier ? `
            <div class="counter-buttons">
                <button onclick="updateCount(event, ${index}, -${resource.customIncrement3})">-${resource.customIncrement3}</button>
                <button onclick="updateCount(event, ${index}, ${resource.customIncrement3})">+${resource.customIncrement3}</button>
            </div>
            ` : ''}
            <div class="counter-buttons">
                <button onclick="updateCount(event, ${index}, -${resource.customIncrement1})">-${resource.customIncrement1}</button>
                <span class="count-display">${resource.count}</span>
                <button onclick="updateCount(event, ${index}, ${resource.customIncrement1})">+${resource.customIncrement1}</button>
            </div>
            ${!resource.keepOneModifier ? `
            <div class="counter-buttons">
                <button onclick="updateCount(event, ${index}, -${resource.customIncrement2})">-${resource.customIncrement2}</button>
                <button onclick="updateCount(event, ${index}, ${resource.customIncrement2})">+${resource.customIncrement2}</button>
            </div>
            ` : ''}
            <div class="other-clients-counts" id="otherClientsCounts${index}">
            </div>
        </div></div>
    `;
}

function generateDiceControls(resource, index) {
    if (!resource.showRollDice) return `<div class="roll-dice-container"></div>`; // Empty container if hidden
    return `
     <div class="roll-dice-container"><div class="roll-dice" style="display: flex; justify-content: center; align-items: center;">
         <button class="dice-button" onclick="rollDice(${index})" aria-label="Roll Dice">🎲</button>
         <div class="roll-result" id="rollResult${index}" style="cursor: pointer; margin-left: 10px;" title="Click to toggle between detailed result and sum">
            ${resource.useCustomDiceValues && resource.rollDiceCustomValues.length > 0
                ? Array(resource.numberOfDice).fill(resource.rollDiceCustomValues[resource.rollDiceCustomValues.length - 1]).join(', ')
                : Array(resource.numberOfDice).fill(resource.rollDiceMax).join(', ')}
         </div>
    </div></div>
`;
}

function generateSettings(resource, index) {
    if (!showSettingsGlobal) return `<div class="settings-container"></div>`; // Empty container if hidden
    const counterSettingsStyle = resource.hideCounter ? 'display: none;' : '';

    return `
        <div class="settings-container"><div class="settings">
            <div class="use-funny-name-checkbox" style="${globalHideFunnyNames ? 'display: none;' : ''}">
                Use Funny Name: <input type="checkbox" ${resource.useFunnyName ? 'checked' : ''} onchange="updateUseFunnyName(${index}, this.checked)" ${globalHideFunnyNames ? 'disabled' : ''}>
            </div>
            <div class="hide-image-checkbox">
                Hide Image: <input type="checkbox" ${resource.hideImage ? 'checked' : ''} onchange="updateHideImage(${index}, this.checked)">
            </div>
            ${!resource.hideImage ? `<button onclick="changeImage(${index})">Change Image</button>` : ''}
            <div class="hide-counter-checkbox">
                Hide Counter: <input type="checkbox" ${resource.hideCounter ? 'checked' : ''} onchange="updateHideCounter(${index}, this.checked)">
            </div>

            <div class="counter-settings" style="${counterSettingsStyle}">
                <div class="keep-one-modifier-checkbox">
                    Keep one Modifier: <input type="checkbox" ${resource.keepOneModifier ? 'checked' : ''} checked onchange="updateKeepOneModifier(${index}, this.checked)">
                </div>
                <div>
                    Increment 1: <input type="number" class="custom-increment" value="${resource.customIncrement1}" onchange="updateCustomIncrement(${index}, 1, this.value)" min="1">
                </div>
                ${!resource.keepOneModifier ? `
                <div>
                    Increment 2: <input type="number" class="custom-increment" value="${resource.customIncrement2}" onchange="updateCustomIncrement(${index}, 2, this.value)" min="1">
                </div>
                <div>
                    Increment 3: <input type="number" class="custom-increment" value="${resource.customIncrement3}" onchange="updateCustomIncrement(${index}, 3, this.value)" min="1">
                </div>
                ` : ''}
                <div>
                    Minimum Count: <input type="number" value="${resource.minCount}" onchange="updateMinCount(${index}, this.value)">
                </div>
                <div>
                    Maximum Count: <input type="number" value="${resource.maxCount === Infinity ? '' : resource.maxCount}" onchange="updateMaxCount(${index}, this.value)">
                </div>
                 <div>
                    Max Game Count: <input type="number" value="${resource.maxGameCounterLimit === Infinity ? '' : resource.maxGameCounterLimit}" onchange="updateMaxGameCounterLimit(${index}, this.value)">
                </div>
            </div>

            <div class="roll-dice-settings">
                Show Roll Dice: <input type="checkbox" ${resource.showRollDice ? 'checked' : ''} onchange="updateShowRollDice(${index}, this.checked)">
            </div>
            ${resource.showRollDice ? `
            <div>
                Use Custom Dice Values: <input type="checkbox" ${resource.useCustomDiceValues ? 'checked' : ''} onchange="updateUseCustomDiceValues(${index}, this.checked)">
            </div>
            ${!resource.useCustomDiceValues ? `
            <div>
                Roll Dice Min: <input type="number" value="${resource.rollDiceMin}" onchange="updateRollDiceMin(${index}, this.value)" min="1">
            </div>
            <div>
                Roll Dice Max: <input type="number" value="${resource.rollDiceMax}" onchange="updateRollDiceMax(${index}, this.value)" min="1">
            </div>
            <div>
                Roll Dice Increment: <input type="number" value="${resource.rollDiceIncrement}" onchange="updateRollDiceIncrement(${index}, this.value)" min="1">
            </div>
            ` : `
            <div>
                Custom Dice Values: <input type="text" value="${resource.rollDiceCustomValues.join(', ')}" onchange="updateRollDiceCustomValues(${index}, this.value)">
            </div>
            `}
            <div>
                Number of Dice: <input type="number" value="${resource.numberOfDice}" min="1" onchange="updateNumberOfDice(${index}, this.value)">
            </div>
            <div>
                Enable Dice Animation: <input type="checkbox" ${resource.enableDiceAnimation ? 'checked' : ''} onchange="updateEnableDiceAnimation(${index}, this.checked)">
            </div>
            ` : ''}
            <button onclick="removeResource(${index})" class="remove-button">Remove</button>
        </div></div>
    `
}


function createResourceHTML(resource, index) {
    const resourceClass = 'resource';
    return `
        <div class="${resourceClass}" data-resource-index="${index}">
            ${generateModifierToggle(resource, index)}
            ${generateResourceImage(resource)}
            ${generateResourceNameContainer(resource, index)}
            ${generateCounter(resource, index)}
            ${generateDiceControls(resource, index)}
            ${generateSettings(resource, index)}
        </div>
     `;
}

function toggleKeepOneModifier(event, index) {
    event.stopPropagation();
    const targetResource = resources[index];
    targetResource.keepOneModifier = !targetResource.keepOneModifier;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateUseCustomDiceValues(index, use) {
    const targetResource = resources[index];
    targetResource.useCustomDiceValues = use;
    hasUnsavedChanges = true;
    const resultElement = document.getElementById(`rollResult${index}`);
    if (resultElement) {
        if (use && targetResource.rollDiceCustomValues.length > 0) {
            const lastValue = targetResource.rollDiceCustomValues[targetResource.rollDiceCustomValues.length - 1];
            resultElement.textContent = Array(targetResource.numberOfDice).fill(lastValue).join(', ');
        } else {
            resultElement.textContent = Array(targetResource.numberOfDice).fill(targetResource.rollDiceMax).join(', ');
        }
    }
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateRollDiceCustomValues(index, value) {
    const targetResource = resources[index];
    targetResource.rollDiceCustomValues = value.split(',').map(v => v.trim()).filter(v => v !== '');
    hasUnsavedChanges = true;
    const resultElement = document.getElementById(`rollResult${index}`);
    if (resultElement && targetResource.useCustomDiceValues && targetResource.rollDiceCustomValues.length > 0) {
        const lastValue = targetResource.rollDiceCustomValues[targetResource.rollDiceCustomValues.length - 1];
        resultElement.textContent = Array(targetResource.numberOfDice).fill(lastValue).join(', ');
    }
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function startServer() {
    if (!db) {
        displayStatusMessage("Firebase database not initialized. Please save Firebase config first.", true);
        console.warn("Firebase database not initialized. Please save Firebase config first.");
        return;
    }

    sessionId = generateSessionId();
    clientName = document.getElementById('clientNameInput').value.trim();
    if (!clientName) {
        clientName = getRandomBrainrotName();
        document.getElementById('clientNameInput').value = clientName;
    }

    // Check for duplicate funny names in the current session
    if (!globalHideFunnyNames) {
        let funnyName = getRandomBrainrotName();
        while (funnyNamesInUseSession.has(funnyName)) {
            funnyName = getRandomBrainrotName();
        }
        clientName = funnyName;
        document.getElementById('clientNameInput').value = clientName;
    }

    document.getElementById('sessionId').value = sessionId;
    configSavedToServer = false;

    db.ref(`sessions/${sessionId}/clients/${clientId}`).set({
        clientId: clientId,
        clientName: clientName,
    }).then(() => {
        saveConfigToServer();
        setupServerClientListeners();
        setupClientResourceListeners();
        setupServerResourceListeners();
        displayStatusMessage(`Server started. Session ID: ${sessionId}, Name: ${clientName}`);
        funnyNamesInUseSession.add(clientName); // Add name to session-used names
    });

    document.getElementById('serverIDDisplay').value = sessionId;
    document.getElementById('serverIDDisplayContainer').style.display = 'block';
    document.getElementById('exportSdkConfigButton').style.display = 'inline-block';
    document.getElementById('newSessionContainer').style.display = 'none';
    generateQRCode();
    updateServerClientUI();
}

async function connectClient() {
    sessionId = document.getElementById('sessionId').value.trim();
    clientName = document.getElementById('clientNameInput').value.trim();
    if (!clientName) {
        clientName = getRandomBrainrotName();
        document.getElementById('clientNameInput').value = clientName;
    }

     if (!globalHideFunnyNames) {
        let funnyName = getRandomBrainrotName();
        while (funnyNamesInUseSession.has(funnyName)) {
            funnyName = getRandomBrainrotName();
        }
        clientName = funnyName;
        document.getElementById('clientNameInput').value = clientName;
    }

    saveToLocalStorage();

    if (!clientName) {
        displayStatusMessage("Please enter a client name.", true);
        return;
    }

    if (sessionId) {
        const clientsRef = db.ref(`sessions/${sessionId}/clients`);
        const snapshot = await clientsRef.orderByChild('clientName').equalTo(clientName).once('value');
        if (snapshot.exists()) {
            displayStatusMessage("This client name is already taken. Please choose a different name.", true);
            return;
        }

        db.ref(`sessions/${sessionId}/clients/${clientId}`).set({
            clientId: clientId,
            clientName: clientName,
        }).then(() => {
            loadConfigFromServer();
            setupClientResourceListeners();
            setupClientSideClientListeners();
            updateServerClientUI();
            displayStatusMessage(`Client - Connected to session: ${sessionId}, Name: ${clientName}`);
            console.log(`Client - Connected to session: ${sessionId}, Name: ${clientName}`);
            funnyNamesInUseSession.add(clientName);
        }).catch(error => {
            displayStatusMessage("Failed to connect to session. Please check the console for details.", true);
            console.error("Error connecting client:", error);
        });
    } else {
        displayStatusMessage("Please enter a Session ID.", true);
    }
}

function generateQRCode() {
    const firebaseConfig = {
        apiKey: document.getElementById('apiKey').value,
        authDomain: document.getElementById('authDomain').value,
        databaseURL: document.getElementById('databaseURL').value,
        projectId: document.getElementById('projectId').value,
        storageBucket: document.getElementById('storageBucket').value,
        messagingSenderId: document.getElementById('messagingSenderId').value,
        appId: document.getElementById('appId').value
    };

    console.log("Firebase Config for QR Code:", firebaseConfig);
    const sessionDetails = {
        sessionId: sessionId
    };

    const combinedConfig = {
        firebaseConfig: firebaseConfig,
        sessionDetails: sessionDetails
    };

    const configString = JSON.stringify(combinedConfig);
    const currentUrl = window.location.href.split('?')[0];
    const qrCodeData = `${currentUrl}?config=${encodeURIComponent(configString)}`;

    console.log("QR Code Data:", qrCodeData);

    const qrcodeContainer = document.getElementById('qrcodeCanvas');
    qrcodeContainer.innerHTML = ''; // Clear previous QR code

    const isDarkMode = document.body.classList.contains('dark-mode');
    const colorDark = isDarkMode ? '#ffffff' : '#000000';
    const colorLight = isDarkMode ? '#000000' : '#ffffff';

    // Always create a new QRCode instance
    qrcode = new QRCode(qrcodeContainer, {
        text: qrCodeData,
        width: 300,
        height: 300,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.H
    });
}



// ====== Event Listeners and Handlers ======
function attachEventListeners() {
    document.addEventListener('click', function (event) {
        const target = event.target;

        if (target.matches('.counter button')) {
            event.stopPropagation();
            const resourceIndex = parseInt(target.closest('.resource').dataset.resourceIndex);
            let change = 0;
            if (target.textContent === '+1') change = resources[resourceIndex].customIncrement1;
            else if (target.textContent === '-1') change = - resources[resourceIndex].customIncrement1;
            else if (target.textContent === '+2') change = resources[resourceIndex].customIncrement2;
            else if (target.textContent === '-2') change = - resources[resourceIndex].customIncrement2;
            else if (target.textContent === '+3') change = resources[resourceIndex].customIncrement3;
            else if (target.textContent === '-3') change = - resources[resourceIndex].customIncrement3;

            updateCount(event, resourceIndex, change);
        }

        if (target.matches('.modifier-toggle')) {
            event.stopPropagation();
            const resourceIndex = parseInt(target.closest('.resource').dataset.resourceIndex);
            toggleKeepOneModifier(event, resourceIndex);
        }
        if (globalSettingsVisible && !target.closest('#globalSettings')) {
            toggleGlobalSettingsVisibility();
        }
        if (serverClientSettingsVisible && !target.closest('#serverClientSettings')) {
            toggleServerClientSettingsVisibility();
        }
        if (statusWindowVisible && !event.target.closest('#statusWindowContainer')) {
            toggleStatusWindowVisibility();
        }
    });


    document.addEventListener('input', function (event) {
        const target = event.target;
        if (target.matches('.resource input')) {
            const input = target;
            const resourceElement = input.closest('.resource');
            const resourceIndex = parseInt(resourceElement.dataset.resourceIndex);
            const setting = input.parentElement.textContent.trim().split(':')[0].toLowerCase().replace(/\s/g, '');
            const value = input.type === 'checkbox' ? input.checked : input.value;
            updateResourceSetting(resourceIndex, setting, value);
        }
    });

    document.getElementById('addButton').addEventListener('click', addResource);
    document.getElementById('loadExampleButton').addEventListener('click', loadSelectedExample);
    document.getElementById('startButton').addEventListener('click', startServer);
    document.getElementById('connectButton').addEventListener('click', connectClient);
    document.getElementById('saveFirebaseConfig').addEventListener('click', () => {
        if (initializeFirebaseWithUserInput()) {
            console.log("Firebase Config Saved and Initialized.");
        } else {
            console.warn("Firebase Initialization Failed.");
        }
    });
}

function updateResourceSetting(index, setting, value) {
     const targetResource = resources[index];
    switch (setting) {
        case 'hideimage': updateHideImage(index, value); break;
        case 'hidecounter': updateHideCounter(index, value); break;
        case 'keeponemodifier': updateKeepOneModifier(index, value); break;
        case 'increment1':
        case 'increment2':
        case 'increment3': updateCustomIncrement(index, parseInt(setting.slice(-1)), value); break;
        case 'minimumcount': updateMinCount(index, value); break;
        case 'maximumcount': updateMaxCount(index, value); break;
        case 'maxgamecount': updateMaxGameCounterLimit(index, value); break; // Added case for max game counter limit
        case 'showrolldice': updateShowRollDice(index, value); break;
        case 'rolldicemin': updateRollDiceMin(index, value); break;
        case 'rolldicemax': updateRollDiceMax(index, value); break;
        case 'rolldiceincrement': updateRollDiceIncrement(index, value); break;
        case 'numberofdice': updateNumberOfDice(index, value); break;
        case 'enablediceAnimation': updateEnableDiceAnimation(index, value); break;
        case 'usecustomdicevalues': updateUseCustomDiceValues(index, value); break;
        case 'customdicevalues': updateRollDiceCustomValues(index, value); break;
        case 'usefunnyname': updateUseFunnyName(index, value); break;
    }
     if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateName(index, newName) {
    const targetResource = resources[index];
    targetResource.name = newName;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    renderResource(targetResource, index);
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateFunnyName(index, newFunnyName) {
    const targetResource = resources[index];
    targetResource.funnyName = newFunnyName;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    renderResource(targetResource, index);
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

async function updateCount(event, index, change) {
    event.stopPropagation();
    const targetResource = resources[index];

    if (typeof change !== 'number' || isNaN(change)) {
        displayStatusMessage("Invalid change value.", true);
        console.error("Invalid change value:", change);
        return;
    }

    let potentialNewResourceCount = Math.max(targetResource.minCount, Math.min(targetResource.count + change, targetResource.maxCount === null ? Infinity : targetResource.maxCount));
    let currentTotalCount = resources.reduce((sum, resource) => sum + resource.count, 0);
    let potentialNewTotalCount = currentTotalCount - targetResource.count + potentialNewResourceCount;

    if (enableGlobalCounterLimit && potentialNewTotalCount > globalCounterLimit) {
        potentialNewResourceCount = globalCounterLimit - (currentTotalCount - targetResource.count);
        potentialNewResourceCount = Math.max(targetResource.minCount, Math.min(potentialNewResourceCount, targetResource.maxCount === null ? Infinity : targetResource.maxCount));
        if (potentialNewResourceCount < targetResource.count) {
            const limitMessageElement = document.getElementById('limitMessage');
            limitMessageElement.textContent = `Global counter limit (${globalCounterLimit}) reached!`;
            limitMessageElement.classList.add('show'); // Use class 'show' to display message
            setTimeout(() => limitMessageElement.classList.remove('show'), 3000); // Hide after 3 seconds
            return;
        }
    } else {
        document.getElementById('limitMessage').classList.remove('show'); // Ensure message is hidden if limit not reached
    }


    let newCount = potentialNewResourceCount;

    if ((serverClientMode === 'client' || serverClientMode === 'server') && sessionId) {
        if (!db) {
            displayStatusMessage("Firebase db is not initialized in updateCount (Server Mode).", true);
            console.warn("Firebase db is not initialized in updateCount (Server Mode).");
            return;
        }

        if (targetResource.maxGameCounterLimit !== Infinity) {
            const resourceCountsSnapshot = await db.ref(`sessions/${sessionId}/client_counts`).get();
            let currentGameResourceCount = 0;
            const clientCountsData = resourceCountsSnapshot.val();
            if (clientCountsData) {
                for (const clientFirebaseId in clientCountsData) {
                    const clientResourceCounts = clientCountsData[clientFirebaseId];
                    if (clientResourceCounts && clientResourceCounts[index] !== undefined) {
                        currentGameResourceCount += clientResourceCounts[index];
                    }
                }
            }
            let potentialNewGameResourceCount = currentGameResourceCount - targetResource.count + potentialNewResourceCount;


            if (potentialNewGameResourceCount > targetResource.maxGameCounterLimit) {
                potentialNewResourceCount = targetResource.maxGameCounterLimit - (currentGameResourceCount - targetResource.count);
                newCount = Math.max(targetResource.minCount, Math.min(potentialNewResourceCount, targetResource.maxCount === null ? Infinity : targetResource.maxCount));
                if (newCount < targetResource.count) {
                    const limitMessageElement = document.getElementById('limitMessage');
                    limitMessageElement.textContent = `Game counter limit for ${targetResource.name} (${targetResource.maxGameCounterLimit}) reached!`;
                    limitMessageElement.classList.add('show');
                    setTimeout(() => limitMessageElement.classList.remove('show'), 3000);
                    return;
                }
            }
            newCount = Math.max(targetResource.minCount, Math.min(newCount, targetResource.maxCount === null ? Infinity : targetResource.maxCount));

        }


        const firebaseRef = db.ref(`sessions/${sessionId}/client_counts/${clientId}/${index}`);

        firebaseRef.set(newCount)
            .then(() => {
                updateOtherClientsCountsDisplay(index);
            })
            .catch(error => {
                displayStatusMessage("Error syncing client resource count to server.", true);
                console.error('Error syncing client resource count to server:', error);
            });
    }
    else {
        targetResource.count = newCount;
        const resourceElement = document.querySelector(`.resource[data-resource-index="${index}"] .count-display`);
        if (resourceElement) {
            resourceElement.textContent = newCount; // Targeted DOM update
        }
        saveToLocalStorage();
    }

    hasUnsavedChanges = true;
    setHideAllExceptResources(true);
    resetInactivityTimer();
    checkGlobalCounterLimit();
}


function updateCustomIncrement(index, incrementNumber, value) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 1) {
        displayStatusMessage("Increment value must be a number greater than 0.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource[`customIncrement${incrementNumber}`] = parsedValue;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateMinCount(index, value) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
        displayStatusMessage("Minimum count must be a number.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.minCount = parsedValue;
    targetResource.count = Math.max(targetResource.minCount, targetResource.count);
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    checkGlobalCounterLimit();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateMaxCount(index, value) {
    let parsedValue = value === '' ? Infinity : parseInt(value);
    if (value !== '' && isNaN(parsedValue)) {
        displayStatusMessage("Maximum count must be a number or empty for no limit.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.maxCount = parsedValue;
    targetResource.count = Math.min(targetResource.maxCount === null ? Infinity : targetResource.maxCount, targetResource.count);
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    checkGlobalCounterLimit();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateMaxGameCounterLimit(index, value) {
    let parsedValue = value === '' ? Infinity : parseInt(value);
    if (value !== '' && isNaN(parsedValue)) {
        displayStatusMessage("Max Game Count must be a number or empty for no limit.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.maxGameCounterLimit = parsedValue;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}


function updateHideImage(index, hide) {
    const targetResource = resources[index];
    targetResource.hideImage = hide;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateKeepOneModifier(index, keep) {
    event.stopPropagation();
    const targetResource = resources[index];
    targetResource.keepOneModifier = keep;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateShowRollDice(index, show) {
    const targetResource = resources[index];
    targetResource.showRollDice = show;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateRollDiceMin(index, value) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 1) {
        displayStatusMessage("Dice minimum value must be a number greater than 0.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.rollDiceMin = parsedValue;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateRollDiceMax(index, value) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < resources[index].rollDiceMin) {
        displayStatusMessage("Dice maximum value must be a number greater than or equal to the minimum.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.rollDiceMax = parsedValue;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateRollDiceIncrement(index, value) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 1) {
        displayStatusMessage("Dice increment must be a number greater than 0.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.rollDiceIncrement = parsedValue;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateNumberOfDice(index, value) {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 1) {
        displayStatusMessage("Number of dice must be a number greater than 0.", true);
        return;
    }
    const targetResource = resources[index];
    targetResource.numberOfDice = parsedValue;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    renderResource(targetResource, index);
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateHideCounter(index, hide) {
    const targetResource = resources[index];
    targetResource.hideCounter = hide;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateEnableDiceAnimation(index, enable) {
    const targetResource = resources[index];
    targetResource.enableDiceAnimation = enable;
    hasUnsavedChanges = true;
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateUseFunnyName(index, use) {
    const targetResource = resources[index];
    targetResource.useFunnyName = use;
    hasUnsavedChanges = true;
    renderResource(targetResource, index);
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function displayRollResult(index, results, sum) {
    const targetResource = resources[index];
    const resultElement = document.getElementById(`rollResult${index}`);

    if (targetResource.useCustomDiceValues && targetResource.rollDiceCustomValues.length > 0) {
        resultElement.textContent = results.join(', ');
        resultElement.dataset.detailed = results.join(', ');
        resultElement.onclick = null;
        resultElement.style.cursor = 'default';
        resultElement.title = 'Custom dice values';
    } else {
        resultElement.textContent = results.join(', ');
        resultElement.dataset.sum = sum;
        resultElement.dataset.detailed = results.join(', ');
        resultElement.onclick = () => toggleRollResult(index);
        resultElement.style.cursor = 'pointer';
        resultElement.title = 'Click to toggle between detailed result and sum';
    }
}

function toggleRollResult(index) {
    const targetResource = resources[index];
    const resultElement = document.getElementById(`rollResult${index}`);

    if (targetResource.useCustomDiceValues && targetResource.rollDiceCustomValues.length > 0) {
        return;
    }

    if (resultElement.textContent === resultElement.dataset.sum) {
        resultElement.textContent = resultElement.dataset.detailed;
    } else {
        resultElement.textContent = resultElement.dataset.sum;
    }
}


async function rollDice(index) {
    const targetResource = resources[index];
    let results = [];
    let sum = 0;
    if (!diceSound) {
        diceSound = await createDiceRollSound();
    }
    if (!diceSound) return;

    if (targetResource.useCustomDiceValues && targetResource.rollDiceCustomValues.length > 0) {
        for (let i = 0; i < targetResource.numberOfDice; i++) {
            const result = targetResource.rollDiceCustomValues[Math.floor(Math.random() * targetResource.rollDiceCustomValues.length)];
            results.push(result);
        }
    } else {
        const min = targetResource.rollDiceMin;
        const max = targetResource.rollDiceMax;
        const increment = targetResource.rollDiceIncrement;
        const possibleValues = [];
        for (let i = min; i <= max; i += increment) {
            possibleValues.push(i);
        }
        for (let i = 0; i < targetResource.numberOfDice; i++) {
            const result = possibleValues[Math.floor(Math.random() * possibleValues.length)];
            results.push(result);
            sum += result;
        }
    }

    const resultElement = document.getElementById(`rollResult${index}`);
    const diceButton = document.querySelector(`.resource[data-resource-index="${index}"] .dice-button`);


    if (targetResource.enableDiceAnimation && !disableAllAnimations) {
        if (diceSound && diceSound.play) {
            diceSound.play();
        }

        diceButton.classList.add('rolling');
        resultElement.textContent = '...';
        setTimeout(() => {
            diceButton.classList.remove('rolling');
            displayRollResult(index, results, sum);
        }, ANIMATION_DURATION_MS);
    } else {
        displayRollResult(index, results, sum);
    }
    setHideAllExceptResources(true);
    resetInactivityTimer();
}


function changeImage(index) {
    const targetResource = resources[index];
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg, image/png, image/gif';
    fileInput.onchange = event => {
        const file = event.target.files[0];
        if (file) {
            targetResource.image = URL.createObjectURL(file);
            hasUnsavedChanges = true;
            renderResource(targetResource, index);
            saveToLocalStorage();
            if (serverClientMode === 'server' && sessionId) {
                saveConfigToServer();
            }
            displayStatusMessage("Resource image changed.");
        }
    };
    fileInput.click();
}

function removeResource(index) {
    const confirmed = confirm('Are you sure you want to remove this resource?');
    if (confirmed) {
        const resource = resources[index];
        if (resource.image && resource.image.startsWith('blob:')) {
            URL.revokeObjectURL(resource.image);
        }
        resources.splice(index, 1);
        hasUnsavedChanges = true;
        renderResources();
        saveToLocalStorage();
        checkGlobalCounterLimit();
        if (serverClientMode === 'server' && sessionId) {
            saveConfigToServer();
        }
        displayStatusMessage("Resource removed.");
    }
}

function exportData() {
    const exportData = {
        resources,
        enableGlobalCounterLimit: enableGlobalCounterLimit,
        globalCounterLimit: globalCounterLimit
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resources.json';
    a.click();
    URL.revokeObjectURL(url);
    displayStatusMessage("Data exported to resources.json!");
}

function triggerImport() {
    document.getElementById('importFile').click();
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const importedData = JSON.parse(e.target.result);
            resources = importedData.resources.map(processResourceData);
            hasUnsavedChanges = false;
            setHideAllExceptResources(true);
            renderResources();
            saveToLocalStorage();
            checkGlobalCounterLimit();
            if (importedData.enableGlobalCounterLimit !== undefined) {
                enableGlobalCounterLimit = importedData.enableGlobalCounterLimit;
                document.getElementById('enableGlobalCounterLimit').checked = enableGlobalCounterLimit;
            }
            if (importedData.globalCounterLimit !== undefined) {
                globalCounterLimit = importedData.globalCounterLimit;
                document.getElementById('globalCounterLimit').value = globalCounterLimit;
            }
            toggleGlobalCounterLimit();
            if (serverClientMode === 'server' && sessionId) {
                saveConfigToServer();
            }
            displayStatusMessage("Data imported successfully!");
        } catch (error) {
            displayStatusMessage('Error importing data. Please make sure the file is valid JSON.', true);
            console.warn('Error importing data. Please make sure the file is valid JSON.');
            console.error('Import Error:', error);
        }
    };
    reader.readAsText(file);

}

function populateExampleDropdown() {
    const select = document.getElementById('exampleSelect');
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select a Game";
    select.appendChild(defaultOption);

    const clearOption = document.createElement('option');
    clearOption.value = 'clear';
    clearOption.textContent = 'Clear';
    select.appendChild(clearOption);

    fetch(`${STATIC_ASSET_URL}/examples/example_list.json`)
        .then(response => response.json())
        .then(exampleNames => {
            exampleNames.forEach(name => {
                const option = document.createElement('option');
                option.value = `${name}.json`;
                option.textContent = name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            displayStatusMessage('Error loading example list.', true);
            console.error('Error loading example list:', error)
        });
}

function loadSelectedExample() {
    const exampleSelect = document.getElementById('exampleSelect');
    const exampleName = exampleSelect.value;

    if (exampleName !== 'clear' && (resources.length > 0 || hasUnsavedChanges)) {
        const confirmation = confirm("Loading a new game will clear your current resources. Are you sure you want to continue?");
        if (!confirmation) return;
    }

    if (exampleName === 'clear') {
        if (confirm("Are you sure you want to clear all resources? This action cannot be undone.")) {
            resources = [];
            hasUnsavedChanges = false;
            renderResources();
            saveToLocalStorage();
            checkGlobalCounterLimit();
            if (serverClientMode === 'server' && sessionId) {
                saveConfigToServer();
            }
            displayStatusMessage("Resources cleared.");
        }
    } else if (exampleName) {
        fetch(`${STATIC_ASSET_URL}/examples/${exampleName}`)
            .then(response => response.json())
            .then(data => {
                const resourcesData = Array.isArray(data) ? data : data.resources;
                resources = resourcesData.map(processResourceData);
                hasUnsavedChanges = false;
                setHideAllExceptResources(true);
                renderResources();
                saveToLocalStorage();
                checkGlobalCounterLimit();
                exampleSelect.value = "";
                if (serverClientMode === 'server' && sessionId) {
                    saveConfigToServer();
                }
                displayStatusMessage(`Example game "${exampleName.replace('.json', '')}" loaded!`);
            })
            .catch(error => {
                displayStatusMessage('Failed to load example.', true);
                console.error('Failed to load example:', error);
            });
    }
}

function refreshExamples() {
    if (!exampleDropdownPopulated) {
        populateExampleDropdown();
        exampleDropdownPopulated = true;
    }
}

function toggleGlobalSettings() {
    showSettingsGlobal = document.getElementById('showSettingsGlobal').checked;
    saveGlobalSettingsToLocalStorage();
    renderResources();
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function toggleGlobalSettingsVisibility() {
    globalSettingsVisible = !globalSettingsVisible;
    document.getElementById('globalSettingsContent').style.display = globalSettingsVisible ? 'block' : 'none';
}


function toggleHideAllExceptResources() {
    hideAllExceptResources = !hideAllExceptResources;
    updateVisibility();
    saveToLocalStorage();
    document.getElementById('hideAllArrow').textContent = hideAllExceptResources ? '▼' : '▲';
}

function setHideAllExceptResources(value) {
    hideAllExceptResources = value;
    updateVisibility();
    saveToLocalStorage();
    document.getElementById('hideAllArrow').textContent = value ? '▼' : '▲';
}

function updateVisibility() {
    document.getElementById('controlsContainer').style.display = hideAllExceptResources ? 'none' : 'block';
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        setHideAllExceptResources(false);
    }, INACTIVITY_TIMEOUT_MS);
}

function toggleAllAnimations() {
    disableAllAnimations = document.getElementById('disableAllAnimations').checked;
    saveGlobalSettingsToLocalStorage();
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}

function updateGlobalCounterLimit() {
    const parsedValue = parseInt(document.getElementById('globalCounterLimit').value);
    if (isNaN(parsedValue) || parsedValue < 0) {
        displayStatusMessage("Global counter limit must be a non-negative number.", true);
        document.getElementById('globalCounterLimit').value = globalCounterLimit; // Revert to previous valid value
        return;
    }
    globalCounterLimit = parsedValue;
    checkGlobalCounterLimit();
}

function toggleGlobalCounterLimit() {
    enableGlobalCounterLimit = document.getElementById('enableGlobalCounterLimit').checked;
    document.getElementById('globalCounterLimitContainer').style.display = enableGlobalCounterLimit ? 'block' : 'none';
    checkGlobalCounterLimit();
}

function toggleGlobalHideFunnyNames() {
    globalHideFunnyNames = document.getElementById('globalHideFunnyNames').checked;
    saveGlobalSettingsToLocalStorage();

    if (globalHideFunnyNames) {
        resources.forEach((resource, index) => {
            previousFunnyNameStates[index] = resource.useFunnyName;
            resource.useFunnyName = false;
        });
   } else {
        resources.forEach((resource, index) => {
            resource.useFunnyName = previousFunnyNameStates[index] === true;
        });
    }

    renderResources();
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}
function toggleGlobalHideAllImages() {
    globalHideAllImages = document.getElementById('globalHideAllImages').checked;
    saveGlobalSettingsToLocalStorage();
    renderResources();
    saveToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}


function checkGlobalCounterLimit() {
    if (!enableGlobalCounterLimit) {
        document.getElementById('limitMessage').classList.remove('show');
        return;
    }

    const totalCount = resources.reduce((sum, resource) => sum + resource.count, 0);
    const limitMessageElement = document.getElementById('limitMessage');
    if (totalCount > globalCounterLimit) {
        limitMessageElement.textContent = `Global counter limit (${globalCounterLimit}) exceeded!`;
        limitMessageElement.classList.add('show');
    } else {
        limitMessageElement.classList.remove('show');
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const darkModeEnabled = document.body.classList.contains('dark-mode');
    localStorage.setItem(LOCAL_STORAGE_DARK_MODE_KEY, darkModeEnabled.toString());
    saveGlobalSettingsToLocalStorage();
    if (serverClientMode === 'server' && sessionId) {
        saveConfigToServer();
    }
}


// ====== Firebase Realtime Database Listeners ======
function setupServerClientListeners() {
    if (!sessionId || serverClientMode !== 'server' || serverListeners.clientListener) return;

    const clientsRef = db.ref(`sessions/${sessionId}/clients`);
    serverListeners.clientListener = clientsRef.on('child_added', (snapshot) => {
        const newClientId = snapshot.key;
        const clientData = snapshot.val();
        const connectedClientName = clientData.clientName;
        clientsInSession[newClientId] = connectedClientName;
        if (!globalHideFunnyNames) {
            funnyNamesInUseSession.add(connectedClientName); // Track funny name in session
        }
        console.log(`Server - Client connected: ${connectedClientName} (${newClientId})`);
        resources.forEach((resource, index) => updateOtherClientsCountsDisplay(index));
    });

    serverListeners.removeClientListener = clientsRef.on('child_removed', (snapshot) => {
        const removedClientId = snapshot.key;
        const removedClientData = snapshot.val();
        const removedClientName = removedClientData ? removedClientData.clientName : 'Unknown Client';
        delete clientsInSession[removedClientId];
        if (!globalHideFunnyNames) {
            funnyNamesInUseSession.delete(removedClientName); // Remove name from session-used names
        }
        console.log(`Server - Client disconnected: ${removedClientId}`);
        resources.forEach((resource, index) => updateOtherClientsCountsDisplay(index));
    });

    clientsRef.once('value', (snapshot) => {
        const initialClientsData = snapshot.val();
        if (initialClientsData) {
            for (const clientId in initialClientsData) {
                clientsInSession[clientId] = initialClientsData[clientId].clientName;
            }
        }
    });
}

function setupClientSideClientListeners() {
    if (!sessionId || serverClientMode !== 'client' || clientListeners.clientListListener) return;

    const clientsRef = db.ref(`sessions/${sessionId}/clients`);

    clientListeners.clientListListener = clientsRef.on('value', (snapshot) => {
        const clientsData = snapshot.val();
        clientsInSession = {};
        if (clientsData) {
            for (const clientIdFB in clientsData) {
                clientsInSession[clientIdFB] = clientsData[clientIdFB].clientName;
            }
        }
         resources.forEach((resource, index) => updateOtherClientsCountsDisplay(index));

    }, (error) => {
        displayStatusMessage("Error fetching client list for client-side clientsInSession.", true);
        console.error("Error fetching client list for client-side clientsInSession:", error);
    });
}

function cleanupFirebaseListeners() {
    if (serverListeners.clientListener) {
        db.ref(`sessions/${sessionId}/clients`).off('child_added', serverListeners.clientListener);
        serverListeners.clientListener = null;
    }
    if (serverListeners.removeClientListener) {
        db.ref(`sessions/${sessionId}/clients`).off('child_removed', serverListeners.removeClientListener);
        serverListeners.removeClientListener = null;
    }
    if (serverListeners.resourceListener) {
        db.ref(`sessions/${sessionId}/client_counts`).off('value', serverListeners.resourceListener);
        serverListeners.resourceListener = null;
    }

    if (clientListeners.configListener) {
        db.ref(`sessions/${sessionId}/config`).off('value', clientListeners.configListener);
        clientListeners.configListener = null;
    }
    if (clientListeners.countsListener) {
        db.ref(`sessions/${sessionId}/client_counts`).off('value', clientListeners.countsListener);
        clientListeners.countsListener = null;
    }
    cleanupClientSideClientListeners();
    funnyNamesInUseSession.clear(); // Clear session-used funny names on disconnect
}

function cleanupClientSideClientListeners() {
    if (clientListeners.clientListListener) {
        db.ref(`sessions/${sessionId}/clients`).off('value', clientListeners.clientListListener);
        clientListeners.clientListListener = null;
    }
}

function saveConfigToServer() {
    if (!sessionId || serverClientMode !== 'server') return;

    const firebaseResources = resources.map(resource => {
        const resourceData = {
            name: resource.name,
            image: resource.image,
            count: resource.count,
            customIncrement1: resource.customIncrement1,
            customIncrement2: resource.customIncrement2,
            customIncrement3: resource.customIncrement3,
            minCount: resource.minCount,
            maxCount: resource.maxCount === Infinity ? null : resource.maxCount,
            maxGameCounterLimit: resource.maxGameCounterLimit === Infinity ? null : resource.maxGameCounterLimit, // Save maxGameCounterLimit to server
            hideImage: resource.hideImage,
            hideCounter: resource.hideCounter,
            keepOneModifier: resource.keepOneModifier,
            showRollDice: resource.showRollDice,
            rollDiceMin: resource.rollDiceMin,
            rollDiceMax: resource.rollDiceMax,
            rollDiceIncrement: resource.rollDiceIncrement,
            enableDiceAnimation: resource.enableDiceAnimation,
            numberOfDice: resource.numberOfDice,
            rollDiceCustomValues: resource.rollDiceCustomValues,
            useCustomDiceValues: resource.useCustomDiceValues,
            useFunnyName: resource.useFunnyName,
            funnyName: resource.funnyName,
            previousUseFunnyName: resource.previousUseFunnyName,
        };
        if (resource.firebaseKey) {
            resourceData.firebaseKey = resource.firebaseKey;
        }
        return resourceData;
    });

    db.ref(`sessions/${sessionId}/config`).set(firebaseResources);
    db.ref(`sessions/${sessionId}/gameSettings`).set({
        enableGlobalCounterLimit: enableGlobalCounterLimit,
        globalCounterLimit: globalCounterLimit
    })
        .then(() => {
            configSavedToServer = true;
            initializeServerCounts();
            displayStatusMessage("Configuration saved to server.");
        })
        .catch(error => {
            displayStatusMessage('Error saving configuration to server.', true);
            console.error('Error saving configuration to server:', error);
        });
}

function initializeServerCounts() {
    if (!sessionId || serverClientMode !== 'server') return;

    const serverCounts = {};
    resources.forEach((resource, index) => {
        serverCounts[index] = resource.count;
    });

    db.ref(`sessions/${sessionId}/client_counts/${clientId}`).set(serverCounts)
        .then(() => console.log("Server's initial counts initialized in client_counts."))
        .catch(error => console.error("Error initializing server counts:", error));
}

function loadConfigFromServer() {
    if (!sessionId) {
        displayStatusMessage('No Session ID provided to load configuration from server.', true);
        console.warn('No Session ID provided to load configuration from server.');
        return;
    }
    if (clientListeners.configListener) {
        db.ref(`sessions/${sessionId}/config`).off('value', clientListeners.configListener)
    }
    clientListeners.configListener = db.ref(`sessions/${sessionId}/config`).once('value', snapshot => {
        const serverConfig = snapshot.val();
        if (serverConfig) {
            resources = Object.values(serverConfig).map(processResourceData);
            renderResources();

            if (initialLoad && (serverClientMode === 'client' || serverClientMode === 'server')) {
                const clientCounts = {};
                resources.forEach((resource, index) => {
                    clientCounts[index] = resource.count;
                });
                db.ref(`sessions/${sessionId}/client_counts/${clientId}`).set(clientCounts)
                    .then(() => {
                        setupClientResourceListeners();
                        initialLoad = false;
                        displayStatusMessage("Configuration loaded from server.");
                    })
                    .catch(error => {
                        displayStatusMessage("Error initializing client counts.", true);
                        console.error("Error initializing client counts:", error)
                    });
            }


        } else {
            resources = [];
            renderResources();
            displayStatusMessage('No configuration found for this Session ID on the server.', true);
            console.warn('No configuration found for this Session ID on the server.');
            console.log('No configuration found on server.');
        }
    }, error => {
        displayStatusMessage('Error loading configuration from server.', true);
        console.error('Error loading configuration from server:', error);
        console.warn('Failed to load configuration from server.');
    });

     db.ref(`sessions/${sessionId}/gameSettings`).once('value', snapshot => {
        const gameSettings = snapshot.val();
        if (gameSettings) {
            enableGlobalCounterLimit = gameSettings.enableGlobalCounterLimit === undefined ? false : gameSettings.enableGlobalCounterLimit;
            globalCounterLimit = gameSettings.globalCounterLimit === undefined ? 100 : gameSettings.globalCounterLimit;
            document.getElementById('enableGlobalCounterLimit').checked = enableGlobalCounterLimit;
            document.getElementById('globalCounterLimit').value = globalCounterLimit;
            toggleGlobalCounterLimit();
            toggleGlobalHideAllImages();
        } else {
            console.log('No game settings found on server, using defaults.');
        }
    });
}

function setupServerResourceListeners() {
    if (!sessionId || serverClientMode !== 'server' || serverListeners.resourceListener) return;

    serverListeners.resourceListener = db.ref(`sessions/${sessionId}/client_counts`).on('value', (snapshot) => {
        const countsData = snapshot.val();
        if (countsData) {
            otherClientsResourceCounts = {};
            for (const clientFirebaseId in countsData) {
                if (clientFirebaseId !== clientId) {
                    otherClientsResourceCounts[clientFirebaseId] = countsData[clientFirebaseId];
                }
            }
            resources.forEach((resource, index) => {
                updateOtherClientsCountsDisplay(index);
            });
        }
    });
}

function setupClientResourceListeners() {
    if (!sessionId || !['client', 'server'].includes(serverClientMode) || clientListeners.countsListener) {
        return;
    }


    clientListeners.countsListener = db.ref(`sessions/${sessionId}/client_counts`).on('value', (snapshot) => {
        const countsData = snapshot.val();
        if (countsData) {
            otherClientsResourceCounts = {};
            for (const clientFirebaseId in countsData) {
                if (clientFirebaseId !== clientId) {
                    otherClientsResourceCounts[clientFirebaseId] = countsData[clientFirebaseId];
                }
            }
            for (const resourceIndex in resources) {
                if (countsData[clientId] && countsData[clientId][resourceIndex] !== undefined) {
                    const countValue = countsData[clientId][resourceIndex];
                    resources[resourceIndex].count = countValue;
                }
                updateOtherClientsCountsDisplay(resourceIndex);
            }
            renderResources();
        } else {
            otherClientsResourceCounts = {};
            resources.forEach((resource, index) => updateOtherClientsCountsDisplay(index));
            renderResources();
        }
    }, (error) => {
        displayStatusMessage("Error in client counts listener.", true);
        console.error("Error in client counts listener:", error);
    });
}

function updateOtherClientsCountsDisplay(resourceIndex) {
    const displayElement = document.getElementById(`otherClientsCounts${resourceIndex}`);
    if (!displayElement) return;

    let displayHTML = '';
    let hasCounts = false;

    for (const clientFirebaseId in otherClientsResourceCounts) {
        const clientCounts = otherClientsResourceCounts[clientFirebaseId];
         if (clientCounts && clientCounts[resourceIndex] !== undefined) {
            const currentClientName = clientsInSession[clientFirebaseId] || 'Unknown Client';
            displayHTML += `<p>${currentClientName}: ${clientCounts[resourceIndex]}</p>`;
            hasCounts = true;
        }
    }

    if (hasCounts) {
        displayElement.innerHTML = displayHTML;
        displayElement.style.display = 'block';
    } else {
        displayElement.innerHTML = '';
        displayElement.style.display = 'none';
    }
}

function handleServerClientModeChange() {
    serverClientMode = document.getElementById('serverClientMode').value;
    updateServerClientUI();
    saveToLocalStorage();
    cleanupFirebaseListeners();
    sessionId = null;
    initialLoad = true;
    configSavedToServer = false;
    document.getElementById('serverIDDisplayContainer').style.display = 'none';
    document.getElementById('exportSdkConfigButton').style.display = 'none';
    document.getElementById('newSessionContainer').style.display = 'block';
    clientsInSession = {};
    funnyNamesInUseSession.clear(); // Clear session-used funny names when mode changes
    cleanupClientSideClientListeners();
    otherClientsResourceCounts = {};
    resources.forEach((resource, index) => updateOtherClientsCountsDisplay(index));

    if (serverClientMode === 'client') {
        connectClientUI();
        setupClientResourceListeners();
        setupClientSideClientListeners();
    } else if (serverClientMode === 'server') {
        setupServerResourceListeners();
    } else {
        serverClientMode = 'local';
        updateServerClientUI();
        loadFromLocalStorage();
    }
    updateServerClientUI();
}

function updateServerClientUI() {
    const sessionIdContainer = document.getElementById('sessionIdContainer');
    const newSessionContainer = document.getElementById('newSessionContainer');
    const serverClientButton = document.getElementById('serverClientButton');
    const serverIDDisplayContainer = document.getElementById('serverIDDisplayContainer');
    const serverClientModeSelect = document.getElementById('serverClientMode');
    const importSdkConfigButton = document.getElementById('importSdkConfigButton');
    const importSdkConfigFileButton = document.getElementById('importSdkConfigFileButton');
    const exportSdkConfigButton = document.getElementById('exportSdkConfigButton');
    const statusWindowContainer = document.getElementById('statusWindowContainer');
    const qrcodeCanvasContainer = document.getElementById('qrcodeCanvas');

    if (serverClientMode === 'client') {
        sessionIdContainer.style.display = 'block';
        newSessionContainer.style.display = 'none';
        serverIDDisplayContainer.style.display = 'none';
        qrcodeCanvasContainer.style.display = 'none';
        exportSdkConfigButton.style.display = 'none';
        serverClientButton.textContent = '👤';
        serverClientModeSelect.style.display = 'inline-block';
        statusWindowContainer.style.display = 'block';
        if (importSdkConfigButton) importSdkConfigButton.style.display = 'inline-block';
        if (importSdkConfigFileButton) importSdkConfigFileButton.style.display = 'inline-block';
    } else if (serverClientMode === 'server') {
        sessionIdContainer.style.display = 'none';
        newSessionContainer.style.display = (sessionId ? 'none' : 'block');
        serverIDDisplayContainer.style.display = (sessionId ? 'block' : 'none');
        qrcodeCanvasContainer.style.display = (sessionId ? 'block' : 'none');
        exportSdkConfigButton.style.display = (sessionId ? 'inline-block' : 'none');
        serverClientButton.textContent = '🌐';
        serverClientModeSelect.style.display = 'inline-block';
        statusWindowContainer.style.display = 'block';
        if (importSdkConfigButton) importSdkConfigButton.style.display = 'none';
        if (importSdkConfigFileButton) importSdkConfigFileButton.style.display = 'none';
        if (sessionId) {
            document.getElementById('serverIDDisplay').value = sessionId;
            generateQRCode();
        }
    } else {
        sessionIdContainer.style.display = 'block';
        newSessionContainer.style.display = 'none';
        serverIDDisplayContainer.style.display = 'none';
        qrcodeCanvasContainer.style.display = 'none';
        exportSdkConfigButton.style.display = 'none';
        serverClientButton.textContent = '👤';
        serverClientModeSelect.style.display = 'inline-block';
        statusWindowContainer.style.display = 'none';
        if (importSdkConfigButton) importSdkConfigButton.style.display = 'none';
        if (importSdkConfigFileButton) importSdkConfigFileButton.style.display = 'none';
    }
}

function connectClientUI() {
    document.getElementById('sessionIdContainer').style.display = 'block';
    document.getElementById('newSessionContainer').style.display = 'none';
}

function triggerImportSdkConfig() {
    document.getElementById('importSdkConfigFile').click();
}

function importSdkConfigAndJoin(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const sdkConfig = JSON.parse(e.target.result);
            if (sdkConfig && sdkConfig.firebaseConfig && sdkConfig.sessionDetails && sdkConfig.sessionDetails.sessionId) {
                document.getElementById('apiKey').value = sdkConfig.firebaseConfig.apiKey || '';
                document.getElementById('authDomain').value = sdkConfig.firebaseConfig.authDomain || '';
                document.getElementById('databaseURL').value = sdkConfig.firebaseConfig.databaseURL || '';
                document.getElementById('projectId').value = sdkConfig.firebaseConfig.projectId || '';
                document.getElementById('storageBucket').value = sdkConfig.firebaseConfig.storageBucket || '';
                document.getElementById('messagingSenderId').value = sdkConfig.firebaseConfig.messagingSenderId || '';
                document.getElementById('appId').value = sdkConfig.firebaseConfig.appId || '';

                if (initializeFirebaseWithUserInput()) {
                    console.log("Firebase re-initialized after SDK config import.");
                    document.getElementById('sessionId').value = sdkConfig.sessionDetails.sessionId;
                    connectClient();
                } else {
                    displayStatusMessage("Firebase Initialization Failed, cannot join session.", true);
                    console.warn("Firebase Initialization Failed, cannot join session.");
                }
            } else {
                displayStatusMessage("Invalid SDK configuration file.", true);
                console.warn("Invalid SDK configuration file.");
            }
        } catch (error) {
            displayStatusMessage("Error importing SDK configuration.", true);
            console.warn("Error importing SDK configuration.");
            console.error("SDK config import error:", error);
        }
    };
    reader.onerror = function(error) {
        displayStatusMessage("Error reading the SDK configuration file.", true);
        console.warn("Error reading the SDK configuration file.");
        console.error("File read error:", error);
    };
    reader.readAsText(file);
}

function importSdkConfigFromURL(configParam) {

    try {
        const sdkConfig = JSON.parse(decodeURIComponent(configParam));


        if (sdkConfig && sdkConfig.firebaseConfig && sdkConfig.sessionDetails && sdkConfig.sessionDetails.sessionId) {
            document.getElementById('apiKey').value = sdkConfig.firebaseConfig.apiKey || '';
            document.getElementById('authDomain').value = sdkConfig.firebaseConfig.authDomain || '';
            document.getElementById('databaseURL').value = sdkConfig.firebaseConfig.databaseURL || '';
            document.getElementById('projectId').value = sdkConfig.firebaseConfig.projectId || '';
            document.getElementById('storageBucket').value = sdkConfig.firebaseConfig.storageBucket || '';
            document.getElementById('messagingSenderId').value = sdkConfig.firebaseConfig.messagingSenderId || '';
            document.getElementById('appId').value = sdkConfig.firebaseConfig.appId || '';

            if (initializeFirebaseWithUserInput()) {
                console.log("Firebase re-initialized from URL config.");
                document.getElementById('sessionId').value = sdkConfig.sessionDetails.sessionId;
                connectClient();
            } else {
                displayStatusMessage("Firebase Initialization Failed from URL config, cannot join session.", true);
                console.warn("Firebase Initialization Failed from URL config, cannot join session.");
            }
        } else {
            displayStatusMessage("Invalid SDK configuration in URL.", true);
            console.warn("Invalid SDK configuration in URL.");
        }
    } catch (error) {
        displayStatusMessage("Error importing SDK configuration from URL.", true);
        console.warn("Error importing SDK configuration from URL:", error);
        console.error("SDK config URL import error:", error);
    }
}


// ====== Initialization and Setup ======
window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
        event.returnValue = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    refreshExamples();
    loadFromLocalStorage();
    resetInactivityTimer();

    loadGlobalSettingsFromLocalStorage();
    toggleGlobalCounterLimit();
    loadFirebaseConfigFromCache();

    if (localStorage.getItem(LOCAL_STORAGE_DARK_MODE_KEY) === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('darkModeToggle').checked = false;
    }

    const serverClientModeSelect = document.getElementById('serverClientMode');
    serverClientModeSelect.addEventListener('change', handleServerClientModeChange);
    handleServerClientModeChange();
    updateServerClientUI();
    attachEventListeners();
    toggleFirebaseConfigVisibility();
    document.getElementById('showFirebaseFieldsToggle').checked = false;
    toggleFirebaseConfigVisibility();

    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    if (configParam) {
        importSdkConfigFromURL(configParam);
    }
});

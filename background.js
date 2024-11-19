let ctrlPressed = false;
let shiftPressed = false;
let activeTabId = null;
let currentWindowId = null;
let openTabs = [];
let tabPointer = 0;

function loadWindowTabs() {
    chrome.windows.getCurrent({populate: true}, (window) => {
        currentWindowId = window.id;
        openTabs = window.tabs.map(tab => {
            return {
                id: tab.id,
                title: tab.title,
                url: tab.url
            }
        });
        console.log(`Tabs loaded for window ${currentWindowId}: `, openTabs);
    });
}

function setActiveTab(tabId) {
    if(tabId) chrome.tabs.update(tabId, { active: true });
}

chrome.runtime.onInstalled.addListener(() => {
    loadWindowTabs();    
    console.log("Extension installed with tabs: ", openTabs);
});

chrome.runtime.onStartup.addListener(() => {
    loadWindowTabs();    
    console.log("Browser started with tabs: ", openTabs);
});

chrome.tabs.onCreated.addListener((tab) => {
    if(tab.windowId === currentWindowId) {
        console.log("Tab created: ", tab);
        openTabs.unshift({
            id: tab.id,
            title: tab.title,
            url: tab.url
        })
    }
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onRemoved.addListener((tabId) => {
    openTabs = openTabs.filter(tab => tab.id !== tabId);
    console.log("Tab removed: ", tabId);
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
    if(windowId === currentWindowId) {
        activeTabId = tabId;
        // check if activeTabId is in openTabs and is the first
        const activeTab = openTabs.find(tab => tab.id === activeTabId);
        if(activeTab) {
            const index = openTabs.indexOf(activeTab);
            if(index !== 0) {
                openTabs.splice(index, 1);
                openTabs.unshift(activeTab);
            }
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(tab.windowId === currentWindowId) {
        const tabToUpdate = openTabs.find(tab => tab.id === tabId);
        if(tabToUpdate) {
            tabToUpdate.title = tab.title;
            tabToUpdate.url = tab.url;
        } else {
            openTabs.push({
                id: tab.id,
                title: tab.title,
                url: tab.url
            });
        }
        console.log("Tab updated: ", tabToUpdate);
    }
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    if(detachInfo.oldWindowId === currentWindowId) {
        openTabs = openTabs.filter(tab => tab.id !== tabId);
        console.log("Tab detached: ", tabId);
        console.log("Open tabs: ", openTabs);
    }
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    if(attachInfo.newWindowId === currentWindowId) {
        chrome.tabs.get(tabId, (tab) => {
            openTabs.unshift({
                id: tab.id,
                title: tab.title,
                url: tab.url
            });
            console.log("Tab attached: ", tab);
            console.log("Open tabs: ", openTabs);
        });
    }
});

chrome.commands.onCommand.addListener((command) => {
    console.log("Command received: ", command);
    if(command === "most_recent") {
        most_recent_tab = openTabs[1];
        if(most_recent_tab) setActiveTab(most_recent_tab.id);
    } else if(command === "cycle_tabs") {
        chrome.action.openPopup();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "get_tabs") {
        console.log(message)
        sendResponse(openTabs);
    } else if (message.action === "set_active_tab") {
        setActiveTab(message.tabId);
        sendResponse({ success: true });
    } else if (message.action === "received_tabs") {
        console.log("Received tabs: ", message.tabs);
        sendResponse({ success: true });
    }

    return true;
});
let ctrlPressed = false;
let shiftPressed = false;
let activeTabId = null;
let currentWindowId = null;
let openTabs = [];
let tabPointer = 0;

<<<<<<< Updated upstream
function loadTabsForCurrentWindow() {
    // chrome.tabs.query({ currentWindow: true }, (tabs) => {
=======
function loadWindowTabs() {
    // chrome.tabs.query({}, (tabs) => {
>>>>>>> Stashed changes
    //     const activeTab = tabs.find(tab => tab.active);
    //     if(activeTab) {
    //         openTabs = [activeTab, ...tabs.filter(tab => tab.id !== activeTab.id)]
    //                     .map(tab => {
    //                         return {
    //                             id: tab.id,
    //                             title: tab.title,
    //                             url: tab.url
    //                         }
    //                     });
    //     }
    //     else {
    //         openTabs = tabs.map(tab => {
    //             return {
    //                 id: tab.id,
    //                 title: tab.title,
    //                 url: tab.url
    //             }
    //         });
    //     }
    //     console.log("Tabs loaded", openTabs);
    // });
<<<<<<< Updated upstream

    chrome.windows.getCurrent({populate: true}, (window) => {
        currentWindowId = currentWindow.id;
=======
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
>>>>>>> Stashed changes
    });
}

function setActiveTab(tabId) {
    if(tabId) chrome.tabs.update(tabId, { active: true });
}

chrome.runtime.onInstalled.addListener(() => {
<<<<<<< Updated upstream
    loadTabsForCurrentWindow();    
=======
    loadWindowTabs();    
>>>>>>> Stashed changes
    console.log("Extension installed with tabs: ", openTabs);
});

chrome.runtime.onStartup.addListener(() => {
<<<<<<< Updated upstream
    loadTabsForCurrentWindow();    
=======
    loadWindowTabs();    
>>>>>>> Stashed changes
    console.log("Browser started with tabs: ", openTabs);
});

chrome.tabs.onCreated.addListener((tab) => {
<<<<<<< Updated upstream
    chrome.windows.getCurrent((window) => {
        if(tab.windowId === window.id) {
            openTabs.unshift({
                id: tab.id,
                title: tab.title,
                url: tab.url
            });
            console.log(`Tab ${tab.id} created in window ${window.id}`);
        }
    });
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    chrome.tabs.get(tabId, (tab) => {
        if(tab.windowId === attachInfo.newWindowId) {
            openTabs.unshift({
                id: tab.id,
                title: tab.title,
                url: tab.url
            });
        }
    });
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    openTabs = openTabs.filter(tab => tab.id !== tabId);
    console.log("Tab detached: ", tabId);
=======
    if(tab.windowId === currentWindowId) {
        console.log("Tab created: ", tab);
        openTabs.unshift({
            id: tab.id,
            title: tab.title,
            url: tab.url
        })
    }
>>>>>>> Stashed changes
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onRemoved.addListener((tabId) => {
    openTabs = openTabs.filter(tab => tab.id !== tabId);
    console.log("Tab removed: ", tabId);
    console.log("Open tabs: ", openTabs);
});

<<<<<<< Updated upstream
chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log("Activated tab: ", activeTabId);
    console.log("Open tabs: ", openTabs);
=======
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
>>>>>>> Stashed changes
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

chrome.commands.onCommand.addListener((command) => {
    console.log("Command received: ", command);
    if(command === "most_recent") {
        most_recent_tab = openTabs[1];
        if(most_recent_tab) setActiveTab(most_recent_tab.id);
    } else if(command === "cycle_tabs") {
        chrome.action.openPopup();
    }
});

<<<<<<< Updated upstream
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
=======
chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "get_tabs") {
        console.log(message)
        return openTabs;
    } else if (message.action === "set_active_tab" && message.tabId) {
        chrome.tabs.update(message.tabId, { active: true });
    } else if (message.action === "recieved_tabs") {
        console.log("Recieved tab: ", message);
>>>>>>> Stashed changes
    }

    return true;
});
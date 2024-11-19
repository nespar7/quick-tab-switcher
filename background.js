let ctrlPressed = false;
let shiftPressed = false;
let activeTabId = null;
let currentWindowId = null;
let openTabs = [];
let tabPointer = 0;

function loadTabsForCurrentWindow() {
    // chrome.tabs.query({ currentWindow: true }, (tabs) => {
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

    chrome.windows.getCurrent({populate: true}, (window) => {
        currentWindowId = currentWindow.id;
    });
}

function setActiveTab(tabId) {
    if(tabId) chrome.tabs.update(tabId, { active: true });
}

chrome.runtime.onInstalled.addListener(() => {
    loadTabsForCurrentWindow();    
    console.log("Extension installed with tabs: ", openTabs);
});

chrome.runtime.onStartup.addListener(() => {
    loadTabsForCurrentWindow();    
    console.log("Browser started with tabs: ", openTabs);
});

chrome.tabs.onCreated.addListener((tab) => {
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
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onRemoved.addListener((tabId) => {
    openTabs = openTabs.filter(tab => tab.id !== tabId);
    console.log("Tab removed: ", tabId);
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    console.log("Activated tab: ", activeTabId);
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const tabToUpdate = openTabs.find(tab => tab.id === tabId);
    if(tabToUpdate) {
        tabToUpdate.title = tab.title;
        tabToUpdate.url = tab.url;
    }
    
    console.log("Tab updated: ", tabToUpdate);
    console.log("Open tabs: ", openTabs);
});

chrome.commands.onCommand.addListener((command) => {
    console.log("Command received: ", command);
    if(command === "most_recent") {
        most_recent_tab = openTabs[1];
        chrome.tabs.update(most_recent_tab.id, { active: true });
    } else if(command === "list_tabs") {
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
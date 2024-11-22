let activeTabId = null;
let currentWindowId = null;
let windowTabs = {};
// status can be "clear" or "marked" for detachment
let windowStatus = {};

function loadWindowTabs(windowId) {
    chrome.windows.get(windowId, {populate: true}, (window) => {
        if(window) {
            windowTabs[windowId] = window.tabs.map(tab => ({
                    id: tab.id,
                    title: tab.title,
                    url: tab.url
                }));
            const activeTab = window.tabs.find(tab => tab.active);
            if(activeTab) {
                const index = windowTabs[window.id].findIndex(tab => tab.id === activeTab.id);
                if(index !== 0) {
                    windowTabs[window.id].splice(index, 1);
                    windowTabs[window.id].unshift({
                        id: activeTab.id,
                        title: activeTab.title,
                        url: activeTab.url
                    });
                }
            }
        }
    });
}

function setActiveTab(tabId) {
    if(tabId) chrome.tabs.update(tabId, { active: true });
}

function initialiseAllWindows() {
    chrome.windows.getAll({populate: true}, (windows) => {
        windows.forEach(window => {
            windowTabs[window.id] = window.tabs.map(tab => ({
                id: tab.id,
                title: tab.title,
                url: tab.url
            }));
            const activeTab = window.tabs.find(tab => tab.active);
            if(activeTab) {
                const index = windowTabs[window.id].findIndex(tab => tab.id === activeTab.id);
                if(index !== 0) {
                    windowTabs[window.id].splice(index, 1);
                    windowTabs[window.id].unshift({
                        id: activeTab.id,
                        title: activeTab.title,
                        url: activeTab.url
                    });
                }
            }
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    initialiseAllWindows();
});

chrome.runtime.onStartup.addListener(() => {
    initialiseAllWindows();
});

chrome.tabs.onCreated.addListener((tab) => {
    if(!windowTabs[tab.windowId]) {
        if(windowStatus[tab.windowId] && windowStatus[tab.windowId] === "marked") {
            windowStatus[tab.windowId] = "clear";
            return;
        }
        loadWindowTabs(tab.windowId);
    } else {
        windowTabs[tab.windowId].unshift({
            id: tab.id,
            title: tab.title,
            url: tab.url
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    const { windowId } = removeInfo;
    if(windowTabs[windowId]) {
        windowTabs[windowId] = windowTabs[windowId].filter(tab => tab.id !== tabId);
    }
});

chrome.tabs.onActivated.addListener(({tabId, windowId}) => {
    activeTabId = tabId;
    if(windowTabs[windowId]) {
        const activeTab = windowTabs[windowId].find(tab => tab.id === activeTabId);
        if(activeTab) {
            const index = windowTabs[windowId].indexOf(activeTab);
            if(index !== 0) {
                windowTabs[windowId].splice(index, 1);
                windowTabs[windowId].unshift(activeTab);
            }
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const { windowId } = tab;
    if(windowTabs[windowId]) {
        const tabToUpdate = windowTabs[windowId].find(tab => tab.id === tabId);
        if(tabToUpdate) {
            tabToUpdate.title = tab.title;
            tabToUpdate.url = tab.url;
        }
    }
});

chrome.windows.onRemoved.addListener((windowId) => {
    delete windowTabs[windowId];
    delete windowStatus[windowId];
});

chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // No active window, possibly the user switched to another app
        return;
    }

    if(!windowTabs[windowId]) loadWindowTabs(windowId);
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    const { oldWindowId } = detachInfo;
    if(windowTabs[oldWindowId]) {
        windowTabs[oldWindowId] = windowTabs[oldWindowId].filter(tab => tab.id !== tabId);
        if(windowTabs[oldWindowId].length === 0) {
            delete windowTabs[oldWindowId];
            windowStatus[oldWindowId] = "marked";
        }
    }
});

chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
    const { newWindowId } = attachInfo;

    chrome.tabs.get(tabId, (tab) => {
        if(!windowTabs[newWindowId]) {
            loadWindowTabs(newWindowId);
        } else {
            windowTabs[newWindowId].unshift({
                id: tab.id,
                title: tab.title,
                url: tab.url
            });
        }
    });
});

chrome.commands.onCommand.addListener((command) => {
    if(command === "most_recent") {
        chrome.windows.getCurrent({populate: true}, (window) => {
            const { id } = window;
            const tabs = windowTabs[id] || [];
            const mostRecentTab = tabs[1];
            if(mostRecentTab) {
                setActiveTab(mostRecentTab.id);
            }
        });
    } else if(command === "cycle_tabs") {
        chrome.action.openPopup();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === "get_tabs") {
        const tabs = windowTabs[message.windowId] || [];
        sendResponse(tabs);
    } else if (message.action === "set_active_tab") {
        setActiveTab(message.tabId);
        sendResponse({ success: true });
    } else if (message.action === "close_tab") {
        chrome.tabs.remove(message.tabId, () => {
            sendResponse({ success: true });
        });
    }

    return true;
});
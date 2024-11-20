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
            console.log(`Tabs loaded for window ${window.id}: `, windowTabs[windowId]);
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
    console.log("Initialised all windows: ", windowTabs);
}

chrome.runtime.onInstalled.addListener(() => {
    initialiseAllWindows();
    console.log("Browser installed with tabs: ", windowTabs);
});

chrome.runtime.onStartup.addListener(() => {
    initialiseAllWindows();
    console.log("Browser started with tabs: ", windowTabs);
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
    console.log(`Tab created in window ${tab.windowId}: `, tab);
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    const { windowId } = removeInfo;
    if(windowTabs[windowId]) {
        windowTabs[windowId] = windowTabs[windowId].filter(tab => tab.id !== tabId);
        console.log(`Tab removed from window ${windowId}: `, tabId);
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
            console.log(`Tab updated in window ${windowId}: `, tabToUpdate);
        }
    }
});

chrome.windows.onRemoved.addListener((windowId) => {
    delete windowTabs[windowId];
    console.log(`Window removed: ${windowId}`);
});

chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
    const { oldWindowId } = detachInfo;
    if(windowTabs[oldWindowId]) {
        windowTabs[oldWindowId] = windowTabs[oldWindowId].filter(tab => tab.id !== tabId);
        if(windowTabs[oldWindowId].length === 0) {
            delete windowTabs[oldWindowId];
            windowStatus[oldWindowId] = "marked";
        }
        console.log(`Tab detached from window ${oldWindowId}: `, tabId);
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
        console.log(`Tab attached to window ${newWindowId}: `, tab);
    });
});

chrome.commands.onCommand.addListener((command) => {
    console.log("Command received: ", command);
    if(command === "most_recent") {
        chrome.windows.getCurrent({populate: true}, (window) => {
            console.log("Current window: ", window);

            const { id } = window;
            const tabs = windowTabs[id] || [];
            console.log("Tabs: ", tabs);
            console.log("Window: ", window);
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
        console.log(message)
        const tabs = windowTabs[message.windowId] || [];
        sendResponse(tabs);
    } else if (message.action === "set_active_tab") {
        setActiveTab(message.tabId);
        sendResponse({ success: true });
    } else if (message.action === "close_tab") {
        chrome.tabs.remove(message.tabId, () => {
            console.log(`Tab closed: ${message.tabId}`);
            sendResponse({ success: true });
        });
    }

    return true;
});
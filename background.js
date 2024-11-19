let ctrlPressed = false;
let shiftPressed = false;
let activeTabId = null;
let openTabs = [];
let tabPointer = 0;

function loadTabs() {
    chrome.tabs.query({}, (tabs) => {
        const activeTab = tabs.find(tab => tab.active);
        if(activeTab) {
            openTabs = [activeTab, ...tabs.filter(tab => tab.id !== activeTab.id)]
                        .map(tab => {
                            return {
                                id: tab.id,
                                title: tab.title,
                                url: tab.url
                            }
                        });
        }
        else {
            openTabs = tabs.map(tab => {
                return {
                    id: tab.id,
                    title: tab.title,
                    url: tab.url
                }
            });
        }
        console.log("Tabs loaded", openTabs);
    });
}

function setActiveTab(tabId) {
    if(tabId) chrome.tabs.update(tabId, { active: true });
}

chrome.runtime.onInstalled.addListener(() => {
    loadTabs();    
    console.log("Extension installed with tabs: ", openTabs);
});

chrome.runtime.onStartup.addListener(() => {
    loadTabs();    
    console.log("Browser started with tabs: ", openTabs);
});

chrome.tabs.onCreated.addListener((tab) => {
    console.log("Tab created: ", tab);
    openTabs.unshift({
        id: tab.id,
        title: tab.title,
        url: tab.url
    })
});

chrome.tabs.onRemoved.addListener((tabId) => {
    openTabs = openTabs.filter(tab => tab.id !== tabId);
    console.log("Tab removed: ", tabId);
    console.log("Open tabs: ", openTabs);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    activeTabId = activeInfo.tabId;
// check if activeTabId is in openTabs and is the first
    const activeTab = openTabs.find(tab => tab.id === activeTabId);
    if(activeTab) {
        const index = openTabs.indexOf(activeTab);
        if(index !== 0) {
            openTabs.splice(index, 1);
            openTabs.unshift(activeTab);
        }
    }

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

chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "list_tabs") {
        console.log(message)
        return openTabs;
    } else if (message.action === "focus_tabs" && message.tabId) {
        chrome.tabs.update(message.tabId, { active: true });
    } else if (message.action === "recieved_tabs") {
        console.log("Recieved tab: ", message);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const tabListElement = document.getElementById('tab-list');
    const searchBarElement = document.getElementById('search-bar');
    let tabList = [];
    let filteredTabs = []
    let activeIndex = 0;
    let suppressMouseOver = false;

    chrome.windows.getCurrent({populate: true}, (window) => {
        if (chrome.runtime.lastError || !window) {
            console.error("Error:", chrome.runtime.lastError?.message || "No active window found.");
            tabList = [];
            filteredTabs = [];
            renderTabs();
            return;
        }
        
        chrome.runtime.sendMessage({ action: "get_tabs", windowId: window.id}, (response) => {
            if(chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                tabList = response || [];
                filteredTabs = tabList.slice();
                renderTabs();
            }
        });
    });

    function renderTabs() {
        tabListElement.innerHTML = "";
        filteredTabs.forEach((tab, index) => {
            const li = document.createElement('li');
            li.className = "tab-item";
            if(index === activeIndex) li.classList.add('active');
            li.dataset.tabId = tab.id;

            const contentDiv = document.createElement('div');
            contentDiv.className = "tab-content";
            contentDiv.textContent = tab.title || tab.url || "Untitled";

            contentDiv.addEventListener('mouseover', () => {
                if(!suppressMouseOver) {
                    activeIndex = index;
                    renderTabs();
                }
            });

            contentDiv.addEventListener('mousedown', () => {
                chrome.runtime.sendMessage({ action: "set_active_tab", tabId: tab.id }, () => {
                    window.close();
                });
            });

            const closeButton = document.createElement('button');
            closeButton.textContent = "X";
            closeButton.className = "close-button";
            closeButton.addEventListener('click', (event) => {
                event.stopPropagation();
                chrome.runtime.sendMessage({ action: "close_tab", tabId: tab.id }, () => {
                    chrome.windows.getCurrent({populate: true}, (window) => {
                        chrome.runtime.sendMessage({ action: "get_tabs", windowId: window.id}, (response) => {
                            if(chrome.runtime.lastError) {
                                console.error("Error:", chrome.runtime.lastError.message);
                            } else {
                                tabList = response || [];
                                filterTabs(searchBarElement.value);
                            }
                        });
                    });
                });
            });
            
            li.appendChild(contentDiv);
            li.appendChild(closeButton);

            tabListElement.appendChild(li);   
        });
    }

    function filterTabs(query) {
        query = query.toLowerCase();
        filteredTabs = tabList.filter(tab =>
            (tab.title && tab.title.toLowerCase().includes(query))
        );
        activeIndex = 0;
        renderTabs();
    }

    searchBarElement.addEventListener('input', (event) => {
        const query = event.target.value;
        filterTabs(query);
    });

    document.addEventListener("keydown", (event) => {
        if(event.key === "ArrowDown") {
            suppressMouseOver = true;
            activeIndex = (activeIndex + 1) % filteredTabs.length;
            console.log(activeIndex);
            renderTabs();
            setTimeout(() => {suppressMouseOver = false;}, 100);
        } else if(event.key === "ArrowUp") {
            suppressMouseOver = true;
            activeIndex = (activeIndex - 1 + filteredTabs.length) % filteredTabs.length;
            console.log(activeIndex);
            renderTabs();
            setTimeout(() => {suppressMouseOver = false;}, 100);
        } else if(event.key === "Enter") {
            console.log(activeIndex);
            console.log(filteredTabs);
            const activeTab = filteredTabs[activeIndex];
            console.log(activeTab);
            if(activeTab) {
                chrome.runtime.sendMessage({ action: "set_active_tab", tabId: activeTab.id }, () => {
                    window.close();
                });
            }
        }
    });
});
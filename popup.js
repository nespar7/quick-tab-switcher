document.addEventListener('DOMContentLoaded', () => {
    const tabListElement = document.getElementById('tab-list');
    let tabList = [];
    let activeIndex = 0;
    let suppressMouseOver = false;

    chrome.windows.getCurrent({populate: true}, (window) => {
        chrome.runtime.sendMessage({ action: "get_tabs", windowId: window.id}, (response) => {
            if(chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
            } else {
                tabList = response || [];
                renderTabs();
            }
        });
    });

    function renderTabs() {
        tabListElement.innerHTML = "";
        tabList.forEach((tab, index) => {
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
                console.log("Close button clicked");
                event.stopPropagation();
                chrome.runtime.sendMessage({ action: "close_tab", tabId: tab.id }, () => {
                    chrome.windows.getCurrent({populate: true}, (window) => {
                        chrome.runtime.sendMessage({ action: "get_tabs", windowId: window.id}, (response) => {
                            if(chrome.runtime.lastError) {
                                console.error("Error:", chrome.runtime.lastError.message);
                            } else {
                                tabList = response || [];
                                renderTabs();
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

    document.addEventListener("keydown", (event) => {
        if(event.key === "ArrowDown") {
            suppressMouseOver = true;
            activeIndex = (activeIndex + 1) % tabList.length;
            renderTabs();
            setTimeout(() => {suppressMouseOver = false;}, 100);
        } else if(event.key === "ArrowUp") {
            suppressMouseOver = true;
            activeIndex = (activeIndex - 1 + tabList.length) % tabList.length;
            renderTabs();
            setTimeout(() => {suppressMouseOver = false;}, 100);
        } else if(event.key === "Enter") {
            const activeTab = tabList[activeIndex];
            if(activeTab) {
                chrome.runtime.sendMessage({ action: "set_active_tab", tabId: activeTab.id }, () => {
                    window.close();
                });
            }
        }
    });
});
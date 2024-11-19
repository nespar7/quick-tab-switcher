document.addEventListener('DOMContentLoaded', () => {
    const tabListElement = document.getElementById('tab-list');
    let tabList = [];
    let activeIndex = 0;

    chrome.runtime.sendMessage({ action: "get_tabs"}, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
        } else {
            tabList = response || [];
            renderTabs();
        }
    })

    function renderTabs() {
        tabListElement.innerHTML = "";
        tabList.forEach((tab, index) => {
            const li = document.createElement('li');
            li.textContent = tab.title || tab.url || "Untitled";
            if(index === activeIndex) li.classList.add('active');
            li.dataset.tabId = tab.id;
            tabListElement.appendChild(li);   
        });
    }

    document.addEventListener("keydown", (event) => {
        if(event.key === "ArrowDown") {
            activeIndex = (activeIndex + 1) % tabList.length;
            renderTabs();
        } else if(event.key === "ArrowUp") {
            activeIndex = (activeIndex - 1 + tabList.length) % tabList.length;
            renderTabs();
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
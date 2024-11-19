document.addEventListener('DOMContentLoaded', () => {
    const tabListElement = document.getElementById('tab-list');
    let tabList = [];
    let activeIndex = 0;
    let suppressMouseOver = false;

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

            li.addEventListener('mouseover', () => {
                if(!suppressMouseOver) {
                    activeIndex = index;
                    renderTabs();
                }
            });

            li.addEventListener('mousedown', () => {
                chrome.runtime.sendMessage({ action: "set_active_tab", tabId: tab.id }, () => {
                    window.close();
                });
            });

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
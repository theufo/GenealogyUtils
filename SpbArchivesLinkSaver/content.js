console.log("Content script loaded and running!");

function addCopyButtons() {
    const rows = document.querySelectorAll("tbody.table-data tr.linked-element, td.table-cell.align-top");

    rows.forEach(row => {
        // Проверяем, не добавлена ли уже кнопка
        if (row.dataset.hasCopyButton === "true") return;

        // Ищем ссылку
        let linkElement = row.querySelector("a[data-link]");
        if (!linkElement) {
            linkElement = row.closest("tr, td")?.querySelector("a[data-link]");
        }

        // Ищем дату
        // Обработка диапазона дат
        let date = "???";
        const dateElements = row.querySelectorAll("span.text-nowrap.text-gray.card-date, div.text-gray.card-date.mb-8");
        if (dateElements.length === 2) {
            const dateStart = dateElements[0].textContent.trim();
            const dateEnd = dateElements[1].textContent.trim();
            date = `${dateStart}-${dateEnd}`;
        } else if (dateElements.length === 1) {
            date = dateElements[0].textContent.trim();
        } else {
            const fallbackDate = row.closest("tr, td")?.querySelector("span.text-nowrap.text-gray.card-date, div.text-gray.card-date.mb-8");
            if (fallbackDate) {
                date = fallbackDate.textContent.trim();
            }
        }

        // Ищем название
        let titleElement = row.querySelector("a.card-title.documents.text-carbon, div.text-carbon.mb-8");
        if (!titleElement) {
            titleElement = row.closest("tr, td")?.querySelector("a.card-title.documents.text-carbon, div.text-carbon.mb-8");
        }

        if (linkElement && titleElement) {
            // Уникальный идентификатор по ссылке (если она уникальна)
            const link = linkElement.getAttribute("href");
            if (document.querySelector(`button[data-for-link='${link}']`)) return;

            // const date = dateElement ? dateElement.textContent.trim() : "???";
            const title = titleElement.textContent.trim();
            const fullText = `${link}\t${date}\t${title}`;

            const button = document.createElement("button");
            button.textContent = "Копировать данные";
            button.className = "external-copy-button";
			button.dataset.forLink = link;
            button.style.position = "absolute";
            button.style.zIndex = "1000";
            button.style.pointerEvents = "auto";
            button.style.cursor = "pointer";
            button.style.background = "#007bff";
            button.style.color = "white";
            button.style.border = "none";
            button.style.padding = "5px 10px";
            button.style.borderRadius = "5px";

            button.onclick = async (event) => {
                event.preventDefault();
                event.stopPropagation();
                try {
                    await navigator.clipboard.writeText(fullText);
                    const originalText = button.textContent;
                    button.textContent = "Скопировано";
                    button.disabled = true;
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                } catch (err) {
                    alert("Ошибка копирования: " + err);
                }
            };

            const rect = row.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            button.style.top = (rect.top + scrollTop) + "px";
            button.style.left = (rect.right + scrollLeft + 10) + "px";

            document.body.appendChild(button);

            // Отметим, что кнопка уже добавлена
            row.dataset.hasCopyButton = "true";
        }
    });
	
	// Обработка одиночной карточки (страницы без таблицы)
    const singlePageContainer = document.querySelector("div#buttons-bar");
    if (singlePageContainer && !document.querySelector("#single-copy-button")) {
        const link = window.location.href;

        const titleElement = document.querySelector("h1.mb-1");
        const title = titleElement ? titleElement.textContent.trim() : "???";

        let date = "???";
        const allTds = Array.from(document.querySelectorAll("td.align-baseline"));
        for (let i = 0; i < allTds.length; i++) {
            if (allTds[i].textContent.includes("Крайние даты документов")) {
                const nextTd = allTds[i + 1];
                if (nextTd) {
                    date = nextTd.textContent.trim();
                }
                break;
            }
        }

        const fullText = `${link}\t${date}\t${title}`;

        const button = document.createElement("button");
        button.id = "single-copy-button";
        button.textContent = "Копировать данные";
        button.className = "external-copy-button";
        button.style.cursor = "pointer";
        button.style.background = "#007bff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.padding = "5px 10px";
        button.style.borderRadius = "5px";

        button.onclick = async (event) => {
            event.preventDefault();
            event.stopPropagation();
            try {
                await navigator.clipboard.writeText(fullText);
                const originalText = button.textContent;
                button.textContent = "Скопировано";
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 1000);
            } catch (err) {
                alert("Ошибка копирования: " + err);
            }
        };

        singlePageContainer.appendChild(button);
    }
}


// Запускаем проверку после полной загрузки страницы
window.addEventListener("load", () => {
    setTimeout(addCopyButtons, 500); // небольшая задержка для избежания лагов
});

// Следим за изменениями в DOM, но с debounce для избежания фризов
let debounceTimer;
const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(addCopyButtons, 300);
});
observer.observe(document.body, { childList: true, subtree: true });

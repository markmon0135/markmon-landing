document.addEventListener("DOMContentLoaded", () => {
    const scrollRoot = document.getElementById("site-scroll");
    const header = document.getElementById("site-header");
    const sections = Array.from(document.querySelectorAll(".panel[data-section]"));
    const progressLinks = Array.from(document.querySelectorAll(".page-progress a"));
    const primaryLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
    const menuToggle = document.querySelector(".menu-toggle");
    const primaryNav = document.getElementById("primary-nav");
    const modalHistoryKey = "__markmonModal";
    const historyManagedDialogIds = ["tool-dialog", "faq-dialog"];
    let closingDialogFromHistory = false;

    function pushDialogHistory(dialog) {
        if (!dialog?.id || history.state?.[modalHistoryKey] === dialog.id) return;
        const currentState = history.state && typeof history.state === "object" ? history.state : {};
        try {
            history.pushState({ ...currentState, [modalHistoryKey]: dialog.id }, "", window.location.href);
        } catch (_) {
            /* The dialog still works if a browser blocks History API on a local file. */
        }
    }

    function removeDialogHistory(dialog) {
        if (!dialog?.id || closingDialogFromHistory) return;
        if (history.state?.[modalHistoryKey] === dialog.id) history.back();
    }

    window.addEventListener("popstate", () => {
        const historyDialogId = history.state?.[modalHistoryKey];
        const openDialog = historyManagedDialogIds
            .map(id => document.getElementById(id))
            .find(dialog => dialog?.open);
        if (!openDialog || historyDialogId === openDialog.id) return;

        closingDialogFromHistory = true;
        openDialog.close();
        closingDialogFromHistory = false;
    });

    function closeMobileMenu() {
        if (!menuToggle || !primaryNav) return;
        menuToggle.setAttribute("aria-expanded", "false");
        primaryNav.classList.remove("is-open");
    }

    menuToggle?.addEventListener("click", () => {
        const open = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!open));
        primaryNav?.classList.toggle("is-open", !open);
    });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            closeMobileMenu();
        });
    });

    function updateHeader() {
        const amount = window.innerWidth <= 900 ? window.scrollY : scrollRoot?.scrollTop || 0;
        header?.classList.toggle("is-scrolled", amount > 12);
    }

    scrollRoot?.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("scroll", updateHeader, { passive: true });

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.42) return;
            const id = entry.target.id;
            const dark = id === "cover" || id === "core-tools";

            progressLinks.forEach(link => {
                const active = link.getAttribute("href") === `#${id}`;
                link.classList.toggle("is-active", active);
                if (active) link.setAttribute("aria-current", "true");
                else link.removeAttribute("aria-current");
            });

            primaryLinks.forEach(link => {
                link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
            });

            document.querySelector(".page-progress")?.classList.toggle("is-light", dark);
        });
    }, { threshold: [0.42, 0.58, 0.72] });

    sections.forEach(section => sectionObserver.observe(section));

    const coverPanel = document.getElementById("cover");
    if (coverPanel) {
        const coverAnimationObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                coverPanel.classList.toggle("is-playing", entry.isIntersecting && entry.intersectionRatio >= 0.55);
            });
        }, { threshold: [0, 0.55] });
        coverAnimationObserver.observe(coverPanel);
    }

    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
    }, { threshold: 0.16 });

    document.querySelectorAll(".reveal").forEach(element => revealObserver.observe(element));

    fetch("./data/product-meta.json?v=20260904-2")
        .then(response => response.ok ? response.json() : Promise.reject())
        .then(meta => {
            document.querySelectorAll("[data-meta='version']").forEach(element => { element.textContent = meta.version; });
            document.querySelectorAll("[data-meta='supportedOs']").forEach(element => { element.textContent = meta.supportedOs; });
            document.querySelectorAll("[data-meta='promotionDate']").forEach(element => { element.textContent = meta.promotionDate; });
            document.querySelectorAll("[data-download-link]").forEach(element => { element.href = meta.downloadUrl; });
            document.querySelectorAll("[data-template-link]").forEach(element => { element.href = meta.templateUrl; });
        })
        .catch(() => {});

    /* Hero product gallery */
    const productSlider = document.getElementById("hero-product-slider");
    const productSlides = Array.from(document.querySelectorAll("[data-product-slide]"));
    const productCurrent = document.getElementById("product-current");
    let productIndex = 0;

    function selectProductSlide(nextIndex) {
        if (!productSlides.length) return;
        productIndex = (nextIndex + productSlides.length) % productSlides.length;
        productSlides.forEach((slide, index) => {
            const active = index === productIndex;
            slide.classList.toggle("is-front", active);
            slide.classList.toggle("is-back", !active);
            slide.setAttribute("aria-pressed", String(active));
            slide.setAttribute("aria-label", active
                ? "다음 마크몬 작업 화면 보기"
                : `${slide.querySelector("img")?.alt || "마크몬 작업 화면"}을 앞으로 가져오기`);
        });
        if (productCurrent) productCurrent.textContent = String(productIndex + 1).padStart(2, "0");
    }

    productSlides.forEach((slide, index) => {
        slide.addEventListener("click", () => {
            selectProductSlide(index === productIndex ? productIndex + 1 : index);
        });
    });
    document.querySelector("[data-product-prev]")?.addEventListener("click", () => selectProductSlide(productIndex - 1));
    document.querySelector("[data-product-next]")?.addEventListener("click", () => selectProductSlide(productIndex + 1));
    productSlider?.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        selectProductSlide(productIndex + (event.key === "ArrowRight" ? 1 : -1));
        productSlides[productIndex]?.focus();
    });

    /* Risk preview */
    const riskPreview = document.getElementById("risk-preview");
    const riskTabs = Array.from(document.querySelectorAll(".risk-tab"));

    function selectRisk(tab) {
        if (!riskPreview || !tab || tab.classList.contains("is-active")) return;
        riskTabs.forEach(item => {
            const active = item === tab;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });
        riskPreview.classList.add("is-changing");
        window.setTimeout(() => {
            riskPreview.src = tab.dataset.riskSrc;
            riskPreview.alt = tab.dataset.riskAlt || "상표권 위험 사례 이미지";
            riskPreview.classList.remove("is-changing");
        }, 170);
    }

    riskTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectRisk(tab));
        tab.addEventListener("keydown", event => {
            if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const next = riskTabs[(index + direction + riskTabs.length) % riskTabs.length];
            selectRisk(next);
            next.focus();
        });
    });

    /* Connected product workspace */
    const workflowData = {
        bulk: {
            label: "CHECK · 최대 3,000행을 한 번에",
            image: "./n3.jpg",
            alt: "상품 3,000개를 한 번에 확인하는 마크몬 대량 점검 화면"
        },
        match: {
            label: "MATCH MODE · 완전일치와 부분일치를 나눠 확인",
            image: "./n2.jpg",
            alt: "부분일치 상표 후보를 주황색으로 구분해 보여주는 마크몬 화면"
        },
        detail: {
            label: "DETAIL VIEW · 상표 정보를 한눈에 확인",
            image: "./n4.jpg",
            alt: "출원번호, 출원인, 상품분류, 등록일과 법적 상태를 간편하게 확인하는 화면"
        }
    };
    const workflowTabs = Array.from(document.querySelectorAll(".workflow-step"));
    const workflowImage = document.getElementById("workflow-image");
    const workflowLabel = document.getElementById("workflow-label");

    function applyWorkflowImage(data) {
        if (!workflowImage) return;
        workflowImage.src = data.image;
        workflowImage.alt = data.alt;
    }

    function selectWorkflow(tab) {
        const data = workflowData[tab?.dataset.workflow];
        if (!data || !workflowImage) return;
        workflowTabs.forEach(item => {
            const active = item === tab;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });
        workflowImage.classList.add("is-changing");
        window.setTimeout(() => {
            if (workflowLabel) workflowLabel.textContent = data.label;
            applyWorkflowImage(data);
            workflowImage.classList.remove("is-changing");
        }, 170);
    }

    workflowTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectWorkflow(tab));
        tab.addEventListener("keydown", event => {
            if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const next = workflowTabs[(index + direction + workflowTabs.length) % workflowTabs.length];
            selectWorkflow(next);
            next.focus();
        });
    });

    /* Core tool cards and detail dialog */
    const toolDialog = document.getElementById("tool-dialog");
    const toolDialogContent = toolDialog?.querySelector(".tool-dialog-content");
    const toolTabs = Array.from(document.querySelectorAll("[data-tool-tab]"));
    const toolPanels = Array.from(document.querySelectorAll("[data-tool-panel]"));
    const toolKeys = toolTabs.map(tab => tab.dataset.toolTab);
    const toolGalleries = Array.from(document.querySelectorAll("[data-tool-gallery]"));
    let lastToolTrigger = null;

    function selectToolGallery(gallery, nextIndex, focusControl = false) {
        if (!gallery) return;
        const mainImage = gallery.querySelector("[data-gallery-main]");
        const thumbnails = Array.from(gallery.querySelectorAll("[data-gallery-thumb]"));
        const steps = Array.from(gallery.querySelectorAll("[data-gallery-step]"));
        if (!mainImage || !thumbnails.length) return;

        const index = Math.max(0, Math.min(Number(nextIndex) || 0, thumbnails.length - 1));
        const selectedThumbnail = thumbnails[index];
        const selectedImage = selectedThumbnail.querySelector("img");
        if (!selectedImage) return;

        mainImage.src = selectedImage.currentSrc || selectedImage.src;
        mainImage.alt = selectedImage.alt;
        thumbnails.forEach((thumbnail, thumbnailIndex) => {
            const active = thumbnailIndex === index;
            thumbnail.classList.toggle("is-active", active);
            thumbnail.setAttribute("aria-pressed", String(active));
        });
        steps.forEach((step, stepIndex) => {
            const active = stepIndex === index;
            step.classList.toggle("is-active", active);
            step.setAttribute("aria-pressed", String(active));
        });
        if (focusControl) steps[index]?.focus();
    }

    toolGalleries.forEach(gallery => {
        const thumbnails = Array.from(gallery.querySelectorAll("[data-gallery-thumb]"));
        const steps = Array.from(gallery.querySelectorAll("[data-gallery-step]"));

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener("click", () => selectToolGallery(gallery, index));
        });
        steps.forEach((step, index) => {
            step.addEventListener("click", () => selectToolGallery(gallery, index));
            step.addEventListener("keydown", event => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                event.preventDefault();
                let nextIndex = index;
                if (event.key === "Home") nextIndex = 0;
                else if (event.key === "End") nextIndex = steps.length - 1;
                else nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + steps.length) % steps.length;
                selectToolGallery(gallery, nextIndex, true);
            });
        });
        selectToolGallery(gallery, 0);
    });

    function selectTool(toolKey, focusTab = false) {
        if (!toolKeys.includes(toolKey)) return;
        toolTabs.forEach(tab => {
            const active = tab.dataset.toolTab === toolKey;
            tab.setAttribute("aria-selected", String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active && focusTab) tab.focus();
        });
        toolPanels.forEach(panel => {
            const active = panel.dataset.toolPanel === toolKey;
            panel.hidden = !active;
            panel.classList.toggle("is-active", active);
            if (active) selectToolGallery(panel.querySelector("[data-tool-gallery]"), 0);
        });
        if (toolDialogContent) toolDialogContent.scrollTop = 0;
    }

    document.querySelectorAll("[data-open-tool]").forEach(card => {
        card.addEventListener("click", () => {
            if (!toolDialog) return;
            lastToolTrigger = card;
            selectTool(card.dataset.openTool);
            toolDialog.showModal();
            pushDialogHistory(toolDialog);
            document.body.classList.add("modal-open");
            window.setTimeout(() => toolDialog.querySelector(".tool-dialog-close")?.focus(), 0);
        });
    });

    toolTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectTool(tab.dataset.toolTab));
        tab.addEventListener("keydown", event => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            let nextIndex = index;
            if (event.key === "Home") nextIndex = 0;
            else if (event.key === "End") nextIndex = toolTabs.length - 1;
            else nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + toolTabs.length) % toolTabs.length;
            selectTool(toolTabs[nextIndex].dataset.toolTab, true);
        });
    });

    toolDialog?.addEventListener("close", () => {
        removeDialogHistory(toolDialog);
        document.body.classList.remove("modal-open");
        lastToolTrigger?.focus?.();
    });

    /* FAQ preview and searchable full catalog */
    const faqCatalog = [
        {
            id: "start",
            label: "시작·이용",
            items: [
                ["기존에 사용하던 엑셀도 불러올 수 있나요?", "기존 판매처 양식이나 개인 엑셀은 프로그램의 ‘마크몬 양식으로 변환’ 기능을 통해 새로운 마크몬 양식으로 간단히 만들 수 있습니다."],
                ["다른 PC에서도 사용할 수 있나요?", "기존 PC에서 정상적으로 로그아웃한 뒤 다른 PC에서 로그인하는 방식으로 사용할 수 있습니다. 서로 다른 기기에서 같은 계정으로 동시에 접속하는 것은 제한될 수 있으며 계정 공유는 허용되지 않습니다."],
                ["내 엑셀 파일이 외부 서버로 전송되나요?", "절대 아닙니다. 상품 엑셀의 가공과 이미지 편집 결과는 사용자 PC에서 처리·저장됩니다."],
                ["프로그램 사용 중 문제가 생기면 어디로 문의하나요?", "홈페이지 하단의 고객문의 또는 프로그램 안에 안내된 마크몬 단톡방에서 문의할 수 있습니다."],
                ["처음 사용하는 사람도 이용할 수 있나요?", "네. 프로그램 내부의 기능 설명과 사용법 안내를 제공하며 홈페이지와 영상 가이드도 함께 확인할 수 있습니다."],
                ["어떤 판매자에게 마크몬이 적합한가요?", "상품을 대량 등록하는 온라인 셀러, 상품명과 키워드를 반복적으로 정리하는 셀러, 상세페이지에서 판매용 이미지를 만들어야 하는 셀러에게 적합합니다."],
                ["작업한 결과를 상업용 상품 등록에 사용할 수 있나요?", "마크몬으로 가공한 상품명·키워드·이미지는 판매 업무에 활용할 수 있습니다. 다만 원본 이미지, 상품명과 상표를 사용할 권리가 있는지는 사용자가 확인해야 하며 마크몬이 제3자의 권리를 대신 보장하지는 않습니다."]
            ]
        },
        {
            id: "trademark",
            label: "상표·상품명",
            items: [
                ["확인할 필요가 없는 단어는 제외할 수 있나요?", "화이트리스트에 등록하면 해당 단어를 일반적인 상표 강조 대상에서 제외해 반복 확인을 줄일 수 있습니다. 화이트리스트 등록이 법적 안전을 의미하는 것은 아닙니다."],
                ["자주 문제가 되는 단어를 관리할 수 있나요?", "블랙리스트에 등록해 반복적으로 제거하거나 확인해야 하는 단어를 별도로 관리할 수 있습니다."],
                ["마크몬을 사용하면 상표 문제를 완전히 방지할 수 있나요?", "아닙니다. 마크몬은 놓치기 쉬운 상표 후보를 찾는 데 도움을 주는 도구입니다. 최종 확인과 수정은 사용자가 직접 해야 하며, 의심되는 상표는 KIPRIS 원문에서 다시 확인해 주세요."],
                ["위험 단어를 발견하면 바로 삭제할 수 있나요?", "네. 선택한 단어 하나만 삭제하거나 여러 상품에서 같은 단어를 한꺼번에 삭제할 수 있습니다."],
                ["여러 상품의 같은 단어를 한 번에 수정할 수 있나요?", "네. 동일 단어 삭제와 단어 바꾸기 기능을 이용해 여러 상품에 반복된 단어를 일괄 수정할 수 있습니다."],
                ["남길 단어만 선택하고 나머지를 삭제할 수 있나요?", "네. 선택 외 삭제 모드를 사용하면 유지할 단어만 고른 뒤 나머지를 한 번에 정리할 수 있습니다."],
                ["여러 단어를 골라 한꺼번에 삭제할 수 있나요?", "네. 일괄 삭제 모드에서 삭제할 단어들을 선택한 뒤 한 번에 적용할 수 있습니다."],
                ["원래 상품명과 수정 결과를 비교할 수 있나요?", "마크몬 화면에서는 현재 가공 결과를 확인할 수 있고 원본 엑셀은 별도로 유지할 수 있습니다."]
            ]
        },
        {
            id: "keyword",
            label: "키워드 마법사",
            items: [
                ["키워드 마법사는 어떤 기능인가요?", "현재 상품의 키워드를 정리하고, 새로운 연관 키워드와 검색량을 확인하며, 선택한 키워드의 상표 후보까지 정밀 점검하는 기능입니다. 상품별 키워드를 꼼꼼하게 정리할 때 유용합니다."],
                ["상품명과 중복되는 키워드를 정리할 수 있나요?", "네. 상품명과 중복되거나 겹치는 키워드를 찾아 정리할 수 있습니다."],
                ["서로 중복되거나 포함되는 키워드를 정리할 수 있나요?", "네. 같은 키워드와 서로 포함 관계에 있는 키워드를 자동으로 정리할 수 있습니다."],
                ["불필요한 키워드를 한 번에 삭제할 수 있나요?", "네. 체크한 키워드를 즉시 삭제하거나 기준 단어가 포함된 키워드를 일괄 정리할 수 있습니다."],
                ["연관 키워드를 새로 찾을 수 있나요?", "네. 기준 키워드를 바탕으로 연관 키워드를 확인할 수 있습니다."],
                ["연관 키워드의 검색량을 확인할 수 있나요?", "네. 연관 키워드와 검색량을 함께 보면서 추가할 키워드를 선별할 수 있습니다."],
                ["검색량을 기준으로 키워드를 고를 수 있나요?", "네. 검색량을 비교하거나 최소 검색량 조건을 적용해 필요한 키워드를 선별할 수 있습니다."],
                ["새로운 키워드를 바로 추가할 수 있나요?", "네. 검색 결과에서 필요한 연관 키워드를 선택해 작업 목록에 추가할 수 있습니다."],
                ["추가하려는 키워드의 상표권도 확인할 수 있나요?", "네. 선택한 키워드의 상표 후보와 상세 정보를 바로 확인할 수 있습니다."],
                ["여러 키워드를 한꺼번에 추가할 수 있나요?", "네. 키워드 일괄 추가 기능을 이용할 수 있습니다."],
                ["특정 단어를 여러 키워드에 적용할 수 있나요?", "네. 기준 단어를 키워드의 앞이나 뒤에 붙이거나 다른 표현으로 일괄 변환할 수 있습니다."]
            ]
        },
        {
            id: "capture",
            label: "캡처몬 추출",
            items: [
                ["캡처몬은 어떤 기능인가요?", "긴 상품 상세페이지에서 필요한 이미지 후보를 찾고, 원하는 영역을 추출한 뒤 배경 제거·지우기·모자이크 등의 편집을 할 수 있는 도구입니다."],
                ["상세페이지에서 이미지 후보를 자동으로 찾나요?", "네. 자동 이미지 추출 기능이 상세페이지 안에서 상품 이미지로 사용할 수 있는 후보를 찾아 미리보기로 보여줍니다."],
                ["자동 추출 결과 중 원하는 이미지만 고를 수 있나요?", "네. 추출된 후보를 확인한 뒤 필요한 이미지만 선택해 편집하거나 저장할 수 있습니다."],
                ["자동으로 찾은 이미지가 마음에 들지 않으면 어떻게 하나요?", "상세페이지에서 원하는 영역을 직접 드래그해 추출하거나 편집창을 열 수 있습니다."],
                ["이미지 배경을 제거할 수 있나요?", "네. 선택한 이미지에서 자동 배경 제거 기능을 실행할 수 있습니다."],
                ["이미지의 불필요한 부분을 직접 지울 수 있나요?", "네. 직접 지우개, 영역 지우기, 테두리 지우개 기능을 사용할 수 있습니다."],
                ["문구나 작은 물체를 자연스럽게 지울 수 있나요?", "AI 스마트 지우개를 이용해 선택한 문구나 잡티, 연결 자국 등을 주변 이미지에 맞춰 정리할 수 있습니다."],
                ["이미지 일부를 모자이크 처리할 수 있나요?", "네. 원하는 영역을 선택해 모자이크를 적용하고 모자이크 크기도 조절할 수 있습니다."]
            ]
        },
        {
            id: "capture-edit",
            label: "캡처몬 편집·저장",
            items: [
                ["지운 부분을 다시 복원할 수 있나요?", "네. 복원 브러시를 이용해 배경 제거 또는 지우개 작업 중 사라진 상품 부분을 원본에서 다시 가져올 수 있습니다."],
                ["이미지 영역을 이동하거나 확대할 수 있나요?", "네. 선택한 영역을 이동·확대하거나 비율을 유지한 채 캔버스를 채울 수 있습니다."],
                ["이미지를 복사하거나 붙여넣을 수 있나요?", "네. 선택 영역을 복사해 새로운 위치에 붙여넣고 크기와 위치를 조절할 수 있습니다."],
                ["이미지를 회전하거나 반전할 수 있나요?", "네. 좌우·상하 반전과 각도별 회전을 지원합니다."],
                ["편집 결과를 원래 상태로 되돌릴 수 있나요?", "네. 되돌리기와 초기화 기능을 이용해 편집 전 상태로 돌아갈 수 있습니다."],
                ["원하는 형태의 이미지로 저장할 수 있나요?", "네. 필요한 영역을 선택하고 배경 제거·지우기·모자이크 등의 편집을 적용한 뒤 지정한 폴더에 저장할 수 있습니다."],
                ["이미지 크기는 어떻게 저장되나요?", "정사각형으로 선택한 이미지는 1000×1000으로 변환할 수 있습니다. 자유 영역은 원본 크기로 저장하거나 1000×1000으로 변환해 저장할 수 있습니다."],
                ["저장 파일명을 선택할 수 있나요?", "제품번호, 상품코드 또는 상품명을 기준으로 파일명을 지정할 수 있습니다."],
                ["같은 이름의 파일이 있으면 덮어쓰나요?", "덮어쓰기 방지 기능을 켜면 기존 파일을 유지하고 새로운 파일명 뒤에 번호를 붙여 저장합니다."]
            ]
        },
        {
            id: "background",
            label: "대량 배경지우개",
            items: [
                ["이미지 폴더 전체를 불러올 수 있나요?", "네. 선택한 폴더의 JPG, JPEG, PNG, WEBP와 BMP 이미지를 불러올 수 있습니다. 하위 폴더는 포함되지 않습니다."],
                ["마크몬 엑셀의 이미지도 처리할 수 있나요?", "네. 엑셀의 이미지1·이미지2·이미지3 중 처리할 이미지 주소 열을 선택할 수 있습니다."],
                ["작업 진행 상황을 확인할 수 있나요?", "네. 처리 개수, 성공·실패 개수, 진행률과 예상 남은 시간을 확인할 수 있습니다."],
                ["처리하지 못한 이미지도 확인할 수 있나요?", "네. 읽을 수 없거나 처리에 실패한 이미지는 실패 상태로 표시되며 나머지 작업은 계속 진행됩니다."],
                ["원본과 결과를 비교할 수 있나요?", "네. 원본 이미지와 배경 제거 결과를 전환하거나 나란히 확인할 수 있습니다."],
                ["원본 이미지는 그대로 유지되나요?", "네. 원본 파일은 수정하지 않고 결과를 별도의 폴더에 저장합니다."],
                ["결과는 어디에 저장되나요?", "기본적으로 원본 폴더 또는 엑셀 위치에 별도의 ‘배경제거_결과’ 폴더를 사용하며, 원하는 다른 위치를 지정할 수도 있습니다."],
                ["흰색 배경과 투명 배경을 선택할 수 있나요?", "네. 흰 배경 JPG와 투명 배경 PNG 중에서 선택할 수 있습니다."],
                ["이미지 비율을 유지할 수 있나요?", "네. 원본 비율을 유지해 여백을 넣거나 1000×1000 크기에 여백 없이 맞출 수 있습니다."],
                ["처리된 이미지를 다시 수정할 수 있나요?", "네. 처리가 끝난 이미지 중 필요한 이미지를 선택해 개별 편집할 수 있으며, 수정 내용은 결과 파일에 반영됩니다."],
                ["작업을 중간에 멈추면 저장된 결과도 사라지나요?", "아닙니다. 현재 처리 중인 이미지를 마친 뒤 작업이 중지되며 이미 저장된 결과는 유지됩니다."]
            ]
        }
    ];
    let faqNumber = 0;
    const allFaqItems = faqCatalog.flatMap(category => category.items.map(([question, answer]) => ({
        number: ++faqNumber,
        categoryId: category.id,
        categoryLabel: category.label,
        question,
        answer
    })));
    const faqDialog = document.getElementById("faq-dialog");
    const faqCategories = document.querySelector("[data-faq-categories]");
    const faqResults = document.querySelector("[data-faq-results]");
    const faqSearch = document.getElementById("faq-search");
    const faqSearchWrap = faqSearch?.closest(".faq-search-wrap");
    const faqEmpty = document.querySelector("[data-faq-empty]");
    const faqResultTitle = document.querySelector("[data-faq-result-title]");
    const faqResultCount = document.querySelector("[data-faq-result-count]");
    let activeFaqCategory = faqCatalog[0].id;

    function setFaqMeta(title, count) {
        if (faqResultTitle) faqResultTitle.textContent = title;
        if (faqResultCount) faqResultCount.textContent = `${count}개 질문`;
    }

    function renderFaqItems(items, title) {
        if (!faqResults || !faqEmpty) return;
        faqResults.replaceChildren();
        faqEmpty.hidden = items.length > 0;
        faqResults.hidden = items.length === 0;
        setFaqMeta(title, items.length);

        items.forEach(item => {
            const details = document.createElement("details");
            details.className = "faq-result-item";
            const summary = document.createElement("summary");
            const number = document.createElement("span");
            number.textContent = String(item.number).padStart(2, "0");
            const question = document.createElement("b");
            question.textContent = item.question;
            const icon = document.createElement("i");
            icon.setAttribute("aria-hidden", "true");
            const answer = document.createElement("p");
            answer.textContent = item.answer;
            summary.append(number, question, icon);
            details.append(summary, answer);
            details.addEventListener("toggle", () => {
                if (!details.open) return;
                faqResults.querySelectorAll("details[open]").forEach(openItem => {
                    if (openItem !== details) openItem.removeAttribute("open");
                });
            });
            faqResults.append(details);
        });
    }

    function selectFaqCategory(categoryId, focusButton = false) {
        const category = faqCatalog.find(item => item.id === categoryId) || faqCatalog[0];
        activeFaqCategory = category.id;
        if (faqSearch) faqSearch.value = "";
        faqSearchWrap?.classList.remove("has-value");
        faqCategories?.querySelectorAll("button").forEach(button => {
            const active = button.dataset.faqCategory === category.id;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-selected", String(active));
            button.tabIndex = active ? 0 : -1;
            if (active && focusButton) button.focus();
        });
        renderFaqItems(
            allFaqItems.filter(item => item.categoryId === category.id),
            category.label
        );
    }

    faqCatalog.forEach((category, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `faq-category${index === 0 ? " is-active" : ""}`;
        button.dataset.faqCategory = category.id;
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(index === 0));
        button.tabIndex = index === 0 ? 0 : -1;
        button.innerHTML = `${category.label}<b>${category.items.length}</b>`;
        button.addEventListener("click", () => selectFaqCategory(category.id));
        button.addEventListener("keydown", event => {
            if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
            event.preventDefault();
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (index + direction + faqCatalog.length) % faqCatalog.length;
            selectFaqCategory(faqCatalog[nextIndex].id, true);
        });
        faqCategories?.append(button);
    });
    faqCategories?.setAttribute("role", "tablist");
    selectFaqCategory(activeFaqCategory);

    faqSearch?.addEventListener("input", () => {
        const query = faqSearch.value.trim().toLocaleLowerCase("ko-KR");
        faqSearchWrap?.classList.toggle("has-value", Boolean(query));
        if (!query) {
            selectFaqCategory(activeFaqCategory);
            faqSearch?.focus();
            return;
        }
        faqCategories?.querySelectorAll("button").forEach(button => {
            button.classList.remove("is-active");
            button.setAttribute("aria-selected", "false");
            button.tabIndex = 0;
        });
        const matches = allFaqItems.filter(item => `${item.question} ${item.answer} ${item.categoryLabel}`.toLocaleLowerCase("ko-KR").includes(query));
        renderFaqItems(matches, `‘${faqSearch.value.trim()}’ 검색 결과`);
    });

    function resetFaqSearch() {
        selectFaqCategory(activeFaqCategory);
        faqSearch?.focus();
    }

    document.querySelector("[data-faq-search-clear]")?.addEventListener("click", resetFaqSearch);
    document.querySelector("[data-faq-reset]")?.addEventListener("click", () => {
        selectFaqCategory(faqCatalog[0].id);
        faqSearch?.focus();
    });
    document.querySelectorAll("[data-open-faq]").forEach(button => {
        button.addEventListener("click", () => {
            const dialog = document.getElementById(button.dataset.openFaq);
            if (!dialog) return;
            lastFocusedElement = button;
            dialog.showModal();
            pushDialogHistory(dialog);
            document.body.classList.add("modal-open");
            window.setTimeout(() => faqSearch?.focus(), 0);
        });
    });
    faqDialog?.addEventListener("close", () => {
        removeDialogHistory(faqDialog);
        document.body.classList.remove("modal-open");
        lastFocusedElement?.focus?.();
    });

    document.querySelectorAll("[data-faq-preview] details").forEach(details => {
        details.addEventListener("toggle", () => {
            if (!details.open) return;
            document.querySelectorAll("[data-faq-preview] details[open]").forEach(openItem => {
                if (openItem !== details) openItem.removeAttribute("open");
            });
        });
    });

    /* Video modals */
    let lastFocusedElement = null;

    function closeVideoModal(modal) {
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        modal.querySelector("video")?.pause();
        document.body.classList.remove("modal-open");
        lastFocusedElement?.focus?.();
    }

    document.querySelectorAll("[data-open-video]").forEach(button => {
        button.addEventListener("click", () => {
            const modal = document.getElementById(button.dataset.openVideo);
            if (!modal) return;
            lastFocusedElement = button;
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
            document.body.classList.add("modal-open");
            const video = modal.querySelector("video");
            const playRequest = video?.play();
            playRequest?.catch(() => {});
            modal.querySelector(".modal-close")?.focus();
        });
    });

    document.querySelectorAll("[data-close-video]").forEach(button => {
        button.addEventListener("click", () => closeVideoModal(button.closest(".video-modal")));
    });

    /* Policy dialogs */
    document.querySelectorAll("[data-policy]").forEach(button => {
        button.addEventListener("click", () => document.getElementById(button.dataset.policy)?.showModal());
    });
    document.querySelectorAll("[data-close-dialog]").forEach(button => {
        button.addEventListener("click", () => button.closest("dialog")?.close());
    });
    document.querySelectorAll("dialog").forEach(dialog => {
        dialog.addEventListener("click", event => {
            const rect = dialog.getBoundingClientRect();
            const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
            if (outside) dialog.close();
        });
    });

    window.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        document.querySelectorAll(".video-modal.is-open").forEach(closeVideoModal);
        closeMobileMenu();
    });

    updateHeader();
});

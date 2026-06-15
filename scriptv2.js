document.addEventListener("DOMContentLoaded", () => {
    const isMobileLanding = document.body.classList.contains("mobile-landing");
    const isDesktopLanding = !isMobileLanding;
    const mobileBreakpoint = 860;
    const currentPath = window.location.pathname || "";
    const mobilePath = currentPath.replace(/[^/]*$/, "mobile.html");
    const desktopPath = currentPath.replace(/[^/]*$/, "index.html");

    if (isDesktopLanding && window.innerWidth <= mobileBreakpoint && !/mobile\.html$/i.test(currentPath)) {
        const target = `${mobilePath}${window.location.search}${window.location.hash}`;
        window.location.replace(target);
        return;
    }

    if (isMobileLanding && window.innerWidth > mobileBreakpoint && !/index\.html$/i.test(currentPath)) {
        const target = `${desktopPath}${window.location.search}${window.location.hash}`;
        window.location.replace(target);
        return;
    }

    const main = document.querySelector("main");
    const header = document.querySelector(".navbar");
    const footer = document.querySelector("body > footer");

    if (!main) {
        return;
    }

    if (isMobileLanding) {
        document.body.classList.remove("horizontal-mode");
        document.body.classList.remove("layout-pending");
    } else {
        document.body.classList.add("horizontal-mode");
        document.body.classList.add("layout-pending");
    }

    refreshIntroSection();

    if (!isMobileLanding) {
        ensureHorizontalLayout(main, header, footer);
        initHorizontalPager();
    }

    initFeatureSlider();
    initWarningRiskCards();
    initFooterInfoPanels();
});

function refreshIntroSection() {
    const introContainer = document.querySelector("#intro .hero-container");

    if (!introContainer) {
        return;
    }

    introContainer.innerHTML = `
        <div class="intro-content fade-in-up">
            <div class="badge intro-badge">막막했던 상표 확인, 마크몬으로 더 쉽게</div>
            <h2 class="intro-title" style="word-break: keep-all;">
                하나씩 찾던 상표 확인,<br><span class="text-gradient">마크몬에선 훨씬 쉽고 빠르게</span>
            </h2>
            <p class="intro-desc intro-copy">
                <strong>상품명과 키워드</strong>, 셀러가 실제로 가장 많이 다루는 항목들 안에서<br>
                필요한 상표 확인을 <strong>더 빠르고 쉽게</strong> 이어갈 수 있습니다.
            </p>
            <p class="intro-desc intro-copy intro-copy--spaced">
                더 이상 <strong>사이트를 오가며 하나씩 검색</strong>하고, 긴 결과 화면을 눈으로 다시 훑어볼 필요가 없습니다.
            </p>
            <p class="intro-desc intro-copy intro-copy--spaced intro-copy--compact">
                <strong>찾는 데 시간을 쓰는 대신, 걸러내는 데 집중하세요.</strong><br>
                막막했던 상표 확인을 <strong>더 직관적이고 편한 작업 흐름</strong>으로 바꿔줍니다.
            </p>
            <p class="intro-highlight">지재권 이슈, 마크몬으로 예방하세요.</p>
        </div>
        <div class="intro-visual reveal-up">
            <div class="image-wrapper shadow-lg intro-visual-card">
                <img src="./markmonlogo33v2.jpg" alt="MarkMon Logo" class="intro-logo">
            </div>
        </div>
    `;
}

function ensureHorizontalLayout(main, header, footer) {
    main.classList.add("horizontal-main");

    if (!document.querySelector(".horizontal-controls")) {
        const controls = document.createElement("div");
        controls.className = "horizontal-controls";
        controls.setAttribute("aria-label", "페이지 이동 컨트롤");
        controls.innerHTML = `
            <button type="button" class="horizontal-control-btn" data-slide-action="prev" aria-label="이전 페이지">&#10094;</button>
            <div class="horizontal-control-status">
                <span id="horizontal-current">1</span>
                <span id="horizontal-total">/ 1</span>
            </div>
            <button type="button" class="horizontal-control-btn" data-slide-action="next" aria-label="다음 페이지">&#10095;</button>
        `;

        if (header) {
            header.insertAdjacentElement("afterend", controls);
        } else {
            document.body.prepend(controls);
        }
    }

    let track = document.getElementById("horizontal-track");

    if (!track) {
        track = document.createElement("div");
        track.id = "horizontal-track";
        track.className = "horizontal-track";

        const sections = Array.from(main.querySelectorAll(":scope > section"));
        const fallbackIds = [
            "direct-search",
            "detail-workspace",
            "button-control",
            "extra-features",
            "video-demo"
        ];

        sections.forEach(section => {
            if (!section.id) {
                section.id = fallbackIds.shift() || `page-${track.children.length + 1}`;
            }

            decoratePageSection(section);
            track.append(section);
        });

        if (footer) {
            const footerPage = document.createElement("section");
            footerPage.id = "footer-info";
            footerPage.className = "page-section page-section--footer";

            const scroll = document.createElement("div");
            scroll.className = "page-section-scroll";

            const frame = document.createElement("div");
            frame.className = "page-frame page-frame--footer";

            frame.append(footer);
            scroll.append(frame);
            footerPage.append(scroll);
            track.append(footerPage);
        }

        main.replaceChildren(track);
    }
}

function decoratePageSection(section) {
    section.classList.add("page-section");

    if (section.querySelector(":scope > .page-section-scroll")) {
        return;
    }

    const scroll = document.createElement("div");
    scroll.className = "page-section-scroll";

    const frame = document.createElement("div");
    frame.className = section.id === "download" ? "page-frame page-frame--cta" : "page-frame";

    while (section.firstChild) {
        frame.append(section.firstChild);
    }

    scroll.append(frame);
    section.append(scroll);
}

function initHorizontalPager() {
    const track = document.getElementById("horizontal-track");
    const pages = Array.from(document.querySelectorAll(".page-section"));
    const prevButton = document.querySelector('[data-slide-action="prev"]');
    const nextButton = document.querySelector('[data-slide-action="next"]');
    const currentLabel = document.getElementById("horizontal-current");
    const totalLabel = document.getElementById("horizontal-total");
    const navAnchors = Array.from(document.querySelectorAll('a[href^="#"]'));

    if (!track || !pages.length || !prevButton || !nextButton || !currentLabel || !totalLabel) {
        return;
    }

    let currentPage = 0;
    let locked = false;
    let wheelLocked = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let refreshFrameId = 0;
    let refreshTimeoutId = 0;
    let readyRevealScheduled = false;

    const pageIndexById = new Map();

    pages.forEach((page, index) => {
        if (page.id) {
            pageIndexById.set(page.id, index);
        }
    });

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    function applyViewportVariables() {
        const viewportWidth = Math.max(
            document.documentElement.clientWidth || 0,
            window.innerWidth || 0
        );
        const viewportHeight = Math.max(
            window.innerHeight || 0,
            document.documentElement.clientHeight || 0
        );

        document.documentElement.style.setProperty("--viewport-width", `${viewportWidth}px`);
        document.documentElement.style.setProperty("--viewport-height", `${viewportHeight}px`);
    }

    function getPageWidth() {
        const firstPage = pages[0];

        if (!firstPage) {
            return window.innerWidth || document.documentElement.clientWidth || 0;
        }

        const rectWidth = firstPage.getBoundingClientRect().width;

        return rectWidth || window.innerWidth || document.documentElement.clientWidth || 0;
    }

    function syncCleanUrl() {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;

        if (window.location.hash) {
            window.history.replaceState(null, "", cleanUrl);
        }
    }

    function updateButtons() {
        prevButton.disabled = currentPage === 0;
        nextButton.disabled = currentPage === pages.length - 1;
        currentLabel.textContent = String(currentPage + 1);
        totalLabel.textContent = `/ ${pages.length}`;
    }

    function setActivePage(index, options = {}) {
        const { resetScroll = true, syncUrl = true, animate = true } = options;

        pages.forEach((page, pageIndex) => {
            page.classList.toggle("is-active", pageIndex === index);
        });

        const previousTransition = track.style.transition;

        if (!animate) {
            track.style.transition = "none";
        }

        const pageWidth = getPageWidth();
        track.style.transform = `translateX(-${index * pageWidth}px)`;
        const activeScroll = pages[index]?.querySelector(".page-section-scroll");

        if (resetScroll && activeScroll) {
            activeScroll.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }

        if (resetScroll) {
            window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }

        if (syncUrl) {
            syncCleanUrl();
        }

        updateButtons();

        if (!animate) {
            track.getBoundingClientRect();
            track.style.transition = previousTransition;
        }
    }

    function goToPage(index) {
        const target = clamp(index, 0, pages.length - 1);

        if (locked || target === currentPage) {
            return;
        }

        locked = true;
        currentPage = target;
        setActivePage(currentPage);

        window.setTimeout(() => {
            const scrollArea = pages[currentPage]?.querySelector(".page-section-scroll");

            if (scrollArea) {
                scrollArea.scrollTo({ top: 0, behavior: "auto" });
            }

            locked = false;
        }, 520);
    }

    function getCurrentScrollArea() {
        return pages[currentPage]?.querySelector(".page-section-scroll");
    }

    function refreshCurrentPageLayout(options = {}) {
        const { resetScroll = false } = options;
        applyViewportVariables();
        setActivePage(currentPage, {
            resetScroll,
            syncUrl: false,
            animate: false
        });
    }

    function scheduleLayoutRefresh(options = {}) {
        const { resetScroll = false } = options;

        if (refreshFrameId) {
            window.cancelAnimationFrame(refreshFrameId);
        }

        if (refreshTimeoutId) {
            window.clearTimeout(refreshTimeoutId);
        }

        refreshFrameId = window.requestAnimationFrame(() => {
            refreshCurrentPageLayout({ resetScroll });

            refreshTimeoutId = window.setTimeout(() => {
                refreshCurrentPageLayout({ resetScroll });
            }, 60);
        });
    }

    function revealLayoutWhenStable() {
        if (readyRevealScheduled) {
            return;
        }

        readyRevealScheduled = true;

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                document.body.classList.remove("layout-pending");
            });
        });
    }

    function canScrollInside(scrollArea, deltaY) {
        if (!scrollArea) {
            return false;
        }

        if (deltaY > 0) {
            return scrollArea.scrollTop + scrollArea.clientHeight < scrollArea.scrollHeight - 2;
        }

        if (deltaY < 0) {
            return scrollArea.scrollTop > 2;
        }

        return false;
    }

    prevButton.addEventListener("click", () => goToPage(currentPage - 1));
    nextButton.addEventListener("click", () => goToPage(currentPage + 1));

    navAnchors.forEach(anchor => {
        anchor.addEventListener("click", event => {
            const href = anchor.getAttribute("href");
            const targetId = href ? href.replace("#", "") : "";

            if (!targetId || !pageIndexById.has(targetId)) {
                return;
            }

            event.preventDefault();
            goToPage(pageIndexById.get(targetId));
        });
    });

    window.addEventListener("keydown", event => {
        if (event.key === "ArrowRight") {
            event.preventDefault();
            goToPage(currentPage + 1);
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            goToPage(currentPage - 1);
        }
    });

    window.addEventListener("wheel", event => {
        const activeScroll = getCurrentScrollArea();

        if (canScrollInside(activeScroll, event.deltaY)) {
            return;
        }

        if (wheelLocked || Math.abs(event.deltaY) < 24) {
            return;
        }

        wheelLocked = true;

        if (event.deltaY > 0) {
            goToPage(currentPage + 1);
        } else {
            goToPage(currentPage - 1);
        }

        window.setTimeout(() => {
            wheelLocked = false;
        }, 620);
    }, { passive: true });

    window.addEventListener("touchstart", event => {
        const touch = event.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }, { passive: true });

    window.addEventListener("touchend", event => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const activeScroll = getCurrentScrollArea();

        if (Math.abs(deltaY) > Math.abs(deltaX) && canScrollInside(activeScroll, deltaY)) {
            return;
        }

        if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY)) {
            return;
        }

        if (deltaX < 0) {
            goToPage(currentPage + 1);
        } else {
            goToPage(currentPage - 1);
        }
    }, { passive: true });

    const initialHash = window.location.hash.replace("#", "");

    if (pageIndexById.has(initialHash)) {
        currentPage = pageIndexById.get(initialHash);
    }

    applyViewportVariables();
    setActivePage(currentPage, { syncUrl: false });
    syncCleanUrl();
    scheduleLayoutRefresh({ resetScroll: true });

    window.addEventListener("load", () => {
        scheduleLayoutRefresh({ resetScroll: true });
    });

    window.addEventListener("resize", () => {
        scheduleLayoutRefresh();
    });

    window.addEventListener("pageshow", () => {
        scheduleLayoutRefresh({ resetScroll: true });
    });

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            scheduleLayoutRefresh();
        }
    });

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            scheduleLayoutRefresh({ resetScroll: true });
            revealLayoutWhenStable();
        });
    } else {
        window.setTimeout(() => {
            revealLayoutWhenStable();
        }, 120);
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
            scheduleLayoutRefresh();
        });
    }

    window.setTimeout(() => {
        revealLayoutWhenStable();
    }, 220);
}

function initFeatureSlider() {
    const sliders = Array.from(document.querySelectorAll(".slider-container"));

    if (!sliders.length) {
        return;
    }

    sliders.forEach(slider => {
        const slides = Array.from(slider.querySelectorAll(".slide-img"));
        const dots = Array.from(slider.querySelectorAll(".dot"));
        const prevButton = slider.querySelector(".prev-btn");
        const nextButton = slider.querySelector(".next-btn");

        if (!slides.length || !prevButton || !nextButton) {
            return;
        }

        let currentIndex = slides.findIndex(slide => slide.classList.contains("active-slide"));

        if (currentIndex < 0) {
            currentIndex = 0;
        }

        function render(index) {
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle("active-slide", slideIndex === index);
            });

            dots.forEach((dot, dotIndex) => {
                dot.classList.toggle("active-dot", dotIndex === index);
            });
        }

        prevButton.addEventListener("click", event => {
            event.stopPropagation();
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            render(currentIndex);
        });

        nextButton.addEventListener("click", event => {
            event.stopPropagation();
            currentIndex = (currentIndex + 1) % slides.length;
            render(currentIndex);
        });

        dots.forEach((dot, dotIndex) => {
            dot.addEventListener("click", event => {
                event.stopPropagation();
                currentIndex = dotIndex;
                render(currentIndex);
            });
        });

        render(currentIndex);
    });

    initVideoModal();
}

function initVideoModal() {
    const openButtons = Array.from(document.querySelectorAll("[data-open-video]"));
    const closeButtons = Array.from(document.querySelectorAll("[data-close-video]"));

    if (!openButtons.length) {
        return;
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);

        if (!modal) {
            return;
        }

        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");

        const video = modal.querySelector("video");

        if (video) {
            video.pause();
        }
    }

    openButtons.forEach(button => {
        button.addEventListener("click", () => {
            const modalId = button.dataset.openVideo;
            const modal = document.getElementById(modalId);

            if (!modal) {
                return;
            }

            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");

            const video = modal.querySelector("video");

            if (video) {
                video.currentTime = 0;
                video.play().catch(() => {});
            }
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener("click", () => {
            closeModal(button.dataset.closeVideo);
        });
    });

    window.addEventListener("keydown", event => {
        if (event.key !== "Escape") {
            return;
        }

        document.querySelectorAll(".video-modal.is-open").forEach(modal => {
            closeModal(modal.id);
        });
    });
}

function initFooterInfoPanels() {
    const display = document.getElementById("footer-panel-display");
    const buttons = Array.from(document.querySelectorAll("[data-footer-panel-target]"));
    const isMobileLanding = document.body.classList.contains("mobile-landing");

    if (!display || !buttons.length) {
        return;
    }

    let activeTarget = "";

    function closePanel() {
        activeTarget = "";
        display.hidden = true;
        display.replaceChildren();
        buttons.forEach(button => button.classList.remove("is-active"));
    }

    function openPanel(button) {
        const targetId = button?.dataset.footerPanelTarget;
        const source = targetId ? document.getElementById(targetId) : null;

        if (!button || !source) {
            return;
        }

        const content = source.cloneNode(true);
        content.removeAttribute("id");
        content.removeAttribute("hidden");
        display.replaceChildren(content);

        display.hidden = false;
        activeTarget = targetId;

        buttons.forEach(item => {
            item.classList.toggle("is-active", item === button);
        });
    }

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.dataset.footerPanelTarget;

            if (activeTarget === targetId) {
                closePanel();
                return;
            }

            openPanel(button);
        });
    });

    if (!isMobileLanding) {
        const defaultButton = buttons.find(button => button.dataset.footerPanelTarget === "terms") || buttons[0];

        if (defaultButton) {
            openPanel(defaultButton);
        }
    }
}

function initWarningRiskCards() {
    const triggers = Array.from(document.querySelectorAll("[data-risk-toggle]"));
    const previewImage = document.getElementById("warning-hook-main-image");
    const previewFallback = document.getElementById("warning-hook-image-fallback");
    const defaultImageSrc = previewImage?.dataset.defaultSrc || previewImage?.getAttribute("src") || "";

    if (!triggers.length) {
        return;
    }

    function showRiskImage(src) {
        if (!previewImage || !src) {
            return;
        }

        previewImage.style.display = "block";
        previewImage.classList.toggle("is-default-risk-image", src === defaultImageSrc);

        if (previewFallback) {
            previewFallback.style.display = "none";
        }

        if (previewImage.getAttribute("src") !== src) {
            previewImage.setAttribute("src", src);
        }
    }

    triggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            const panelId = trigger.dataset.riskToggle;
            const imageSrc = trigger.dataset.riskImage;
            const panel = panelId ? document.getElementById(panelId) : null;
            const isExpanded = trigger.getAttribute("aria-expanded") === "true";

            triggers.forEach(otherTrigger => {
                const otherPanelId = otherTrigger.dataset.riskToggle;
                const otherPanel = otherPanelId ? document.getElementById(otherPanelId) : null;

                otherTrigger.setAttribute("aria-expanded", "false");

                if (otherPanel) {
                    otherPanel.hidden = true;
                }
            });

            if (!panel) {
                return;
            }

            if (!isExpanded) {
                trigger.setAttribute("aria-expanded", "true");
                panel.hidden = false;
                showRiskImage(imageSrc);
            } else if (defaultImageSrc) {
                showRiskImage(defaultImageSrc);
            }
        });
    });
}

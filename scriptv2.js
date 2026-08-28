document.addEventListener("DOMContentLoaded", () => {
    const scrollRoot = document.getElementById("site-scroll");
    const header = document.getElementById("site-header");
    const sections = Array.from(document.querySelectorAll(".panel[data-section]"));
    const progressLinks = Array.from(document.querySelectorAll(".page-progress a"));
    const primaryLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
    const menuToggle = document.querySelector(".menu-toggle");
    const primaryNav = document.getElementById("primary-nav");

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
            const dark = id === "cover" || id === "solution" || id === "capture";

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

    /* Solution screen stack */
    const solutionStage = document.querySelector(".solution-stage");
    const solutionScreens = Array.from(document.querySelectorAll("[data-solution-screen]"));
    let solutionIndex = solutionScreens.findIndex(screen => screen.classList.contains("screen-front"));
    if (solutionIndex < 0) solutionIndex = 0;

    function selectSolutionScreen(nextIndex) {
        if (!solutionScreens.length) return;
        solutionIndex = (nextIndex + solutionScreens.length) % solutionScreens.length;
        solutionScreens.forEach((screen, index) => {
            const active = index === solutionIndex;
            screen.classList.toggle("screen-front", active);
            screen.classList.toggle("screen-back", !active);
            screen.setAttribute("aria-pressed", String(active));
            screen.setAttribute("aria-label", active
                ? "다음 솔루션 화면 보기"
                : `${screen.querySelector("img")?.alt || "솔루션 화면"}를 앞으로 가져오기`);
        });
    }

    solutionScreens.forEach((screen, index) => {
        screen.addEventListener("click", () => {
            selectSolutionScreen(index === solutionIndex ? solutionIndex + 1 : index);
        });
    });
    solutionStage?.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        selectSolutionScreen(solutionIndex + (event.key === "ArrowRight" ? 1 : -1));
        solutionScreens[solutionIndex]?.focus();
    });

    /* Feature explorer */
    const features = {
        bulk: {
            kicker: "BULK CHECK",
            number: "FEATURE 01",
            title: "3,000행을 한 번에",
            copy: "엑셀을 불러오면 상품명과 키워드를 대량으로 확인하고, 결과를 즉시 가공할 수 있습니다.",
            image: "./47v2.jpg",
            alt: "3,000행을 한 번에 분석하는 대량 상품 검사 화면",
            chips: ["대량 엑셀", "빠른 검사", "결과 저장"]
        },
        edit: {
            kicker: "DIRECT EDIT",
            number: "FEATURE 02",
            title: "보고, 지우고, 바로 수정",
            copy: "검사 결과와 상품 이미지를 함께 보면서 불필요한 단어를 지우고 원하는 표현으로 즉시 바꿀 수 있습니다.",
            image: "./38v2.jpg",
            alt: "상품명과 키워드를 즉시 수정하는 마크몬 화면",
            chips: ["즉시 수정", "단어 바꾸기", "듀얼 뷰"]
        },
        wizard: {
            kicker: "KEYWORD WIZARD",
            number: "FEATURE 03",
            title: "정리부터 선별까지 한 번에",
            copy: "후보 키워드를 한눈에 비교하고 남길 표현과 제거할 표현을 빠르게 결정하는 올인원 가공 도구입니다.",
            image: "./33v2.jpg",
            alt: "키워드 정리와 선별을 돕는 키워드 마법사 화면",
            chips: ["키워드 정리", "후보 비교", "빠른 선별"]
        },
        background: {
            kicker: "BACKGROUND REMOVER",
            number: "FEATURE 04",
            title: "상품 이미지 배경을 한 번에",
            copy: "이미지 폴더나 마크몬 엑셀을 불러오면 여러 상품 이미지의 배경을 지우고, 원본과 결과를 비교해 원하는 폴더에 저장할 수 있습니다.",
            image: "./n3.jpg",
            alt: "상품 이미지의 원본과 배경 제거 결과를 비교하는 마크몬 배경지우개 화면",
            chips: ["폴더·엑셀 불러오기", "원본·결과 비교", "결과 일괄 저장"]
        }
    };

    const featureTabs = Array.from(document.querySelectorAll(".feature-tab"));
    const featureImage = document.getElementById("feature-image");
    const featureKicker = document.getElementById("feature-kicker");
    const featureNumber = document.getElementById("feature-number");
    const featureTitle = document.getElementById("feature-title");
    const featureCopy = document.getElementById("feature-copy");
    const featureChips = document.getElementById("feature-chips");

    function selectFeature(tab) {
        const data = features[tab?.dataset.feature];
        if (!data || !featureImage) return;
        featureTabs.forEach(item => {
            const active = item === tab;
            item.classList.toggle("is-active", active);
            item.setAttribute("aria-selected", String(active));
        });
        featureImage.classList.add("is-changing");
        window.setTimeout(() => {
            featureImage.src = data.image;
            featureImage.alt = data.alt;
            featureKicker.textContent = data.kicker;
            featureNumber.textContent = data.number;
            featureTitle.textContent = data.title;
            featureCopy.textContent = data.copy;
            featureChips.replaceChildren(...data.chips.map(label => {
                const chip = document.createElement("span");
                chip.textContent = label;
                return chip;
            }));
            featureImage.classList.remove("is-changing");
        }, 170);
    }

    featureTabs.forEach((tab, index) => {
        tab.addEventListener("click", () => selectFeature(tab));
        tab.addEventListener("keydown", event => {
            if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
            event.preventDefault();
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const next = featureTabs[(index + direction + featureTabs.length) % featureTabs.length];
            selectFeature(next);
            next.focus();
        });
    });

    /* CaptureMon gallery */
    const captureGallery = document.getElementById("capture-gallery");
    const captureSlides = Array.from(document.querySelectorAll("[data-capture-slide]"));
    const captureCurrent = document.getElementById("capture-current");
    let captureIndex = 0;

    function selectCapture(nextIndex) {
        if (!captureSlides.length) return;
        captureIndex = (nextIndex + captureSlides.length) % captureSlides.length;
        captureSlides.forEach((slide, index) => {
            const depth = (index - captureIndex + captureSlides.length) % captureSlides.length;
            const active = depth === 0;
            slide.classList.remove("is-front", "is-behind-1", "is-behind-2", "is-behind-3", "is-behind-4");
            slide.classList.add(active ? "is-front" : `is-behind-${depth}`);
            slide.setAttribute("aria-pressed", String(active));
            slide.setAttribute("aria-label", active
                ? "다음 캡쳐몬 작업 화면 보기"
                : `${slide.querySelector("img")?.alt || "캡쳐몬 작업 화면"}을 앞으로 가져오기`);
        });
        if (captureCurrent) captureCurrent.textContent = String(captureIndex + 1).padStart(2, "0");
    }

    captureSlides.forEach((slide, index) => {
        slide.addEventListener("click", () => {
            selectCapture(index === captureIndex ? captureIndex + 1 : index);
        });
    });
    document.getElementById("capture-prev")?.addEventListener("click", () => selectCapture(captureIndex - 1));
    document.getElementById("capture-next")?.addEventListener("click", () => selectCapture(captureIndex + 1));
    captureGallery?.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        selectCapture(captureIndex + (event.key === "ArrowRight" ? 1 : -1));
        captureSlides[captureIndex]?.focus();
    });
    selectCapture(0);

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

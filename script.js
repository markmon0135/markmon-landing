document.addEventListener("DOMContentLoaded", () => {
    // 1. 네비게이션바 스크롤 스타일링 효과
    const navbar = document.querySelector(".navbar");
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
            navbar.style.background = "rgba(255, 255, 255, 0.95)";
        } else {
            navbar.style.boxShadow = "none";
            navbar.style.background = "rgba(255, 255, 255, 0.85)";
        }
    });

    // 2. Intersection Observer를 활용한 스크롤 애니메이션 (Reveal)
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15 // 요소가 15% 보일 때 트리거
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 화면에 나타나면 active 클래스 추가 (스타일시트에서 애니메이션 실행)
                entry.target.classList.add("active");
                // 애니메이션이 한 번 실행되면 관찰 해제
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 애니메이션 적용할 요소들
    const animatedElements = document.querySelectorAll(
        ".fade-in-up, .reveal-left, .reveal-right, .reveal-up, .slide-up-delayed"
    );

    // 관찰 시작
    animatedElements.forEach(el => observer.observe(el));
    // 3. 이미지 슬라이더 로직
    const slides = document.querySelectorAll(".slide-img");
    const dots = document.querySelectorAll(".dot");
    const prevBtn = document.querySelector(".prev-btn");
    const nextBtn = document.querySelector(".next-btn");

    if (slides.length > 0) {
        let currentSlide = 0;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove("active-slide"));
            dots.forEach(dot => dot.classList.remove("active-dot"));

            slides[index].classList.add("active-slide");
            dots[index].classList.add("active-dot");
            currentSlide = index;
        }

        prevBtn.addEventListener("click", () => {
            let index = currentSlide - 1;
            if (index < 0) index = slides.length - 1;
            showSlide(index);
        });

        nextBtn.addEventListener("click", () => {
            let index = currentSlide + 1;
            if (index >= slides.length) index = 0;
            showSlide(index);
        });

        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                showSlide(index);
            });
        });
    }
});

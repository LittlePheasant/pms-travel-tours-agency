// One-page interactions: slider (auto + manual + touch), mobile nav, featured injection, reveal animations
document.addEventListener('DOMContentLoaded', () => {
    /* ===== Mobile nav ===== */
    const hamburger = document.getElementById('hamburger');
    const primaryNav = document.getElementById('primary-nav');

    const navPanel = document.createElement('div');
    navPanel.className = 'nav-panel';
    navPanel.setAttribute('aria-hidden','true');
    navPanel.innerHTML = primaryNav ? primaryNav.innerHTML : '';
    document.body.appendChild(navPanel);

    function closeNav() {
        navPanel.classList.remove('open');
        navPanel.setAttribute('aria-hidden','true');
        hamburger.setAttribute('aria-expanded','false');
        document.body.style.overflow = '';
    }
    hamburger.addEventListener("click", () => {
        const isOpen = primaryNav.classList.toggle("show");
        hamburger.setAttribute("aria-expanded", isOpen);
    });
    navPanel.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') closeNav();
        if (e.target === navPanel) closeNav();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

    /* ===== Slider ===== */
    const slidesWrap = document.querySelector('.slides');
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const dotsContainer = document.getElementById('sliderDots');
    let idx = 0;
    let autoTimer = null;
    const INTERVAL = 8000;

    if (slides.length) {
        slides.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'slider-dot';
            d.setAttribute('aria-label', `Go to slide ${i+1}`);
            d.addEventListener('click', () => { goTo(i); resetAuto(); });
            dotsContainer.appendChild(d);
        });
        const dots = Array.from(dotsContainer.children);

        function update() {
            slidesWrap.style.transform = `translateX(-${idx * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        }
        function goTo(i){ idx = (i + slides.length) % slides.length; update(); }
        function next(){ goTo(idx + 1); }
        function prev(){ goTo(idx - 1); }

        nextBtn && nextBtn.addEventListener('click', () => { next(); resetAuto(); });
        prevBtn && prevBtn.addEventListener('click', () => { prev(); resetAuto(); });

        function startAuto(){ autoTimer = setInterval(next, INTERVAL); }
        function stopAuto(){ if (autoTimer) clearInterval(autoTimer); autoTimer = null; }
        function resetAuto(){ stopAuto(); startAuto(); }

        const sliderEl = document.getElementById('heroSlider');
        sliderEl.addEventListener('mouseenter', stopAuto);
        sliderEl.addEventListener('mouseleave', startAuto);
        sliderEl.addEventListener('focusin', stopAuto);
        sliderEl.addEventListener('focusout', startAuto);

        let startX = 0;
        sliderEl.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stopAuto(); }, {passive:true});
        sliderEl.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = endX - startX;
            if (Math.abs(diff) > 50) { if (diff > 0) prev(); else next(); }
            resetAuto();
        });

        goTo(0);
        startAuto();
    }

    /* ===== Reveal animations ===== */
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                obs.unobserve(entry.target);
            }
        });
    }, {threshold: 0.12});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    /* ===== Excel-based Packages ===== */
    const packageTypeSelect = document.getElementById("package-type");
    const packagesTable = document.getElementById("packages-table");
    const modal = document.getElementById("booking-modal");
    const modalContent = document.getElementById("modal-form-content");
    let allPackages = [];

    async function loadExcelPackages(tripType) {
        const url = `http://localhost:8080/PMS-Travel-and-Tour-Agency/data/${tripType}-based.xlsx`;
        try {
            const res = await fetch(url);
            const array = await res.arrayBuffer();
            const workbook = XLSX.read(array, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            allPackages = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            const headers = getHeadersFromSheet(sheet);

            renderTable(headers);

        } catch (err) {
            console.error("Error loading Excel file:", err);
            packagesTable.innerHTML = "<p>Error loading data.</p>";
        }
    }

    // Extract clean headers from allPackages
    function getHeadersFromSheet(sheet) {
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const headers = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
            const cell = sheet[cellAddress];
            if (cell && cell.v !== undefined) {
                headers.push(cell.v.toString().trim());
            }
        }
        return headers;
    }
    

    function renderTable(headers) {
        if (!headers || headers.length === 0) {
            packagesTable.innerHTML = "<p>No packages available.</p>";
            return;
        }

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";

        // Headers
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        headers.forEach(key => {
            const th = document.createElement("th");
            th.textContent = key;
            th.style.border = "1px solid #ddd";
            th.style.padding = "8px";
            th.style.backgroundColor = "#0ea5a4";
            th.style.color = "#fff";
            headerRow.appendChild(th);
        });
        // Add extra header for booking button
        const thBook = document.createElement("th");
        thBook.textContent = "Book";
        thBook.style.border = "1px solid #ddd";
        thBook.style.padding = "8px";
        thBook.style.backgroundColor = "#0ea5a4";
        thBook.style.color = "#fff";
        headerRow.appendChild(thBook);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement("tbody");
        allPackages.forEach(pkg => {
            const tr = document.createElement("tr");
            headers.forEach(key => {
                const td = document.createElement("td");
                td.textContent = pkg[key] || "";
                td.style.border = "1px solid #ddd";
                td.style.padding = "8px";
                tr.appendChild(td);
            });

            // Booking button
            const tdBtn = document.createElement("td");
            const btn = document.createElement("button");
            btn.textContent = "Book";
            btn.className = "book-btn";
            btn.dataset.package = pkg.Package || pkg.Name || "";
            btn.addEventListener("click", () => openBookingForm(btn.dataset.package));
            tdBtn.appendChild(btn);
            tr.appendChild(tdBtn);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        packagesTable.innerHTML = "";
        packagesTable.appendChild(table);
    }

    function openBookingForm(packageName) {
        const bookingID = "BK" + Math.floor(Math.random() * 1000000);
        modalContent.innerHTML = `
            <h3>Book: ${packageName}</h3>
            <p>Booking ID: <strong>${bookingID}</strong></p>
            <form id="booking-form" action="https://formspree.io/f/xgvjkkgo" method="POST">
                <label for="book-name">Full Name:</label>
                <input type="text" id="book-name" required>
                <label for="book-email">Email:</label>
                <input type="email" id="book-email" required>
                <button type="submit">Confirm Booking</button>
            </form>
        `;
        modal.style.display = "flex";

        console.log(packageName);

        document.getElementById("booking-form").onsubmit = function(e) {
            e.preventDefault();
            alert(`Booking confirmed! Your ID: ${bookingID}`);
            closeModal();
        };
    }

    function closeModal() {
        modal.style.display = "none";
    }

    packageTypeSelect.addEventListener("change", () => {
        loadExcelPackages(packageTypeSelect.value.toLowerCase());
    });

    loadExcelPackages(packageTypeSelect.value.toLowerCase());

    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    /* ===== Pre-fill contact form if 'package' param present ===== */
    const urlParams = new URLSearchParams(location.search);
    const pkgParam = urlParams.get('package');
    if (pkgParam) {
        const messageEl = document.getElementById('message');
        const tripTypeEl = document.getElementById('tripType');
        if (messageEl) messageEl.value = `Inquiry about package ${pkgParam}. Please send details and pricing.`;
        if (tripTypeEl) tripTypeEl.value = tripTypeEl.querySelector('option') ? tripTypeEl.querySelector('option').value : '';
    }

    /* ===== Footer year ===== */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});

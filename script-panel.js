document.addEventListener('DOMContentLoaded', () => {
    // === COOKIE BANNER ===
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    if (banner && acceptBtn) {
        if (!localStorage.getItem('cookiesAccepted')) {
            banner.classList.remove('hidden');
        }
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            banner.classList.add('hidden');
        });
    }

    // === TEMA ===
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const htmlEl = document.documentElement;
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'paper') {
            htmlEl.setAttribute('data-theme', 'paper');
            updateThemeIcon('paper');
        }
        themeToggle.addEventListener('click', () => {
            const current = htmlEl.getAttribute('data-theme') || 'dark';
            const newTheme = current === 'dark' ? 'paper' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // === CERRAR SESIÓN ===
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            alert('Funcionalidad pendiente de integración con Back4App.');
        });
    }

    // === OBRAS DESDE LOCALSTORAGE ===
    const worksContainer = document.getElementById('works-container');
    if (worksContainer) {
        const obras = JSON.parse(localStorage.getItem('adea_obras') || '[]');
        if (obras.length === 0) {
            worksContainer.innerHTML = '<p class="no-works">Aún no has añadido ninguna obra. <a href="./encuesta.html">Rellena la encuesta</a> para comenzar.</p>';
        } else {
            worksContainer.innerHTML = obras.map(obra => `
                <div class="work-card">
                    <h4>${obra.title}</h4>
                    <p class="work-genre">${obra.genre}</p>
                    <span class="work-status">Activa</span>
                    <a href="${obra.link}" target="_blank" class="work-link">Ver obra</a>
                </div>
            `).join('');
        }
    }

    // === INFORME DINÁMICO CON 3 FILTROS ===
    const monthlyData = [
        { month: "Enero", year: 2023, reach: 4200, clicks: 280, engagement: "6.2%", cpr: "0.55 €" },
        { month: "Febrero", year: 2023, reach: 4800, clicks: 310, engagement: "6.4%", cpr: "0.53 €" },
        { month: "Marzo", year: 2024, reach: 7200, clicks: 480, engagement: "6.6%", cpr: "0.51 €" },
        { month: "Enero", year: 2025, reach: 9800, clicks: 620, engagement: "6.3%", cpr: "0.52 €" },
        { month: "Febrero", year: 2025, reach: 10500, clicks: 710, engagement: "6.5%", cpr: "0.50 €" },
        { month: "Marzo", year: 2025, reach: 11200, clicks: 780, engagement: "6.7%", cpr: "0.49 €" },
        { month: "Abril", year: 2025, reach: 12450, clicks: 842, engagement: "6.8%", cpr: "0.47 €" }
    ];

    // Extraer años con datos
    function getYearsWithData() {
        return [...new Set(monthlyData.map(m => m.year))].sort((a, b) => b - a);
    }

    // Meses por año
    function getMonthsForYear(year) {
        return monthlyData
            .filter(m => m.year === year)
            .map(m => ({ name: m.month, value: m.month }));
    }

    // Cuatrimestres con datos para un año
    function getQuartersForYear(year) {
        const months = monthlyData.filter(m => m.year === year).map(m => m.month);
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const monthIndices = months.map(m => monthNames.indexOf(m));

        const quarters = [];
        if (monthIndices.some(m => m >= 0 && m <= 3)) quarters.push({ name: "Ene–Abr", value: "q1" });
        if (monthIndices.some(m => m >= 4 && m <= 7)) quarters.push({ name: "May–Ago", value: "q2" });
        if (monthIndices.some(m => m >= 8 && m <= 11)) quarters.push({ name: "Sep–Dic", value: "q3" });

        return quarters;
    }

    // Calcular métricas
    function calculateMetrics(data) {
        if (data.length === 0) return { reach: 0, clicks: 0, engagement: "0%", cpr: "0 €" };
        const reach = data.reduce((sum, m) => sum + m.reach, 0);
        const clicks = data.reduce((sum, m) => sum + m.clicks, 0);
        const engagement = clicks / reach > 0 ? (clicks / reach * 100).toFixed(1) + "%" : "0%";
        const cpr = clicks > 0 ? (reach / clicks / 100).toFixed(2) + " €" : "0 €";
        return { reach, clicks, engagement, cpr };
    }

    // Renderizar informe
    function renderReport(year, month = null, quarter = null) {
        let data = monthlyData.filter(m => m.year === year);
        let title = `${year}`;

        if (month) {
            data = data.filter(m => m.month === month);
            title = `${month} ${year}`;
        } else if (quarter) {
            const ranges = {
                q1: ["Enero", "Febrero", "Marzo", "Abril"],
                q2: ["Mayo", "Junio", "Julio", "Agosto"],
                q3: ["Septiembre", "Octubre", "Noviembre", "Diciembre"]
            };
            data = data.filter(m => ranges[quarter].includes(m.month));
            title = `${ranges[quarter][0]}–${ranges[quarter][3]} ${year}`;
        }

        const metrics = calculateMetrics(data);
        document.getElementById('report-content').innerHTML = `
        <h4 style="text-align:center; margin-bottom:1.5rem; color:var(--accent);">${title}</h4>
        <div class="stats-grid">
            <div class="stat-card"><h4>Alcance</h4><p class="stat-value">${metrics.reach.toLocaleString()}</p></div>
            <div class="stat-card"><h4>Clics</h4><p class="stat-value">${metrics.clicks.toLocaleString()}</p></div>
            <div class="stat-card"><h4>Engagement</h4><p class="stat-value">${metrics.engagement}</p></div>
            <div class="stat-card"><h4>Coste por resultado</h4><p class="stat-value">${metrics.cpr}</p></div>
        </div>
    `;
    }

    // Inicializar filtros
    function initFilters() {
        const yearSelect = document.getElementById('filter-year');
        const monthSelect = document.getElementById('filter-month');
        const quarterSelect = document.getElementById('filter-quarter');

        if (!yearSelect || !monthSelect || !quarterSelect) return;

        // Años
        const years = getYearsWithData();
        yearSelect.innerHTML = '';
        years.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            yearSelect.appendChild(opt);
        });

        const defaultYear = Math.max(...years);
        yearSelect.value = defaultYear;

        // Actualizar meses y cuatrimestres
        function updateFilters() {
            const year = parseInt(yearSelect.value);

            // Meses
            monthSelect.innerHTML = '<option value="">Todos los meses</option>';
            getMonthsForYear(year).forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.value;
                opt.textContent = m.name;
                monthSelect.appendChild(opt);
            });

            // Cuatrimestres
            quarterSelect.innerHTML = '<option value="">Todos los cuatrimestres</option>';
            getQuartersForYear(year).forEach(q => {
                const opt = document.createElement('option');
                opt.value = q.value;
                opt.textContent = q.name;
                quarterSelect.appendChild(opt);
            });

            renderReport(year);
        }

        yearSelect.addEventListener('change', updateFilters);
        monthSelect.addEventListener('change', () => {
            const year = parseInt(yearSelect.value);
            const month = monthSelect.value || null;
            const quarter = quarterSelect.value || null;
            if (month) quarterSelect.value = ""; // Limpiar cuatrimestre si se elige mes
            renderReport(year, month, quarter ? quarter : null);
        });
        quarterSelect.addEventListener('change', () => {
            const year = parseInt(yearSelect.value);
            const quarter = quarterSelect.value || null;
            const month = monthSelect.value || null;
            if (quarter) monthSelect.value = ""; // Limpiar mes si se elige cuatrimestre
            renderReport(year, null, quarter);
        });

        updateFilters();
    }

    // Ejecutar al cargar
    initFilters();
});

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle svg');
    if (!icon) return;
    icon.innerHTML = theme === 'paper' ?
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' :
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
}
// PDF Viewer functionality
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.2;
let canvas = null;
let ctx = null;
let loadingSpinner = null;

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'static/js/pdf.worker.min.js';
}

function updateProfileSubtitle() {
    const subtitle = document.querySelector('#profile .portrait-title h3');
    if (subtitle) {
        subtitle.textContent = 'Spatial Data Science · Urban Analytics · Behavioral Health';
    }
}

function updateFeaturedPublicationTitle() {
    const titleLink = document.querySelector('#featured h2 a[href="/article-1.html"] span');
    if (titleLink) {
        titleLink.textContent = 'Popularity influence mechanism of coastal spaces in urban areas: Insights from multi-modal large language models';
    }
}

function updateAboutMeText() {
    const aboutHeading = document.getElementById('about-me');
    const bioText = aboutHeading ? aboutHeading.parentElement : null;
    if (!bioText) return;

    const paragraphs = [
        'I am an interdisciplinary data scientist and researcher with over a decade of experience working at the intersection of architecture, urban planning, environmental systems, behavioral data, and health analytics. My work focuses on translating complex multimodal datasets into tangible, real-world insights and decision-support tools through applied AI and data-driven approaches.',
        'My technical toolkit is built for high-dimensional data. I routinely integrate geospatial, remote sensing, mobility, behavioral, clinical, image, and text-based sources. My methodological expertise spans applied AI/ML, computer vision, NLP, multimodal modeling, predictive analytics, causal inference, and geospatial statistics.',
        'With a strong track record bridging academic research and industry consulting, I have successfully collaborated across urban development, commercial strategy, and digital health initiatives. By connecting complex data with human behavior and environmental contexts, I am passionate about engineering evidence-based solutions that drive measurable impact across health, urban, and applied AI domains.'
    ];

    bioText.querySelectorAll('p').forEach(function(paragraph) {
        paragraph.remove();
    });

    paragraphs.forEach(function(text) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        bioText.appendChild(paragraph);
    });
}

function updateEducationSection() {
    const headings = Array.from(document.querySelectorAll('.section-subheading'));
    const experienceHeading = headings.find(function(heading) {
        return heading.textContent.trim() === 'Experience';
    });
    const educationHeading = headings.find(function(heading) {
        return heading.textContent.trim() === 'Education';
    });

    if (experienceHeading && experienceHeading.parentElement) {
        experienceHeading.parentElement.remove();
    }
    if (!educationHeading || !educationHeading.parentElement) return;

    const educationBlock = educationHeading.parentElement;
    const educationWrapper = educationBlock.parentElement;
    if (educationWrapper) {
        educationWrapper.className = 'mt-6 dark:text-gray-300';
    }

    educationBlock.innerHTML = `
        <div class="section-subheading mb-3">Education</div>
        <ul class="space-y-3">
            <li>
                <p class="course font-medium">Ph.D., Urban Planning</p>
                <p class="text-sm">University of North Carolina at Chapel Hill (Joint Program), 2020</p>
            </li>
            <li>
                <p class="course font-medium">Master of Engineering, Urban Systems Engineering</p>
                <p class="text-sm">Dalian University of Technology, 2016</p>
            </li>
            <li>
                <p class="course font-medium">Bachelor of Engineering, Urban Systems Engineering</p>
                <p class="text-sm">Dalian University of Technology, 2014</p>
            </li>
        </ul>
    `;
}

function updateNavigationAndSectionOrder() {
    document.querySelectorAll('a[href="#professionalskills"]').forEach(function(link) {
        link.textContent = 'Work Experience';
    });

    document.querySelectorAll('#navbarResponsive ul, #mobileMenu ul').forEach(function(navList) {
        const workLink = navList.querySelector('a[href="#professionalskills"]');
        if (workLink && !navList.querySelector('a[href="#technicalskills"]')) {
            const technicalItem = document.createElement('li');
            const technicalLink = document.createElement('a');
            technicalLink.className = workLink.className;
            technicalLink.href = '#technicalskills';
            technicalLink.textContent = 'Technical Skills';
            technicalItem.appendChild(technicalLink);
            navList.insertBefore(technicalItem, workLink.closest('li'));
        }

        const conferenceLink = navList.querySelector('a[href="#conferencepresentations"]');
        if (conferenceLink) {
            conferenceLink.textContent = 'Dissemination';
        }

        const teachingLink = navList.querySelector('a[href="#teachinginnavation"]');
        if (teachingLink && teachingLink.closest('li')) {
            teachingLink.closest('li').remove();
        }
    });

    const technicalSection = document.getElementById('technicalskills');
    const workSection = document.getElementById('professionalskills');
    if (technicalSection && workSection && technicalSection.parentElement === workSection.parentElement) {
        workSection.parentElement.insertBefore(technicalSection, workSection);
    }

    const workHeading = document.getElementById('professionalskills-subtitle');
    if (workHeading) {
        workHeading.textContent = 'Work Experience';
    }

    const conferenceHeading = document.getElementById('conferencepresentations-subtitle');
    if (conferenceHeading) {
        conferenceHeading.textContent = 'Dissemination';
    }

    const conferenceContent = document.getElementById('conferencepresentations-md');
    if (conferenceContent && !document.getElementById('conferencepresentations-section-label')) {
        const label = document.createElement('h3');
        label.id = 'conferencepresentations-section-label';
        label.className = 'text-2xl font-semibold text-gray-900 mb-4';
        label.textContent = 'Conference Presentations';
        conferenceContent.parentElement.insertBefore(label, conferenceContent);
    }

    const teachingHeading = document.getElementById('teachinginnavation-subtitle');
    if (teachingHeading) {
        teachingHeading.textContent = 'Teaching Innovation';
    }
}

function renderPage(num) {
    if (!pdfDoc || !canvas || !ctx) return;
    pageRendering = true;

    pdfDoc.getPage(num).then(function(page) {
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({scale: scale});
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const renderTask = page.render({
            canvasContext: ctx,
            viewport: viewport,
            enhanceTextSelection: true,
            renderInteractiveForms: true
        });

        renderTask.promise.then(function() {
            ctx.scale(1 / dpr, 1 / dpr);
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.disabled = (num <= 1);
    if (nextBtn) nextBtn.disabled = (num >= pdfDoc.numPages);
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

function zoomIn() {
    scale += 0.25;
    if (scale > 3.0) scale = 3.0;
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = Math.round(scale * 100) + '%';
    if (pdfDoc && pageNum) queueRenderPage(pageNum);
}

function zoomOut() {
    scale -= 0.25;
    if (scale < 0.5) scale = 0.5;
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = Math.round(scale * 100) + '%';
    if (pdfDoc && pageNum) queueRenderPage(pageNum);
}

function loadPDF() {
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not loaded');
        if (loadingSpinner) {
            loadingSpinner.innerHTML = '<p class="text-center text-red-600">PDF.js library not loaded</p>';
        }
        return;
    }

    pdfjsLib.getDocument('contents/Portfolio.pdf').promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
        renderPage(pageNum);
    }).catch(function(error) {
        console.error('Error loading PDF:', error);
        if (loadingSpinner) {
            loadingSpinner.innerHTML = '<p class="text-center text-red-600">Failed to load PDF</p>';
        }
    });
}

window.addEventListener('load', function() {
    updateProfileSubtitle();
    updateFeaturedPublicationTitle();
    updateAboutMeText();
    updateEducationSection();
    updateNavigationAndSectionOrder();

    canvas = document.getElementById('pdfCanvas');
    loadingSpinner = document.getElementById('pdfLoadingSpinner');
    ctx = canvas ? canvas.getContext('2d') : null;

    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) zoomLevel.textContent = Math.round(scale * 100) + '%';

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    if (prevBtn) prevBtn.addEventListener('click', onPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', onNextPage);
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);

    function shouldLoadPDF() {
        const pdfSection = document.getElementById('portfoliopreview');
        return window.location.hash === '#portfoliopreview' || (pdfSection && pdfSection.offsetParent !== null);
    }

    setTimeout(function() {
        if (!canvas) {
            console.error('Canvas element not found! Cannot load PDF.');
            return;
        }
        if (shouldLoadPDF()) loadPDF();
    }, 1000);

    window.addEventListener('hashchange', function() {
        if (shouldLoadPDF() && canvas && !pdfDoc) loadPDF();
    });
});

function resizeCanvas() {
    if (pdfDoc && pageNum) queueRenderPage(pageNum);
}

window.addEventListener('resize', resizeCanvas);

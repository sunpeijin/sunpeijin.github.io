// PDF Viewer functionality
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
// Set initial scale to 1.2 for better default clarity
let scale = 1.2;
let canvas = null;
let ctx = null;
let loadingSpinner = null;

// PDF.js configuration
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'static/js/pdf.worker.min.js';
}

// Render a page
function renderPage(num) {
    if (!pdfDoc || !canvas || !ctx) return;
    
    pageRendering = true;
    
    pdfDoc.getPage(num).then(function(page) {
        // Get the device pixel ratio, falling back to 1.0
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({scale: scale});
        
        // Set canvas dimensions with DPI support
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        
        // Scale the context to ensure correct rendering
        ctx.scale(dpr, dpr);
        
        // Set high-quality rendering options
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high'; // This can be 'low', 'medium', or 'high'
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        // Add rendering parameters for better quality
        const renderTask = page.render({
            ...renderContext,
            enhanceTextSelection: true,
            renderInteractiveForms: true
        });
        
        renderTask.promise.then(function() {
            // Reset the scale for future operations
            ctx.scale(1/dpr, 1/dpr);
            
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
    
    // Update page info
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
    }
    
    // Update button states
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) prevBtn.disabled = (num <= 1);
    if (nextBtn) nextBtn.disabled = (num >= pdfDoc.numPages);
}

// Queue rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Previous page
function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

// Next page
function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

// Zoom functions
function zoomIn() {
    scale += 0.25;
    if (scale > 3.0) scale = 3.0;
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(scale * 100) + '%';
    }
    if (pdfDoc && pageNum) {
        queueRenderPage(pageNum);
    }
}

function zoomOut() {
    scale -= 0.25;
    if (scale < 0.5) scale = 0.5;
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(scale * 100) + '%';
    }
    if (pdfDoc && pageNum) {
        queueRenderPage(pageNum);
    }
}

// Load PDF
function loadPDF() {
    
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js library not loaded');
        if (loadingSpinner) {
            loadingSpinner.innerHTML = `
                <div class="text-center text-red-600">
                    <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-lg font-medium">PDF.js library not loaded</p>
                    <p class="text-sm mt-2">Please check your internet connection</p>
                </div>
            `;
        }
        return;
    }
    
    const url = 'contents/Portfolio.pdf';
    
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        
        // Hide loading spinner and show canvas
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        if (canvas) {
            canvas.style.display = 'block';
        }
        
        // Initial render
        renderPage(pageNum);
    }).catch(function(error) {
        console.error('Error loading PDF:', error);
        console.error('Error details:', error.message, error.name);
        if (loadingSpinner) {
            loadingSpinner.innerHTML = `
                <div class="text-center text-red-600">
                    <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-lg font-medium">Failed to load PDF</p>
                    <p class="text-sm mt-2">Error: ${error.message || 'Unknown error'}</p>
                    <p class="text-sm mt-1">File path: contents/Portfolio.pdf</p>
                </div>
            `;
        }
    });
}

// Initialize PDF viewer when page loads
window.addEventListener('load', function() {
    
    // Initialize elements
    canvas = document.getElementById('pdfCanvas');
    loadingSpinner = document.getElementById('pdfLoadingSpinner');
    ctx = canvas ? canvas.getContext('2d') : null;
    
    // Initialize zoom level display
    const zoomLevel = document.getElementById('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = Math.round(scale * 100) + '%';
    }
    
    // Event listeners
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    
    if (prevBtn) prevBtn.addEventListener('click', onPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', onNextPage);
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    
    // Check if we're on the PDF preview section
    function shouldLoadPDF() {
        const hash = window.location.hash;
        const pdfSection = document.getElementById('portfoliopreview');
        return hash === '#portfoliopreview' || (pdfSection && pdfSection.offsetParent !== null);
    }
    
    // Add a small delay to ensure PDF.js is fully loaded
    setTimeout(function() {
        if (!canvas) {
            console.error('Canvas element not found! Cannot load PDF.');
            return;
        }
        if (!loadingSpinner) {
            console.error('Loading spinner element not found!');
        }
        
        // Only load PDF if we're on the PDF section or hash is #portfoliopreview
        if (shouldLoadPDF()) {
            try {
                loadPDF();
            } catch (error) {
                console.error('Error calling loadPDF:', error);
            }
        } else {
            console.log('Not loading PDF - not on PDF section');
        }
    }, 1000);
    
    // Also listen for hash changes
    window.addEventListener('hashchange', function() {
        if (shouldLoadPDF() && canvas && !pdfDoc) {
            loadPDF();
        }
    });
    

});

// Responsive canvas sizing
function resizeCanvas() {
    if (pdfDoc && pageNum) {
        queueRenderPage(pageNum);
    }
}

window.addEventListener('resize', resizeCanvas);
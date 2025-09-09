

const content_dir = 'contents/'
const config_file = 'config.yml'
const section_names = ['home', 'professionalskills', 'technicalskills', 'publications', 'books', 'researchgrants', 'awards', 'conferencepresentations', 'teachinginnavation']


window.addEventListener('DOMContentLoaded', event => {

    // Mobile menu toggle functionality
    const navbarToggler = document.getElementById('navbarToggler');
    const mobileMenu = document.getElementById('mobileMenu');
    const navbarResponsive = document.getElementById('navbarResponsive');
    
    if (navbarToggler && mobileMenu) {
        navbarToggler.addEventListener('click', () => {
            const isHidden = mobileMenu.style.display === 'none' || mobileMenu.style.display === '';
            mobileMenu.style.display = isHidden ? 'block' : 'none';
            navbarToggler.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        });
    }

    // Close mobile menu when nav link is clicked
    const mobileNavItems = document.querySelectorAll('#mobileMenu a');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
            if (mobileMenu) {
                mobileMenu.style.display = 'none';
                navbarToggler.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Simple scroll spy functionality
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    function updateActiveNavLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('text-primary');
            link.classList.add('text-gray-700');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.remove('text-gray-700');
                link.classList.add('text-primary');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink(); // Initial call


    // Yaml
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    document.getElementById(key).innerHTML = yml[key];
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString())
                }

            })
        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
    section_names.forEach((name, idx) => {
        fetch(content_dir + name + '.md')
            .then(response => response.text())
            .then(markdown => {
                const html = marked.parse(markdown);
                document.getElementById(name + '-md').innerHTML = html;
            }).then(() => {
                // MathJax
                MathJax.typeset();
            })
            .catch(error => console.log(error));
    })

});

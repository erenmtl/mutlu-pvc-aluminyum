document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobil Menü Kontrolü
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.getElementById('navbar');

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('open');
            hamburgerBtn.classList.toggle('active', isOpen);
            hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                hamburgerBtn.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 2. Üst Menü Kaydırma Efekti
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2.5 Hero Vitrin Görsel Seçici (Gerçek Instagram Fotoğrafları)
    const heroThumbs = document.querySelectorAll('.hero-thumb');
    const heroMainImg = document.getElementById('heroMainImg');
    const heroBadgeTitle = document.getElementById('heroBadgeTitle');
    const heroBadgeSub = document.getElementById('heroBadgeSub');

    heroThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            heroThumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            const imgSrc = thumb.getAttribute('data-img');
            const title = thumb.getAttribute('data-title');
            const sub = thumb.getAttribute('data-sub');
            if (heroMainImg && imgSrc) heroMainImg.src = imgSrc;
            if (heroBadgeTitle && title) heroBadgeTitle.textContent = title;
            if (heroBadgeSub && sub) heroBadgeSub.textContent = sub;
        });
    });

    // 3. Proje Galerisi Kategori Filtreleme
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            projectCards.forEach(card => {
                const categories = card.getAttribute('data-category') || '';
                if (filterValue === 'all' || categories.includes(filterValue)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });

    // 3.5 Lightbox Modal (Proje Çoklu Fotoğraf & Video Görüntüleyici)
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxBody = document.getElementById('lightboxBody');
    const lightboxControls = document.getElementById('lightboxControls');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');

    let currentGallery = [];
    let currentGalleryIndex = 0;

    function renderGallerySlide() {
        if (!lightboxBody || currentGallery.length === 0) return;
        const src = currentGallery[currentGalleryIndex];
        lightboxBody.innerHTML = `<img src="${src}" alt="Proje Fotoğrafı ${currentGalleryIndex + 1}">`;
        if (lightboxCounter) {
            lightboxCounter.textContent = `${currentGalleryIndex + 1} / ${currentGallery.length}`;
        }
    }

    function openLightboxGallery(images, title) {
        currentGallery = images;
        currentGalleryIndex = 0;
        if (lightboxTitle) lightboxTitle.textContent = title || 'Proje Fotoğrafları';
        if (lightboxControls) {
            lightboxControls.style.display = images.length > 1 ? 'flex' : 'none';
        }
        renderGallerySlide();
        if (lightboxModal) {
            lightboxModal.classList.add('open');
            lightboxModal.setAttribute('aria-hidden', 'false');
        }
    }

    function openLightboxVideo(videoUrl, posterUrl, title) {
        currentGallery = [];
        if (lightboxTitle) lightboxTitle.textContent = title || 'Uygulama Videosu';
        if (lightboxControls) lightboxControls.style.display = 'none';
        if (lightboxBody) {
            lightboxBody.innerHTML = `
                <video controls autoplay playsinline poster="${posterUrl || ''}">
                    <source src="${videoUrl}" type="video/mp4">
                </video>
            `;
        }
        if (lightboxModal) {
            lightboxModal.classList.add('open');
            lightboxModal.setAttribute('aria-hidden', 'false');
        }
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('open');
        lightboxModal.setAttribute('aria-hidden', 'true');
        if (lightboxBody) {
            lightboxBody.innerHTML = '';
        }
    }

    document.querySelectorAll('.project-img-wrap').forEach(wrap => {
        wrap.addEventListener('click', () => {
            const videoUrl = wrap.getAttribute('data-video');
            const posterUrl = wrap.getAttribute('data-poster');
            const galleryStr = wrap.getAttribute('data-gallery');
            const title = wrap.getAttribute('data-title');

            if (videoUrl) {
                openLightboxVideo(videoUrl, posterUrl, title);
            } else if (galleryStr) {
                const imgs = galleryStr.split(',').map(s => s.trim()).filter(Boolean);
                openLightboxGallery(imgs, title);
            }
        });
    });

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => {
            if (currentGallery.length > 1) {
                currentGalleryIndex = (currentGalleryIndex - 1 + currentGallery.length) % currentGallery.length;
                renderGallerySlide();
            }
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => {
            if (currentGallery.length > 1) {
                currentGalleryIndex = (currentGalleryIndex + 1) % currentGallery.length;
                renderGallerySlide();
            }
        });
    }

    // Mobilde Lightbox içinde parmakla sağa/sola kaydırma (Swipe) desteği
    let touchStartX = 0;
    if (lightboxBody) {
        lightboxBody.addEventListener('touchstart', (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
                touchStartX = e.changedTouches[0].screenX;
            }
        }, { passive: true });

        lightboxBody.addEventListener('touchend', (e) => {
            if (currentGallery.length > 1 && e.changedTouches && e.changedTouches.length > 0) {
                const diffX = e.changedTouches[0].screenX - touchStartX;
                if (Math.abs(diffX) > 40) {
                    if (diffX < 0 && lightboxNext) {
                        lightboxNext.click();
                    } else if (diffX > 0 && lightboxPrev) {
                        lightboxPrev.click();
                    }
                }
            }
        }, { passive: true });
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (lightboxModal && lightboxModal.classList.contains('open') && currentGallery.length > 1) {
            if (e.key === 'ArrowLeft') lightboxPrev.click();
            if (e.key === 'ArrowRight') lightboxNext.click();
        }
    });

    // Sayfadaki Reels videolarından biri oynatıldığında diğerlerini duraklat
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(vid => {
        vid.addEventListener('play', () => {
            allVideos.forEach(other => {
                if (other !== vid && !other.paused) {
                    other.pause();
                }
            });
        });
    });

    // 4. Hizmet Kartlarından Teklif Formuna Hizmet Türü Aktarımı
    const serviceCtas = document.querySelectorAll('.service-cta');
    const serviceTypeSelect = document.getElementById('serviceType');
    const widthInput = document.getElementById('widthInput');

    serviceCtas.forEach(cta => {
        cta.addEventListener('click', () => {
            const targetService = cta.getAttribute('data-service');
            if (targetService && serviceTypeSelect) {
                serviceTypeSelect.value = targetService;
                setTimeout(() => {
                    if (widthInput) widthInput.focus();
                }, 500);
            }
        });
    });

    // 5. İnteraktif Ön Keşif ve WhatsApp Teklif Hesaplama Formu
    const quoteForm = document.getElementById('whatsappQuoteForm');
    const heightInput = document.getElementById('heightInput');
    const unitRadios = document.querySelectorAll('input[name="measureUnit"]');
    const unitLabels = document.querySelectorAll('.unit-label');
    const calculatedAreaEl = document.getElementById('calculatedArea');
    const locationSelect = document.getElementById('locationSelect');
    const extraNoteInput = document.getElementById('extraNote');

    function getSelectedUnit() {
        const checked = document.querySelector('input[name="measureUnit"]:checked');
        return checked ? checked.value : 'cm';
    }

    function updateUnitPlaceholders() {
        const unit = getSelectedUnit();
        unitLabels.forEach(lbl => {
            lbl.textContent = unit === 'cm' ? 'cm' : 'metre';
        });

        if (widthInput && heightInput) {
            if (unit === 'cm') {
                widthInput.placeholder = 'Örn: 450';
                heightInput.placeholder = 'Örn: 200';
            } else {
                widthInput.placeholder = 'Örn: 4.5';
                heightInput.placeholder = 'Örn: 2.0';
            }
        }
        updateAreaCalculation();
    }

    function updateAreaCalculation() {
        if (!widthInput || !heightInput || !calculatedAreaEl) return;

        const w = parseFloat(widthInput.value);
        const h = parseFloat(heightInput.value);
        const unit = getSelectedUnit();

        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
            let areaSqm = 0;
            if (unit === 'cm') {
                areaSqm = (w / 100) * (h / 100);
            } else {
                areaSqm = w * h;
            }
            const formattedArea = areaSqm.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            calculatedAreaEl.textContent = `${w} ${unit} × ${h} ${unit} (Yaklaşık ${formattedArea} m²)`;
        } else {
            calculatedAreaEl.textContent = 'Ölçü giriniz';
        }
    }

    unitRadios.forEach(radio => {
        radio.addEventListener('change', updateUnitPlaceholders);
    });

    if (widthInput && heightInput) {
        widthInput.addEventListener('input', updateAreaCalculation);
        heightInput.addEventListener('input', updateAreaCalculation);
    }

    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const service = serviceTypeSelect ? serviceTypeSelect.value : '';
            const unit = getSelectedUnit();
            const widthVal = widthInput ? widthInput.value.trim() : '';
            const heightVal = heightInput ? heightInput.value.trim() : '';
            const location = locationSelect ? locationSelect.value : '';
            const extraNote = extraNoteInput ? extraNoteInput.value.trim() : '';

            const w = parseFloat(widthVal);
            const h = parseFloat(heightVal);
            let areaInfo = '';

            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                const areaSqm = unit === 'cm' ? (w / 100) * (h / 100) : w * h;
                const formattedArea = areaSqm.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                areaInfo = ` (Yaklaşık ${formattedArea} m²)`;
            }

            const messageLines = [
                'Merhaba *Mutlu PVC ve Alüminyum*, web siteniz üzerinden ön keşif ve fiyat teklifi almak istiyorum:',
                '',
                `• *Hizmet Türü:* ${service}`,
                `• *Yaklaşık Ölçü:* Genişlik: ${widthVal} ${unit} x Yükseklik: ${heightVal} ${unit}${areaInfo}`,
                `• *İlçe / Bölge:* ${location}`
            ];

            if (extraNote) {
                messageLines.push(`• *Ek Detay:* ${extraNote}`);
            }

            messageLines.push('', 'Müsait olduğunuzda fiyat bilgisi paylaşabilir misiniz?');

            const encodedMessage = encodeURIComponent(messageLines.join('\n'));
            const whatsappUrl = `https://wa.me/905071908181?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        });
    }

    // Yıl bilgisini güncelle
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = String(new Date().getFullYear());
    }
});

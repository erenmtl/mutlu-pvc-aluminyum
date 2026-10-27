document.addEventListener('DOMContentLoaded', () => {
    // Yardımcı Güvenlik Fonksiyonları (XSS Sanitization & KVKK İsim Maskeleme)
    function sanitizeText(input, maxLen = 200) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/[\u0000-\u001F\u007F<>]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, maxLen);
    }

    function maskNameForKvkk(fullName) {
        const cleaned = sanitizeText(fullName, 60);
        if (!cleaned) return 'Müşteri';
        const parts = cleaned.split(' ').filter(Boolean);
        if (parts.length === 1) {
            return parts[0];
        }
        const titles = ['dr.', 'dr', 'av.', 'av', 'mimar', 'müh.', 'muh.'];
        return parts
            .map((part, idx) => {
                if (idx === 0) return part;
                if (idx === 1 && titles.includes(parts[0].toLowerCase())) return part;
                return part.charAt(0).toUpperCase() + '.';
            })
            .join(' ');
    }

    // 5 Saniyelik Cooldown / Debounce (Spam & Art Arda Tıklama Koruması)
    const activeCooldowns = new WeakMap();
    function applyButtonCooldown(buttonEl, seconds = 5) {
        if (!buttonEl) return;
        const labelEl = buttonEl.querySelector('.submit-btn-text');
        const originalText = labelEl ? labelEl.textContent : buttonEl.textContent;
        let remaining = seconds;

        buttonEl.disabled = true;
        buttonEl.classList.add('btn-cooldown');
        activeCooldowns.set(buttonEl, true);

        const updateLabel = () => {
            const msg = `Gönderildi • Lütfen bekleyin (${remaining} sn)`;
            if (labelEl) {
                labelEl.textContent = msg;
            } else {
                buttonEl.textContent = msg;
            }
        };
        updateLabel();

        const timer = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(timer);
                buttonEl.disabled = false;
                buttonEl.classList.remove('btn-cooldown');
                activeCooldowns.delete(buttonEl);
                if (labelEl) {
                    labelEl.textContent = originalText;
                } else {
                    buttonEl.textContent = originalText;
                }
            } else {
                updateLabel();
            }
        }, 1000);
    }

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
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

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
            if (heroMainImg && imgSrc) heroMainImg.setAttribute('src', imgSrc);
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

    // 3.5 Lightbox Modal (XSS Güvenli DOM API ile Fotoğraf & Video Görüntüleyici)
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

    function clearElement(el) {
        if (!el) return;
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    function renderGallerySlide() {
        if (!lightboxBody || currentGallery.length === 0) return;
        clearElement(lightboxBody);

        const src = currentGallery[currentGalleryIndex];
        const imgEl = document.createElement('img');
        imgEl.setAttribute('src', src);
        imgEl.setAttribute('alt', `Proje Fotoğrafı ${currentGalleryIndex + 1}`);
        imgEl.setAttribute('draggable', 'false');
        imgEl.addEventListener('contextmenu', e => e.preventDefault());
        lightboxBody.appendChild(imgEl);

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
            clearElement(lightboxBody);
            const videoEl = document.createElement('video');
            videoEl.controls = true;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.setAttribute('controlsList', 'nodownload');
            if (posterUrl) {
                videoEl.setAttribute('poster', posterUrl);
            }
            videoEl.addEventListener('contextmenu', e => e.preventDefault());

            const sourceEl = document.createElement('source');
            sourceEl.setAttribute('src', videoUrl);
            sourceEl.setAttribute('type', 'video/mp4');
            videoEl.appendChild(sourceEl);
            lightboxBody.appendChild(videoEl);
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
        clearElement(lightboxBody);
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
            if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
            if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
        }
    });

    // Sayfadaki Reels videolarından biri oynatıldığında diğerlerini duraklat
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(vid => {
        vid.setAttribute('controlsList', 'nodownload');
        vid.addEventListener('play', () => {
            allVideos.forEach(other => {
                if (other !== vid && !other.paused) {
                    other.pause();
                }
            });
        });
    });

    // Görsel & Video Kopyalama Koruması (Sağ Tık ve Sürükleme Engelleme)
    const protectedMediaSelectors = '.showcase-img, .hero-thumb img, .project-img-wrap, .project-img-wrap img, .reel-video-box, .reel-video-box video, .lightbox-body';
    document.querySelectorAll(protectedMediaSelectors).forEach(el => {
        el.setAttribute('draggable', 'false');
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        el.addEventListener('dragstart', (e) => {
            e.preventDefault();
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

    // 5. İnteraktif Ön Keşif ve WhatsApp Teklif Hesaplama Formu (XSS & Spam Korumalı)
    const quoteForm = document.getElementById('whatsappQuoteForm');
    const heightInput = document.getElementById('heightInput');
    const unitRadios = document.querySelectorAll('input[name="measureUnit"]');
    const unitLabels = document.querySelectorAll('.unit-label');
    const calculatedAreaEl = document.getElementById('calculatedArea');
    const locationSelect = document.getElementById('locationSelect');
    const extraNoteInput = document.getElementById('extraNote');
    const quoteWebsiteHp = document.getElementById('quoteWebsiteHp');
    const quoteSubmitBtn = document.getElementById('quoteSubmitBtn');

    function getSelectedUnit() {
        const checked = document.querySelector('input[name="measureUnit"]:checked');
        return checked && checked.value === 'metre' ? 'metre' : 'cm';
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

        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && w <= 100000 && h <= 100000) {
            const areaSqm = unit === 'cm' ? (w / 100) * (h / 100) : w * h;
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

            // Honeypot Bot Kontrolü
            if (quoteWebsiteHp && quoteWebsiteHp.value.trim() !== '') {
                return;
            }

            // 5 Saniye Rate-Limit / Cooldown Kontrolü
            const submitButton = quoteSubmitBtn || quoteForm.querySelector('button[type="submit"]');
            if (submitButton && activeCooldowns.get(submitButton)) {
                return;
            }

            const service = sanitizeText(serviceTypeSelect ? serviceTypeSelect.value : '', 80);
            const unit = getSelectedUnit();
            const widthVal = sanitizeText(widthInput ? widthInput.value : '', 12);
            const heightVal = sanitizeText(heightInput ? heightInput.value : '', 12);
            const location = sanitizeText(locationSelect ? locationSelect.value : '', 80);
            const extraNote = sanitizeText(extraNoteInput ? extraNoteInput.value : '', 180);

            const w = parseFloat(widthVal);
            const h = parseFloat(heightVal);
            if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
                return;
            }

            const areaSqm = unit === 'cm' ? (w / 100) * (h / 100) : w * h;
            const formattedArea = areaSqm.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const areaInfo = ` (Yaklaşık ${formattedArea} m²)`;

            const messageLines = [
                'Merhaba *Mutlu PVC ve Alüminyum*, web siteniz üzerinden ön keşif ve fiyat teklifi almak istiyorum:',
                '',
                `• *Hizmet Türü:* ${service}`,
                `• *Yaklaşık Ölçü:* Genişlik: ${w} ${unit} x Yükseklik: ${h} ${unit}${areaInfo}`,
                `• *İlçe / Bölge:* ${location}`
            ];

            if (extraNote) {
                messageLines.push(`• *Ek Detay:* ${extraNote}`);
            }

            messageLines.push('', 'Müsait olduğunuzda fiyat bilgisi paylaşabilir misiniz?');

            const encodedMessage = encodeURIComponent(messageLines.join('\n'));
            const whatsappUrl = `https://wa.me/905071908181?text=${encodedMessage}`;

            if (submitButton) {
                applyButtonCooldown(submitButton, 5);
            }

            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        });
    }

    // Yıl bilgisini güncelle
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = String(new Date().getFullYear());
    }

    // 6. Müşteri Geri Bildirim ve Yıldız Değerlendirme Sistemi (XSS & KVKK Korumalı)
    const starBtns = document.querySelectorAll('#starSelector .star-btn');
    const feedbackRatingInput = document.getElementById('feedbackRating');
    const starRatingLabel = document.getElementById('starRatingLabel');
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackSuccessMsg = document.getElementById('feedbackSuccessMsg');
    const reviewsGrid = document.getElementById('reviewsGrid');
    const feedbackWebsiteHp = document.getElementById('feedbackWebsiteHp');
    const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');

    const ratingDescriptions = {
        1: '1 / 5 - Geliştirilmeli',
        2: '2 / 5 - Orta',
        3: '3 / 5 - İyi',
        4: '4 / 5 - Memnunum',
        5: '5 / 5 - Çok Memnunum'
    };

    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = parseInt(btn.getAttribute('data-rating') || '5', 10);
            if (feedbackRatingInput) feedbackRatingInput.value = String(rating);
            if (starRatingLabel) starRatingLabel.textContent = ratingDescriptions[rating] || '5 / 5';

            starBtns.forEach(b => {
                const bVal = parseInt(b.getAttribute('data-rating') || '0', 10);
                b.classList.toggle('active', bVal <= rating);
            });
        });
    });

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Honeypot Bot Kontrolü
            if (feedbackWebsiteHp && feedbackWebsiteHp.value.trim() !== '') {
                return;
            }

            // 5 Saniye Cooldown Kontrolü
            const submitButton = feedbackSubmitBtn || feedbackForm.querySelector('button[type="submit"]');
            if (submitButton && activeCooldowns.get(submitButton)) {
                return;
            }

            const rawName = sanitizeText(document.getElementById('feedbackName')?.value || '', 60);
            const maskedName = maskNameForKvkk(rawName);
            const category = sanitizeText(document.getElementById('feedbackCategory')?.value || 'Müşteri Memnuniyeti', 80);
            const service = sanitizeText(document.getElementById('feedbackService')?.value || '', 80);
            const region = sanitizeText(document.getElementById('feedbackRegion')?.value || 'Düzce', 60) || 'Düzce';
            const message = sanitizeText(document.getElementById('feedbackMessage')?.value || '', 500);
            const rawRating = parseInt(feedbackRatingInput?.value || '5', 10);
            const rating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, rawRating)) : 5;
            const starsVisual = '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));

            if (!rawName || !message) return;

            // XSS Güvenli DOM Oluşturma (innerHTML kullanmadan sadece textContent ile)
            if (reviewsGrid && rating >= 4) {
                const initials = maskedName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(part => part.charAt(0).toUpperCase() + '.')
                    .join('');

                const newCard = document.createElement('article');
                newCard.className = 'review-card';

                const topDiv = document.createElement('div');
                topDiv.className = 'review-card-top';

                const authorDiv = document.createElement('div');
                authorDiv.className = 'review-author';

                const avatarSpan = document.createElement('span');
                avatarSpan.className = 'author-avatar';
                avatarSpan.textContent = initials || 'M.M.';

                const authorMetaDiv = document.createElement('div');
                const h4El = document.createElement('h4');
                h4El.textContent = maskedName;
                const metaSpan = document.createElement('span');
                metaSpan.textContent = `${region} • ${service}`;

                authorMetaDiv.appendChild(h4El);
                authorMetaDiv.appendChild(metaSpan);
                authorDiv.appendChild(avatarSpan);
                authorDiv.appendChild(authorMetaDiv);

                const starsSpan = document.createElement('span');
                starsSpan.className = 'review-stars';
                starsSpan.setAttribute('aria-label', `${rating} Yıldız`);
                starsSpan.textContent = '★'.repeat(rating);

                topDiv.appendChild(authorDiv);
                topDiv.appendChild(starsSpan);

                const textP = document.createElement('p');
                textP.className = 'review-text';
                textP.textContent = `"${message}"`;

                const badgeSpan = document.createElement('span');
                badgeSpan.className = 'review-badge';
                badgeSpan.textContent = `Yeni Geri Bildirim • ${service}`;

                newCard.appendChild(topDiv);
                newCard.appendChild(textP);
                newCard.appendChild(badgeSpan);

                reviewsGrid.prepend(newCard);
            }

            if (feedbackSuccessMsg) {
                feedbackSuccessMsg.hidden = false;
            }

            if (submitButton) {
                applyButtonCooldown(submitButton, 5);
            }

            const waLines = [
                'Merhaba *Mutlu PVC ve Alüminyum*, web siteniz üzerinden geri bildirim / değerlendirme gönderiyorum:',
                '',
                `• *Ad Soyad:* ${rawName}`,
                `• *Konu:* ${category}`,
                `• *Memnuniyet Puanı:* ${starsVisual} (${rating}/5)`,
                `• *İlgili Hizmet:* ${service}`,
                `• *Bölge:* ${region}`,
                `• *Mesaj:* ${message}`
            ];

            const waUrl = `https://wa.me/905071908181?text=${encodeURIComponent(waLines.join('\n'))}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');

            feedbackForm.reset();
            if (feedbackRatingInput) feedbackRatingInput.value = '5';
            if (starRatingLabel) starRatingLabel.textContent = ratingDescriptions[5];
            starBtns.forEach(b => b.classList.add('active'));
        });
    }

    // 7. Yasal Metinler Modalı (KVKK, Gizlilik, Çerez Politikası, Ön Keşif Koşulları)
    const legalModal = document.getElementById('legalModal');
    const legalBackdrop = document.getElementById('legalBackdrop');
    const legalModalClose = document.getElementById('legalModalClose');
    const legalTabBtns = document.querySelectorAll('.legal-tab-btn');
    const legalTabPanels = document.querySelectorAll('.legal-tab-panel');
    const openLegalTriggers = document.querySelectorAll('[data-open-legal]');

    function switchLegalTab(tabKey) {
        legalTabBtns.forEach(btn => {
            const isMatch = btn.getAttribute('data-legal-tab') === tabKey;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-selected', String(isMatch));
        });

        legalTabPanels.forEach(panel => {
            const isMatch = panel.id === `legal-panel-${tabKey}`;
            panel.classList.toggle('active', isMatch);
        });
    }

    function openLegalModal(tabKey) {
        if (!legalModal) return;
        switchLegalTab(tabKey || 'kvkk');
        legalModal.classList.add('open');
        legalModal.setAttribute('aria-hidden', 'false');
    }

    function closeLegalModal() {
        if (!legalModal) return;
        legalModal.classList.remove('open');
        legalModal.setAttribute('aria-hidden', 'true');
    }

    openLegalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetTab = trigger.getAttribute('data-open-legal') || 'kvkk';
            openLegalModal(targetTab);
        });
    });

    legalTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabKey = btn.getAttribute('data-legal-tab');
            if (tabKey) switchLegalTab(tabKey);
        });
    });

    if (legalModalClose) legalModalClose.addEventListener('click', closeLegalModal);
    if (legalBackdrop) legalBackdrop.addEventListener('click', closeLegalModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && legalModal && legalModal.classList.contains('open')) {
            closeLegalModal();
        }
    });

    // 8. Çerez (Cookie) Onay ve Tercih Yönetimi
    const COOKIE_STORAGE_KEY = 'mutlu_pvc_cookie_consent_v1';
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAcceptAllBtn = document.getElementById('cookieAcceptAllBtn');
    const cookieNecessaryBtn = document.getElementById('cookieNecessaryBtn');
    const saveCookiePrefsBtn = document.getElementById('saveCookiePrefsBtn');
    const acceptAllCookiesModalBtn = document.getElementById('acceptAllCookiesModalBtn');
    const openCookieSettingsBtn = document.getElementById('openCookieSettingsBtn');
    const cookiePrefFunctional = document.getElementById('cookiePrefFunctional');
    const cookiePrefAnalytics = document.getElementById('cookiePrefAnalytics');

    function saveCookieConsent(preferences) {
        const payload = {
            necessary: true,
            functional: Boolean(preferences.functional),
            analytics: Boolean(preferences.analytics),
            updatedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
        } catch (_) {
            // Özel tarama modunda localStorage kapalıysa sessizce devam et
        }
        if (cookieBanner) {
            cookieBanner.hidden = true;
        }
        closeLegalModal();
    }

    function loadCookieConsent() {
        try {
            const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    }

    const existingConsent = loadCookieConsent();
    if (!existingConsent) {
        setTimeout(() => {
            if (cookieBanner) cookieBanner.hidden = false;
        }, 500);
    } else {
        if (cookiePrefFunctional) cookiePrefFunctional.checked = Boolean(existingConsent.functional);
        if (cookiePrefAnalytics) cookiePrefAnalytics.checked = Boolean(existingConsent.analytics);
    }

    if (cookieAcceptAllBtn) {
        cookieAcceptAllBtn.addEventListener('click', () => {
            if (cookiePrefFunctional) cookiePrefFunctional.checked = true;
            if (cookiePrefAnalytics) cookiePrefAnalytics.checked = true;
            saveCookieConsent({ functional: true, analytics: true });
        });
    }

    if (acceptAllCookiesModalBtn) {
        acceptAllCookiesModalBtn.addEventListener('click', () => {
            if (cookiePrefFunctional) cookiePrefFunctional.checked = true;
            if (cookiePrefAnalytics) cookiePrefAnalytics.checked = true;
            saveCookieConsent({ functional: true, analytics: true });
        });
    }

    if (cookieNecessaryBtn) {
        cookieNecessaryBtn.addEventListener('click', () => {
            if (cookiePrefFunctional) cookiePrefFunctional.checked = false;
            if (cookiePrefAnalytics) cookiePrefAnalytics.checked = false;
            saveCookieConsent({ functional: false, analytics: false });
        });
    }

    if (saveCookiePrefsBtn) {
        saveCookiePrefsBtn.addEventListener('click', () => {
            saveCookieConsent({
                functional: cookiePrefFunctional ? cookiePrefFunctional.checked : true,
                analytics: cookiePrefAnalytics ? cookiePrefAnalytics.checked : false
            });
        });
    }

    if (openCookieSettingsBtn) {
        openCookieSettingsBtn.addEventListener('click', () => {
            openLegalModal('cerez');
        });
    }

    // 9. Bireysel / Müteahhit (B2B) Teklif Sekmeleri & B2B Form Gönderimi
    const quoteModeTabs = document.querySelectorAll('.quote-mode-tab');
    const b2bQuoteForm = document.getElementById('b2bQuoteForm');
    const b2bWebsiteHp = document.getElementById('b2bWebsiteHp');
    const b2bSubmitBtn = document.getElementById('b2bSubmitBtn');

    function switchQuoteModeTab(mode) {
        quoteModeTabs.forEach(tab => {
            const isMatch = tab.getAttribute('data-quote-tab') === mode;
            tab.classList.toggle('active', isMatch);
            tab.setAttribute('aria-selected', String(isMatch));
        });

        if (quoteForm && b2bQuoteForm) {
            if (mode === 'b2b') {
                quoteForm.hidden = true;
                b2bQuoteForm.hidden = false;
            } else {
                quoteForm.hidden = false;
                b2bQuoteForm.hidden = true;
            }
        }
    }

    quoteModeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.getAttribute('data-quote-tab') || 'individual';
            switchQuoteModeTab(mode);
        });
    });

    if (b2bQuoteForm) {
        b2bQuoteForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Honeypot Bot Kontrolü
            if (b2bWebsiteHp && b2bWebsiteHp.value.trim() !== '') {
                return;
            }

            // 5 Saniye Rate-Limit / Cooldown Kontrolü
            const submitButton = b2bSubmitBtn || b2bQuoteForm.querySelector('button[type="submit"]');
            if (submitButton && activeCooldowns.get(submitButton)) {
                return;
            }

            const companyName = sanitizeText(document.getElementById('b2bCompanyName')?.value || '', 80);
            const projectLocation = sanitizeText(document.getElementById('b2bLocation')?.value || '', 80);
            const projectScope = sanitizeText(document.getElementById('b2bProjectScope')?.value || '', 120);
            const extraNote = sanitizeText(document.getElementById('b2bExtraNote')?.value || '', 200);

            const checkedItems = Array.from(b2bQuoteForm.querySelectorAll('input[name="b2bItem"]:checked'))
                .map(cb => sanitizeText(cb.value, 60))
                .filter(Boolean);

            if (!companyName || !projectLocation || !projectScope) {
                return;
            }

            const itemsSummary = checkedItems.length > 0
                ? checkedItems.join(', ')
                : 'Belirtilmedi (Keşifte netleştirilecek)';

            const b2bLines = [
                'Merhaba *Mutlu PVC ve Alüminyum*, kurumsal *Müteahhit / Toplu Proje (B2B)* kapsamında şantiye fiyat teklifi almak istiyoruz:',
                '',
                `• *Firma / Yetkili:* ${companyName}`,
                `• *Proje Bölgesi:* ${projectLocation}`,
                `• *Proje Kapsamı:* ${projectScope}`,
                `• *İstenen Kalemler:* ${itemsSummary}`
            ];

            if (extraNote) {
                b2bLines.push(`• *Proje Notu / Takvim:* ${extraNote}`);
            }

            b2bLines.push(
                '',
                'Mimari projemizi ve keşif listemizi WhatsApp üzerinden paylaşmak istiyoruz.'
            );

            const waUrl = `https://wa.me/905071908181?text=${encodeURIComponent(b2bLines.join('\n'))}`;

            if (submitButton) {
                applyButtonCooldown(submitButton, 5);
            }

            window.open(waUrl, '_blank', 'noopener,noreferrer');
        });
    }

    // 10. İnteraktif Cam ve Profil Renk Kartelası (Görsel Önizlemeli Simülatör)
    const profileSwatches = document.querySelectorAll('#profileSwatches .swatch-btn');
    const glassSwatches = document.querySelectorAll('#glassSwatches .glass-btn');
    const previewStage = document.getElementById('previewStage');
    const previewProfileBadge = document.getElementById('previewProfileBadge');
    const previewGlassBadge = document.getElementById('previewGlassBadge');
    const previewComboTitle = document.getElementById('previewComboTitle');
    const previewFacadeText = document.getElementById('previewFacadeText');
    const previewAdvantageText = document.getElementById('previewAdvantageText');
    const metricThermalVal = document.getElementById('metricThermalVal');
    const metricThermalBar = document.getElementById('metricThermalBar');
    const metricSolarVal = document.getElementById('metricSolarVal');
    const metricSolarBar = document.getElementById('metricSolarBar');
    const metricPrivacyVal = document.getElementById('metricPrivacyVal');
    const metricPrivacyBar = document.getElementById('metricPrivacyBar');
    const applyComboToQuoteBtn = document.getElementById('applyComboToQuoteBtn');

    const profileCatalog = {
        'antrasit': {
            name: 'Antrasit Gri Profil',
            short: 'Antrasit Gri',
            note: 'Modern rezidans, yeni nesil konut ve kış bahçesi cephelerine tam uyum sağlar, leke ve tozu belli etmez.'
        },
        'altin-mese': {
            name: 'Altın Meşe (Ahşap Desen) Profil',
            short: 'Altın Meşe / Ahşap Desen',
            note: 'Villa, bahçe katı, teras ve doğayla iç içe müstakil projelerde sıcak ahşap estetiği sunar.'
        },
        'beyaz': {
            name: 'Klasik Beyaz Profil',
            short: 'Klasik Beyaz',
            note: 'Aydınlık, ferah ve mevcut PVC doğramalarla %100 bütünlük sağlayan zamansız görünüm sunar.'
        },
        'bronz': {
            name: 'Bronz / Eloksal Profil',
            short: 'Bronz / Eloksal',
            note: 'Prestijli dış cephelerde, kafe/restoran ve sıcak tonlu bina kaplamalarında korozyona tam direnç sağlar.'
        },
        'siyah': {
            name: 'Mat Siyah Minimal Profil',
            short: 'Mat Siyah',
            note: 'Ticari dükkan vitrinleri, loft daireler ve modern kış bahçelerinde keskin mimari çerçeve etkisi yaratır.'
        }
    };

    const glassCatalog = {
        'fume': {
            name: '8mm Füme Temperli Cam',
            short: '8mm Füme Temperli',
            facade: 'Güney ve Batı cepheli, yoğun güneş alan balkonlar ve kış bahçesi tavan/cepheleri için önerilir.',
            advantage: 'Güneşin yakıcı UV etkisini ve parlamayı kırar, gündüz saatlerinde dışarıdan içerinin görünmesini azaltarak mahremiyet sağlar.',
            thermalLabel: '%88 Yüksek',
            thermalPct: 88,
            solarLabel: '%85 Güneş Kırıcı',
            solarPct: 85,
            privacyLabel: '%80 Gündüz Mahremiyeti',
            privacyPct: 80
        },
        'seffaf': {
            name: '8mm / 10mm Şeffaf Temperli Cam',
            short: '8mm/10mm Şeffaf Temperli',
            facade: 'Kuzey ve Doğu cepheli balkonlar, manzaralı teraslar ve gün ışığından maksimum faydalanmak isteyen daireler için önerilir.',
            advantage: 'Panoramik manzarayı hiç kesmez, doğal gün ışığını %95 oranında içeri alır ve darbe dayanımı yüksek temperli güvenlik sunar.',
            thermalLabel: '%82 Standart+',
            thermalPct: 82,
            solarLabel: '%45 Doğal Işık Odaklı',
            solarPct: 45,
            privacyLabel: '%40 Tam Şeffaf',
            privacyPct: 40
        },
        'bronz': {
            name: '8mm Bronz Temperli Cam',
            short: '8mm Bronz Temperli',
            facade: 'Güney, Doğu ve Batı cephelerde sıcak, loş ve dinlendirici bir balkon atmosferi arayan konut ve villalar için önerilir.',
            advantage: 'Göz yoran parlak ışığı yumuşak kehribar-bronz tonuyla filtreler; özellikle ahşap desen, bronz ve antrasit profillerle üst düzey uyum yakalar.',
            thermalLabel: '%86 Yüksek',
            thermalPct: 86,
            solarLabel: '%80 UV & Parlama Kontrolü',
            solarPct: 80,
            privacyLabel: '%75 Dengeli Mahremiyet',
            privacyPct: 75
        },
        'reflekte': {
            name: 'Reflekte (Aynalı) Temperli Cam',
            short: 'Reflekte / Aynalı Cam',
            facade: 'Cadde üzeri giriş/ara kat daireler, komşu binalara yakın balkonlar ve yoğun güneş alan ticari cepheler için önerilir.',
            advantage: 'Dış yüzeyi ayna efekti vererek gündüz dışarıdan içerinin görünmesini maksimum düzeyde engeller ve güneş ısısını geri yansıtır.',
            thermalLabel: '%90 Çok Yüksek',
            thermalPct: 90,
            solarLabel: '%92 Maksimum Güneş Kalkanı',
            solarPct: 92,
            privacyLabel: '%95 Maksimum Mahremiyet',
            privacyPct: 95
        },
        'isicam': {
            name: 'Isıcam Konfor (Çift Camlı 4+16+4 Sistem)',
            short: 'Isıcam Konfor (Çift Cam)',
            facade: 'Balkonunu evin bir odasına katmak isteyen tüm cepheler (Kuzey/Güney), kış bahçeleri ve yüksek ses/ısı yalıtımı arayan projeler için önerilir.',
            advantage: 'Tek cama göre ısı kaybını %50’ye varan oranda azaltır; kışın sıcak, yazın serin tutar, terleme/buğulanmayı ve dış gürültüyü minimuma indirir.',
            thermalLabel: '%98 Maksimum (Dört Mevsim Oda)',
            thermalPct: 98,
            solarLabel: '%88 Konfor Cam Kontrolü',
            solarPct: 88,
            privacyLabel: '%70 Çift Cam Yansıma',
            privacyPct: 70
        }
    };

    let selectedProfileKey = 'antrasit';
    let selectedGlassKey = 'fume';

    function updateConfiguratorPreview() {
        const pInfo = profileCatalog[selectedProfileKey] || profileCatalog['antrasit'];
        const gInfo = glassCatalog[selectedGlassKey] || glassCatalog['fume'];

        if (previewStage) {
            previewStage.setAttribute('data-profile-theme', selectedProfileKey);
            previewStage.setAttribute('data-glass-theme', selectedGlassKey);
        }

        if (previewProfileBadge) previewProfileBadge.textContent = `Profil: ${pInfo.short}`;
        if (previewGlassBadge) previewGlassBadge.textContent = `Cam: ${gInfo.short}`;
        if (previewComboTitle) previewComboTitle.textContent = `${pInfo.name} + ${gInfo.name}`;
        if (previewFacadeText) {
            previewFacadeText.textContent = `${gInfo.facade} ${pInfo.note}`;
        }
        if (previewAdvantageText) {
            previewAdvantageText.textContent = gInfo.advantage;
        }

        if (metricThermalVal) metricThermalVal.textContent = gInfo.thermalLabel;
        if (metricThermalBar) metricThermalBar.style.width = `${gInfo.thermalPct}%`;

        if (metricSolarVal) metricSolarVal.textContent = gInfo.solarLabel;
        if (metricSolarBar) metricSolarBar.style.width = `${gInfo.solarPct}%`;

        if (metricPrivacyVal) metricPrivacyVal.textContent = gInfo.privacyLabel;
        if (metricPrivacyBar) metricPrivacyBar.style.width = `${gInfo.privacyPct}%`;
    }

    profileSwatches.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-profile');
            if (!key || !profileCatalog[key]) return;
            selectedProfileKey = key;

            profileSwatches.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-checked', String(isActive));
            });

            updateConfiguratorPreview();
        });
    });

    glassSwatches.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-glass');
            if (!key || !glassCatalog[key]) return;
            selectedGlassKey = key;

            glassSwatches.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-checked', String(isActive));
            });

            updateConfiguratorPreview();
        });
    });

    if (applyComboToQuoteBtn) {
        applyComboToQuoteBtn.addEventListener('click', () => {
            const pInfo = profileCatalog[selectedProfileKey] || profileCatalog['antrasit'];
            const gInfo = glassCatalog[selectedGlassKey] || glassCatalog['fume'];

            switchQuoteModeTab('individual');
            if (serviceTypeSelect) {
                serviceTypeSelect.value = 'Cam Balkon';
            }
            if (extraNoteInput) {
                extraNoteInput.value = `Seçilen Kombinasyon: ${pInfo.short} Profil + ${gInfo.short}`;
            }

            const quoteSection = document.getElementById('teklif-hesaplama');
            if (quoteSection) {
                quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setTimeout(() => {
                if (widthInput) widthInput.focus();
            }, 600);
        });
    }

    // 11. "Hangi Cam Balkon Sistemi Size Uygun?" Karşılaştırma Tablosu
    const compareTabBtns = document.querySelectorAll('#compareMobileTabs .compare-tab-btn');
    const comparisonTable = document.getElementById('systemComparisonTable');
    const compareSelectBtns = document.querySelectorAll('.compare-select-btn');

    compareTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const colId = btn.getAttribute('data-compare-col');
            if (!colId || !comparisonTable) return;

            compareTabBtns.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-selected', String(isActive));
            });

            comparisonTable.querySelectorAll('[data-col]').forEach(cell => {
                const isMatch = cell.getAttribute('data-col') === colId;
                cell.classList.toggle('is-active-col', isMatch);
            });
        });
    });

    compareSelectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetService = btn.getAttribute('data-compare-service') || 'Cam Balkon';
            const targetNote = btn.getAttribute('data-compare-note') || '';

            switchQuoteModeTab('individual');

            if (serviceTypeSelect) {
                serviceTypeSelect.value = targetService;
            }
            if (extraNoteInput && targetNote) {
                extraNoteInput.value = targetNote;
            }

            const quoteSection = document.getElementById('teklif-hesaplama');
            if (quoteSection) {
                quoteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setTimeout(() => {
                if (widthInput) widthInput.focus();
            }, 600);
        });
    });
});

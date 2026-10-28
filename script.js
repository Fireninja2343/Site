const discordUserTag = "fireninja.";

/* Masonry instance for the gallery grid. Assigned once images have loaded
   and re-used by media-swap handlers to re-run layout after a card's
   size changes (e.g. swapping between an image and a video variant). */
let masonryInstance;

/* Fallback placeholder images shown when a real asset fails to load. */
const RENDER_FALLBACK_IMG = "https://placehold.co/600x600/0f121d/f97316?text=Render";
const VARIATION_FALLBACK_IMG = "https://placehold.co/150x100/0f121d/f97316?text=View";

/* Thin wrapper over analytics.js's fnTrackEvent: bumps the countapi
   counter for this interaction and mirrors the event into Umami.
   Falls back to Umami-only if analytics.js didn't load. */
function trackEvent(counterKey, umamiName, umamiData) {
    if (window.fnTrackEvent) return window.fnTrackEvent(counterKey, umamiName, umamiData);
    if (umamiName && window.umami) window.umami.track(umamiName, umamiData);
}

const linksDatabase = [
    {
        title: "AniList Profile",
        subtitle: "Tracking my anime and manga stats",
        url: "https://anilist.co/user/Fireninja/",
        iconClass: "fa-solid fa-tv"
    },
    {
        title: "The Storygraph Hub",
        subtitle: "Tracking my reading stats",
        url: "https://app.thestorygraph.com/profile/fireninja",
        iconClass: "fa-solid fa-book-open"
    },
    {
        title: "Last.fm Profile",
        subtitle: "Tracking my music listening stats",
        url: "https://www.last.fm/user/Fireninja2343",
        iconClass: "fa-brands fa-lastfm"
    },
    {
        title:"Tagify Profile",
        subtitle: "Tagging my music",
        url: "https://community.tagify.fm/@fireninja",
        iconClass: "fa-solid fa-tag"
    }
];

/* Creates a <video> element configured for autoplaying, looping,
   muted, inline preview playback. Used anywhere a render variant
   needs to be swapped in or newly displayed as a video. */
function createVideoElement(id, className, src) {
    const vid = document.createElement('video');
    vid.id = id;
    vid.className = className;
    vid.src = src;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.setAttribute('playsinline', '');
    return vid;
}

/* Creates an <img> element with the shared render fallback wired up
   to onerror. Used anywhere a render variant needs to be swapped in
   or newly displayed as an image. */
function createImageElement(id, className, src, alt) {
    const img = document.createElement('img');
    img.id = id;
    img.className = className;
    img.src = src;
    img.alt = alt || '';
    img.onerror = () => { img.src = RENDER_FALLBACK_IMG; };
    return img;
}

/* Populates the nav links grid from linksDatabase. */
function bootstrapLinks() {
    const container = document.getElementById('links-container');
    container.innerHTML = '';
    linksDatabase.forEach(link => {
        const anchor = document.createElement('a');
        anchor.className = 'social-link-item';
        anchor.href = link.url;
        anchor.target = '_blank';
        anchor.setAttribute('data-umami-event', 'Link Click');
        anchor.setAttribute('data-umami-event-target', link.title);
        anchor.addEventListener('click', () => {
            trackEvent('fn-portfolio-ev-link-click', 'Link Click', { target: link.title });
        });
        anchor.innerHTML = `
            <div class="link-icon-box">
                <i class="${link.iconClass}"></i>
            </div>
            <div class="link-details">
                <span class="link-main-title">${link.title}</span>
                <span class="link-sub-title">${link.subtitle}</span>
            </div>
            <i class="fa-solid fa-arrow-right arrow-indicator"></i>
        `;
        container.appendChild(anchor);
    });
}

/* Attaches countdown-timer behavior to a video element, updating the
   given <span> with the remaining playback time (mm:ss). Shared by
   both gallery card thumbnails and the lightbox video view. */
function attachVideoTimer(vid, timer) {
    vid.addEventListener('loadedmetadata', () => {
        const duration = Math.floor(vid.duration);
        const mins = String(Math.floor(duration / 60)).padStart(2, '0');
        const secs = String(duration % 60).padStart(2, '0');
        timer.innerText = `${mins}:${secs}`;
    });
    vid.addEventListener('timeupdate', () => {
        const remaining = Math.floor(vid.duration - vid.currentTime);
        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
        const secs = String(remaining % 60).padStart(2, '0');
        timer.innerText = `${mins}:${secs}`;
    });
}

/* Creates and attaches a video countdown timer to the lightbox viewport,
   replacing any timer left over from a previous variant. */
function createLightboxTimer(vid) {
    document.getElementById('lightbox-video-timer')?.remove();
    const timer = document.createElement('span');
    timer.id = 'lightbox-video-timer';
    timer.className = 'video-timer';
    timer.innerText = '00:00';
    document.querySelector('.lightbox-viewport').appendChild(timer);
    attachVideoTimer(vid, timer);
}

/* Populates the masonry gallery from rendersDatabase (defined in images.js),
   wiring up each card's click-to-open-lightbox behavior and, where a render
   has multiple variations, its mini variation-swapper thumbnails. */
function bootstrapGallery() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = '';

    rendersDatabase.forEach((render, index) => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.id = `gallery-card-${index}`;
        card.onclick = (e) => {
            if (e.target.closest('.mini-swapper-box')) return;
            revealLightbox(index);
        };

        const isVideo = render.mainImg.toLowerCase().includes('.mp4');

        card.innerHTML = `
            ${isVideo
                ? `<video class="render-thumbnail" id="card-img-${index}" src="${render.mainImg}"
                        autoplay loop muted playsinline
                        onerror="this.style.display='none'"></video>`
                : `<img class="render-thumbnail" id="card-img-${index}" src="${render.mainImg}" alt="${render.title}"
                        onerror="this.src='${RENDER_FALLBACK_IMG}'">`
            }
            <div class="card-hover-overlay ${render.variations && render.variations.length > 1 ? '' : 'no-variants'}">
                <span class="overlay-title">${render.title}</span>
                <span class="overlay-variant-count ${render.variations && render.variations.length > 1 ? '' : 'no-variants'}">
                    <i class="fa-solid fa-images"></i> ${render.variations ? render.variations.length : 1} Views
                </span>
            </div>
            <div class="card-variations-bar" id="indicator-bar-${index}"></div>
        `;

        // Countdown timer for video cards, using the shared timer helper.
        if (isVideo) {
            const timer = document.createElement('span');
            timer.className = 'video-timer';
            timer.innerText = '00:00';
            card.appendChild(timer);

            attachVideoTimer(card.querySelector('.render-thumbnail'), timer);
        }

        container.appendChild(card);

        // Inject mini variation swapper thumbnails into the indicator bar.
        const bar = document.getElementById(`indicator-bar-${index}`);
        if (render.variations && render.variations.length > 1) {
            render.variations.forEach((variant, vIdx) => {
                const isVarVideo = variant.type === "video";
                const variantSrc = isVarVideo ? variant.thumb : variant.url;
                const box = document.createElement('div');
                box.className = `mini-swapper-box${vIdx === 0 ? ' active' : ''}`;
                box.title = variant.label;
                box.innerHTML = `
                    <img src="${variantSrc}" alt="${variant.label}">
                    ${isVarVideo ? `<i class="var-video-badge fa-solid fa-video"></i>` : ''}
                `;

                box.onclick = (e) => {
                    e.stopPropagation();

                    trackEvent('fn-portfolio-ev-swap-card', 'Swap Variant', { title: render.title, variant: `${render.title} — ${variant.label}`, from: 'card' });

                    const siblings = bar.querySelectorAll('.mini-swapper-box');
                    siblings.forEach(sib => sib.classList.remove('active'));
                    box.classList.add('active');

                    const varIsVideo = variant.url.toLowerCase().includes('.mp4');
                    const mediaNode = document.getElementById(`card-img-${index}`);
                    const currentIsVideo = mediaNode.tagName === 'VIDEO';

                    if (varIsVideo === currentIsVideo) {
                        // Same media type — just swap the src.
                        mediaNode.style.opacity = '0.7';
                        setTimeout(() => {
                            mediaNode.src = variant.url;
                            if (varIsVideo) mediaNode.load?.();
                            mediaNode.style.opacity = '1';
                            setTimeout(() => masonryInstance?.layout(), 150);
                        }, 100);
                    } else {
                        // Media type changed — replace the element outright.
                        const replacement = varIsVideo
                            ? createVideoElement(`card-img-${index}`, mediaNode.className, variant.url)
                            : createImageElement(`card-img-${index}`, mediaNode.className, variant.url, render.title);
                        mediaNode.replaceWith(replacement);
                        setTimeout(() => masonryInstance?.layout(), 150);
                    }
                };

                bar.appendChild(box);
            });
        }
    });

    document.getElementById('gallery-count').innerText = `${rendersDatabase.length} Projects`;

    // Initialize Masonry after all images have loaded to avoid layout miscalculations.
    const grid = document.getElementById('gallery-container');
    imagesLoaded(grid, () => {
        masonryInstance = new Masonry(grid, {
            itemSelector: '.gallery-card',
            columnWidth: '.gallery-card',
            gutter: 16,
            fitWidth: false
        });
        // Fallback re-layout for slow or GIF images that imagesLoaded may miss.
        setTimeout(() => masonryInstance.layout(), 500);
    });
}

/* Opens the lightbox for the render at the given index, showing its
   current media (image or video) plus its variation thumbnails, if any. */
function revealLightbox(index) {
    const render = rendersDatabase[index];
    const modal = document.getElementById('viewer-lightbox');

    trackEvent('fn-portfolio-renders-clicked', 'View Project', { title: render.title });

    /* Backup counter, independent of Umami — see analytics.js. */
    fetch('https://countapi.mileshilliard.com/api/v1/hit/fn-portfolio-renders-clicked', { keepalive: true }).catch(() => { /* best-effort */ });

    const currentCardImg = document.getElementById(`card-img-${index}`).src;
    const lightboxMedia = document.getElementById('lightbox-main-img');
    const isVideo = currentCardImg.toLowerCase().includes('.mp4');

    if (isVideo) {
        lightboxMedia.style.display = 'none';

        let vid = document.getElementById('lightbox-main-video');
        if (!vid) {
            vid = createVideoElement('lightbox-main-video', lightboxMedia.className, currentCardImg);
            lightboxMedia.parentNode.insertBefore(vid, lightboxMedia);
        } else {
            vid.src = currentCardImg;
        }
        vid.style.display = 'block';
        createLightboxTimer(vid);
    } else {
        document.getElementById('lightbox-main-video')?.remove();
        document.getElementById('lightbox-video-timer')?.remove();
        lightboxMedia.style.display = 'block';
        lightboxMedia.src = currentCardImg;
    }

    document.getElementById('lightbox-title').innerHTML = render.title;
    document.getElementById('lightbox-desc').innerHTML = render.desc;

    const variationsContainer = document.getElementById('variations-container');
    const wrapper = document.getElementById('variations-wrapper');
    variationsContainer.innerHTML = '';

    if (render.variations && render.variations.length > 1) {
        wrapper.style.display = 'block';
        render.variations.forEach((variant) => {
            const isActive = currentCardImg === variant.url;
            const btn = document.createElement('button');
            btn.className = 'variation-thumb-btn' + (isActive ? ' active' : '');

            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.variation-thumb-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                trackEvent('fn-portfolio-ev-swap-lightbox', 'Swap Variant', { title: render.title, variant: `${render.title} — ${variant.label}`, from: 'lightbox' });

                const varIsVideo = variant.url.toLowerCase().includes('.mp4');
                const img = document.getElementById('lightbox-main-img');
                let vid = document.getElementById('lightbox-main-video');

                if (varIsVideo) {
                    img.style.display = 'none';
                    img.style.opacity = '1';
                    if (!vid) {
                        vid = createVideoElement('lightbox-main-video', img.className, '');
                        img.parentNode.insertBefore(vid, img);
                    }
                    vid.style.opacity = '0';
                    vid.style.display = 'block';
                    setTimeout(() => {
                        vid.src = variant.url;
                        vid.load();
                        vid.style.opacity = '1';
                    }, 120);
                    vid = document.getElementById('lightbox-main-video');
                    createLightboxTimer(vid);
                } else {
                    if (vid) {
                        vid.style.opacity = '0';
                        setTimeout(() => { vid.remove(); }, 5);
                    }
                    img.style.display = 'block';
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.src = variant.url;
                        img.style.opacity = '1';
                    }, 120);
                    document.getElementById('lightbox-video-timer')?.remove();
                }
            };

            const isVarVideo = variant.type === "video";
            const variantSrc = isVarVideo ? variant.thumb : variant.url;
            btn.innerHTML = `
                <div style="position:relative; display:inline-block;">
                    <img class="variation-preview-img" src="${variantSrc}" alt="${variant.label}" onerror="this.src='${VARIATION_FALLBACK_IMG}'">
                    ${isVarVideo ? `<i class="fa-solid fa-video" style="position:absolute; top:10%; left:10%; transform:translate(-10%,-10%); font-size:1.4rem; color:white; opacity:0.9; pointer-events:none;"></i>` : ''}
                </div>
                <span class="variation-label">${variant.label}</span>
            `;
            variationsContainer.appendChild(btn);
        });
    } else {
        wrapper.style.display = 'none';
    }

    modal.classList.add('active');
}

function dismissLightbox() {
    document.getElementById('viewer-lightbox').classList.remove('active');
}

/* Copies the Discord tag to the clipboard using the modern Clipboard API,
   falling back to the legacy execCommand approach only if needed (older
   browsers, or non-HTTPS contexts where Clipboard API isn't available). */
function copyDiscordName() {
    const showToast = () => {
        const toast = document.getElementById('alert-toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    };

    trackEvent('fn-portfolio-ev-copy-discord', 'Copy Discord Tag');

    if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(discordUserTag).then(showToast).catch(() => {
            copyDiscordNameLegacy();
            showToast();
        });
    } else {
        copyDiscordNameLegacy();
        showToast();
    }
}

/* Legacy clipboard fallback using a temporary offscreen textarea +
   document.execCommand. Kept only for browsers/contexts where the
   Clipboard API isn't available. */
function copyDiscordNameLegacy() {
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = discordUserTag;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
}

window.onload = function() {
    document.getElementById('discord-tag-display').innerText = discordUserTag;
    bootstrapLinks();
    bootstrapGallery();
};

/* Fires a single engagement event after 10s so Umami records this as an
   active session (affects bounce rate and visit duration), rather than
   a bounce if the visitor never triggers another pageview or event. */
setTimeout(() => {
    trackEvent('fn-portfolio-ev-engaged-10s', 'Engaged Visitor (10s)');
}, 10000);
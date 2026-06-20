const discordUserTag = "fireninja.";
let msnry;

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
    }
];



// Generate custom Solo.to link boxes at top of dashboard
function bootstrapLinks() {
    const container = document.getElementById('links-container');
    container.innerHTML = '';
    linksDatabase.forEach(link => {
        const anchor = document.createElement('a');
        anchor.className = 'social-link-item';
        anchor.href = link.url;
        anchor.target = '_blank';
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

// Generate visual masonry card elements with hover swap features!
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
                        onerror="this.src='https://placehold.co/600x600/0f121d/f97316?text=Render'">`
            }
            <div class="card-hover-overlay ${render.variations && render.variations.length > 1 ? '' : 'no-variants'}">
                <span class="overlay-title">${render.title}</span>
                <span class="overlay-variant-count ${render.variations && render.variations.length > 1 ? '' : 'no-variants'}">
                    <i class="fa-solid fa-images"></i> ${render.variations ? render.variations.length : 1} Views
                </span>
            </div>
            <div class="card-variations-bar" id="indicator-bar-${index}"></div>
        `;
        if (isVideo) {
            const timer = document.createElement('span');
            timer.className = 'video-timer';
            timer.innerText = '00:00';
            card.appendChild(timer);

            const vid = card.querySelector('.render-thumbnail');
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

        container.appendChild(card);
        // Inject mini swappers inside indicator bar
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
                    ${variant.type === "video" ? `<i class="var-video-badge fa-solid fa-video"></i>` : ''}
                `;

                box.onclick = (e) => {
                    e.stopPropagation();
                    
                    const siblings = bar.querySelectorAll('.mini-swapper-box');
                    siblings.forEach(sib => sib.classList.remove('active'));
                    box.classList.add('active');

                    const varIsVideo = variant.url.toLowerCase().includes('.mp4');
                    const mediaNode = document.getElementById(`card-img-${index}`);
                    const currentIsVideo = mediaNode.tagName === 'VIDEO';

                    if (varIsVideo === currentIsVideo) {
                        // Same type, just swap src
                        mediaNode.style.opacity = '0.7';
                        setTimeout(() => {
                            mediaNode.src = variant.url;
                            if (varIsVideo) mediaNode.load?.();
                            mediaNode.style.opacity = '1';
                            setTimeout(() => msnry?.layout(), 150);
                        }, 100);
                    } else if (varIsVideo) {
                        // Switching image → video
                        const vid = document.createElement('video');
                        vid.id = `card-img-${index}`;
                        vid.className = mediaNode.className;
                        vid.src = variant.url;
                        vid.autoplay = true;
                        vid.loop = true;
                        vid.muted = true;
                        vid.setAttribute('playsinline', '');
                        mediaNode.replaceWith(vid);
                        setTimeout(() => msnry?.layout(), 150);
                    } else {
                        // Switching video → image
                        const img = document.createElement('img');
                        img.id = `card-img-${index}`;
                        img.className = mediaNode.className;
                        img.src = variant.url;
                        img.alt = render.title;
                        img.onerror = () => img.src = 'https://placehold.co/600x600/0f121d/f97316?text=Render';
                        mediaNode.replaceWith(img);
                        setTimeout(() => msnry?.layout(), 150);
                    }
                };

                bar.appendChild(box);
            });
        }
    });

    document.getElementById('gallery-count').innerText = `${rendersDatabase.length} Projects`;

    const grid = document.getElementById('gallery-container');
    imagesLoaded(grid, () => {
        msnry = new Masonry(grid, {
            itemSelector: '.gallery-card',
            columnWidth: '.gallery-card',
            gutter: 16,
            fitWidth: false
        });
        setTimeout(() => msnry.layout(), 500);
    });
}


// Lightbox modal controller
function revealLightbox(index) {
    const render = rendersDatabase[index];
    const modal = document.getElementById('viewer-lightbox');

    const currentCardImg = document.getElementById(`card-img-${index}`).src;
    const lightboxMedia = document.getElementById('lightbox-main-img');
    const isVideo = currentCardImg.toLowerCase().includes('.mp4');

    if (isVideo) {
        lightboxMedia.style.display = 'none';

        let vid = document.getElementById('lightbox-main-video');
        if (!vid) {
            vid = document.createElement('video');
            vid.id = 'lightbox-main-video';
            vid.className = lightboxMedia.className;
            vid.autoplay = true;
            vid.loop = true;
            vid.muted = true;
            vid.setAttribute('playsinline', '');
            lightboxMedia.parentNode.insertBefore(vid, lightboxMedia);
        }
        vid.src = currentCardImg;
        vid.style.display = 'block';
    } else {
        document.getElementById('lightbox-main-video')?.remove();
        lightboxMedia.style.display = 'block';
        lightboxMedia.src = currentCardImg;
    }

    const existingTimer = document.getElementById('lightbox-video-timer');
    if (existingTimer) existingTimer.remove();

    if (isVideo) {
        const timer = document.createElement('span');
        timer.id = 'lightbox-video-timer';
        timer.className = 'video-timer';
        timer.innerText = '00:00';
        document.querySelector('.lightbox-viewport').appendChild(timer);

        const vid = document.getElementById('lightbox-main-video');
        vid.addEventListener('loadedmetadata', () => {
            const remaining = Math.floor(vid.duration);
            const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
            const secs = String(remaining % 60).padStart(2, '0');
            timer.innerText = `${mins}:${secs}`;
        });
        vid.addEventListener('timeupdate', () => {
            const remaining = Math.floor(vid.duration - vid.currentTime);
            const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
            const secs = String(remaining % 60).padStart(2, '0');
            timer.innerText = `${mins}:${secs}`;
        });
    }

    document.getElementById('lightbox-title').innerHTML = render.title;
    document.getElementById('lightbox-desc').innerHTML = render.desc;

    const variationsContainer = document.getElementById('variations-container');
    const wrapper = document.getElementById('variations-wrapper');
    variationsContainer.innerHTML = '';

    if (render.variations && render.variations.length > 1) {
        wrapper.style.display = 'block';
        render.variations.forEach((variant, vIdx) => {
            const isActive = currentCardImg === variant.url;
            const btn = document.createElement('button');
            btn.className = 'variation-thumb-btn' + (isActive ? ' active' : '');

            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.variation-thumb-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const varIsVideo = variant.url.toLowerCase().includes('.mp4');
                const img = document.getElementById('lightbox-main-img');
                let vid = document.getElementById('lightbox-main-video');

                if (varIsVideo) {
                    img.style.display = 'none';
                    img.style.opacity = '1';
                    if (!vid) {
                        vid = document.createElement('video');
                        vid.id = 'lightbox-main-video';
                        vid.className = img.className;
                        vid.autoplay = true;
                        vid.loop = true;
                        vid.muted = true;
                        vid.setAttribute('playsinline', '');
                        img.parentNode.insertBefore(vid, img);
                    }
                    vid.style.opacity = '0';
                    vid.style.display = 'block';
                    setTimeout(() => {
                        vid.src = variant.url;
                        vid.load();
                        vid.style.opacity = '1';
                    }, 120);
                    const existingTimer = document.getElementById('lightbox-video-timer');
                    if (existingTimer) existingTimer.remove();
                    const timer = document.createElement('span');
                    timer.id = 'lightbox-video-timer';
                    timer.className = 'video-timer';
                    timer.innerText = '00:00';
                    document.querySelector('.lightbox-viewport').appendChild(timer);

                    vid = document.getElementById('lightbox-main-video');
                    vid.addEventListener('loadedmetadata', () => {
                        const remaining = Math.floor(vid.duration);
                        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
                        const secs = String(remaining % 60).padStart(2, '0');
                        timer.innerText = `${mins}:${secs}`;
                    });
                    vid.addEventListener('timeupdate', () => {
                        const remaining = Math.floor(vid.duration - vid.currentTime);
                        const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
                        const secs = String(remaining % 60).padStart(2, '0');
                        timer.innerText = `${mins}:${secs}`;
                    });
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
                    <img class="variation-preview-img" src="${variantSrc}" alt="${variant.label}" onerror="this.src='https://placehold.co/150x100/0f121d/f97316?text=View'">
                    ${variant.type === "video" ? `<i class="fa-solid fa-video" style="position:absolute; top:10%; left:10%; transform:translate(-10%,-10%); font-size:1.4rem; color:white; opacity:0.9; pointer-events:none;"></i>` : ''}
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

// Clip Discord copy with standard fallback selector
function copyDiscordName() {
    const dummy = document.createElement('textarea');
    dummy.value = discordUserTag;
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    const toast = document.getElementById('alert-toast');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Initialize script configs on DOM Load
window.onload = function() {
    document.getElementById('discord-tag-display').innerText = discordUserTag;
    bootstrapLinks();
    bootstrapGallery();
};
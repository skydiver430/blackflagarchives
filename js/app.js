/**
 * Black Flag Archives - Main Application
 * Handles resource loading, rendering, search functionality, and routing
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        dataUrl: 'data/resources.json',
        searchDelay: 300, // ms debounce delay
        animationDelay: 50, // ms between card animations
    };

    /**
     * Header micro actions (Donate, About, Contact, Source, Report). Only entries with a non-empty url are rendered.
     * Add url values when ready (e.g. 'about.html', 'contact.html', Monero donation link, repo URL, issues/feedback URL).
     */
    const HEADER_MICRO_ACTIONS = [
        { id: 'source', label: 'Source code', floatingLabel: 'Source code', url: '' },
        { id: 'report', label: 'Report issue', floatingLabel: 'Report issue', url: '' },
        { id: 'about', label: 'About', floatingLabel: 'About us', url: '' },
        { id: 'contact', label: 'Contact', floatingLabel: 'Contact us', url: '' },
        { id: 'donate', label: 'Donate (Monero)', floatingLabel: 'Buy me a coffee', url: '' }
    ];

    /** Left-aligned in header and homepage grid: source, report. Rest (about, contact, donate) in floating pills / header-controls. */
    const LEFT_HEADER_ACTION_IDS = ['source', 'report'];

    // State
    let resourcesData = [];
    let filteredData = [];
    let searchTimeout = null;
    let currentView = 'home'; // 'home' or 'category'
    let searchFuse = null; // Fuse.js instance, built after data load
    let searchSelectedIndex = -1; // Keyboard selection in search results

    // Filter icon/label maps (shared by createCategoryFilters and universalSearch)
    const platformIcons = {
        'web': '🌐',
        'download': '📥',
        'desktop': '💻',
        'mobile': '📱',
        'self-hosted': '🏠',
        'android': '<img src="favicons/browsers/android.svg" alt="Android" style="width:1em;height:1em;vertical-align:-0.1em;">'
    };

    const platformLabels = {
        'web': 'Web',
        'download': 'Download',
        'desktop': 'Desktop',
        'mobile': 'Mobile',
        'self-hosted': 'Self-Hosted',
        'android': 'Android'
    };

    const contentTypeIcons = {
        'movies': '🎬',
        'tv-shows': '📺',
        'anime': '🌸',
        'animated': '🎨',
        'documentaries': '📖',
        'sports': '⚽',
        'live': '🔴',
        'tv-channels': '📡',
        'radio': '📻',
        'books': '📚',
        'audiobooks': '🎧',
        'articles': '📄',
        'manga': '🖼️',
        'course': '📖',
        'interactive': '🎮',
        'guide': '📝',
        'extension': '🧩',
        'search-engine': '🔍',
        'keyboard': '⌨️',
        'templates': '📦',
        'video-tools': '🎬',
        'music-tools': '🎵',
        'software': '💻'
    };

    const contentTypeLabels = {
        'movies': 'Movies',
        'tv-shows': 'TV Shows',
        'anime': 'Anime',
        'animated': 'Animated',
        'documentaries': 'Documentaries',
        'sports': 'Sports',
        'live': 'Live',
        'tv-channels': 'TV',
        'radio': 'Radio',
        'books': 'Books',
        'audiobooks': 'Audiobooks',
        'articles': 'Articles',
        'manga': 'Manga',
        'course': 'Courses',
        'interactive': 'Interactive',
        'guide': 'Guides',
        'extension': 'Extensions',
        'search-engine': 'Search Engines',
        'keyboard': 'Keyboards',
        'templates': 'Templates',
        'video-tools': 'Video Tools',
        'music-tools': 'Music Tools',
        'software': 'Software'
    };

    /** Content type filter pills: only these types are shown, in this order. */
    const CONTENT_TYPE_FILTER_ORDER = [
        'movies', 'tv-shows', 'anime', 'animated', 'documentaries',
        'sports', 'live', 'tv-channels', 'radio',
        'video-tools', 'music-tools', 'software'
    ];

    /** Tools filter (e.g. Music category: YouTube; Gaming: pre-installed, torrent, etc.). Used for tool-specific filtering. */
    const toolIcons = {
        'youtube': '<span class="tool-icon tool-icon-youtube" aria-hidden="true"><img src="favicons/music/youtube.png" width="16" height="16" alt=""></span>',
        'pre-installed': '📦',
        'torrent': '<span class="tool-icon" aria-hidden="true"><img src="favicons/gaming/qbittorrent.png" width="16" height="16" alt=""></span>',
        'direct-download': '⬇️',
        'repack': '📦',
        'online': '🌐',
        'emulators': '🎮',
        'classic': '🕹️',
        'trainer': '🎯',
        'info': 'ℹ️',
        'adult': '🔞'
    };

    const toolLabels = {
        'youtube': 'YouTube',
        'pre-installed': 'Pre-installed',
        'torrent': 'Torrent',
        'direct-download': 'Direct Download',
        'repack': 'RePack',
        'online': 'Online',
        'emulators': 'Emulators',
        'classic': 'Classic',
        'trainer': 'Trainer',
        'info': 'Info',
        'adult': '18+'
    };

    const TOOL_FILTER_ORDER = ['youtube', 'pre-installed', 'torrent', 'direct-download', 'repack', 'online', 'emulators', 'classic', 'trainer', 'info', 'adult'];

    /** Sport filter: ball/type icons for sports streaming filter. */
    const sportIcons = {
        'soccer': '⚽',
        'nba': '🏀',
        'mma': '🥊',
        'f1': '🏎️'
    };

    const sportLabels = {
        'soccer': 'Soccer',
        'nba': 'NBA',
        'mma': 'MMA',
        'f1': 'F1'
    };

    const SPORT_FILTER_ORDER = ['soccer', 'nba', 'mma', 'f1'];

    const topicIcons = {
        'typing': '⌨️',
        'linux': '🐧',
        'technology': '💻',
        'privacy': '🔒'
    };

    const topicLabels = {
        'typing': 'Typing',
        'linux': 'Linux',
        'technology': 'Technology',
        'privacy': 'Privacy'
    };

    const blockerTypeIcons = {
        'browser-extension': '🌐',
        'self-hosted': '🏠',
        'dns-service': '🛡️',
        'blocklist': '📄'
    };

    const blockerTypeLabels = {
        'browser-extension': 'Browser Extension',
        'self-hosted': 'Self-Hosted',
        'dns-service': 'DNS Service',
        'blocklist': 'Blocklists'
    };

    /**
     * Wrap matched ranges in text with <mark> for search highlighting.
     * @param {string} text - Raw display text
     * @param {Object|undefined} matchEntry - Fuse match entry { key, value, indices: [[start,end],...] }
     * @returns {string} HTML string (escaped with <mark> around matches)
     */
    function highlightMatches(text, matchEntry) {
        if (!text) return '';
        if (!matchEntry || !matchEntry.indices || matchEntry.indices.length === 0) return sanitizeHTML(text);
        const indices = matchEntry.indices.slice().sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (let i = 0; i < indices.length; i++) {
            const [s, e] = indices[i];
            const endExcl = e + 1;
            if (merged.length && s <= merged[merged.length - 1][1]) {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], endExcl);
            } else {
                merged.push([s, endExcl]);
            }
        }
        let out = '';
        let last = 0;
        merged.forEach(([s, endExcl]) => {
            out += sanitizeHTML(text.substring(last, s));
            out += '<mark class="search-highlight">' + sanitizeHTML(text.substring(s, endExcl)) + '</mark>';
            last = endExcl;
        });
        out += sanitizeHTML(text.substring(last));
        return out;
    }

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    function sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Collect all icon URLs used by a category (for preloading).
     * @param {Object} category - Category object with subcategories/links
     * @returns {Set<string>} Unique local icon URLs
     */
    function collectCategoryIconUrls(category) {
        const urls = new Set();
        const subcategories = category.subcategories || [{ links: category.links || [] }];

        function addLocalIcon(url) {
            if (!url || typeof url !== 'string') return;
            if (url.startsWith('http://') || url.startsWith('https://')) return;
            urls.add(url);
        }

        function walk(subs) {
            (subs || []).forEach(sub => {
                if (sub.links) {
                    sub.links.forEach(link => {
                        if (link.icon) addLocalIcon(link.icon);
                        if (link.actions?.github) urls.add('favicons/browsers/github-light.png');
                        if (link.actions?.docker) urls.add('favicons/browsers/docker.png');
                        if (link.actions?.firefox) urls.add('favicons/browsers/firefox.png');
                        if (link.browsers?.firefox) urls.add('favicons/browsers/firefox.png');
                        if (link.browsers?.chrome) urls.add('favicons/browsers/chrome.png');
                        if (link.browsers?.github) urls.add('favicons/browsers/github-light.png');
                        if (link.actions?.instructions) urls.add('favicons/browsers/github-light.png');
                        if (link.browsers?.fdroid || (link.actions && 'fdroid' in link.actions)) urls.add('favicons/browsers/fdroid.png');
                    });
                }
                if (sub.subcategories) walk(sub.subcategories);
            });
        }
        walk(subcategories);
        return urls;
    }

    /**
     * Preload local category icons so they are ready when tiles render (avoids black placeholder flash).
     * @param {Object} category - Category object
     */
    function preloadCategoryIcons(category) {
        const urls = collectCategoryIconUrls(category);
        urls.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = href;
            document.head.appendChild(link);
        });
    }

    /**
     * Create slug from category title
     * @param {string} title - Category title
     * @returns {string} URL-safe slug
     */
    function createSlug(title) {
        return title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get current route from hash
     * @returns {Object} Route object with view and params
     */
    function getCurrentRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const parts = hash.split('/').filter(p => p);

        if (parts.length === 0 || parts[0] === '') {
            return { view: 'home', params: {} };
        }

        if (parts[0] === 'category' && parts[1]) {
            return { view: 'category', params: { slug: parts[1] } };
        }

        return { view: 'home', params: {} };
    }

    /**
     * Navigate to a route
     * @param {string} path - Route path
     */
    function navigateTo(path) {
        window.location.hash = path;
    }

    /**
     * Fetch resources data from JSON file
     * @returns {Promise<Array>} Resources data
     */
    async function fetchResources() {
        try {
            const response = await fetch(CONFIG.dataUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.categories || [];
        } catch (error) {
            console.error('Error fetching resources:', error);
            showError('Failed to load resources. Please check your connection and try again.');
            return [];
        }
    }

    /**
     * Create a category card element for homepage
     * @param {Object} category - Category data
     * @param {number} index - Index for animation delay
     * @returns {HTMLElement} Category card element
     */
    function createCategoryCard(category, index = 0) {
        const card = document.createElement('a');
        card.className = 'category-card';
        // Animation delay handled by CSS nth-child rules
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `${category.title} category`);

        const slug = createSlug(category.title);
        card.href = `#/category/${slug}`;

        // Icon (emoji or placeholder)
        const icon = document.createElement('div');
        icon.className = 'category-icon';
        icon.innerHTML = category.icon || '📦';
        icon.setAttribute('aria-hidden', 'true');

        // Title (span allows search highlight to set innerHTML)
        const title = document.createElement('h2');
        title.className = 'category-title';
        const titleText = document.createElement('span');
        titleText.className = 'category-title-text';
        titleText.textContent = category.title;
        title.appendChild(titleText);

        // Resource count badge - count all links in subcategories (including nested)
        let totalLinks = 0;
        if (category.subcategories) {
            category.subcategories.forEach(subcat => {
                // Direct links in subcategory
                totalLinks += subcat.links?.length || 0;

                // Nested subcategories (e.g., language groups under "Movies & Series")
                if (subcat.subcategories) {
                    subcat.subcategories.forEach(nested => {
                        totalLinks += nested.links?.length || 0;
                    });
                }
            });
        } else if (category.links) {
            totalLinks = category.links.length;
        }

        const count = document.createElement('span');
        count.className = 'resource-count';
        count.textContent = totalLinks;
        count.setAttribute('aria-label', `${totalLinks} resources`);
        title.appendChild(count);

        // Description
        const description = document.createElement('p');
        description.className = 'category-description';
        description.textContent = category.description;

        // Assemble card
        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(description);

        return card;
    }

    /**
     * Render categories to the grid (Homepage)
     * @param {Array} categories - Categories to render
     */
    function renderCategories(categories) {
        const grid = document.getElementById('categories-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        // Clear grid and remove category page class
        grid.innerHTML = '';
        grid.classList.remove('showing-category');

        if (categories.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        grid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Render cards with staggered animation
        categories.forEach((category, index) => {
            const card = createCategoryCard(category, index);
            grid.appendChild(card);
        });
    }

    /**
     * Create badges for platform and language indicators
     * @param {Object} link - Link data
     * @returns {HTMLElement|null} Badges container or null
     */
    function createResourceBadges(link) {
        const platforms = link.platforms || [];
        const languages = link.languages || [];
        const pricing = link.pricing; // 'paid', 'free', or undefined
        const audioOptions = link.audioOptions || []; // 'dub', 'sub' for anime
        const vpnRequired = link.vpnRequired || false; // VPN indicator
        const hasTorrent = link.tools && link.tools.includes('torrent');

        // Return null if no badges to display
        if (platforms.length === 0 && languages.length === 0 && !pricing && audioOptions.length === 0 && !vpnRequired && !hasTorrent) {
            return null;
        }

        const badgesContainer = document.createElement('div');
        badgesContainer.className = 'resource-badges';

        // Pricing badge (always first, before platform badges)
        if (pricing === 'paid') {
            const badge = document.createElement('span');
            badge.className = 'badge badge-pricing badge-paid';
            badge.textContent = '$';
            badge.title = 'Paid service';
            badgesContainer.appendChild(badge);
        }

        // VPN required badge
        if (vpnRequired) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-vpn';
            badge.textContent = 'VPN';
            badge.title = 'VPN required to access';
            badgesContainer.appendChild(badge);
        }

        // Audio options badges (DUB/SUB for anime)
        audioOptions.forEach(audio => {
            const badge = document.createElement('span');
            badge.className = `badge badge-audio badge-${audio}`;
            badge.textContent = audio.toUpperCase();
            badge.title = audio === 'dub' ? 'English Dubbed' : 'Subtitled';
            badgesContainer.appendChild(badge);
        });

        // Torrent icon (same as filter pill) when link has torrent in tools
        if (hasTorrent) {
            const torrentBadge = document.createElement('span');
            torrentBadge.className = 'badge badge-torrent';
            torrentBadge.title = 'Torrent';
            torrentBadge.innerHTML = '<span class="tool-icon" aria-hidden="true"><img src="favicons/gaming/qbittorrent.png" width="16" height="16" alt=""></span>';
            badgesContainer.appendChild(torrentBadge);
        }

        // Add platform badges
        platforms.forEach(platform => {
            const badge = document.createElement('span');
            badge.className = 'badge badge-platform';
            const icon = platformIcons[platform] || '❓';
            if (icon.startsWith('<')) {
                badge.innerHTML = icon;
            } else {
                badge.textContent = icon;
            }
            badge.title = `Available on ${platform}`;
            badgesContainer.appendChild(badge);
        });

        // Add language badges (if MULTI present, only show MULTI — filters still work via data attribute)
        const hasMulti = languages.includes('MULTI');
        languages.forEach(lang => {
            if (hasMulti && lang !== 'MULTI') return;
            const badge = document.createElement('span');
            badge.className = 'badge badge-language';
            badge.textContent = lang.toUpperCase();
            badge.title = `${lang.toUpperCase()} language`;
            badgesContainer.appendChild(badge);
        });

        return badgesContainer;
    }

    /**
     * Create a resource item element
     * @param {Object} link - Link data
     * @param {number} index - Index for animation delay
     * @returns {HTMLElement} Resource item element
     */
    function createResourceItem(link, index) {
        const item = document.createElement('li');
        item.className = 'resource-item';
        // Animation delay handled by CSS nth-child rules

        // Add data attributes for filtering
        if (link.platforms && link.platforms.length > 0) {
            item.setAttribute('data-platforms', link.platforms.join(','));
        }
        if (link.languages && link.languages.length > 0) {
            item.setAttribute('data-languages', link.languages.join(','));
        }
        if (link.contentTypes && link.contentTypes.length > 0) {
            item.setAttribute('data-content-types', link.contentTypes.join(','));
        }
        if (link.topics && link.topics.length > 0) {
            item.setAttribute('data-topics', link.topics.join(','));
        }
        if (link.sports && link.sports.length > 0) {
            item.setAttribute('data-sports', link.sports.join(','));
        }
        if (link.blockerType) {
            item.setAttribute('data-blocker-type', link.blockerType);
        }
        if (link.tools && link.tools.length > 0) {
            item.setAttribute('data-tools', link.tools.join(','));
        }

        // Create and add badges if applicable (but not for DNS services)
        if (link.type !== 'dns-service') {
            const badges = createResourceBadges(link);
            if (badges) {
                item.appendChild(badges);
            }
        }

        // Check if this is a DNS service (has type: dns-service)
        if (link.type === 'dns-service') {
            // Mark the item for DNS card styling
            item.classList.add('dns-card-item');

            // Create clickable wrapper that links to service website
            const dnsCardLink = document.createElement('a');
            dnsCardLink.href = sanitizeHTML(link.url);
            dnsCardLink.className = 'dns-card-wrapper';
            dnsCardLink.target = '_blank';
            dnsCardLink.rel = 'noopener noreferrer';
            dnsCardLink.title = `Visit ${link.name}`;

            // Create container for the DNS card
            const dnsCard = document.createElement('div');
            dnsCard.className = 'dns-card';

            // Icon/Title section
            const dnsHeader = document.createElement('div');
            dnsHeader.className = 'dns-header';

            const dnsIcon = document.createElement('div');
            dnsIcon.className = 'dns-icon';

            // Use custom icon if provided, otherwise use emoji fallback
            if (link.icon) {
                // Check if icon is a URL/path or an emoji/text
                if (link.icon.startsWith('http://') || link.icon.startsWith('https://') || link.icon.includes('/') || link.icon.includes('.')) {
                    const iconImg = document.createElement('img');
                    iconImg.src = link.icon;
                    iconImg.alt = `${link.name} icon`;
                    iconImg.onerror = function() {
                        // Fallback to emoji if image fails
                        dnsIcon.textContent = '🔒';
                        this.remove();
                    };
                    dnsIcon.appendChild(iconImg);
                } else {
                    // It's an emoji or text, display directly
                    dnsIcon.textContent = link.icon;
                }
            } else {
                dnsIcon.textContent = '🔒';
            }

            const dnsInfo = document.createElement('div');
            dnsInfo.className = 'dns-info';

            const dnsName = document.createElement('h4');
            dnsName.className = 'dns-name';
            dnsName.textContent = link.name;

            const dnsDesc = document.createElement('p');
            dnsDesc.className = 'dns-description';
            dnsDesc.textContent = link.description || '';

            dnsInfo.appendChild(dnsName);
            dnsInfo.appendChild(dnsDesc);
            dnsHeader.appendChild(dnsIcon);
            dnsHeader.appendChild(dnsInfo);

            // DNS Addresses section
            const dnsAddresses = document.createElement('div');
            dnsAddresses.className = 'dns-addresses';

            // Add DNS address buttons with copy functionality
            if (link.dnsAddresses && link.dnsAddresses.length > 0) {
                link.dnsAddresses.forEach((address, idx) => {
                    const addressBtn = document.createElement('button');
                    addressBtn.className = 'dns-address';
                    addressBtn.type = 'button';
                    addressBtn.title = `Click to copy: ${address}`;

                    // Prevent card link click when clicking IP button
                    addressBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        try {
                            // Copy to clipboard using modern API
                            await navigator.clipboard.writeText(address);

                            // Visual feedback
                            addressBtn.classList.add('copied');

                            // Remove feedback after 2 seconds
                            setTimeout(() => {
                                addressBtn.classList.remove('copied');
                            }, 2000);

                            console.log(`✓ Copied to clipboard: ${address}`);
                        } catch (err) {
                            console.error('Clipboard API failed, using fallback:', err);
                            // Fallback for older browsers or HTTP contexts
                            fallbackCopyToClipboard(address, addressBtn);
                        }
                    });

                    const label = document.createElement('span');
                    label.className = 'dns-address-label';
                    label.textContent = link.dnsAddresses.length > 1 ? `IPv4 ${idx + 1}:` : 'IPv4:';

                    const ipText = document.createElement('span');
                    ipText.textContent = address;

                    // Copy icon (visible before click)
                    const copyIcon = document.createElement('span');
                    copyIcon.className = 'copy-icon';
                    copyIcon.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;

                    const checkmark = document.createElement('span');
                    checkmark.className = 'copy-checkmark';
                    checkmark.textContent = '✓';

                    addressBtn.appendChild(label);
                    addressBtn.appendChild(ipText);
                    addressBtn.appendChild(copyIcon);
                    addressBtn.appendChild(checkmark);
                    dnsAddresses.appendChild(addressBtn);
                });
            }

            dnsCard.appendChild(dnsHeader);
            dnsCard.appendChild(dnsAddresses);
            dnsCardLink.appendChild(dnsCard);
            item.appendChild(dnsCardLink);
        }
        // Hybrid card: standard link + action buttons + icon links (e.g. search engines with Docker/GitHub, or Emuparadise with Console/Emulator list)
        else if (link.url && !link.browsers && (link.actions || link.instanceList || link.consoleList || link.emulatorList)) {
            // --- Standard link portion (same as standard card) ---
            const anchor = document.createElement('a');
            anchor.className = 'resource-link';
            anchor.href = sanitizeHTML(link.url);
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.title = `Visit ${link.name}`;

            // Favicon
            const faviconContainer = document.createElement('div');
            faviconContainer.className = 'resource-favicon';

            if (link.icon && link.icon.includes('github')) {
                faviconContainer.classList.add('github-resource');
            }

            if (link.icon) {
                const favicon = document.createElement('img');
                favicon.src = link.icon;
                favicon.alt = '';
                favicon.loading = 'eager';
                favicon.decoding = 'async';
                favicon.width = 24;
                favicon.height = 24;
                favicon.onerror = function() {
                    this.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'resource-favicon-fallback';
                    fallback.textContent = '🔗';
                    faviconContainer.appendChild(fallback);
                };
                faviconContainer.appendChild(favicon);
            } else {
                const fallback = document.createElement('span');
                fallback.className = 'resource-favicon-fallback';
                fallback.textContent = '🔗';
                faviconContainer.appendChild(fallback);
            }

            // Content container (name + description)
            const contentContainer = document.createElement('div');
            contentContainer.className = 'resource-content';

            const name = document.createElement('span');
            name.className = 'resource-name';
            name.textContent = link.name;
            contentContainer.appendChild(name);

            if (link.description) {
                const description = document.createElement('span');
                description.className = 'resource-description';
                description.textContent = link.description;
                contentContainer.appendChild(description);
            }

            // Arrow
            const arrow = document.createElement('svg');
            arrow.className = 'resource-arrow';
            arrow.setAttribute('width', '20');
            arrow.setAttribute('height', '20');
            arrow.setAttribute('viewBox', '0 0 24 24');
            arrow.setAttribute('fill', 'none');
            arrow.setAttribute('stroke', 'currentColor');
            arrow.setAttribute('stroke-width', '2');
            arrow.innerHTML = '<path d="M5 12h14m-7-7 7 7-7 7"/>';

            anchor.appendChild(faviconContainer);
            anchor.appendChild(contentContainer);
            anchor.appendChild(arrow);
            item.appendChild(anchor);

            // --- Action buttons row ---
            const actionLinks = document.createElement('div');
            actionLinks.className = 'action-links hybrid-actions';

            // GitHub link
            if (link.actions && link.actions.github) {
                const githubLink = document.createElement('a');
                githubLink.href = sanitizeHTML(link.actions.github);
                githubLink.className = 'action-link github';
                githubLink.target = '_blank';
                githubLink.rel = 'noopener noreferrer';
                githubLink.title = 'View on GitHub';

                const iconContainer = document.createElement('div');
                iconContainer.className = 'action-icon';
                const iconImg = document.createElement('img');
                iconImg.src = 'favicons/browsers/github-light.png';
                iconImg.alt = 'GitHub';
                iconImg.onerror = function() {
                    iconContainer.textContent = '📦';
                    this.remove();
                };
                iconContainer.appendChild(iconImg);

                const textSpan = document.createElement('span');
                textSpan.textContent = 'GitHub';

                githubLink.appendChild(iconContainer);
                githubLink.appendChild(textSpan);
                actionLinks.appendChild(githubLink);
            }

            // Docker link
            if (link.actions && link.actions.docker) {
                const dockerLink = document.createElement('a');
                dockerLink.href = sanitizeHTML(link.actions.docker);
                dockerLink.className = 'action-link docker';
                dockerLink.target = '_blank';
                dockerLink.rel = 'noopener noreferrer';
                dockerLink.title = 'Docker Deployment';

                const iconContainer = document.createElement('div');
                iconContainer.className = 'action-icon';
                const iconImg = document.createElement('img');
                iconImg.src = 'favicons/browsers/docker.png';
                iconImg.alt = 'Docker';
                iconImg.onerror = function() {
                    iconContainer.textContent = '🐳';
                    this.remove();
                };
                iconContainer.appendChild(iconImg);

                const textSpan = document.createElement('span');
                textSpan.textContent = 'Docker';

                dockerLink.appendChild(iconContainer);
                dockerLink.appendChild(textSpan);
                actionLinks.appendChild(dockerLink);
            }

            // Firefox Guide link
            if (link.actions && link.actions.firefox) {
                const ffLink = document.createElement('a');
                ffLink.href = sanitizeHTML(link.actions.firefox);
                ffLink.className = 'action-link firefox-guide';
                ffLink.target = '_blank';
                ffLink.rel = 'noopener noreferrer';
                ffLink.title = 'Firefox Setup Guide';

                const iconContainer = document.createElement('div');
                iconContainer.className = 'action-icon';
                const iconImg = document.createElement('img');
                iconImg.src = 'favicons/browsers/firefox.png';
                iconImg.alt = 'Firefox';
                iconImg.onerror = function() {
                    iconContainer.textContent = '🦊';
                    this.remove();
                };
                iconContainer.appendChild(iconImg);

                const textSpan = document.createElement('span');
                textSpan.textContent = 'Add to Firefox';

                ffLink.appendChild(iconContainer);
                ffLink.appendChild(textSpan);
                actionLinks.appendChild(ffLink);
            }

            // Instructions link
            if (link.actions && link.actions.instructions) {
                const instructionsLink = document.createElement('a');
                instructionsLink.href = sanitizeHTML(link.actions.instructions);
                instructionsLink.className = 'action-link instructions';
                instructionsLink.target = '_blank';
                instructionsLink.rel = 'noopener noreferrer';
                instructionsLink.title = 'View Instructions';
                instructionsLink.innerHTML = `
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Instructions</span>
                `;
                actionLinks.appendChild(instructionsLink);
            }

            // Set as Default Search Engine guide link
            if (link.actions && link.actions['default-search']) {
                const defaultLink = document.createElement('a');
                defaultLink.href = sanitizeHTML(link.actions['default-search']);
                defaultLink.className = 'action-link default-search';
                defaultLink.target = '_blank';
                defaultLink.rel = 'noopener noreferrer';
                defaultLink.title = 'Set as default search engine';
                defaultLink.innerHTML = `
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span>Set as Default</span>
                `;
                actionLinks.appendChild(defaultLink);
            }

            // F-Droid link
            if (link.actions && link.actions.fdroid) {
                const fdroidLink = document.createElement('a');
                fdroidLink.href = sanitizeHTML(link.actions.fdroid);
                fdroidLink.className = 'action-link fdroid';
                fdroidLink.target = '_blank';
                fdroidLink.rel = 'noopener noreferrer';
                fdroidLink.title = 'Get on F-Droid';

                const fdroidIconContainer = document.createElement('div');
                fdroidIconContainer.className = 'action-icon';
                const fdroidIconImg = document.createElement('img');
                fdroidIconImg.src = 'favicons/browsers/fdroid.png';
                fdroidIconImg.alt = 'F-Droid';
                fdroidIconImg.onerror = function() {
                    fdroidIconContainer.textContent = '🤖';
                    this.remove();
                };
                fdroidIconContainer.appendChild(fdroidIconImg);

                const fdroidTextSpan = document.createElement('span');
                fdroidTextSpan.textContent = 'F-Droid';

                fdroidLink.appendChild(fdroidIconContainer);
                fdroidLink.appendChild(fdroidTextSpan);
                actionLinks.appendChild(fdroidLink);
            }

            // APK Download link
            if (link.actions && link.actions.apk) {
                const apkLink = document.createElement('a');
                apkLink.href = sanitizeHTML(link.actions.apk);
                apkLink.className = 'action-link apk';
                apkLink.target = '_blank';
                apkLink.rel = 'noopener noreferrer';
                apkLink.title = 'Download APK';
                apkLink.innerHTML = `
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Download APK</span>
                `;
                actionLinks.appendChild(apkLink);
            }

            // Instance List button (same style as Docker/GitHub)
            if (link.instanceList) {
                const instanceLink = document.createElement('a');
                instanceLink.href = sanitizeHTML(link.instanceList);
                instanceLink.className = 'action-link instance-list';
                instanceLink.target = '_blank';
                instanceLink.rel = 'noopener noreferrer';
                instanceLink.title = 'View public instances';
                instanceLink.innerHTML = `
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                        <line x1="6" y1="6" x2="6.01" y2="6"/>
                        <line x1="6" y1="18" x2="6.01" y2="18"/>
                    </svg>
                    <span>Instance List</span>
                `;
                actionLinks.appendChild(instanceLink);
            }

            // Console List button (e.g. Emuparadise ROMs/ISOs)
            if (link.consoleList) {
                const consoleListLink = document.createElement('a');
                consoleListLink.href = sanitizeHTML(link.consoleList);
                consoleListLink.className = 'action-link console-list';
                consoleListLink.target = '_blank';
                consoleListLink.rel = 'noopener noreferrer';
                consoleListLink.title = 'Console List';
                consoleListLink.innerHTML = `
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    <span>Console List</span>
                `;
                actionLinks.appendChild(consoleListLink);
            }

            // Emulator list button (e.g. Emuparadise)
            if (link.emulatorList) {
                const emulatorListLink = document.createElement('a');
                emulatorListLink.href = sanitizeHTML(link.emulatorList);
                emulatorListLink.className = 'action-link emulator-list';
                emulatorListLink.target = '_blank';
                emulatorListLink.rel = 'noopener noreferrer';
                emulatorListLink.title = 'Emulator list';
                emulatorListLink.innerHTML = `
                    <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <span>Emulator list</span>
                `;
                actionLinks.appendChild(emulatorListLink);
            }

            item.appendChild(actionLinks);
        }
        // Check if this is a browser extension (has browsers property) or action card (has actions property)
        else if (link.browsers || link.actions) {
            // Create container for the extension/action card
            const extCard = document.createElement('div');
            extCard.className = 'extension-card';

            // Icon/Title section
            const extHeader = document.createElement('div');
            extHeader.className = 'extension-header';

            const extIcon = document.createElement('div');
            extIcon.className = 'extension-icon';

            // Use custom icon if provided, otherwise use emoji fallback
            if (link.icon) {
                // Check if icon is a URL/path or an emoji/text
                if (link.icon.startsWith('http://') || link.icon.startsWith('https://') || link.icon.includes('/') || link.icon.includes('.')) {
                    const iconImg = document.createElement('img');
                    iconImg.src = link.icon;
                    iconImg.alt = `${link.name} icon`;
                    iconImg.onerror = function() {
                        // Fallback to emoji if image fails
                        extIcon.textContent = '🛡️';
                        this.remove();
                    };
                    extIcon.appendChild(iconImg);
                } else {
                    // It's an emoji or text, display directly
                    extIcon.textContent = link.icon;
                }
            } else {
                extIcon.textContent = '🛡️';
            }

            const extInfo = document.createElement('div');
            extInfo.className = 'extension-info';

            const extName = document.createElement('h4');
            extName.className = 'extension-name';
            extName.textContent = link.name;

            const extDesc = document.createElement('p');
            extDesc.className = 'extension-description';
            extDesc.textContent = link.description || '';

            extInfo.appendChild(extName);
            extInfo.appendChild(extDesc);
            extHeader.appendChild(extIcon);
            extHeader.appendChild(extInfo);

            // When url is present, make the header (tile) clickable
            let headerElement = extHeader;
            if (link.url) {
                const headerLink = document.createElement('a');
                headerLink.href = sanitizeHTML(link.url);
                headerLink.className = 'extension-header-link';
                headerLink.target = '_blank';
                headerLink.rel = 'noopener noreferrer';
                headerLink.title = `Visit ${link.name}`;
                headerLink.appendChild(extHeader);
                headerElement = headerLink;
            }

            // Browser links section (for extensions)
            if (link.browsers) {
                const browserLinks = document.createElement('div');
                browserLinks.className = 'browser-links';

                // Firefox link
                if (link.browsers.firefox) {
                    const ffLink = document.createElement('a');
                    ffLink.href = sanitizeHTML(link.browsers.firefox);
                    ffLink.className = 'browser-link firefox';
                    ffLink.target = '_blank';
                    ffLink.rel = 'noopener noreferrer';
                    ffLink.title = 'Get for Firefox';
                    ffLink.innerHTML = `
                        <img class="browser-logo" src="favicons/browsers/firefox.png" alt="">
                        <span>Firefox</span>
                    `;
                    browserLinks.appendChild(ffLink);
                }

                // Chrome link
                if (link.browsers.chrome) {
                    const chromeLink = document.createElement('a');
                    chromeLink.href = sanitizeHTML(link.browsers.chrome);
                    chromeLink.className = 'browser-link chrome';
                    chromeLink.target = '_blank';
                    chromeLink.rel = 'noopener noreferrer';
                    chromeLink.title = 'Get for Chrome';
                    chromeLink.innerHTML = `
                        <img class="browser-logo" src="favicons/browsers/chrome.png" alt="">
                        <span>Chrome</span>
                    `;
                    browserLinks.appendChild(chromeLink);
                }

                // GitHub link (for resources like DNS Blocklists)
                if (link.browsers.github) {
                    const githubLink = document.createElement('a');
                    githubLink.href = sanitizeHTML(link.browsers.github);
                    githubLink.className = 'browser-link github';
                    githubLink.target = '_blank';
                    githubLink.rel = 'noopener noreferrer';
                    githubLink.title = 'View on GitHub';
                    githubLink.innerHTML = `
                        <img class="browser-logo" src="favicons/browsers/github-light.png" alt="">
                        <span>GitHub</span>
                    `;
                    browserLinks.appendChild(githubLink);
                }

                extCard.appendChild(headerElement);
                extCard.appendChild(browserLinks);
            }

            // Action buttons section (for tools like Pi-hole)
            if (link.actions) {
                const actionLinks = document.createElement('div');
                actionLinks.className = 'action-links';

                // GitHub link
                if (link.actions.github) {
                    const githubLink = document.createElement('a');
                    githubLink.href = sanitizeHTML(link.actions.github);
                    githubLink.className = 'action-link github';
                    githubLink.target = '_blank';
                    githubLink.rel = 'noopener noreferrer';
                    githubLink.title = 'View on GitHub';

                    // Icon container with GitHub logo
                    const iconContainer = document.createElement('div');
                    iconContainer.className = 'action-icon';

                    // Always use GitHub logo for GitHub links
                    const iconImg = document.createElement('img');
                    iconImg.src = 'favicons/browsers/github-light.png';
                    iconImg.alt = 'GitHub';
                    iconImg.onerror = function() {
                        // Fallback to text if image fails
                        iconContainer.textContent = '📦';
                        this.remove();
                    };
                    iconContainer.appendChild(iconImg);

                    const textSpan = document.createElement('span');
                    textSpan.textContent = 'GitHub';

                    githubLink.appendChild(iconContainer);
                    githubLink.appendChild(textSpan);
                    actionLinks.appendChild(githubLink);
                }

                // Instructions link
                if (link.actions.instructions) {
                    const instructionsLink = document.createElement('a');
                    instructionsLink.href = sanitizeHTML(link.actions.instructions);
                    instructionsLink.className = 'action-link instructions';
                    instructionsLink.target = '_blank';
                    instructionsLink.rel = 'noopener noreferrer';
                    instructionsLink.title = 'View Instructions';
                    instructionsLink.innerHTML = `
                        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span>Instructions</span>
                    `;
                    actionLinks.appendChild(instructionsLink);
                }

                // Docker link
                if (link.actions.docker) {
                    const dockerLink = document.createElement('a');
                    dockerLink.href = sanitizeHTML(link.actions.docker);
                    dockerLink.className = 'action-link docker';
                    dockerLink.target = '_blank';
                    dockerLink.rel = 'noopener noreferrer';
                    dockerLink.title = 'Docker Deployment';

                    const dockerIconContainer = document.createElement('div');
                    dockerIconContainer.className = 'action-icon';
                    const dockerIconImg = document.createElement('img');
                    dockerIconImg.src = 'favicons/browsers/docker.png';
                    dockerIconImg.alt = 'Docker';
                    dockerIconImg.onerror = function() {
                        dockerIconContainer.textContent = '🐳';
                        this.remove();
                    };
                    dockerIconContainer.appendChild(dockerIconImg);

                    const dockerTextSpan = document.createElement('span');
                    dockerTextSpan.textContent = 'Docker';

                    dockerLink.appendChild(dockerIconContainer);
                    dockerLink.appendChild(dockerTextSpan);
                    actionLinks.appendChild(dockerLink);
                }

                // Set as Default Search Engine guide link
                if (link.actions['default-search']) {
                    const defaultLink = document.createElement('a');
                    defaultLink.href = sanitizeHTML(link.actions['default-search']);
                    defaultLink.className = 'action-link default-search';
                    defaultLink.target = '_blank';
                    defaultLink.rel = 'noopener noreferrer';
                    defaultLink.title = 'Set as default search engine';
                    defaultLink.innerHTML = `
                        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <span>Set as Default</span>
                    `;
                    actionLinks.appendChild(defaultLink);
                }

                // F-Droid link
                if (link.actions.fdroid) {
                    const fdroidLink = document.createElement('a');
                    fdroidLink.href = sanitizeHTML(link.actions.fdroid);
                    fdroidLink.className = 'action-link fdroid';
                    fdroidLink.target = '_blank';
                    fdroidLink.rel = 'noopener noreferrer';
                    fdroidLink.title = 'Get on F-Droid';

                    const fdroidIconContainer = document.createElement('div');
                    fdroidIconContainer.className = 'action-icon';
                    const fdroidIconImg = document.createElement('img');
                    fdroidIconImg.src = 'favicons/browsers/fdroid.png';
                    fdroidIconImg.alt = 'F-Droid';
                    fdroidIconImg.onerror = function() {
                        fdroidIconContainer.textContent = '🤖';
                        this.remove();
                    };
                    fdroidIconContainer.appendChild(fdroidIconImg);

                    const fdroidTextSpan = document.createElement('span');
                    fdroidTextSpan.textContent = 'F-Droid';

                    fdroidLink.appendChild(fdroidIconContainer);
                    fdroidLink.appendChild(fdroidTextSpan);
                    actionLinks.appendChild(fdroidLink);
                }

                // APK Download link
                if (link.actions.apk) {
                    const apkLink = document.createElement('a');
                    apkLink.href = sanitizeHTML(link.actions.apk);
                    apkLink.className = 'action-link apk';
                    apkLink.target = '_blank';
                    apkLink.rel = 'noopener noreferrer';
                    apkLink.title = 'Download APK';
                    apkLink.innerHTML = `
                        <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Download APK</span>
                    `;
                    actionLinks.appendChild(apkLink);
                }

                extCard.appendChild(headerElement);
                extCard.appendChild(actionLinks);
            }

            item.appendChild(extCard);
        } else {
            // Standard link format
            const anchor = document.createElement('a');
            anchor.className = 'resource-link';
            anchor.href = sanitizeHTML(link.url);
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.title = `Visit ${link.name}`;

            // Favicon
            const faviconContainer = document.createElement('div');
            faviconContainer.className = 'resource-favicon';

            // Add github-resource class for GitHub icons to make them larger
            if (link.icon && link.icon.includes('github')) {
                faviconContainer.classList.add('github-resource');
            }

            if (link.icon) {
                const favicon = document.createElement('img');
                favicon.src = link.icon;
                favicon.alt = '';
                favicon.loading = 'eager';
                favicon.decoding = 'async';
                favicon.width = 24;
                favicon.height = 24;
                favicon.onerror = function() {
                    this.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.className = 'resource-favicon-fallback';
                    fallback.textContent = '🔗';
                    faviconContainer.appendChild(fallback);
                };
                faviconContainer.appendChild(favicon);
            } else {
                const fallback = document.createElement('span');
                fallback.className = 'resource-favicon-fallback';
                fallback.textContent = '🔗';
                faviconContainer.appendChild(fallback);
            }

            // Content container (name + description)
            const contentContainer = document.createElement('div');
            contentContainer.className = 'resource-content';

            // Name
            const name = document.createElement('span');
            name.className = 'resource-name';
            name.textContent = link.name;
            contentContainer.appendChild(name);

            // Description (if available)
            if (link.description) {
                const description = document.createElement('span');
                description.className = 'resource-description';
                description.textContent = link.description;
                contentContainer.appendChild(description);
            }

            // Arrow
            const arrow = document.createElement('svg');
            arrow.className = 'resource-arrow';
            arrow.setAttribute('width', '20');
            arrow.setAttribute('height', '20');
            arrow.setAttribute('viewBox', '0 0 24 24');
            arrow.setAttribute('fill', 'none');
            arrow.setAttribute('stroke', 'currentColor');
            arrow.setAttribute('stroke-width', '2');
            arrow.innerHTML = '<path d="M5 12h14m-7-7 7 7-7 7"/>';

            anchor.appendChild(faviconContainer);
            anchor.appendChild(contentContainer);
            anchor.appendChild(arrow);
            item.appendChild(anchor);

            // Corner links: monitor, safetyCheck, telegram, and/or discord (bottom-right)
            if (link.monitor || link.safetyCheck || link.telegram || link.discord) {
                const cornerLinks = document.createElement('div');
                cornerLinks.className = 'corner-links';
                if (link.monitor) {
                    const monitorLink = document.createElement('a');
                    monitorLink.className = 'monitor-link';
                    monitorLink.href = sanitizeHTML(link.monitor);
                    monitorLink.target = '_blank';
                    monitorLink.rel = 'noopener noreferrer';
                    monitorLink.title = 'Check uptime monitor';
                    monitorLink.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
                    monitorLink.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    cornerLinks.appendChild(monitorLink);
                }
                if (link.safetyCheck && link.safetyCheck.url) {
                    const safetyLink = document.createElement('a');
                    safetyLink.className = 'safety-check-link';
                    safetyLink.href = sanitizeHTML(link.safetyCheck.url);
                    safetyLink.target = '_blank';
                    safetyLink.rel = 'noopener noreferrer';
                    safetyLink.title = 'Safety / reputation check';
                    const safetyIcon = document.createElement('img');
                    safetyIcon.src = link.safetyCheck.icon || '';
                    safetyIcon.alt = 'Safety check';
                    safetyIcon.width = 18;
                    safetyIcon.height = 18;
                    safetyLink.appendChild(safetyIcon);
                    safetyLink.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    cornerLinks.appendChild(safetyLink);
                }
                if (link.telegram) {
                    const telegramLink = document.createElement('a');
                    telegramLink.className = 'telegram-link';
                    telegramLink.href = sanitizeHTML(link.telegram);
                    telegramLink.target = '_blank';
                    telegramLink.rel = 'noopener noreferrer';
                    telegramLink.title = 'Telegram';
                    const tgIcon = document.createElement('img');
                    tgIcon.src = link.telegramIcon || 'favicons/telegram.png';
                    tgIcon.alt = 'Telegram';
                    tgIcon.width = 18;
                    tgIcon.height = 18;
                    telegramLink.appendChild(tgIcon);
                    telegramLink.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    cornerLinks.appendChild(telegramLink);
                }
                if (link.discord) {
                    const discordLink = document.createElement('a');
                    discordLink.className = 'discord-link';
                    discordLink.href = sanitizeHTML(link.discord);
                    discordLink.target = '_blank';
                    discordLink.rel = 'noopener noreferrer';
                    discordLink.title = 'Discord';
                    const discordImg = document.createElement('img');
                    discordImg.src = link.discordIcon || 'favicons/discord.png';
                    discordImg.alt = 'Discord';
                    discordImg.width = 18;
                    discordImg.height = 18;
                    discordLink.appendChild(discordImg);
                    discordLink.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    cornerLinks.appendChild(discordLink);
                }
                item.appendChild(cornerLinks);
            }
        }

        return item;
    }

    /**
     * Icon SVG inner-HTML for header micro action buttons (24x24 viewBox, stroke-based).
     * Each value is the innerHTML placed inside the <svg> element.
     */
    const HEADER_MICRO_ACTION_ICONS = {
        // Coffee cup (Buy Me a Coffee / Monero)
        donate: '<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',
        // Users / people (About Us)
        about: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        // Envelope (Contact)
        contact: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
        // Code brackets (Source code)
        source: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
        // Flag (Report issue)
        report: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'
    };

    /**
     * Create one header micro-action button (coffee, about, or contact).
     * When url is empty, the button is rendered as disabled/inactive.
     * @param {Object} action - { id, label, url }
     * @param {string} [idPrefix='header'] - Optional prefix for element id (e.g. 'header-drawer' to avoid duplicate ids in drawer).
     * @returns {HTMLAnchorElement|HTMLSpanElement} Button element with id {idPrefix}-micro-action-{action.id}
     */
    function createOneHeaderMicroAction(action, idPrefix) {
        const prefix = typeof idPrefix === 'string' ? idPrefix : 'header';
        const url = typeof action.url === 'string' ? action.url.trim() : '';
        const hasUrl = url.length > 0;

        const el = document.createElement(hasUrl ? 'a' : 'span');
        el.id = prefix + '-micro-action-' + action.id;
        el.className = 'header-micro-action' + (hasUrl ? '' : ' header-micro-action--disabled');
        el.setAttribute('aria-label', action.label);
        el.title = action.label;

        if (hasUrl) {
            el.href = sanitizeHTML(url);
            if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('//') === 0) {
                el.target = '_blank';
                el.rel = 'noopener noreferrer';
            }
        } else {
            el.setAttribute('aria-disabled', 'true');
        }

        const svgNs = 'http://www.w3.org/2000/svg';
        const iconMarkup = HEADER_MICRO_ACTION_ICONS[action.id] || '';
        const svg = document.createElementNS(svgNs, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        if (iconMarkup) {
            svg.innerHTML = iconMarkup;
        }
        el.appendChild(svg);
        return el;
    }

    /**
     * Populate the floating nav-action buttons (homepage only).
     * Uses the same HEADER_MICRO_ACTIONS config and icons as the category-header buttons.
     */
    function renderFloatingNavActions() {
        var container = document.getElementById('floating-nav-actions');
        if (!container || container.children.length > 0) return; // already populated

        HEADER_MICRO_ACTIONS.forEach(function(action) {
            if (LEFT_HEADER_ACTION_IDS.indexOf(action.id) !== -1) return; // donate, report go to left bar
            var url = typeof action.url === 'string' ? action.url.trim() : '';
            var hasUrl = url.length > 0;

            var el = document.createElement(hasUrl ? 'a' : 'span');
            el.className = 'floating-nav-action' + (hasUrl ? '' : ' floating-nav-action--disabled');
            el.setAttribute('aria-label', action.label);
            el.title = action.label;

            if (hasUrl) {
                el.href = sanitizeHTML(url);
                if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('//') === 0) {
                    el.target = '_blank';
                    el.rel = 'noopener noreferrer';
                }
            } else {
                el.setAttribute('aria-disabled', 'true');
            }

            var svgNs = 'http://www.w3.org/2000/svg';
            var iconMarkup = HEADER_MICRO_ACTION_ICONS[action.id] || '';
            var svg = document.createElementNS(svgNs, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            if (iconMarkup) {
                svg.innerHTML = iconMarkup;
            }
            el.appendChild(svg);
            var textLabel = action.floatingLabel || action.label;
            var span = document.createElement('span');
            span.className = 'floating-nav-action-label';
            span.textContent = textLabel;
            el.appendChild(span);
            container.appendChild(el);
        });
    }

    /**
     * Show or hide the floating nav-action buttons.
     * @param {boolean} visible
     */
    function toggleFloatingNavActions(visible) {
        var container = document.getElementById('floating-nav-actions');
        if (!container) return;
        if (visible) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    /**
     * Populate the homepage left-aligned actions (donate, report only). Same pill style as floating nav.
     */
    function renderHomepageLeftActions() {
        var container = document.getElementById('homepage-left-actions');
        if (!container || container.children.length > 0) return;

        HEADER_MICRO_ACTIONS.forEach(function(action) {
            if (LEFT_HEADER_ACTION_IDS.indexOf(action.id) === -1) return;

            var url = typeof action.url === 'string' ? action.url.trim() : '';
            var hasUrl = url.length > 0;

            var el = document.createElement(hasUrl ? 'a' : 'span');
            el.className = 'floating-nav-action' + (hasUrl ? '' : ' floating-nav-action--disabled');
            el.setAttribute('aria-label', action.label);
            el.title = action.label;

            if (hasUrl) {
                el.href = sanitizeHTML(url);
                if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0 || url.indexOf('//') === 0) {
                    el.target = '_blank';
                    el.rel = 'noopener noreferrer';
                }
            } else {
                el.setAttribute('aria-disabled', 'true');
            }

            var svgNs = 'http://www.w3.org/2000/svg';
            var iconMarkup = HEADER_MICRO_ACTION_ICONS[action.id] || '';
            var svg = document.createElementNS(svgNs, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            if (iconMarkup) {
                svg.innerHTML = iconMarkup;
            }
            el.appendChild(svg);
            var textLabel = action.floatingLabel || action.label;
            var span = document.createElement('span');
            span.className = 'floating-nav-action-label';
            span.textContent = textLabel;
            el.appendChild(span);
            container.appendChild(el);
        });

        // Placeholder to balance row (3 left, 3 right) so search bar stays centered
        var placeholder = document.createElement('span');
        placeholder.className = 'action-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        container.appendChild(placeholder);
    }

    /**
     * Show or hide the homepage left-aligned actions row.
     * @param {boolean} visible
     */
    function toggleHomepageLeftActions(visible) {
        var container = document.getElementById('homepage-left-actions');
        if (!container) return;
        if (visible) {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }

    /**
     * Show or hide the homepage top actions bar (grid-aligned left + right groups).
     * @param {boolean} visible
     */
    function toggleHomepageTopActions(visible) {
        var wrapper = document.getElementById('homepage-top-actions');
        if (!wrapper) return;
        if (visible) {
            wrapper.classList.remove('hidden');
        } else {
            wrapper.classList.add('hidden');
        }
    }

    /**
     * Update the site header for category view
     * @param {Object} category - Category data
     */
    function updateHeaderForCategory(category) {
        const header = document.getElementById('site-header');
        const headerTitle = document.getElementById('header-title');
        const headerTagline = document.getElementById('header-tagline');
        const headerControls = document.querySelector('.header-controls');
        const headerLeftActions = document.getElementById('header-left-actions');

        if (!header || !headerTitle || !headerTagline) return;

        // Add category mode class
        header.classList.add('category-mode');

        // Update title with category icon and name
        headerTitle.innerHTML = `
            <span class="category-icon-inline">${category.icon || '📦'}</span>
            ${sanitizeHTML(category.title)}
        `;

        // Update tagline to show category description
        headerTagline.textContent = category.description;

        // Category title: button to refresh the page
        const headerTitleLink = document.getElementById('header-title-link');
        const categoryHref = '#category/' + createSlug(category.title);
        if (headerTitleLink) {
            headerTitleLink.href = categoryHref;
            headerTitleLink.setAttribute('aria-label', 'Refresh page');
            headerTitleLink.setAttribute('title', 'Refresh page');
            headerTitleLink.onclick = function(e) {
                e.preventDefault();
                location.reload();
            };
        }

        // Circle link (narrow screens): same as title — link to category page
        let backToTopWrap = document.getElementById('header-back-to-top-wrap');
        if (!backToTopWrap && headerTitleLink && headerTitleLink.parentElement) {
            backToTopWrap = document.createElement('div');
            backToTopWrap.id = 'header-back-to-top-wrap';
            backToTopWrap.className = 'header-back-to-top-wrap';
            const backToTopLink = document.createElement('a');
            backToTopLink.href = categoryHref;
            backToTopLink.id = 'header-back-to-top';
            backToTopLink.className = 'header-back-to-top';
            backToTopLink.setAttribute('aria-label', 'Category page');
            backToTopLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
            backToTopWrap.appendChild(backToTopLink);
            headerTitleLink.parentElement.insertBefore(backToTopWrap, headerTitleLink);
        } else if (backToTopWrap) {
            const link = backToTopWrap.querySelector('a');
            if (link) link.href = categoryHref;
        }

        // Update document title for browser tab
        document.title = category.title + ' · BFA';

        // Order in nav: [back] [about] [contact] [source] [theme-toggle]; left bar: [donate] [report]
        const themeToggle = document.getElementById('theme-toggle');

        // Hamburger menu button and drawer (for small screens)
        let menuToggle = document.getElementById('header-menu-toggle');
        if (!menuToggle) {
            menuToggle = document.createElement('button');
            menuToggle.type = 'button';
            menuToggle.id = 'header-menu-toggle';
            menuToggle.className = 'header-menu-toggle';
            menuToggle.setAttribute('aria-label', 'Open menu');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-controls', 'header-drawer');
            menuToggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
            headerControls.insertBefore(menuToggle, headerControls.firstChild);
        }
        let drawerOverlay = document.getElementById('header-drawer-overlay');
        let drawer = document.getElementById('header-drawer');
        if (!drawerOverlay || !drawer) {
            drawerOverlay = document.createElement('div');
            drawerOverlay.id = 'header-drawer-overlay';
            drawerOverlay.className = 'header-drawer-overlay';
            drawerOverlay.setAttribute('aria-hidden', 'true');
            drawer = document.createElement('div');
            drawer.id = 'header-drawer';
            drawer.className = 'header-drawer';
            drawer.setAttribute('role', 'dialog');
            drawer.setAttribute('aria-label', 'Site menu');
            const drawerActions = document.createElement('div');
            drawerActions.className = 'header-drawer-actions';
            HEADER_MICRO_ACTIONS.forEach(function(action) {
                drawerActions.appendChild(createOneHeaderMicroAction(action, 'header-drawer'));
            });
            const drawerThemeBtn = document.createElement('button');
            drawerThemeBtn.type = 'button';
            drawerThemeBtn.className = 'theme-toggle';
            drawerThemeBtn.setAttribute('aria-label', 'Toggle theme');
            drawerThemeBtn.innerHTML = themeToggle ? themeToggle.innerHTML : '';
            drawerThemeBtn.addEventListener('click', function() {
                var t = document.getElementById('theme-toggle');
                if (t) t.click();
            });
            drawerActions.appendChild(drawerThemeBtn);
            drawer.appendChild(drawerActions);
            document.body.appendChild(drawerOverlay);
            document.body.appendChild(drawer);

            function closeDrawer() {
                drawerOverlay.classList.remove('is-open');
                drawer.classList.remove('is-open');
                if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
                drawerOverlay.setAttribute('aria-hidden', 'true');
                document.removeEventListener('keydown', onEscape);
            }
            function onEscape(e) {
                if (e.key === 'Escape') closeDrawer();
            }
            menuToggle.addEventListener('click', function() {
                var open = drawer.classList.toggle('is-open');
                drawerOverlay.classList.toggle('is-open', open);
                menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                drawerOverlay.setAttribute('aria-hidden', !open);
                if (open) document.addEventListener('keydown', onEscape);
                else document.removeEventListener('keydown', onEscape);
            });
            drawerOverlay.addEventListener('click', closeDrawer);
            drawerActions.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', closeDrawer);
            });
            drawerThemeBtn.addEventListener('click', closeDrawer);
        }

        // Category header: micro-actions after hamburger (or first control), then about/contact/donate before theme.
        var insertAfterNode = document.getElementById('header-menu-toggle') || headerControls.firstChild;
        HEADER_MICRO_ACTIONS.forEach(function(action) {
            var isLeft = LEFT_HEADER_ACTION_IDS.indexOf(action.id) !== -1;
            if (!headerControls) return;

            var microEl = document.getElementById('header-micro-action-' + action.id);
            if (!microEl) {
                microEl = createOneHeaderMicroAction(action);
                if (isLeft) {
                    headerControls.insertBefore(microEl, insertAfterNode.nextSibling);
                    insertAfterNode = microEl;
                } else {
                    headerControls.insertBefore(microEl, themeToggle);
                }
            }
        });

        // Add header search bar in container (between logo and nav) if it doesn't exist
        let headerSearchForm = document.getElementById('header-search-form');
        if (!headerSearchForm) {
            const container = document.querySelector('.site-header .container');
            const nav = container ? container.querySelector('nav') : null;
            if (!container || !nav) return;

            headerSearchForm = document.createElement('form');
            headerSearchForm.id = 'header-search-form';
            headerSearchForm.setAttribute('role', 'search');
            headerSearchForm.className = 'header-search-form';

            const headerSearchInput = document.createElement('input');
            headerSearchInput.type = 'search';
            headerSearchInput.id = 'header-search-input';
            headerSearchInput.className = 'header-search-input';
            headerSearchInput.placeholder = 'Search categories or resources...';
            headerSearchInput.setAttribute('aria-label', 'Search resources');

            const label = document.createElement('label');
            label.htmlFor = 'header-search-input';

            const svgNs = 'http://www.w3.org/2000/svg';
            const searchIcon = document.createElementNS(svgNs, 'svg');
            searchIcon.setAttribute('class', 'header-search-icon');
            searchIcon.setAttribute('aria-hidden', 'true');
            searchIcon.setAttribute('viewBox', '0 0 24 24');
            searchIcon.setAttribute('fill', 'none');
            searchIcon.setAttribute('stroke', 'currentColor');
            searchIcon.setAttribute('stroke-width', '2');
            const circle = document.createElementNS(svgNs, 'circle');
            circle.setAttribute('cx', '11');
            circle.setAttribute('cy', '11');
            circle.setAttribute('r', '8');
            const path = document.createElementNS(svgNs, 'path');
            path.setAttribute('d', 'm21 21-4.35-4.35');
            searchIcon.appendChild(circle);
            searchIcon.appendChild(path);
            label.appendChild(searchIcon);
            label.appendChild(headerSearchInput);
            headerSearchForm.appendChild(label);

            container.insertBefore(headerSearchForm, nav);

            headerSearchForm.addEventListener('submit', (e) => e.preventDefault());
            headerSearchInput.addEventListener('input', handleSearch);
            headerSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    headerSearchInput.value = '';
                    performSearch('');
                }
            });
        }
    }

    /**
     * Reset the site header to home view
     */
    function resetHeader() {
        const header = document.getElementById('site-header');
        const headerTitle = document.getElementById('header-title');
        const headerTagline = document.getElementById('header-tagline');

        if (!header || !headerTitle || !headerTagline) return;

        // Remove category mode class
        header.classList.remove('category-mode');

        // Reset title
        headerTitle.textContent = 'Black Flag Archives';

        // Reset tagline
        headerTagline.textContent = 'In a world without gold, we might have been heroes!';

        // Reset title link to homepage (remove refresh handler)
        const headerTitleLink = document.getElementById('header-title-link');
        if (headerTitleLink) {
            headerTitleLink.href = '#/';
            headerTitleLink.setAttribute('aria-label', 'Black Flag Archives - Home');
            headerTitleLink.removeAttribute('title');
            headerTitleLink.onclick = null;
        }

        // Reset document title for browser tab
        document.title = 'Black Flag Archives';

        // Remove hamburger and drawer
        const menuToggle = document.getElementById('header-menu-toggle');
        if (menuToggle) menuToggle.remove();
        const drawerOverlay = document.getElementById('header-drawer-overlay');
        if (drawerOverlay) drawerOverlay.remove();
        const drawer = document.getElementById('header-drawer');
        if (drawer) drawer.remove();

        // Remove back-to-top button and its wrapper
        const backToTopWrap = document.getElementById('header-back-to-top-wrap');
        if (backToTopWrap) backToTopWrap.remove();

        // Remove header micro-action buttons (from header-controls and header-left-actions)
        HEADER_MICRO_ACTIONS.forEach(function(action) {
            const el = document.getElementById('header-micro-action-' + action.id);
            if (el) el.remove();
        });

        var headerLeftActions = document.getElementById('header-left-actions');
        if (headerLeftActions) {
            headerLeftActions.innerHTML = '';
        }

        // Remove header search form if it exists
        const headerSearchForm = document.getElementById('header-search-form');
        if (headerSearchForm) {
            headerSearchForm.remove();
        }
    }

    /**
     * Collect all unique platforms, languages, content types, and blocker types from a category
     * @param {Object} category - Category data
     * @returns {Object} Object with platforms, languages, contentTypes, and blockerTypes arrays
     */
    function collectFilterOptions(category) {
        const platforms = new Set();
        const languages = new Set();
        const contentTypes = new Set();
        const sports = new Set();
        const topics = new Set();
        const blockerTypes = new Set();
        const tools = new Set();

        // Helper to process links array
        const processLinks = (links) => {
            if (!links) return;
            links.forEach(link => {
                if (link.platforms) {
                    link.platforms.forEach(p => platforms.add(p));
                }
                if (link.languages) {
                    link.languages.forEach(l => languages.add(l));
                }
                if (link.contentTypes) {
                    link.contentTypes.forEach(c => contentTypes.add(c));
                }
                if (link.sports) {
                    link.sports.forEach(s => sports.add(s));
                }
                if (link.topics) {
                    link.topics.forEach(t => topics.add(t));
                }
                if (link.blockerType) {
                    blockerTypes.add(link.blockerType);
                }
                if (link.tools) {
                    link.tools.forEach(t => tools.add(t));
                }
            });
        };

        // Handle subcategories
        if (category.subcategories) {
            category.subcategories.forEach(subcat => {
                // Direct links in subcategory
                processLinks(subcat.links);

                // Nested subcategories
                if (subcat.subcategories) {
                    subcat.subcategories.forEach(nested => {
                        processLinks(nested.links);
                    });
                }
            });
        } else {
            // Legacy format with direct links
            processLinks(category.links);
        }

        return {
            platforms: Array.from(platforms),
            languages: Array.from(languages),
            contentTypes: Array.from(contentTypes),
            sports: Array.from(sports),
            topics: Array.from(topics),
            blockerTypes: Array.from(blockerTypes),
            tools: Array.from(tools)
        };
    }

    /**
     * Create filter UI for category page
     * @param {Object} category - Category data
     * @param {Function} onFilterChange - Callback when filter changes
     * @returns {HTMLElement|null} Filter container or null
     */
    function createCategoryFilters(category, onFilterChange) {
        const options = collectFilterOptions(category);

        // Don't show filters if no filter data exists (toolFilterGroups can provide tool pills without link data)
        const hasToolFilterGroups = category.toolFilterGroups && category.toolFilterGroups.length > 0;
        if (options.platforms.length === 0 && options.languages.length === 0 && options.contentTypes.length === 0 && options.sports.length === 0 && options.topics.length === 0 && options.blockerTypes.length === 0 && options.tools.length === 0 && !hasToolFilterGroups) {
            return null;
        }

        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'category-filters';

        const currentFilters = {
            platform: 'all',
            language: 'all',
            contentType: 'all',
            sport: 'all',
            topic: 'all',
            blockerType: 'all',
            tool: 'all',
            tool2: 'all'
        };

        // Create platform filters if we have platforms
        if (options.platforms.length > 0) {
            const platformGroup = document.createElement('div');
            platformGroup.className = 'filter-group';

            const platformLabel = document.createElement('label');
            platformLabel.className = 'filter-label';
            platformLabel.textContent = 'Platform:';

            const platformPills = document.createElement('div');
            platformPills.className = 'filter-pills';

            // "All" pill
            const allPill = document.createElement('button');
            allPill.className = 'filter-pill active';
            allPill.textContent = 'All';
            allPill.addEventListener('click', () => {
                platformPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                currentFilters.platform = 'all';
                onFilterChange(currentFilters);
            });
            platformPills.appendChild(allPill);

            // Individual platform pills
            options.platforms.forEach(platform => {
                const pill = document.createElement('button');
                pill.className = 'filter-pill';
                pill.innerHTML = `${platformIcons[platform] || '❓'} ${platformLabels[platform] || platform}`;
                pill.setAttribute('data-filter-value', platform);
                pill.addEventListener('click', () => {
                    platformPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilters.platform = platform;
                    onFilterChange(currentFilters);
                });
                platformPills.appendChild(pill);
            });

            platformGroup.appendChild(platformLabel);
            platformGroup.appendChild(platformPills);
            filtersContainer.appendChild(platformGroup);
        }

        // Create language filters if we have languages
        if (options.languages.length > 0) {
            const languageGroup = document.createElement('div');
            languageGroup.className = 'filter-group';

            const languageLabel = document.createElement('label');
            languageLabel.className = 'filter-label';
            languageLabel.textContent = 'Language:';

            const languagePills = document.createElement('div');
            languagePills.className = 'filter-pills';

            // "All" pill
            const allPill = document.createElement('button');
            allPill.className = 'filter-pill active';
            allPill.textContent = 'All';
            allPill.addEventListener('click', () => {
                languagePills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                currentFilters.language = 'all';
                onFilterChange(currentFilters);
            });
            languagePills.appendChild(allPill);

            // Individual language pills
            options.languages.forEach(lang => {
                const pill = document.createElement('button');
                pill.className = 'filter-pill';
                pill.textContent = lang.toUpperCase();
                pill.setAttribute('data-filter-value', lang);
                pill.addEventListener('click', () => {
                    languagePills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilters.language = lang;
                    onFilterChange(currentFilters);
                });
                languagePills.appendChild(pill);
            });

            languageGroup.appendChild(languageLabel);
            languageGroup.appendChild(languagePills);
            filtersContainer.appendChild(languageGroup);
        }

        // Create content type filters: only types in CONTENT_TYPE_FILTER_ORDER, in that order
        const orderedContentTypes = CONTENT_TYPE_FILTER_ORDER.filter(ct => options.contentTypes.includes(ct));
        if (orderedContentTypes.length > 0) {
            const contentTypeGroup = document.createElement('div');
            contentTypeGroup.className = 'filter-group';

            const contentTypeLabel = document.createElement('label');
            contentTypeLabel.className = 'filter-label';
            contentTypeLabel.textContent = 'Content Type:';

            const contentTypePills = document.createElement('div');
            contentTypePills.className = 'filter-pills';

            // "All" pill
            const allPill = document.createElement('button');
            allPill.className = 'filter-pill active';
            allPill.textContent = 'All';
            allPill.addEventListener('click', () => {
                contentTypePills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                currentFilters.contentType = 'all';
                onFilterChange(currentFilters);
            });
            contentTypePills.appendChild(allPill);

            // Individual content type pills (ordered)
            orderedContentTypes.forEach(contentType => {
                const pill = document.createElement('button');
                pill.className = 'filter-pill';
                pill.innerHTML = `${contentTypeIcons[contentType] || '📺'} ${contentTypeLabels[contentType] || contentType}`;
                pill.setAttribute('data-filter-value', contentType);
                pill.addEventListener('click', () => {
                    contentTypePills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilters.contentType = contentType;
                    onFilterChange(currentFilters);
                });
                contentTypePills.appendChild(pill);
            });

            contentTypeGroup.appendChild(contentTypeLabel);
            contentTypeGroup.appendChild(contentTypePills);
            filtersContainer.appendChild(contentTypeGroup);
        }

        // Create sport filters: only types in SPORT_FILTER_ORDER, in that order
        const orderedSports = SPORT_FILTER_ORDER.filter(s => options.sports.includes(s));
        if (orderedSports.length > 0) {
            const sportGroup = document.createElement('div');
            sportGroup.className = 'filter-group';

            const sportLabel = document.createElement('label');
            sportLabel.className = 'filter-label';
            sportLabel.textContent = 'Sport:';

            const sportPills = document.createElement('div');
            sportPills.className = 'filter-pills';

            const allPill = document.createElement('button');
            allPill.className = 'filter-pill active';
            allPill.textContent = 'All';
            allPill.addEventListener('click', () => {
                sportPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                currentFilters.sport = 'all';
                onFilterChange(currentFilters);
            });
            sportPills.appendChild(allPill);

            orderedSports.forEach(sport => {
                const pill = document.createElement('button');
                pill.className = 'filter-pill';
                pill.innerHTML = `${sportIcons[sport] || '⚽'} ${sportLabels[sport] || sport}`;
                pill.setAttribute('data-filter-value', sport);
                pill.addEventListener('click', () => {
                    sportPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilters.sport = sport;
                    onFilterChange(currentFilters);
                });
                sportPills.appendChild(pill);
            });

            sportGroup.appendChild(sportLabel);
            sportGroup.appendChild(sportPills);
            filtersContainer.appendChild(sportGroup);
        }

        // Create topic filters if we have topics
        if (options.topics.length > 0) {
            const topicGroup = document.createElement('div');
            topicGroup.className = 'filter-group';

            const topicLabel = document.createElement('label');
            topicLabel.className = 'filter-label';
            topicLabel.textContent = 'Topic:';

            const topicPills = document.createElement('div');
            topicPills.className = 'filter-pills';

            // "All" pill
            const allPill = document.createElement('button');
            allPill.className = 'filter-pill active';
            allPill.textContent = 'All';
            allPill.addEventListener('click', () => {
                topicPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                currentFilters.topic = 'all';
                onFilterChange(currentFilters);
            });
            topicPills.appendChild(allPill);

            // Individual topic pills
            options.topics.forEach(topic => {
                const pill = document.createElement('button');
                pill.className = 'filter-pill';
                pill.innerHTML = `${topicIcons[topic] || '📚'} ${topicLabels[topic] || topic}`;
                pill.setAttribute('data-filter-value', topic);
                pill.addEventListener('click', () => {
                    topicPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilters.topic = topic;
                    onFilterChange(currentFilters);
                });
                topicPills.appendChild(pill);
            });

            topicGroup.appendChild(topicLabel);
            topicGroup.appendChild(topicPills);
            filtersContainer.appendChild(topicGroup);
        }

        // Create blocker type filters if we have blocker types
        if (options.blockerTypes.length > 0) {
            const blockerTypeGroup = document.createElement('div');
            blockerTypeGroup.className = 'filter-group';

            const blockerTypeLabel = document.createElement('label');
            blockerTypeLabel.className = 'filter-label';
            blockerTypeLabel.textContent = 'Blocker Type:';

            const blockerTypePills = document.createElement('div');
            blockerTypePills.className = 'filter-pills';

            // "All" pill
            const allPill = document.createElement('button');
            allPill.className = 'filter-pill active';
            allPill.textContent = 'All';
            allPill.addEventListener('click', () => {
                blockerTypePills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                allPill.classList.add('active');
                currentFilters.blockerType = 'all';
                onFilterChange(currentFilters);
            });
            blockerTypePills.appendChild(allPill);

            // Individual blocker type pills
            options.blockerTypes.forEach(blockerType => {
                const pill = document.createElement('button');
                pill.className = 'filter-pill';
                pill.innerHTML = `${blockerTypeIcons[blockerType] || '📦'} ${blockerTypeLabels[blockerType] || blockerType}`;
                pill.setAttribute('data-filter-value', blockerType);
                pill.addEventListener('click', () => {
                    blockerTypePills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    currentFilters.blockerType = blockerType;
                    onFilterChange(currentFilters);
                });
                blockerTypePills.appendChild(pill);
            });

            blockerTypeGroup.appendChild(blockerTypeLabel);
            blockerTypeGroup.appendChild(blockerTypePills);
            filtersContainer.appendChild(blockerTypeGroup);
        }

        // Create Tools filters: either two groups (toolFilterGroups) or single Tools row (toolFilterPills)
        if (category.toolFilterGroups && category.toolFilterGroups.length > 0) {
            category.toolFilterGroups.forEach((group, groupIndex) => {
                const key = groupIndex === 0 ? 'tool' : 'tool2';
                const pillKeys = group.pills || [];
                const toolSet = new Set([...options.tools, ...pillKeys]);
                const orderedTools = TOOL_FILTER_ORDER.filter(t => toolSet.has(t) && pillKeys.includes(t));
                if (orderedTools.length === 0) return;

                const toolGroup = document.createElement('div');
                toolGroup.className = 'filter-group';

                const toolLabel = document.createElement('label');
                toolLabel.className = 'filter-label';
                toolLabel.textContent = (group.label || 'Tools') + ':';

                const toolPills = document.createElement('div');
                toolPills.className = 'filter-pills';

                const allPill = document.createElement('button');
                allPill.className = 'filter-pill active';
                allPill.textContent = 'All';
                allPill.addEventListener('click', () => {
                    toolPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    allPill.classList.add('active');
                    currentFilters[key] = 'all';
                    onFilterChange(currentFilters);
                });
                toolPills.appendChild(allPill);

                orderedTools.forEach(tool => {
                    const pill = document.createElement('button');
                    pill.className = 'filter-pill';
                    pill.innerHTML = `${toolIcons[tool] || '🔧'} ${toolLabels[tool] || tool}`;
                    pill.setAttribute('data-filter-value', tool);
                    pill.addEventListener('click', () => {
                        toolPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                        currentFilters[key] = tool;
                        onFilterChange(currentFilters);
                    });
                    toolPills.appendChild(pill);
                });

                toolGroup.appendChild(toolLabel);
                toolGroup.appendChild(toolPills);
                filtersContainer.appendChild(toolGroup);
            });
        } else {
            const toolSet = new Set([...options.tools, ...(category.toolFilterPills || [])]);
            const orderedTools = TOOL_FILTER_ORDER.filter(t => toolSet.has(t));
            if (orderedTools.length > 0) {
                const toolGroup = document.createElement('div');
                toolGroup.className = 'filter-group';

                const toolLabel = document.createElement('label');
                toolLabel.className = 'filter-label';
                toolLabel.textContent = 'Tools:';

                const toolPills = document.createElement('div');
                toolPills.className = 'filter-pills';

                const allPill = document.createElement('button');
                allPill.className = 'filter-pill active';
                allPill.textContent = 'All';
                allPill.addEventListener('click', () => {
                    toolPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                    allPill.classList.add('active');
                    currentFilters.tool = 'all';
                    onFilterChange(currentFilters);
                });
                toolPills.appendChild(allPill);

                orderedTools.forEach(tool => {
                    const pill = document.createElement('button');
                    pill.className = 'filter-pill';
                    pill.innerHTML = `${toolIcons[tool] || '🔧'} ${toolLabels[tool] || tool}`;
                    pill.setAttribute('data-filter-value', tool);
                    pill.addEventListener('click', () => {
                        toolPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                        pill.classList.add('active');
                        currentFilters.tool = tool;
                        onFilterChange(currentFilters);
                    });
                    toolPills.appendChild(pill);
                });

                toolGroup.appendChild(toolLabel);
                toolGroup.appendChild(toolPills);
                filtersContainer.appendChild(toolGroup);
            }
        }

        // Reset all filters button
        const resetRow = document.createElement('div');
        resetRow.className = 'category-filters-reset';
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'filter-reset-btn';
        resetBtn.textContent = 'Reset all filters';
        resetBtn.addEventListener('click', () => {
            currentFilters.platform = 'all';
            currentFilters.language = 'all';
            currentFilters.contentType = 'all';
            currentFilters.sport = 'all';
            currentFilters.topic = 'all';
            currentFilters.blockerType = 'all';
            currentFilters.tool = 'all';
            currentFilters.tool2 = 'all';
            filtersContainer.querySelectorAll('.filter-pills').forEach(pillsEl => {
                pillsEl.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                const firstPill = pillsEl.querySelector('.filter-pill');
                if (firstPill) firstPill.classList.add('active');
            });
            onFilterChange(currentFilters);
        });
        resetRow.appendChild(resetBtn);
        filtersContainer.appendChild(resetRow);

        return filtersContainer;
    }

    /**
     * Apply filters to all resource items on the page
     * @param {Object} filters - Current filter state
     */
    function applyFilters(filters) {
        const allItems = document.querySelectorAll('.resource-item');

        allItems.forEach(item => {
            const itemPlatforms = item.getAttribute('data-platforms');
            const itemLanguages = item.getAttribute('data-languages');
            const itemContentTypes = item.getAttribute('data-content-types');
            const itemSports = item.getAttribute('data-sports');
            const itemTopics = item.getAttribute('data-topics');
            const itemBlockerType = item.getAttribute('data-blocker-type');
            const itemTools = item.getAttribute('data-tools');

            let platformMatch = false;
            let languageMatch = false;
            let contentTypeMatch = false;
            let sportMatch = false;
            let topicMatch = false;
            let blockerTypeMatch = false;
            let toolMatch = false;

            // Check platform filter
            if (filters.platform === 'all') {
                platformMatch = true;
            } else if (itemPlatforms) {
                const platforms = itemPlatforms.split(',');
                platformMatch = platforms.includes(filters.platform);
            } else {
                // Items without platform metadata don't match specific platform filters
                platformMatch = false;
            }

            // Check language filter (MULTI-tagged items match only when MULTI or EN is selected)
            if (filters.language === 'all') {
                languageMatch = true;
            } else if (itemLanguages) {
                const languages = itemLanguages.split(',');
                languageMatch = languages.includes(filters.language) ||
                    (languages.includes('MULTI') && (filters.language === 'MULTI' || filters.language === 'EN'));
            } else {
                // Items without language metadata don't match specific language filters
                languageMatch = false;
            }

            // Check content type filter
            if (filters.contentType === 'all') {
                contentTypeMatch = true;
            } else if (itemContentTypes) {
                const contentTypes = itemContentTypes.split(',');
                contentTypeMatch = contentTypes.includes(filters.contentType);
            } else {
                // Items without content type metadata don't match specific content type filters
                contentTypeMatch = false;
            }

            // Check sport filter
            if (filters.sport === 'all') {
                sportMatch = true;
            } else if (itemSports) {
                const sports = itemSports.split(',');
                sportMatch = sports.includes(filters.sport);
            } else {
                // Items without sport metadata don't match specific sport filters
                sportMatch = false;
            }

            // Check topic filter
            if (filters.topic === 'all') {
                topicMatch = true;
            } else if (itemTopics) {
                const topics = itemTopics.split(',');
                topicMatch = topics.includes(filters.topic);
            } else {
                // Items without topic metadata don't match specific topic filters
                topicMatch = false;
            }

            // Check blocker type filter
            if (filters.blockerType === 'all') {
                blockerTypeMatch = true;
            } else if (itemBlockerType) {
                blockerTypeMatch = itemBlockerType === filters.blockerType;
            } else {
                blockerTypeMatch = false;
            }

            // Check tools filter (single tool or both tool and tool2 when toolFilterGroups is used)
            if (filters.tool === 'all') {
                toolMatch = true;
            } else if (itemTools) {
                const tools = itemTools.split(',');
                toolMatch = tools.includes(filters.tool);
            } else {
                toolMatch = false;
            }
            let tool2Match = true;
            if (filters.tool2 !== undefined && filters.tool2 !== 'all') {
                if (itemTools) {
                    const tools = itemTools.split(',');
                    tool2Match = tools.includes(filters.tool2);
                } else {
                    tool2Match = false;
                }
            }

            // Show item only if all filters match
            if (platformMatch && languageMatch && contentTypeMatch && sportMatch && topicMatch && blockerTypeMatch && toolMatch && tool2Match) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // Show empty state if no items match filters
        const visibleItems = allItems.filter(item => item.style.display !== 'none');
        const existingEmpty = document.querySelector('.filter-empty-state');

        if (visibleItems.length === 0) {
            if (!existingEmpty) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'filter-empty-state';
                emptyMsg.textContent = 'No resources match the selected filters.';
                const container = document.querySelector('.subcategories-container');
                if (container) container.appendChild(emptyMsg);
            }
        } else if (existingEmpty) {
            existingEmpty.remove();
        }
    }

    /**
     * Render a single category page with tabbed interface
     * @param {string} slug - Category slug
     */
    function renderCategoryPage(slug) {
        const grid = document.getElementById('categories-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        // Find category by slug
        const category = resourcesData.find(cat => createSlug(cat.title) === slug);

        if (!category) {
            // Category not found
            emptyState.classList.add('hidden');

            // Clear and switch to category layout
            grid.innerHTML = '';
            grid.classList.remove('showing-category');
            grid.classList.add('showing-category');

            // Reset header
            resetHeader();

            // Add error content
            grid.innerHTML = `
                <div class="category-page">
                    <div class="empty-state">
                        <h2>Category not found</h2>
                        <p>The category you're looking for doesn't exist.</p>
                    </div>
                </div>
            `;
            return;
        }

        // Preload local icons so tiles don't show black placeholders
        preloadCategoryIcons(category);

        // Update header with category info
        updateHeaderForCategory(category);

        // Hide empty state
        emptyState.classList.add('hidden');

        // Create category page
        const page = document.createElement('div');
        page.className = 'category-page';
        page.setAttribute('data-category-slug', createSlug(category.title));

        // Create and add global filters
        const filters = createCategoryFilters(category, applyFilters);
        if (filters) {
            page.appendChild(filters);
        }

        // Handle both new subcategories format and legacy links format
        const subcategories = category.subcategories || [{ title: null, links: category.links || [] }];

        if (subcategories.length === 0 || (subcategories.length === 1 && subcategories[0].links.length === 0)) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-subcategory';
            emptyMessage.textContent = 'No resources available in this category yet.';
            page.appendChild(emptyMessage);
        } else if (subcategories.length === 1 && !subcategories[0].title) {
            // Single subcategory without title - render directly
            const container = document.createElement('div');
            container.className = 'subcategories-container';

            const column = document.createElement('div');
            column.className = 'subcategory-column';

            const resourceList = document.createElement('ul');
            resourceList.className = 'resource-list';

            let itemIndex = 0;
            if (subcategories[0].links && subcategories[0].links.length > 0) {
                subcategories[0].links.forEach((link) => {
                    const item = createResourceItem(link, itemIndex);
                    itemIndex++;
                    resourceList.appendChild(item);
                });
            }

            column.appendChild(resourceList);
            container.appendChild(column);
            page.appendChild(container);
        } else {
            // Multiple subcategories - render side by side
            const container = document.createElement('div');
            container.className = 'subcategories-container';

            let globalItemIndex = 0;

            // Create a column for each subcategory
            subcategories.forEach((subcategory, subIndex) => {
                const column = document.createElement('div');
                column.className = 'subcategory-column';

                // Add data attribute for Movies & Series to enable special styling
                if (subcategory.title) {
                    column.setAttribute('data-title', subcategory.title);
                }

                // Add subcategory header
                if (subcategory.title) {
                    const header = document.createElement('h3');
                    header.className = 'subcategory-header';
                    header.textContent = subcategory.title;
                    column.appendChild(header);
                }

                // Check if this subcategory has nested subcategories (like language groups)
                if (subcategory.subcategories && subcategory.subcategories.length > 0) {
                    if (subcategory.fullWidth) {
                        column.classList.add('has-nested');
                    }
                    // Create a single merged resource list for all nested items
                    const resourceList = document.createElement('ul');
                    resourceList.className = 'resource-list';

                    // Render all nested subcategories into one continuous list
                    subcategory.subcategories.forEach((nested) => {
                        if (nested.links && nested.links.length > 0) {
                            nested.links.forEach((link) => {
                                const item = createResourceItem(link, globalItemIndex);
                                globalItemIndex++;
                                resourceList.appendChild(item);
                            });
                        }
                    });

                    column.appendChild(resourceList);
                } else {
                    // No nested subcategories - render links directly
                    const resourceList = document.createElement('ul');
                    resourceList.className = 'resource-list';

                    if (subcategory.links && subcategory.links.length > 0) {
                        subcategory.links.forEach((link) => {
                            const item = createResourceItem(link, globalItemIndex);
                            globalItemIndex++;
                            resourceList.appendChild(item);
                        });
                    }

                    column.appendChild(resourceList);
                }

                container.appendChild(column);
            });

            page.appendChild(container);
        }

        // Clear grid and switch to category layout
        grid.innerHTML = '';
        grid.classList.remove('showing-category');
        grid.classList.add('showing-category');

        // Append page (CSS handles sizing independently)
        grid.appendChild(page);
    }

    /**
     * Collect all resources from all categories into a flat array.
     * Each resource is annotated with parent category context.
     * @returns {Array} Flat array of resource objects with category metadata
     */
    function collectAllResources() {
        const resources = [];

        resourcesData.forEach(category => {
            const categoryMeta = {
                _categoryTitle: category.title,
                _categoryIcon: category.icon || '📦',
                _categorySlug: createSlug(category.title)
            };

            if (category.subcategories) {
                category.subcategories.forEach(subcat => {
                    const subcatTitle = subcat.title || null;

                    // Direct links in subcategory
                    if (subcat.links) {
                        subcat.links.forEach(link => {
                            resources.push({
                                ...link,
                                ...categoryMeta,
                                _subcategoryTitle: subcatTitle
                            });
                        });
                    }

                    // Nested subcategories (2 levels deep)
                    if (subcat.subcategories) {
                        subcat.subcategories.forEach(nested => {
                            if (nested.links) {
                                nested.links.forEach(link => {
                                    resources.push({
                                        ...link,
                                        ...categoryMeta,
                                        _subcategoryTitle: subcatTitle
                                    });
                                });
                            }
                        });
                    }
                });
            } else if (category.links) {
                // Legacy format: direct links on category
                category.links.forEach(link => {
                    resources.push({
                        ...link,
                        ...categoryMeta,
                        _subcategoryTitle: null
                    });
                });
            }
        });

        return resources;
    }

    /**
     * Build a flat list of searchable documents for Fuse.js (categories + resources).
     * Each doc has type, title, searchText, searchable (title + ' ' + searchText), and original fields.
     * @returns {Array} List of documents for Fuse index
     */
    function buildSearchIndex() {
        const docs = [];
        resourcesData.forEach(category => {
            const searchText = (category.description || '').trim();
            const searchable = (category.title + ' ' + searchText).trim();
            docs.push({
                type: 'category',
                title: category.title,
                searchText: searchText,
                searchable: searchable,
                ...category
            });
        });
        const allResources = collectAllResources();
        allResources.forEach(resource => {
            const parts = [(resource.description || '')];
            if (resource.platforms) {
                resource.platforms.forEach(p => { parts.push(platformLabels[p] || p); });
            }
            if (resource.languages) parts.push(...resource.languages);
            if (resource.contentTypes) {
                resource.contentTypes.forEach(c => { parts.push(contentTypeLabels[c] || c); });
            }
            if (resource.topics) {
                resource.topics.forEach(t => { parts.push(topicLabels[t] || t); });
            }
            if (resource.sports) {
                resource.sports.forEach(s => { parts.push(sportLabels[s] || s); });
            }
            if (resource.blockerType) {
                parts.push(blockerTypeLabels[resource.blockerType] || resource.blockerType);
            }
            const searchText = parts.filter(Boolean).join(' ');
            const searchable = (resource.name + ' ' + searchText).trim();
            docs.push({
                type: 'resource',
                title: resource.name,
                searchText: searchText,
                searchable: searchable,
                ...resource
            });
        });
        return docs;
    }

    /**
     * Universal search across categories and individual resources.
     * Returns both matching categories and matching individual resources.
     * @param {string} query - Search query
     * @returns {Object} { categories: Array, resources: Array } or with fuseResults for highlighting
     */
    function universalSearch(query) {
        if (!query || query.trim() === '') {
            return { categories: resourcesData, resources: [], fuseResults: null };
        }

        const tokens = query.trim().toLowerCase().split(/\s+/).filter(s => s.length > 0).filter(s => s.length >= 2);
        if (tokens.length === 0) {
            return { categories: resourcesData, resources: [], fuseResults: null };
        }

        if (searchFuse) {
            const andQuery = { $and: tokens.map(term => ({ $or: [{ title: term }, { searchText: term }] })) };
            const fuseResults = searchFuse.search(andQuery);
            const categories = [];
            const resources = [];
            fuseResults.forEach(r => {
                if (r.item.type === 'category') {
                    categories.push(r.item);
                } else {
                    resources.push(r.item);
                }
            });
            return { categories, resources, fuseResults };
        }

        // Fallback when Fuse.js not loaded: token-based AND (no fuzzy)
        const matchedCategories = resourcesData.filter(category =>
            tokens.every(token =>
                category.title.toLowerCase().includes(token) ||
                (category.description && category.description.toLowerCase().includes(token))
            )
        );
        const allResources = collectAllResources();
        const matchedResources = allResources.filter(resource =>
            tokens.every(token => {
                const nameMatch = resource.name.toLowerCase().includes(token);
                const descMatch = resource.description &&
                    resource.description.toLowerCase().includes(token);
                const platformMatch = resource.platforms &&
                    resource.platforms.some(p => p.toLowerCase().includes(token) ||
                        (platformLabels[p] || '').toLowerCase().includes(token));
                const languageMatch = resource.languages &&
                    resource.languages.some(l => l.toLowerCase().includes(token));
                const contentTypeMatch = resource.contentTypes &&
                    resource.contentTypes.some(c => c.toLowerCase().includes(token) ||
                        (contentTypeLabels[c] || '').toLowerCase().includes(token));
                const topicMatch = resource.topics &&
                    resource.topics.some(t => t.toLowerCase().includes(token) ||
                        (topicLabels[t] || '').toLowerCase().includes(token));
                const sportMatch = resource.sports &&
                    resource.sports.some(s => s.toLowerCase().includes(token) ||
                        (sportLabels[s] || '').toLowerCase().includes(token));
                const blockerTypeMatch = resource.blockerType &&
                    (resource.blockerType.toLowerCase().includes(token) ||
                        (blockerTypeLabels[resource.blockerType] || '').toLowerCase().includes(token));
                return nameMatch || descMatch || platformMatch || languageMatch ||
                       contentTypeMatch || topicMatch || sportMatch || blockerTypeMatch;
            })
        );
        return {
            categories: matchedCategories,
            resources: matchedResources,
            fuseResults: null
        };
    }

    /**
     * Create a resource result card for homepage universal search.
     * @param {Object} resource - Resource data with _category* metadata
     * @returns {HTMLElement} Search result card element
     */
    function createSearchResourceCard(resource) {
        // Determine the primary URL for the card (prefer resource.url when present)
        let primaryUrl = resource.url || null;
        if (!primaryUrl && resource.browsers) {
            primaryUrl = resource.browsers.firefox ||
                         resource.browsers.chrome ||
                         resource.browsers.github || null;
        }
        if (!primaryUrl && resource.actions) {
            primaryUrl = resource.actions.github ||
                         resource.actions.instructions || null;
        }

        // Create the card container
        const card = document.createElement('a');
        card.className = 'search-resource-card';
        card.setAttribute('role', 'article');

        if (primaryUrl) {
            card.href = primaryUrl;
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
        } else {
            card.href = '#/category/' + resource._categorySlug;
        }

        // Category context label
        const categoryLabel = document.createElement('div');
        categoryLabel.className = 'search-result-category';
        const catIcon = document.createElement('span');
        catIcon.className = 'search-result-category-icon';
        catIcon.textContent = resource._categoryIcon;
        const catName = document.createElement('span');
        catName.textContent = resource._categoryTitle;
        categoryLabel.appendChild(catIcon);
        categoryLabel.appendChild(catName);

        // Resource icon/favicon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'search-result-icon';

        if (resource.icon) {
            if (resource.icon.startsWith('http') || resource.icon.includes('/') || resource.icon.includes('.')) {
                const img = document.createElement('img');
                img.src = resource.icon;
                img.alt = '';
                img.loading = 'lazy';
                img.addEventListener('error', function() {
                    this.style.display = 'none';
                    iconContainer.textContent = '🔗';
                });
                iconContainer.appendChild(img);
            } else {
                iconContainer.textContent = resource.icon;
            }
        } else if (resource.url) {
            iconContainer.textContent = '🔗';
        } else {
            iconContainer.textContent = '🔗';
        }

        // Resource name (span allows search highlight to set innerHTML)
        const name = document.createElement('h3');
        name.className = 'search-result-name';
        const nameText = document.createElement('span');
        nameText.className = 'search-result-name-text';
        nameText.textContent = resource.name;
        name.appendChild(nameText);

        // Resource description
        const desc = document.createElement('p');
        desc.className = 'search-result-description';
        desc.textContent = resource.description || '';

        // Assemble card
        card.appendChild(categoryLabel);
        card.appendChild(iconContainer);
        card.appendChild(name);
        if (resource.description) {
            card.appendChild(desc);
        }

        // Type indicator for special resource types
        if (resource.browsers) {
            const badge = document.createElement('span');
            badge.className = 'search-result-type';
            badge.textContent = 'Browser Extension';
            card.appendChild(badge);
        } else if (resource.url && resource.actions && !resource.browsers) {
            const badge = document.createElement('span');
            badge.className = 'search-result-type';
            badge.textContent = resource.contentTypes && resource.contentTypes.includes('search-engine') ? 'Search Engine' : 'Tool';
            card.appendChild(badge);
        } else if (resource.actions) {
            const badge = document.createElement('span');
            badge.className = 'search-result-type';
            badge.textContent = 'Self-Hosted Tool';
            card.appendChild(badge);
        } else if (resource.type === 'dns-service') {
            const badge = document.createElement('span');
            badge.className = 'search-result-type';
            badge.textContent = 'DNS Service';
            card.appendChild(badge);
        }

        return card;
    }

    /**
     * Get Fuse match entry for a key from result.matches
     * @param {Array} matches - result.matches from Fuse
     * @param {string} key - 'title' or 'searchText'
     * @returns {Object|undefined}
     */
    function getMatchForKey(matches, key) {
        return matches && matches.find(m => m.key === key);
    }

    /**
     * Set empty-state content with query and suggestions (when no search results).
     * @param {HTMLElement} emptyState - #empty-state element
     * @param {string} query - Last search query (escaped before display)
     */
    function setEmptyStateContent(emptyState, query) {
        const safeQuery = query ? sanitizeHTML(query.trim()) : '';
        const searchEmptySvg = '<svg class="empty-state-icon" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="34" cy="34" r="22"/><path d="M50 50l14 14"/><circle cx="34" cy="34" r="14" stroke-dasharray="3 3" opacity="0.6"/></svg>';
        const heading = safeQuery ? 'No results' : 'No results found';
        const queryBlock = safeQuery
            ? '<p class="empty-state-query-wrap">for <span class="empty-state-query">' + safeQuery + '</span></p>'
            : '';
        emptyState.innerHTML =
            '<div class="empty-state-inner">' +
            searchEmptySvg +
            '<h2 class="empty-state-title">' + heading + '</h2>' +
            queryBlock +
            '<p class="empty-state-subline">Nothing in the archives matches that search.</p>' +
            '<div class="empty-state-tips-wrap">' +
            '<p class="empty-state-tips-heading">Try:</p>' +
            '<ul class="empty-state-tips">' +
            '<li><span class="empty-state-tip-icon" aria-hidden="true">&#10003;</span>Check your spelling</li>' +
            '<li><span class="empty-state-tip-icon" aria-hidden="true">&#10003;</span>Try different keywords</li>' +
            '<li><span class="empty-state-tip-icon" aria-hidden="true">&#10003;</span>Try more general terms</li>' +
            '</ul>' +
            '</div>' +
            '</div>';
    }

    /**
     * Render universal search results (categories + individual resources).
     * @param {Object} results - { categories: Array, resources: Array, fuseResults: Array|null }
     */
    function renderSearchResults(results) {
        const grid = document.getElementById('categories-grid');
        const emptyState = document.getElementById('empty-state');

        if (!grid) return;

        grid.innerHTML = '';
        grid.classList.remove('showing-category');

        const totalResults = results.categories.length + results.resources.length;

        if (totalResults === 0) {
            grid.classList.add('hidden');
            if (emptyState) {
                emptyState.classList.remove('hidden');
                setEmptyStateContent(emptyState, results.lastQuery || '');
            }
            return;
        }

        grid.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        searchSelectedIndex = -1;

        const fuseResults = results.fuseResults || null;
        const hasCategories = results.categories.length > 0;
        const hasResources = results.resources.length > 0;

        if (fuseResults && fuseResults.length > 0) {
            const categoryResults = fuseResults.filter(r => r.item.type === 'category');
            const resourceResults = fuseResults.filter(r => r.item.type === 'resource');
            if (categoryResults.length > 0) {
                if (resourceResults.length > 0) {
                    const header = document.createElement('div');
                    header.className = 'search-section-header';
                    header.textContent = 'Categories';
                    grid.appendChild(header);
                }
                categoryResults.forEach((r, index) => {
                    const card = createCategoryCard(r.item, index);
                    const titleMatch = getMatchForKey(r.matches, 'title');
                    const searchTextMatch = getMatchForKey(r.matches, 'searchText');
                    const titleEl = card.querySelector('.category-title-text');
                    if (titleEl && titleMatch) titleEl.innerHTML = highlightMatches(r.item.title, titleMatch);
                    const descEl = card.querySelector('.category-description');
                    if (descEl && searchTextMatch && r.item.description) descEl.innerHTML = highlightMatches(r.item.description, searchTextMatch);
                    grid.appendChild(card);
                });
            }
            if (resourceResults.length > 0) {
                const header = document.createElement('div');
                header.className = 'search-section-header';
                header.textContent = 'Resources';
                grid.appendChild(header);
                resourceResults.forEach(r => {
                    const card = createSearchResourceCard(r.item);
                    const titleMatch = getMatchForKey(r.matches, 'title');
                    const searchTextMatch = getMatchForKey(r.matches, 'searchText');
                    const nameEl = card.querySelector('.search-result-name-text');
                    if (nameEl && titleMatch) nameEl.innerHTML = highlightMatches(r.item.name, titleMatch);
                    const descEl = card.querySelector('.search-result-description');
                    if (descEl && searchTextMatch && r.item.description) descEl.innerHTML = highlightMatches(r.item.description, searchTextMatch);
                    grid.appendChild(card);
                });
            }
        } else {
            if (hasCategories) {
                if (hasResources) {
                    const header = document.createElement('div');
                    header.className = 'search-section-header';
                    header.textContent = 'Categories';
                    grid.appendChild(header);
                }
                results.categories.forEach((category, index) => {
                    const card = createCategoryCard(category, index);
                    grid.appendChild(card);
                });
            }
            if (hasResources) {
                const header = document.createElement('div');
                header.className = 'search-section-header';
                header.textContent = 'Resources';
                grid.appendChild(header);
                results.resources.forEach(resource => {
                    const card = createSearchResourceCard(resource);
                    grid.appendChild(card);
                });
            }
        }
    }

    /**
     * Perform universal search or restore current view (shared by homepage and header search).
     * @param {string} query - Search query (empty = restore view)
     */
    function performSearch(query) {
        if (!query || query.trim() === '') {
            filteredData = resourcesData;
            if (currentView === 'home') {
                renderCategories(filteredData);
            } else {
                const route = getCurrentRoute();
                if (route.view === 'category' && route.params.slug) {
                    renderCategoryPage(route.params.slug);
                } else {
                    renderCategories(filteredData);
                }
            }
            return;
        }
        const results = universalSearch(query);
        results.lastQuery = query;
        filteredData = results.categories;
        renderSearchResults(results);
    }

    /**
     * Handle search input (homepage or header search bar)
     * @param {Event} event - Input event
     */
    function handleSearch(event) {
        const query = event.target.value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => performSearch(query), CONFIG.searchDelay);
    }

    /**
     * Keyboard navigation for search results (Arrow Up/Down, Enter).
     * Only active when search results are visible and focus is in search context.
     */
    function handleSearchKeydown(e) {
        const grid = document.getElementById('categories-grid');
        if (!grid || grid.classList.contains('hidden')) return;
        const cards = grid.querySelectorAll('.category-card, .search-resource-card');
        if (cards.length === 0) return;
        const target = e.target;
        const isSearchInput = target.id === 'search-input' || target.id === 'header-search-input';
        const isInGrid = grid.contains(target);
        if (!isSearchInput && !isInGrid) return;
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;

        e.preventDefault();
        if (e.key === 'ArrowDown') {
            searchSelectedIndex = Math.min(searchSelectedIndex + 1, cards.length - 1);
        } else if (e.key === 'ArrowUp') {
            searchSelectedIndex = Math.max(searchSelectedIndex - 1, -1);
            if (searchSelectedIndex === -1) {
                const searchInput = document.getElementById('search-input') || document.getElementById('header-search-input');
                if (searchInput) searchInput.focus();
                cards.forEach(c => c.classList.remove('selected'));
                return;
            }
        } else if (e.key === 'Enter') {
            if (searchSelectedIndex >= 0 && cards[searchSelectedIndex]) {
                cards[searchSelectedIndex].click();
            }
            return;
        }

        cards.forEach((c, i) => c.classList.toggle('selected', i === searchSelectedIndex));
        if (searchSelectedIndex >= 0 && cards[searchSelectedIndex]) {
            cards[searchSelectedIndex].focus({ preventScroll: false });
            cards[searchSelectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        grid.innerHTML = '';

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-state';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';

        const heading = document.createElement('h2');
        heading.textContent = 'Oops! Something went wrong';

        const paragraph = document.createElement('p');
        paragraph.textContent = message;

        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'reload-btn';
        reloadBtn.textContent = 'Reload Page';
        reloadBtn.addEventListener('click', () => location.reload());

        errorDiv.appendChild(svg);
        errorDiv.appendChild(heading);
        errorDiv.appendChild(paragraph);
        errorDiv.appendChild(reloadBtn);
        grid.appendChild(errorDiv);
    }

    /**
     * Fallback copy to clipboard for older browsers
     * @param {string} text - Text to copy
     * @param {HTMLElement} button - Button element for visual feedback
     */
    function fallbackCopyToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                button.classList.add('copied');
                setTimeout(() => {
                    button.classList.remove('copied');
                }, 2000);
                console.log(`✓ Copied to clipboard (fallback): ${text}`);
            } else {
                console.error('Fallback copy failed');
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
        }

        document.body.removeChild(textArea);
    }

    /**
     * Handle routing based on URL hash
     */
    function handleRoute() {
        clearTimeout(searchTimeout);
        const route = getCurrentRoute();
        const searchInput = document.getElementById('search-input');
        const searchSection = document.querySelector('.search-section');
        const siteHeader = document.getElementById('site-header');

        if (route.view === 'home') {
            currentView = 'home';
            // Reset header to homepage state
            resetHeader();
            // Hide header on homepage (minimal layout)
            if (siteHeader) siteHeader.classList.add('header-hidden');
            // Show search on homepage
            if (searchSection) searchSection.classList.remove('hidden');
            if (searchInput) searchInput.value = '';
            // Show floating nav actions and homepage top actions bar (grid-aligned) on homepage
            toggleFloatingNavActions(true);
            toggleHomepageTopActions(true);

            filteredData = resourcesData;
            renderCategories(filteredData);
        } else if (route.view === 'category') {
            currentView = 'category';
            // Show header on category pages
            if (siteHeader) siteHeader.classList.remove('header-hidden');
            // Hide search on category pages
            if (searchSection) searchSection.classList.add('hidden');
            // Hide floating nav actions and homepage top actions bar on category pages
            toggleFloatingNavActions(false);
            toggleHomepageTopActions(false);

            renderCategoryPage(route.params.slug);
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    /**
     * Initialize the application
     */
    async function init() {
        console.log('Black Flag Archives initializing...');

        // Fetch and render resources
        resourcesData = await fetchResources();
        filteredData = resourcesData;

        // Defer Fuse.js index build so the page and category tiles paint immediately.
        // Build runs after first paint; until then search uses the token-based fallback.
        if (typeof window.Fuse !== 'undefined') {
            const buildFuseIndex = function() {
                const searchIndex = buildSearchIndex();
                searchFuse = new window.Fuse(searchIndex, {
                    keys: [{ name: 'title', weight: 2 }, { name: 'searchText', weight: 1 }],
                    threshold: 0.35,
                    ignoreDiacritics: true,
                    includeScore: true,
                    includeMatches: true,
                    minMatchCharLength: 2,
                    useExtendedSearch: true
                });
            };
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(buildFuseIndex, { timeout: 2000 });
            } else {
                setTimeout(buildFuseIndex, 0);
            }
        }

        // Populate floating nav actions (about, contact, source) and homepage left row (donate, report)
        renderFloatingNavActions();
        renderHomepageLeftActions();

        // Set up routing
        window.addEventListener('hashchange', handleRoute);
        handleRoute(); // Initial route

        // Set up search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);

            // Clear search on Escape key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    performSearch('');
                }
            });
        }
        document.addEventListener('keydown', handleSearchKeydown);

        // Prevent search form submission (page reload)
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => e.preventDefault());
        }

        // Back-to-top button
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 400) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            }, { passive: true });

            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        console.log(`Black Flag Archives loaded with ${resourcesData.length} categories`);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for testing or external use
    window.BlackFlagArchives = {
        getResources: () => resourcesData,
        getFilteredResources: () => filteredData,
        search: (query) => performSearch(query)
    };

})();

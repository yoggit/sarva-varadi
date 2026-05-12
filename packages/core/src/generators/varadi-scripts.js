// Convert timestamps to user's local timezone
document.addEventListener('DOMContentLoaded', function() {
    // Convert main report timestamp
    const timestampEl = document.getElementById('timestamp');
    if (timestampEl) {
        const isoTime = timestampEl.getAttribute('data-time');
        const date = new Date(isoTime);
        timestampEl.textContent = date.toLocaleString();
    }

    // Convert all tooltip dates (Top Offenders history icons)
    document.querySelectorAll('.tooltip-date').forEach(el => {
        const isoTime = el.getAttribute('data-time');
        if (isoTime) {
            const date = new Date(isoTime);
            const placeholder = el.querySelector('.date-placeholder');
            if (placeholder) {
                placeholder.textContent = date.toLocaleString();
            }
        }
    });

    // Convert last flaky dates (Top Offenders)
    document.querySelectorAll('.last-flaky-date').forEach(el => {
        const isoTime = el.getAttribute('data-time');
        if (isoTime) {
            const date = new Date(isoTime);
            el.textContent = date.toLocaleString();
        }
    });

    // Convert Activity Stream dates
    document.querySelectorAll('.activity-date').forEach(el => {
        const isoTime = el.getAttribute('data-time');
        if (isoTime) {
            const date = new Date(isoTime);
            el.textContent = date.toLocaleString();
        }
    });

    // Modal setup
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'modal';
    modal.onclick = closeModal;
    modal.innerHTML = '<img id="modalImage" onclick="event.stopPropagation()">';
    document.body.appendChild(modal);

    // Dynamic tooltip positioning to prevent edge trimming
    document.querySelectorAll('.info-tooltip').forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            const tooltipText = this.querySelector('.tooltip-text');
            if (!tooltipText) return;

            // Reset position classes
            tooltipText.style.cssText = '';

            const iconRect = this.getBoundingClientRect();
            const tooltipWidth = 450; // From CSS
            const tooltipHeight = tooltipText.offsetHeight || 100;
            const margin = 8; // spacing from icon

            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };

            // Calculate available space in each direction
            const spaceTop = iconRect.top;
            const spaceBottom = viewport.height - iconRect.bottom;
            const spaceLeft = iconRect.left;
            const spaceRight = viewport.width - iconRect.right;

            // Determine best vertical position (above or below)
            const preferAbove = spaceTop > spaceBottom && spaceTop > tooltipHeight + margin;

            // Determine best horizontal alignment
            let position = '';
            if (preferAbove) {
                position = 'bottom: 100%; margin-bottom: ' + margin + 'px;';
            } else {
                position = 'top: 100%; margin-top: ' + margin + 'px;';
            }

            // Horizontal alignment: try right-align first, then left-align if not enough space
            if (iconRect.right >= tooltipWidth) {
                // Right-align tooltip (tooltip extends left from icon)
                position += ' right: 0;';
            } else if (spaceRight >= tooltipWidth) {
                // Left-align tooltip (tooltip extends right from icon)
                position += ' left: 0;';
            } else {
                // Center on icon if neither side has full space
                position += ' left: 50%; transform: translateX(-50%);';
            }

            tooltipText.style.cssText = position;
        });
    });

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('varadiTheme');

        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('light-mode');
                localStorage.setItem('varadiTheme', 'light');
            } else {
                document.body.classList.remove('light-mode');
                localStorage.setItem('varadiTheme', 'dark');
            }
        });
    }

    // Filter functionality (only for test status filters in main report)
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            // Only remove 'active' from buttons with data-filter attribute (same group)
            document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            const tests = document.querySelectorAll('.test-item');

            tests.forEach(test => {
                if (filter === 'all') {
                    test.style.display = 'block';
                } else {
                    // Check both data-status and data-all-statuses (for grouped tests)
                    const matchesStatus = test.dataset.status === filter;
                    const matchesAnyStatus = test.dataset.allStatuses && test.dataset.allStatuses.includes(filter);

                    if (matchesStatus || matchesAnyStatus) {
                        test.style.display = 'block';
                    } else {
                        test.style.display = 'none';
                    }
                }
            });
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const tests = document.querySelectorAll('.test-item');

            tests.forEach(test => {
                const title = test.querySelector('.test-title').textContent.toLowerCase();
                const location = test.querySelector('.test-location').textContent.toLowerCase();

                if (title.includes(query) || location.includes(query)) {
                    test.style.display = 'block';
                } else {
                    test.style.display = 'none';
                }
            });
        });
    }
});

// Global functions for onclick handlers
function toggleTest(testId) {
    const testItem = document.querySelector(`[data-testid="${testId}"]`);
    if (testItem) {
        testItem.classList.toggle('expanded');
    }
}

function toggleBrowserTest(testId) {
    const detailsEl = document.getElementById(`browser-details-${testId}`);
    const iconEl = document.querySelector(`.browser-expand-icon-${testId}`);
    if (detailsEl && iconEl) {
        if (detailsEl.style.display === 'none') {
            detailsEl.style.display = 'block';
            iconEl.textContent = '▲';
        } else {
            detailsEl.style.display = 'none';
            iconEl.textContent = '▼';
        }
    }
}

function toggleRetriesSection() {
    const contentEl = document.getElementById('retries-content');
    const hintEl = document.getElementById('retries-hint');
    const iconEl = document.getElementById('retries-expand-icon');

    if (contentEl && hintEl && iconEl) {
        if (contentEl.style.display === 'none') {
            contentEl.style.display = 'block';
            hintEl.style.display = 'none';
            iconEl.textContent = '▲';
        } else {
            contentEl.style.display = 'none';
            hintEl.style.display = 'inline';
            iconEl.textContent = '▼';
        }
    }
}

function expandAll() {
    const testItems = document.querySelectorAll('.test-item');
    testItems.forEach(item => item.classList.add('expanded'));
}

function collapseAll() {
    const testItems = document.querySelectorAll('.test-item');
    testItems.forEach(item => item.classList.remove('expanded'));
}

function openModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modal.style.display = 'flex';
        modalImg.src = src;
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

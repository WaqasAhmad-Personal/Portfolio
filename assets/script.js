/**
 * Waqas Ahmad - Portfolio Interactive Script
 * Solves:
 * 1. Nested button click bubbling bugs in carousels
 * 2. Mobile navigation drawer toggle
 * 3. Dynamic category filtering across all projects
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Drawer Toggle
  const toggleBtn = document.getElementById('navToggleBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (toggleBtn && mobileDrawer) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      toggleBtn.textContent = isOpen ? '✕' : '☰';
    });

    // Close drawer when clicking any link inside it
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.textContent = '☰';
      });
    });
  }

  // Category Filter Tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  const projectCards = document.querySelectorAll('.project-card');

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.getAttribute('data-category');
      
      // Update active tab styling
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter project cards
      projectCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'All' || cardCategory === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});

/**
 * Cycle screenshot carousel without triggering parent links or page jumps.
 * @param {HTMLElement} btn - The clicked button (< or >)
 * @param {number} delta - Direction: -1 for previous, 1 for next
 * @param {Event} event - The click event
 */
function cycleProjectAlbum(btn, delta, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const album = btn.closest('.album-container');
  if (!album) return;

  try {
    const images = JSON.parse(album.getAttribute('data-images') || '[]');
    if (!images || images.length === 0) return;

    let currentIndex = parseInt(album.getAttribute('data-index') || '0', 10);
    let nextIndex = (currentIndex + delta + images.length) % images.length;
    album.setAttribute('data-index', String(nextIndex));

    const imgElement = album.querySelector('.album-img');
    const counterElement = album.querySelector('.album-counter');

    if (imgElement && images[nextIndex]) {
      imgElement.src = images[nextIndex];
    }
    if (counterElement) {
      counterElement.textContent = (nextIndex + 1) + ' / ' + images.length;
    }
  } catch (err) {
    console.error('Error cycling album:', err);
  }
}

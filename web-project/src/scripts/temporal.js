/**
 * Temporal Analysis Page - JavaScript
 * Fetches FAQ data from /api/phase3/faq and renders accordion
 */

const API_BASE = 'http://127.0.0.1:8000';

/**
 * Initialize the temporal analysis page
 */
async function initTemporalPage() {
    const container = document.getElementById('faq-container');
    const totalQuestionsEl = document.getElementById('total-questions');
    
    if (!container) return;
    
    try {
        // Fetch FAQ data from static JSON (no backend required)
        const response = await fetch('assets/data/phase3_faq.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            container.innerHTML = `<p style="color: #ff6b6b;">Error: ${data.error}</p>`;
            return;
        }
        
        // Update total count
        if (totalQuestionsEl) {
            totalQuestionsEl.textContent = data.total || data.faq.length;
        }
        
        // Render FAQ items
        renderFAQ(data.faq, container);
        
    } catch (error) {
        console.error('Failed to fetch FAQ data:', error);
        container.innerHTML = `
            <p style="color: #ff6b6b; text-align: center;">
                Unable to load analysis questions. Please ensure the API server is running.
            </p>
        `;
    }
}

/**
 * Render FAQ accordion items
 */
function renderFAQ(faqItems, container) {
    if (!faqItems || faqItems.length === 0) {
        container.innerHTML = '<p>No analysis questions available.</p>';
        return;
    }
    
    const html = faqItems.map((item, index) => {
        // Generate image HTML if images exist
        let imagesHtml = '';
        if (item.images && item.images.length > 0) {
            imagesHtml = `
                <div class="faq-images">
                    ${item.images.map(img => `
                        <div class="faq-image-container">
                            <img src="${img}" alt="Analysis Chart for ${item.id}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
        <div class="faq-item" data-id="${item.id}">
            <div class="faq-question" onclick="toggleFAQ(this)">
                <span class="faq-number">${item.id}</span>
                <span class="faq-question-text">${escapeHtml(item.question)}</span>
                <span class="faq-toggle">+</span>
            </div>
            <div class="faq-answer">
                <div class="faq-insight">
                    ${formatInsight(item.insight)}
                </div>
                ${imagesHtml}
            </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

/**
 * Toggle FAQ item open/closed
 */
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const wasActive = faqItem.classList.contains('active');
    
    // Close all other items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current item
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

/**
 * Format insight text with proper paragraphs
 */
function formatInsight(text) {
    if (!text) return '<p>Analysis pending.</p>';
    
    // Split by newlines and create paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim());
    
    return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initTemporalPage);

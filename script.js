// --- VARIABLES GLOBALES ---
let products = JSON.parse(localStorage.getItem('products')) || [];
let designTypes = JSON.parse(localStorage.getItem('designTypes')) || [
    'Anime', 'Gaming', 'Música', 'Deportes', 'Abstracto', 'Naturaleza'
];

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', function() {
    loadDesignTypes();
    loadProducts();
    updateStats();
    setupEventListeners();
    setupLogoUpload();
    switchSection('individual');
});

// --- GESTIÓN DE EVENTOS ---
function setupEventListeners() {
    document.getElementById('product-form').addEventListener('submit', addProduct);
    document.getElementById('design-form').addEventListener('submit', addDesignType);
    
    document.querySelectorAll('.category-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            switchSection(this.getAttribute('data-section'));
        });
    });
    
    document.getElementById('tipo-diseno').addEventListener('change', filterProducts);

    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                if (modal.id === 'product-modal') closeModal();
                if (modal.id === 'design-modal') closeDesignModal();
            }
        });
    });
}

// --- GESTIÓN DEL LOGO ---
function setupLogoUpload() {
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');

    logoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                logoPreview.src = e.target.result;
                localStorage.setItem('logo', e.target.result);
                showNotification('Logo actualizado correctamente', 'success');
            };
            reader.readAsDataURL(file);
        }
    });

    const savedLogo = localStorage.getItem('logo');
    if (savedLogo) {
        logoPreview.src = savedLogo;
    }
}

// --- GESTIÓN DE TIPOS DE DISEÑO ---
function loadDesignTypes() {
    const typeSelect = document.getElementById('product-type');
    const designFilter = document.getElementById('tipo-diseno');
    const designList = document.getElementById('design-list');
    
    typeSelect.innerHTML = '<option value="" disabled selected>Selecciona un tipo de diseño</option>';
    designFilter.innerHTML = '<option value="">Todos los diseños</option>';
    designList.innerHTML = '';
    
    designTypes.sort().forEach(type => {
        typeSelect.appendChild(new Option(type, type));
        designFilter.appendChild(new Option(type, type));
        
        const item = document.createElement('div');
        item.className = 'design-item';
        item.innerHTML = `
            <span>${type}</span>
            <button class="design-delete-btn" onclick="removeDesignType('${type}')" aria-label="Eliminar ${type}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        designList.appendChild(item);
    });
}

function addDesignType(event) {
    event.preventDefault();
    const designNameInput = document.getElementById('design-name');
    const designName = designNameInput.value.trim();
    
    if (designName && !designTypes.some(d => d.toLowerCase() === designName.toLowerCase())) {
        designTypes.push(designName);
        localStorage.setItem('designTypes', JSON.stringify(designTypes));
        loadDesignTypes();
        updateStats();
        designNameInput.value = '';
        showNotification('Tipo de diseño agregado', 'success');
    } else {
        showNotification('El tipo de diseño ya existe o es inválido', 'error');
    }
}

function removeDesignType(typeToRemove) {
    if (confirm(`¿Seguro que quieres eliminar el tipo "${typeToRemove}"? Esto cambiará los productos asociados a "Sin categoría".`)) {
        designTypes = designTypes.filter(type => type !== typeToRemove);
        localStorage.setItem('designTypes', JSON.stringify(designTypes));
        
        products.forEach(p => {
            if (p.type === typeToRemove) {
                p.type = 'Sin categoría';
            }
        });
        localStorage.setItem('products', JSON.stringify(products));

        loadDesignTypes();
        loadProducts();
        updateStats();
        showNotification('Tipo de diseño eliminado', 'success');
    }
}

// --- GESTIÓN DE PRODUCTOS ---
function addProduct(event) {
    event.preventDefault();
    
    const imageFile = document.getElementById('product-image').files[0];
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const type = document.getElementById('product-type').value;
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (imageFile && name && category && type && !isNaN(price) && price >= 0) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const product = {
                id: Date.now(),
                name: name,
                category: category,
                type: type,
                price: price,
                image: e.target.result,
                dateAdded: new Date().toISOString()
            };
            
            products.push(product);
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
            updateStats();
            closeModal();
            showNotification('Franela agregada exitosamente', 'success');
        };
        
        // --- CORRECCIÓN CLAVE ---
        // Esta línea inicia la lectura del archivo. Debe estar FUERA del 'onload'.
        reader.readAsDataURL(imageFile);

    } else {
        showNotification('Por favor completa todos los campos correctamente', 'error');
    }
}


function deleteProduct(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta franela?')) {
        products = products.filter(product => product.id !== productId);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        updateStats();
        showNotification('Franela eliminada exitosamente', 'success');
    }
}

function loadProducts() {
    const individualGrid = document.getElementById('individual-grid');
    const dobleGrid = document.getElementById('doble-grid');
    
    individualGrid.innerHTML = '';
    dobleGrid.innerHTML = '';
    
    const individualProducts = products.filter(p => p.category === 'individual');
    const dobleProducts = products.filter(p => p.category === 'doble');

    const emptyMessage = `
        <div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 3rem;">
            <i class="fas fa-tshirt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>Aún no hay franelas en esta sección.</p>
            <p>Usa el botón "Agregar Franela" para empezar.</p>
        </div>
    `;

    if (individualProducts.length === 0) individualGrid.innerHTML = emptyMessage;
    if (dobleProducts.length === 0) dobleGrid.innerHTML = emptyMessage;
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-type', product.type.toLowerCase());
        
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-type">${product.type}</p>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-actions">
                <button class="delete-btn" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        
        if (product.category === 'individual') {
            individualGrid.appendChild(card);
        } else if (product.category === 'doble') {
            dobleGrid.appendChild(card);
        }
    });
    filterProducts();
}

// --- FUNCIONES DE LA INTERFAZ ---
function switchSection(sectionId) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    document.querySelectorAll('.catalog-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`${sectionId}-section`).classList.add('active');
}

function filterProducts() {
    const typeFilter = document.getElementById('tipo-diseno').value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
        const productType = card.getAttribute('data-type');
        card.style.display = (!typeFilter || productType.includes(typeFilter)) ? 'flex' : 'none';
    });
}

function updateStats() {
    document.getElementById('total-products').textContent = products.length;
    document.getElementById('individual-count').textContent = products.filter(p => p.category === 'individual').length;
    document.getElementById('doble-count').textContent = products.filter(p => p.category === 'doble').length;
    document.getElementById('design-types-count').textContent = designTypes.length;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<p>${message}</p>`;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 5px; color: white;
        font-family: 'Orbitron', sans-serif; z-index: 10001; animation: slideIn 0.3s ease; max-width: 300px;
        background: ${type === 'success' ? '#28a745' : (type === 'error' ? '#dc3545' : '#007bff')};
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        notification.addEventListener('animationend', () => notification.remove());
    }, 3000);
}

// --- MODALES ---
function openModal() { document.getElementById('product-modal').style.display = 'block'; }
function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
    document.getElementById('product-form').reset();
}
function openDesignModal() { document.getElementById('design-modal').style.display = 'block'; }
function closeDesignModal() {
    document.getElementById('design-modal').style.display = 'none';
    document.getElementById('design-form').reset();
}

// --- EXPORTACIÓN A PDF (VERSIÓN ELEGANTE) ---
async function exportCompleteCatalog() {
    if (products.length === 0) {
        showNotification('No hay productos para exportar', 'error');
        return;
    }

    showNotification('Generando PDF elegante...', 'info');

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        const colors = {
            bg: '#F3E5F5',
            border: '#5D6D7E',
            cardBg: '#FFFFFF',
            text: '#212121',
            primary: '#AD1457',
            secondary: '#00695C',
            subtle: '#9E9E9E',
        };

        let pageNumber = 0;
        const addNewPage = (title) => {
            pageNumber++;
            if (pageNumber > 1) pdf.addPage();
            pdf.setFillColor(colors.bg);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            pdf.setDrawColor(colors.border);
            pdf.setLineWidth(0.3);
            pdf.rect(margin / 2, margin / 2, pageWidth - margin, pageHeight - margin);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(colors.text);
            pdf.setFontSize(20);
            pdf.text('M.B DRIP', pageWidth / 2, margin + 8, { align: 'center' });
            if (title) {
                pdf.setFontSize(14);
                pdf.setTextColor(colors.primary);
                pdf.text(title, pageWidth / 2, margin + 18, { align: 'center' });
            }
            pdf.setTextColor(colors.border);
            pdf.setFontSize(8);
            pdf.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 7, { align: 'center' });
        };

        addNewPage('Catálogo Oficial');
        const savedLogo = localStorage.getItem('logo');
        if (savedLogo) {
            pdf.addImage(savedLogo, 'PNG', (pageWidth - 60) / 2, 50, 60, 60);
        }
        
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colors.text);
        pdf.setFontSize(12);
        const generationDate = new Date().toLocaleDateString('es-VE', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        pdf.text(`Generado el: ${generationDate}`, pageWidth / 2, 130, { align: 'center' });
        pdf.text(`Total de Diseños en Catálogo: ${products.length}`, pageWidth / 2, 140, { align: 'center' });

        const categories = [{ id: 'individual', title: 'Franelas Individuales' }, { id: 'doble', title: 'Doble Estampado' }];
        
        for (const category of categories) {
            const categoryProducts = products.filter(p => p.category === category.id);
            if (categoryProducts.length === 0) continue;

            addNewPage(category.title);
            let yPos = 40;
            const cardWidth = pageWidth - (margin * 2);
            const cardHeight = 80;

            for (const product of categoryProducts) {
                if (yPos + cardHeight > pageHeight - margin) {
                    addNewPage(`${category.title} (cont.)`);
                    yPos = 40;
                }

                pdf.setFillColor(colors.cardBg);
                pdf.setDrawColor(colors.subtle);
                pdf.setLineWidth(0.2);
                pdf.roundedRect(margin, yPos, cardWidth, cardHeight - 5, 3, 3, 'FD');

                const imageWidth = 65;
                const imageHeight = 65;
                const imageX = margin + 5;
                const imageY = yPos + 5;
                const textX = imageX + imageWidth + 8;
                const textWidth = cardWidth - imageWidth - 20;

                pdf.addImage(product.image, 'JPEG', imageX, imageY, imageWidth, imageHeight);
                pdf.setDrawColor(colors.subtle);
                pdf.rect(imageX, imageY, imageWidth, imageHeight);
                
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(colors.text);
                pdf.setFontSize(14);
                const productName = pdf.splitTextToSize(product.name, textWidth);
                pdf.text(productName, textX, yPos + 15);

                pdf.setFillColor(colors.subtle);
                const typeText = product.type;
                const typeWidth = pdf.getStringUnitWidth(typeText) * 10 / pdf.internal.scaleFactor + 6;
                pdf.roundedRect(textX, yPos + 25, typeWidth, 8, 2, 2, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(colors.cardBg);
                pdf.setFontSize(10);
                pdf.text(typeText, textX + 3, yPos + 30.5);

                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(colors.primary);
                pdf.setFontSize(22);
                pdf.text(`$${product.price.toFixed(2)}`, textX, yPos + 55);

                yPos += cardHeight;
            }
        }

        pdf.save(`catalogo-mb-drip-elegante-${new Date().toISOString().slice(0, 10)}.pdf`);
        showNotification('¡PDF de estilo elegante generado!', 'success');

    } catch (error) {
        console.error('Error generando PDF:', error);
        showNotification('Error al generar el PDF. Revisa la consola.', 'error');
    }
}

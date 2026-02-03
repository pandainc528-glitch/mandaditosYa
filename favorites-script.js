// ============================================
// FAVORITOS - ÑAN DELIVERY
// ============================================

// Datos de productos (mismo que en home-script.js)
const productsData = {
    restaurantes: [
        {
            id: 'rest-1',
            name: 'Hamburguesa',
            price: 2.50,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
            category: 'restaurantes'
        },
        {
            id: 'rest-2',
            name: 'Almuerzo',
            price: 2.50,
            image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
            category: 'restaurantes'
        },
        {
            id: 'rest-3',
            name: 'Ensalada',
            price: 3.00,
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
            category: 'restaurantes'
        },
        {
            id: 'rest-4',
            name: 'Papipollo',
            price: 1.50,
            image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop',
            category: 'restaurantes'
        },
        {
            id: 'rest-5',
            name: 'Fritada',
            price: 1.50,
            image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop',
            category: 'restaurantes'
        }
    ],
    mercado: [
        {
            id: 'merc-1',
            name: 'Azúcar',
            price: 1.00,
            image: 'https://images.unsplash.com/photo-1581850518616-bcb8077a2336?w=400&h=400&fit=crop',
            category: 'mercado'
        },
        {
            id: 'merc-2',
            name: 'Sal',
            price: 1.00,
            image: 'https://images.unsplash.com/photo-1584949602334-204ce8068c17?w=400&h=400&fit=crop',
            category: 'mercado'
        },
        {
            id: 'merc-3',
            name: 'Fideos',
            price: 2.00,
            image: 'https://images.unsplash.com/photo-1551462147-37c24e43d335?w=400&h=400&fit=crop',
            category: 'mercado'
        }
    ],
    farmacia: [
        {
            id: 'farm-1',
            name: 'Curita',
            price: 0.10,
            image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&h=400&fit=crop',
            category: 'farmacia'
        },
        {
            id: 'farm-2',
            name: 'Alcohol',
            price: 1.30,
            image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
            category: 'farmacia'
        },
        {
            id: 'farm-3',
            name: 'Preservativos',
            price: 2.50,
            image: 'https://images.unsplash.com/photo-1550572017-4332d4e6a8e5?w=400&h=400&fit=crop',
            category: 'farmacia'
        }
    ],
    ferreteria: [
        {
            id: 'ferr-1',
            name: 'Clavos',
            price: 0.70,
            image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop',
            category: 'ferreteria'
        },
        {
            id: 'ferr-2',
            name: 'Martillo',
            price: 6.00,
            image: 'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?w=400&h=400&fit=crop',
            category: 'ferreteria'
        }
    ]
};

// Variables globales
let currentUser = null;
let favorites = [];
let cart = [];
let allProducts = [];

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    
    // Inicializar Firebase
    const firebaseInitialized = initializeFirebase();
    
    if (!firebaseInitialized) {
        console.error('Error al inicializar Firebase');
        window.location.href = 'index.html';
        return;
    }
    
    // Crear array plano de todos los productos
    allProducts = Object.values(productsData).flat();
    
    // Cargar carrito desde localStorage
    loadCartFromStorage();
    updateCartBadge();
    
    // Verificar autenticación
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadFavorites();
            renderFavorites();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// ============================================
// CARGAR FAVORITOS
// ============================================

async function loadFavorites() {
    try {
        // Intentar cargar desde Firestore
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            favorites = userData.favorites || [];
            console.log('✅ Favoritos cargados desde Firestore:', favorites);
        } else {
            // Fallback a localStorage
            const savedFavorites = localStorage.getItem('nanAppFavorites');
            if (savedFavorites) {
                favorites = JSON.parse(savedFavorites);
                console.log('✅ Favoritos cargados desde localStorage:', favorites);
            }
        }
    } catch (error) {
        console.error('Error al cargar favoritos:', error);
        // Fallback a localStorage
        const savedFavorites = localStorage.getItem('nanAppFavorites');
        if (savedFavorites) {
            favorites = JSON.parse(savedFavorites);
        }
    }
}

// ============================================
// RENDERIZAR FAVORITOS
// ============================================

function renderFavorites() {
    const favoritesSection = document.getElementById('favoritesSection');
    const emptyState = document.getElementById('emptyState');
    const favCount = document.getElementById('favCount');
    
    // Actualizar contador
    favCount.textContent = favorites.length;
    
    // Si no hay favoritos, mostrar estado vacío
    if (favorites.length === 0) {
        favoritesSection.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    // Ocultar estado vacío y mostrar lista
    emptyState.style.display = 'none';
    favoritesSection.style.display = 'block';
    
    // Limpiar contenido
    favoritesSection.innerHTML = '';
    
    // Renderizar cada producto favorito
    favorites.forEach((favoriteId, index) => {
        const product = allProducts.find(p => p.id === favoriteId);
        
        if (product) {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            favoriteItem.style.animationDelay = `${index * 0.1}s`;
            
            favoriteItem.innerHTML = `
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-details">
                    <div class="product-header">
                        <h3 class="product-name">${product.name}</h3>
                        <button class="remove-favorite-btn" onclick="removeFavorite('${product.id}')">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>
                    <p class="product-category">${getCategoryName(product.category)}</p>
                    <div class="product-footer">
                        <p class="product-price">$${product.price.toFixed(2)}</p>
                        <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                            Agregar
                        </button>
                    </div>
                </div>
            `;
            
            favoritesSection.appendChild(favoriteItem);
        }
    });
}

// ============================================
// REMOVER DE FAVORITOS
// ============================================

window.removeFavorite = async function(productId) {
    // Remover del array
    const index = favorites.indexOf(productId);
    if (index > -1) {
        favorites.splice(index, 1);
    }
    
    // Guardar en localStorage
    localStorage.setItem('nanAppFavorites', JSON.stringify(favorites));
    
    // Actualizar en Firestore
    if (currentUser) {
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(currentUser.uid).update({
                favorites: favorites
            });
            console.log('✅ Favoritos actualizados en Firestore');
        } catch (error) {
            console.error('Error al actualizar favoritos:', error);
        }
    }
    
    // Obtener nombre del producto
    const product = allProducts.find(p => p.id === productId);
    const productName = product ? product.name : 'Producto';
    
    // Mostrar mensaje
    showToast(`${productName} eliminado de favoritos`);
    
    // Re-renderizar
    renderFavorites();
};

// ============================================
// AGREGAR AL CARRITO
// ============================================

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        console.error('Producto no encontrado');
        return;
    }
    
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    // Guardar en localStorage
    saveCartToStorage();
    
    // Actualizar badge
    updateCartBadge();
    
    // Mostrar mensaje
    showToast(`${product.name} agregado al carrito`);
};

// ============================================
// FUNCIONES DE CARRITO
// ============================================

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('nanAppCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveCartToStorage() {
    localStorage.setItem('nanAppCart', JSON.stringify(cart));
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    badge.textContent = totalItems;
    
    if (totalItems > 0) {
        badge.classList.add('show');
    } else {
        badge.classList.remove('show');
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getCategoryName(category) {
    const names = {
        'restaurantes': 'Restaurantes',
        'mercado': 'Mercado',
        'farmacia': 'Farmacia',
        'ferreteria': 'Ferretería'
    };
    return names[category] || category;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: slideUp 0.3s ease;
        max-width: 90%;
        text-align: center;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
        }
    `;
    
    if (!document.head.querySelector('style[data-toast]')) {
        style.setAttribute('data-toast', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 2000);
}

console.log('✅ Página de favoritos inicializada');

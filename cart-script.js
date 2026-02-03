// ============================================
// CARRITO DE COMPRAS - ÑAN DELIVERY
// ============================================

// Variables globales
let currentUser = null;
let cart = [];
const DELIVERY_FEE = 1.00;

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
    
    // Verificar autenticación
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadCart();
            renderCart();
        } else {
            window.location.href = 'index.html';
        }
    });
    
    // Event listener para el botón de checkout
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
});

// ============================================
// CARGAR CARRITO
// ============================================

function loadCart() {
    const savedCart = localStorage.getItem('nanAppCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        console.log('✅ Carrito cargado:', cart);
    }
}

function saveCart() {
    localStorage.setItem('nanAppCart', JSON.stringify(cart));
}

// ============================================
// RENDERIZAR CARRITO
// ============================================

function renderCart() {
    const cartSection = document.getElementById('cartSection');
    const emptyState = document.getElementById('emptyState');
    const orderSummary = document.getElementById('orderSummary');
    const clearCartBtn = document.getElementById('clearCartBtn');
    
    // Si el carrito está vacío
    if (cart.length === 0) {
        cartSection.style.display = 'none';
        orderSummary.style.display = 'none';
        emptyState.style.display = 'block';
        clearCartBtn.style.display = 'none';
        return;
    }
    
    // Mostrar elementos
    emptyState.style.display = 'none';
    cartSection.style.display = 'block';
    orderSummary.style.display = 'block';
    clearCartBtn.style.display = 'flex';
    
    // Limpiar contenido
    cartSection.innerHTML = '';
    
    // Renderizar cada producto
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.style.animationDelay = `${index * 0.1}s`;
        
        const itemSubtotal = item.price * item.quantity;
        
        cartItem.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="item-details">
                <div class="item-header">
                    <h3 class="item-name">${item.name}</h3>
                    <button class="remove-item-btn" onclick="removeItem('${item.id}')">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>
                <p class="item-price">$${item.price.toFixed(2)} c/u</p>
                <div class="item-footer">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="decreaseQuantity('${item.id}')" ${item.quantity <= 1 ? 'disabled' : ''}>
                            −
                        </button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="increaseQuantity('${item.id}')">
                            +
                        </button>
                    </div>
                    <span class="item-subtotal">$${itemSubtotal.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        cartSection.appendChild(cartItem);
    });
    
    // Actualizar resumen
    updateOrderSummary();
}

// ============================================
// GESTIÓN DE CANTIDADES
// ============================================

window.increaseQuantity = function(productId) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity++;
        saveCart();
        renderCart();
    }
};

window.decreaseQuantity = function(productId) {
    const item = cart.find(i => i.id === productId);
    if (item && item.quantity > 1) {
        item.quantity--;
        saveCart();
        renderCart();
    }
};

// ============================================
// ELIMINAR PRODUCTOS
// ============================================

window.removeItem = function(productId) {
    const item = cart.find(i => i.id === productId);
    
    if (item) {
        showConfirmModal(
            '¿Eliminar producto?',
            `¿Deseas eliminar ${item.name} del carrito?`,
            () => {
                cart = cart.filter(i => i.id !== productId);
                saveCart();
                renderCart();
                showToast('Producto eliminado del carrito');
            }
        );
    }
};

window.clearCartConfirm = function() {
    if (cart.length === 0) return;
    
    showConfirmModal(
        '¿Vaciar carrito?',
        '¿Deseas eliminar todos los productos del carrito?',
        () => {
            cart = [];
            saveCart();
            renderCart();
            showToast('Carrito vaciado');
        }
    );
};

// ============================================
// RESUMEN DEL PEDIDO
// ============================================

function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_FEE;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `$${DELIVERY_FEE.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// ============================================
// CHECKOUT
// ============================================

function handleCheckout() {
    if (cart.length === 0) {
        showToast('El carrito está vacío');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_FEE;
    
    showConfirmModal(
        '¿Confirmar pedido?',
        `Total a pagar: $${total.toFixed(2)}`,
        async () => {
            try {
                // Crear pedido en Firestore
                await createOrder();
                
                // Limpiar carrito
                cart = [];
                saveCart();
                renderCart();
                
                // Mostrar mensaje de éxito
                showSuccessModal();
                
            } catch (error) {
                console.error('Error al crear pedido:', error);
                showToast('Error al procesar el pedido');
            }
        }
    );
}

async function createOrder() {
    if (!currentUser) return;
    
    try {
        const db = firebase.firestore();
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + DELIVERY_FEE;
        
        const orderData = {
            userId: currentUser.uid,
            customerName: currentUser.displayName || 'Usuario',
            customerEmail: currentUser.email,
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
                category: item.category
            })),
            subtotal: subtotal,
            deliveryFee: DELIVERY_FEE,
            total: total,
            status: 'pendiente',
            paymentMethod: 'efectivo',
            orderDate: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const orderRef = await db.collection('orders').add(orderData);
        console.log('✅ Pedido creado:', orderRef.id);
        
        return orderRef.id;
        
    } catch (error) {
        console.error('❌ Error al crear pedido:', error);
        throw error;
    }
}

// ============================================
// MODALES
// ============================================

function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon">⚠️</div>
            <h3 class="confirm-title">${title}</h3>
            <p class="confirm-text">${message}</p>
            <div class="confirm-buttons">
                <button class="confirm-btn confirm-btn-cancel" onclick="closeConfirmModal()">
                    Cancelar
                </button>
                <button class="confirm-btn confirm-btn-delete" onclick="confirmAction()">
                    Confirmar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Guardar callback
    window.currentConfirmAction = onConfirm;
}

window.closeConfirmModal = function() {
    const modal = document.querySelector('.confirm-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    window.currentConfirmAction = null;
};

window.confirmAction = function() {
    if (window.currentConfirmAction) {
        window.currentConfirmAction();
    }
    closeConfirmModal();
};

function showSuccessModal() {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon">✅</div>
            <h3 class="confirm-title">¡Pedido realizado!</h3>
            <p class="confirm-text">Tu pedido ha sido registrado exitosamente. Pronto recibirás tu entrega.</p>
            <button class="confirm-btn confirm-btn-delete" onclick="closeSuccessModal()" style="width: 100%;">
                Aceptar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.closeSuccessModal = function() {
    const modal = document.querySelector('.confirm-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
    // Redirigir al home
    window.location.href = 'home.html';
};

// ============================================
// NOTIFICACIONES
// ============================================

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 250px;
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
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
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

console.log('✅ Página de carrito inicializada');

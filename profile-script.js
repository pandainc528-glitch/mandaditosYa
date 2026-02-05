// ============================================
// PERFIL - ÑAN DELIVERY
// ============================================

let currentUser = null;
let userData = null;

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
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            await loadStats();
        } else {
            window.location.href = 'index.html';
        }
    });
});

// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================

async function loadUserData() {
    try {
        // Cargar desde Firestore
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
        } else {
            userData = {};
        }
        
        // Mostrar información
        displayUserInfo();
        
        console.log('✅ Datos de usuario cargados');
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        // Usar datos de Firebase Auth como fallback
        displayUserInfo();
    }
}

function displayUserInfo() {
    // Foto de perfil
    const profilePic = document.getElementById('profilePicture');
    if (currentUser.photoURL) {
        profilePic.innerHTML = `<img src="${currentUser.photoURL}" alt="Perfil">`;
    } else {
        const initial = currentUser.displayName 
            ? currentUser.displayName.charAt(0).toUpperCase() 
            : currentUser.email.charAt(0).toUpperCase();
        profilePic.innerHTML = `<span style="font-size: 40px; font-weight: 700; color: #c62828;">${initial}</span>`;
    }
    
    // Nombre
    const userName = document.getElementById('userName');
    userName.textContent = currentUser.displayName || userData.displayName || 'Usuario';
    
    // Email
    const userEmail = document.getElementById('userEmail');
    userEmail.textContent = currentUser.email;
}

// ============================================
// CARGAR ESTADÍSTICAS
// ============================================

async function loadStats() {
    try {
        const db = firebase.firestore();
        
        // Contar pedidos
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', currentUser.uid)
            .get();
        
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        
        // Contar favoritos
        if (userData && userData.favorites) {
            document.getElementById('totalFavorites').textContent = userData.favorites.length;
        } else {
            const favoritesStorage = localStorage.getItem('nanAppFavorites');
            if (favoritesStorage) {
                const favorites = JSON.parse(favoritesStorage);
                document.getElementById('totalFavorites').textContent = favorites.length;
            }
        }
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ============================================
// EDITAR PERFIL
// ============================================

window.openEditProfile = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editProfileModal';
    
    const currentName = currentUser.displayName || userData.displayName || '';
    const currentPhone = userData.phone || '';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">Editar Perfil</h3>
            
            <input 
                type="text" 
                id="editName" 
                class="modal-input" 
                placeholder="Nombre completo"
                value="${currentName}"
            >
            
            <input 
                type="tel" 
                id="editPhone" 
                class="modal-input" 
                placeholder="Teléfono (10 dígitos)"
                value="${currentPhone}"
                maxlength="10"
            >
            
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-cancel" onclick="closeModal('editProfileModal')">
                    Cancelar
                </button>
                <button class="modal-btn modal-btn-confirm" onclick="saveProfile()">
                    Guardar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Solo números en teléfono
    document.getElementById('editPhone').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
};

window.saveProfile = async function() {
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    
    if (!name) {
        showToast('Por favor ingresa tu nombre');
        return;
    }
    
    if (phone && phone.length !== 10) {
        showToast('El teléfono debe tener 10 dígitos');
        return;
    }
    
    try {
        // Actualizar en Firebase Auth
        await currentUser.updateProfile({
            displayName: name
        });
        
        // Actualizar en Firestore
        const db = firebase.firestore();
        await db.collection('users').doc(currentUser.uid).update({
            displayName: name,
            phone: phone,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar vista
        await loadUserData();
        
        closeModal('editProfileModal');
        showToast('Perfil actualizado correctamente');
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showToast('Error al actualizar el perfil');
    }
};

// ============================================
// ACERCA DE
// ============================================

window.openAbout = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'aboutModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">Acerca de Ñan Delivery</h3>
            
            <p class="modal-text">
                <strong>Versión:</strong> 1.0.0<br><br>
                
                <strong>Descripción:</strong><br>
                Ñan es tu aplicación de delivery favorita. 
                Encuentra productos de restaurantes, mercados, farmacias y ferreterías, 
                todo en un solo lugar.<br><br>
                
                <strong>Características:</strong><br>
                • Pedidos rápidos y seguros<br>
                • Seguimiento en tiempo real<br>
                • Múltiples categorías<br>
                • Favoritos personalizados<br>
                • Historial de pedidos<br><br>
                
                <strong>Desarrollado con:</strong><br>
                Firebase, OpenStreetMap, HTML5, CSS3, JavaScript<br><br>
                
                <strong>Contacto:</strong><br>
                soporte@nandelivery.com<br><br>
                
                © 2024 Ñan Delivery. Todos los derechos reservados.
            </p>
            
            <button class="modal-btn modal-btn-confirm" onclick="closeModal('aboutModal')" style="width: 100%;">
                Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// ============================================
// AYUDA
// ============================================

window.openHelp = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'helpModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3 class="modal-title">Centro de Ayuda</h3>
            
            <p class="modal-text">
                <strong>Preguntas Frecuentes</strong><br><br>
                
                <strong>¿Cómo hago un pedido?</strong><br>
                1. Explora los productos<br>
                2. Agrégalos al carrito<br>
                3. Selecciona tu ubicación<br>
                4. Confirma tu pedido<br><br>
                
                <strong>¿Cuánto demora la entrega?</strong><br>
                El tiempo de entrega depende de la distancia y disponibilidad de repartidores. 
                Generalmente entre 30-60 minutos.<br><br>
                
                <strong>¿Cómo pago?</strong><br>
                Actualmente aceptamos pago en efectivo al momento de la entrega.<br><br>
                
                <strong>¿Puedo cancelar mi pedido?</strong><br>
                Sí, puedes cancelar pedidos que estén en estado "Pendiente" desde "Mis Pedidos".<br><br>
                
                <strong>¿Necesitas más ayuda?</strong><br>
                Contáctanos en: soporte@nandelivery.com
            </p>
            
            <button class="modal-btn modal-btn-confirm" onclick="closeModal('helpModal')" style="width: 100%;">
                Cerrar
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// ============================================
// CERRAR SESIÓN
// ============================================

window.confirmLogout = function() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'logoutModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="text-align: center;">
            <div style="font-size: 50px; margin-bottom: 15px;">👋</div>
            <h3 class="modal-title">¿Cerrar Sesión?</h3>
            <p class="modal-text">
                ¿Estás seguro de que deseas cerrar sesión?
            </p>
            
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-cancel" onclick="closeModal('logoutModal')">
                    Cancelar
                </button>
                <button class="modal-btn modal-btn-confirm" onclick="logout()">
                    Cerrar Sesión
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

window.logout = async function() {
    try {
        await firebase.auth().signOut();
        
        // Limpiar datos locales
        localStorage.removeItem('nanAppUser');
        localStorage.removeItem('nanAppCart');
        localStorage.removeItem('nanAppFavorites');
        
        // Redirigir al login
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showToast('Error al cerrar sesión');
    }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
};

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
        z-index: 10000;
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
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    
    if (!document.head.querySelector('style[data-toast]')) {
        style.setAttribute('data-toast', 'true');
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            document.body.removeChild(toast);
        }
    }, 3000);
}

console.log('✅ Página de perfil inicializada');

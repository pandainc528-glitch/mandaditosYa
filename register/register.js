function selectRole(role) {
    switch (role) {
        case 'cliente':
            window.location.href = 'register_cliente.html';
            break;

        case 'repartidor':
            window.location.href = 'register_repartidor.html';
            break;

        case 'negocio':
            window.location.href = 'register_negocio.html';
            break;
    }
}

function loginWithGoogle() {
    alert('Login con Google (pendiente de Firebase)');
    // Aquí luego conectas Firebase Auth con Google
}

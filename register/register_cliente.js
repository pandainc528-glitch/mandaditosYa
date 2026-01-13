import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const birthday = document.getElementById('birthday').value;
    const password = document.getElementById('password').value;

    try {
        // Validar campos vacíos
        if (!name || !email || !phone || !birthday || !password) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            phone: phone,
            birthday: birthday,
            rol: 'cliente'
        });

        alert("¡Registro exitoso! Serás redirigido a la página principal.");
        // Redireccionar después de un registro exitoso
        window.location.href = "home.html";

    } catch (error) {
        console.error("Error durante el registro:", error.code, error.message);
        
        // Manejo de errores específicos de Firebase
        if (error.code === 'auth/email-already-in-use') {
            alert("Este correo electrónico ya está registrado. Por favor, utiliza otro.");
        } else if (error.code === 'auth/invalid-email') {
            alert("El formato del correo electrónico no es válido. Por favor, corrígelo.");
        } else if (error.code === 'auth/weak-password') {
            alert("La contraseña es demasiado débil. Debe tener al menos 6 caracteres.");
        } else {
            // Mensaje genérico para otros errores
            alert("Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.");
        }
    }
});

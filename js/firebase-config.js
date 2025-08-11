// js/firebase-config.js
var firebaseConfig = {
    apiKey: "AIzaSyDV9YEG8Gs_rireiiXCiAdL4dJ9kARD4Is",
    authDomain: "controlecargasweb.firebaseapp.com",
    projectId: "controlecargasweb",
    storageBucket: "controlecargasweb.firebasestorage.app",
    messagingSenderId: "769247700925",
    appId: "1:769247700925:web:d1a8230b1c99ba289a94d4"
};

// Inicializa o Firebase apenas uma vez
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

var auth = firebase.auth();
var db = firebase.firestore();

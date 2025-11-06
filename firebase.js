// firebase.js
// Configuración e inicialización de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCjvz1uxCVR5xVxaNt3qushp1se1Ep8glY",
  authDomain: "greendolio-tienda.firebaseapp.com",
  projectId: "greendolio-tienda",
  storageBucket: "greendolio-tienda.appspot.com",
  messagingSenderId: "64271997064",
  appId: "1:64271997064:web:8001973cad419458fd379f",
  measurementId: "G-H9F4SXPJPA"
};

firebase.initializeApp(firebaseConfig);
if (typeof firebase.analytics === 'function') {
  firebase.analytics();
} else {
  console.warn('[Firebase] analytics() no está disponible con los SDK cargados.');
}

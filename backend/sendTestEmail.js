require('dotenv').config();
const sendVerificationEmail = require('./utils/email');

sendVerificationEmail('andresbotello1502@gmail.com', '123456')
    .then(() => console.log('Correo de prueba enviado'))
    .catch(error => console.error('Error al enviar el correo de prueba:', error));

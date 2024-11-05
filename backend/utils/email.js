const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false 
    }
});

const sendVerificationEmail = async (to, code) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Código de verificación de tu cuenta',
        text: `Tu código de verificación es: ${code}`
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado exitosamente a ${to}`);
    } catch (error) {
        console.error(`Error al enviar el correo a ${to}:`, error);
    }
};

module.exports = sendVerificationEmail; 

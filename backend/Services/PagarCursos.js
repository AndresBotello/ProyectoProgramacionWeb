require('dotenv').config();
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const preference = new Preference(client);
const payment = new Payment(client);

const db = require('./db');

class PagoService {
    async crearPago(usuarioId, cursoId, email) {
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            const [metodoPago] = await connection.query(
                'SELECT id FROM metodos_pago WHERE metodo = "MercadoPago"'
            );

            if (!metodoPago.length) {
                throw new Error('Método de pago no configurado');
            }

            const [inscripcionExistente] = await connection.query(
                'SELECT id FROM inscripciones WHERE usuario_id = ? AND curso_id = ? AND estado = "ACTIVA"',
                [usuarioId, cursoId]
            );

            if (inscripcionExistente.length > 0) {
                throw new Error('Ya estás inscrito en este curso');
            }

            const [curso] = await connection.query(
                'SELECT titulo, precio FROM cursos WHERE id = ?',
                [cursoId]
            );

            if (!curso.length) {
                throw new Error('Curso no encontrado');
            }

            const preferenceData = {
                body: {
                    items: [{
                        title: curso[0].titulo,
                        unit_price: Math.round(Number(curso[0].precio) * 100),  // Aseguramos que el precio sea entero en centavos
                        quantity: 1,
                    }],
                    payer: {
                        email: email
                    },
                    back_urls: {
                        success: `${process.env.FRONTEND_URL}/pagar/success`,
                        failure: `${process.env.FRONTEND_URL}/pagar/failure`,
                        pending: `${process.env.FRONTEND_URL}/pagar/pending`
                    },
                    auto_return: "approved",
                    external_reference: `${usuarioId}-${cursoId}`,
                    notification_url: `${process.env.BACKEND_URL}/api/pagar/webhook`
                }
            };
            

            const response = await preference.create(preferenceData);
            
            const [resultado] = await connection.query(
                `INSERT INTO pagos (
                    usuario_id, 
                    curso_id, 
                    monto, 
                    metodo_pago_id,
                    estado,
                    referencia_externa,
                    preference_id,
                    detalles_pago
                ) VALUES (?, ?, ?, ?, 'PENDIENTE', ?, ?, ?)`,
                [
                    usuarioId,
                    cursoId,
                    curso[0].precio,
                    metodoPago[0].id,
                    preferenceData.body.external_reference,
                    response.id,
                    JSON.stringify({
                        init_point: response.init_point,
                        sandbox_init_point: response.sandbox_init_point
                    })
                ]
            );

            await connection.query(
                `INSERT INTO transacciones_pago (
                    pago_id, 
                    estado_anterior, 
                    estado_nuevo, 
                    detalles
                ) VALUES (?, NULL, 'PENDIENTE', ?)`,
                [
                    resultado.insertId,
                    JSON.stringify({
                        preference_id: response.id,
                        creation_date: new Date()
                    })
                ]
            );

            await connection.commit();
            return {
                init_point: response.init_point,
                preference_id: response.id
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async procesarWebhook(data) {
        const connection = await db.pool.getConnection();
        try {
            await connection.beginTransaction();

            if (data.type === 'payment') {
                const paymentResponse = await payment.get({ id: data.data.id });
                const [usuarioId, cursoId] = paymentResponse.external_reference.split('-');

                if (paymentResponse.status === 'approved') {
                    const [pago] = await connection.query(
                        `UPDATE pagos 
                         SET estado = 'COMPLETADO',
                             payment_id = ?,
                             detalles_pago = JSON_SET(
                                 COALESCE(detalles_pago, '{}'),
                                 '$.payment_info', ?
                             )
                         WHERE referencia_externa = ? AND estado = 'PENDIENTE'
                         RETURNING id`,
                        [
                            paymentResponse.id,
                            JSON.stringify(paymentResponse),
                            paymentResponse.external_reference
                        ]
                    );

                    if (pago.length > 0) {
                        await connection.query(
                            `INSERT INTO inscripciones (
                                usuario_id, 
                                curso_id, 
                                estado, 
                                fecha_inscripcion,
                                pago_id
                            ) VALUES (?, ?, 'ACTIVA', CURRENT_TIMESTAMP, ?)`,
                            [usuarioId, cursoId, pago[0].id]
                        );

                        await connection.query(
                            `INSERT INTO transacciones_pago (
                                pago_id, 
                                estado_anterior, 
                                estado_nuevo, 
                                detalles
                            ) VALUES (?, 'PENDIENTE', 'COMPLETADO', ?)`,
                            [
                                pago[0].id,
                                JSON.stringify({
                                    payment_id: paymentResponse.id,
                                    status: paymentResponse.status,
                                    processed_at: new Date()
                                })
                            ]
                        );

                        await connection.query(
                            `INSERT INTO notificaciones (
                                usuario_id, 
                                contenido,
                                tipo_notificacion_id
                            ) VALUES (?, ?, (
                                SELECT id FROM tipos_notificacion 
                                WHERE tipo = 'INSCRIPCION' LIMIT 1
                            ))`,
                            [
                                usuarioId,
                                `¡Inscripción exitosa! Tu pago ha sido confirmado para el curso.`
                            ]
                        );
                    }
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async verificarPago(paymentId, externalReference) {
        console.log('Iniciando verificación de pago:', { 
            paymentId, 
            externalReference 
        });
    
        const connection = await db.pool.getConnection();
        try {
            // Validaciones iniciales
            if (!paymentId || typeof paymentId !== 'string') {
                return { 
                    success: false, 
                    message: 'ID de pago inválido' 
                };
            }
    
            if (!externalReference || !externalReference.includes('-')) {
                return { 
                    success: false, 
                    message: 'Referencia externa inválida' 
                };
            }
    
            // Comenzar transacción
            await connection.beginTransaction();
    
            // Obtener detalles del pago desde Mercado Pago
            let paymentDetails;
            try {
                paymentDetails = await payment.get({ id: paymentId });
            } catch (mpError) {
                console.error('Error al obtener detalles de pago de Mercado Pago:', mpError);
                return { 
                    success: false, 
                    message: 'No se pudieron obtener los detalles del pago',
                    error: mpError.message
                };
            }
    
            console.log('Detalles completos del pago:', JSON.stringify(paymentDetails, null, 2));
    
            // Verificación de referencia externa
            const [expectedUserId, expectedCourseId] = externalReference.split('-');
            const [receivedUserId, receivedCourseId] = (paymentDetails.external_reference || '').split('-');
    
            if (!receivedUserId || !receivedCourseId) {
                return { 
                    success: false, 
                    message: 'Referencia externa de Mercado Pago no válida' 
                };
            }
    
            // Comparación de referencias
            if (expectedUserId !== receivedUserId || expectedCourseId !== receivedCourseId) {
                return { 
                    success: false, 
                    message: 'Referencia externa no coincide',
                    details: {
                        expected: { userId: expectedUserId, courseId: expectedCourseId },
                        received: { userId: receivedUserId, courseId: receivedCourseId }
                    }
                };
            }
    
            // Verificar estado del pago
            if (paymentDetails.status !== 'approved') {
                return { 
                    success: false, 
                    message: 'Pago no aprobado', 
                    status: paymentDetails.status 
                };
            }
    
            // Buscar pago pendiente
            const [existingPayments] = await connection.query(
                'SELECT id FROM pagos WHERE referencia_externa = ? AND estado = "PENDIENTE"',
                [externalReference]
            );
    
            // Si se encuentra un pago pendiente
            if (existingPayments.length > 0) {
                // Realizar la actualización en la tabla de pagos
                const updateQuery = `
                    UPDATE pagos
                    SET estado = 'COMPLETADO',
                        payment_id = ?, 
                        detalles_pago = JSON_SET(
                            COALESCE(detalles_pago, '{}'),
                            '$.payment_info', ?
                        )
                    WHERE referencia_externa = ? AND estado = 'PENDIENTE';
                `;
                const paymentInfo = JSON.stringify({
                    status: 'approved',
                    payment_id: paymentDetails.id
                });
    
                await connection.query(updateQuery, [
                    paymentDetails.id, // Payment ID de MercadoPago
                    paymentInfo,        // Detalles del pago como JSON
                    externalReference   // Referencia externa
                ]);
    
                // Confirmar inscripción al curso
                const [pago] = await connection.query(
                    `SELECT id FROM pagos WHERE referencia_externa = ? AND estado = 'COMPLETADO'`,
                    [externalReference]
                );
    
                if (pago.length > 0) {
                    // Insertar en historial_compras
                    await connection.query(
                        `INSERT INTO historial_compras (
                            usuario_id, 
                            curso_id, 
                            fecha, 
                            payment_id
                        ) VALUES (?, ?, CURRENT_TIMESTAMP, ?)`,
                        [expectedUserId, expectedCourseId, paymentDetails.id]
                    );
    
                    // Insertar en la tabla de inscripciones
                    await connection.query(
                        `INSERT INTO inscripciones (
                            usuario_id, 
                            curso_id, 
                            estado, 
                            fecha_inscripcion,
                            pago_id
                        ) VALUES (?, ?, 'ACTIVA', CURRENT_TIMESTAMP, ?)`,
                        [expectedUserId, expectedCourseId, pago[0].id]
                    );
    
                    // Registrar transacción de pago
                    await connection.query(
                        `INSERT INTO transacciones_pago (
                            pago_id, 
                            estado_anterior, 
                            estado_nuevo, 
                            detalles
                        ) VALUES (?, 'PENDIENTE', 'COMPLETADO', ?)`,
    
                        [
                            pago[0].id,
                            JSON.stringify({
                                payment_id: paymentDetails.id,
                                status: paymentDetails.status,
                                processed_at: new Date()
                            })
                        ]
                    );
    
                    // Notificación al usuario
                    await connection.query(
                        `INSERT INTO notificaciones (
                            usuario_id, 
                            contenido,
                            tipo_notificacion_id
                        ) VALUES (?, ?, (
                            SELECT id FROM tipos_notificacion 
                            WHERE tipo = 'INSCRIPCION' LIMIT 1
                        ))`,
                        [
                            expectedUserId,
                            `¡Inscripción exitosa! Tu pago ha sido confirmado para el curso.`
                        ]
                    );
                }
            }
    
            await connection.commit();
            return { 
                success: true, 
                message: 'Pago verificado e inscripción procesada',
                details: {
                    payment_id: paymentDetails.id,
                    status: paymentDetails.status,
                    referencia_externa: externalReference,
                    usuario_id: expectedUserId,
                    curso_id: expectedCourseId
                }
            };
    
        } catch (error) {
            // Rollback en caso de error
            await connection.rollback();
            console.error('Error completo en verificación de pago:', {
                message: error.message,
                stack: error.stack
            });
            return { 
                success: false, 
                message: 'Error interno al verificar el pago',
                errorDetails: error.message
            };
    
        } finally {
            // Liberar conexión de base de datos
            connection.release();
        }
    }
    
}

module.exports = new PagoService();
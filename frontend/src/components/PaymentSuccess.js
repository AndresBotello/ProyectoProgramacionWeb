import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import '../PaymentSuccess.css';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando tu pago...');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const payment_id = searchParams.get('payment_id');
        const external_reference = searchParams.get('external_reference');
        const collection_status = searchParams.get('collection_status');
  
        console.log('Parametros recibidos:', {
          payment_id,
          external_reference,
          collection_status
        });
  
        if (!payment_id || !external_reference || collection_status !== 'approved') {
          throw new Error('Información de pago incompleta o inválida');
        }
  
        const response = await fetch(`${process.env.BACKEND_URL}/pagar/verificar?payment_id=${payment_id}&external_reference=${external_reference}&collection_status=${collection_status}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
  
        console.log('Respuesta del servidor:', response);
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
  
        const data = await response.json();
  
        console.log('Datos recibidos:', data);
  
        if (data.success) {
          setStatus('success');
          setMessage('¡Pago procesado exitosamente! Redirigiendo...');
          setTimeout(() => navigate('/user-access'), 3000);
        } else {
          throw new Error(data.message || 'Error al verificar el pago');
        }
      } catch (error) {
        console.error('Error completo:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Error al procesar el pago');
        setTimeout(() => navigate('/user-access'), 5000);
      }
    };
  
    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-200" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Procesando</h2>
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">¡Pago Exitoso!</h2>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-500 text-2xl">×</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Error en el Pago</h2>
          </>
        )}

        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default PaymentSuccess;
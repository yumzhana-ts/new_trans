'use client'

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Отключаем SSR, иначе Swagger UI не работает
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerPage() {
  const apiUrl = '/api/docs'; // браузер через Caddy

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <SwaggerUI
        url={apiUrl}
        docExpansion="list"      // Разворачивает список эндпоинтов
        deepLinking={true}      // Ссылки на конкретные эндпоинты
        displayRequestDuration  // Показывает время запроса
        defaultModelsExpandDepth={-1} // Не показывать схемы моделей снизу
        withCredentials={true}
      />
    </div>
  );
}

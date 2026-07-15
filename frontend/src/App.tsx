import { useState } from 'react'

// Definimos la estructura de una pala usando TypeScript
interface Pala {
  id: number;
  nombre: string;
  tipo: 'Dura' | 'Blanda';
  precioPorHora: number;
  disponible: boolean;
}

function App() {
  // Simulamos los datos que en el futuro vendrán del backend (base de datos)
  const [pistas] = useState<Pala[]>([
    { id: 1, nombre: 'Vertex02', tipo: 'Dura', precioPorHora: 20, disponible: true },
    { id: 2, nombre: 'Vertex03', tipo: 'Blanda', precioPorHora: 18, disponible: true },
    { id: 3, nombre: 'Vertex04', tipo: 'Blanda', precioPorHora: 15, disponible: false },
  ]);

  return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>🎾 YoSoyTuPadel - Catálogo de Palas</h1>
        <hr />

          <h2>Nuestras Palas</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {pistas.map((pista) => (
              <div
                  key={pista.id}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '15px',
                    width: '200px',
                    backgroundColor: pista.disponible ? '#e2f0cb' : '#f5cdcd'
                  }}
              >
                <h3>{pista.nombre}</h3>
                <p><strong>Tipo:</strong> {pista.tipo}</p>
                <p><strong>Precio/Hora:</strong> {pista.precioPorHora}€</p>
                <p><strong>Estado:</strong> {pista.disponible ? 'Disponible' : 'No disponible'}</p>
              </div>
          ))}
        </div>
      </div>
  )
}

export default App
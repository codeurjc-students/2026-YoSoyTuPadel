import { useEffect, useState } from 'react';
import api from './service/api';

interface Racket {
    id: number;
    brand: string;
    name: string;
    description: string;
    pricePerDay: number;
}

function App() {
    const [rackets, setRackets] = useState<Racket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<Racket[]>('/api/rackets')
            .then((response) => {
                setRackets(response.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error al conectar con la base de datos:', err);
                setError('No se ha podido conectar con el servidor.');
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <h1>YoSoyTuPadel </h1>
            <hr />

            <h2>Catálogo de Palas</h2>

            {loading && <p>Cargando palas de la base de datos...</p>}

            {error && (
                <div>
                    <p><strong>Error:</strong> {error}</p>
                </div>
            )}

            {!loading && !error && (
                <ul>
                    {rackets.map((racket) => (
                        <li key={racket.id}>
                            <h3>{racket.brand} - {racket.name}</h3>
                            <p>{racket.description}</p>
                            <p>Precio de Alquiler: {racket.pricePerDay} € por sesión</p>
                            <hr />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default App;
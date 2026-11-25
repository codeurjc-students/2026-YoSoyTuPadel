export interface LevelingOption {
    score: number;
    label: string;
}

export interface LevelingQuestion {
    id: string;
    title: string;
    options: LevelingOption[];
}

export const INITIAL_LEVELING_QUESTIONS: LevelingQuestion[] = [
    {
        id: 'experience',
        title: '¿Cuál es tu experiencia y frecuencia de juego?',
        options: [
            { score: 0, label: 'He jugado muy pocas veces (1 o 2 partidos sueltos).' },
            { score: 1, label: 'Juego de forma ocasional (1 o 2 veces al mes) partidos informales.' },
            { score: 2, label: 'Juego con regularidad (al menos 1 vez por semana) partidos amistosos.' },
            { score: 3, label: 'Juego varias veces por semana y participo en pozos, ligas locales o torneos amateur.' },
            { score: 4, label: 'Compito habitualmente en ligas federadas o torneos amateur de nivel medio-alto.' },
        ],
    },
    {
        id: 'groundstrokes',
        title: '¿Cómo son tus golpes de fondo (derecha y revés)?',
        options: [
            { score: 0, label: 'Me cuesta golpear la bola correctamente y mantener un peloteo.' },
            { score: 1, label: 'Devuelvo bolas lentas y centradas, pero fallo con frecuencia cuando el rival acelera.' },
            { score: 2, label: 'Mantengo peloteos estables y empiezo a dirigir la bola hacia los lados o al centro.' },
            { score: 3, label: 'Controlo dirección, profundidad y globos defensivos con comodidad.' },
            { score: 4, label: 'Domino todo tipo de golpeos bajo presión para construir el punto desde atrás.' },
        ],
    },
    {
        id: 'walls',
        title: '¿Cómo te desenvuelves en el juego con paredes?',
        options: [
            { score: 0, label: 'No sé calcular el bote en la pared y no me coordino muy bien cuando la bola pasa.' },
            { score: 1, label: 'Devuelvo rebotes sencillos de pared de fondo si la bola viene despacio y frontal.' },
            { score: 2, label: 'Defiendo bien la pared de fondo y empiezo a resolver rebotes en pared lateral.' },
            { score: 3, label: 'Resuelvo dobles paredes, giros y bajadas de pared devolviéndola de forma exitosa.' },
            { score: 4, label: 'Leo cualquier rebote de forma natural y ejecuto bajadas de pared agresivas.' },
        ],
    },
    {
        id: 'net',
        title: '¿Cuál es tu dominio en la red?',
        options: [
            { score: 0, label: 'Evito subir a la red y no domino el golpe de volea.' },
            { score: 1, label: 'Subo a la red en ocasiones, pero voleo sin control ni profundidad.' },
            { score: 2, label: 'Mantengo la posición en la red con voleas básicas y devuelvo globos con bandejas.' },
            { score: 3, label: 'Voleo con determinación, uso la bandeja para no perder la red y remato bolas claras.' },
            { score: 4, label: 'Domino volea agresiva, bandeja, víbora y remate para definir los puntos.' },
        ],
    },
    {
        id: 'tactics',
        title: '¿Cómo vas de saque, resto y posicionamiento?',
        options: [
            { score: 0, label: 'Desconozco las reglas de posicionamiento y cubro mi lado sin mucha coordinación.' },
            { score: 1, label: 'Saco y resto con seguridad básica, pero me cuesta coordinar cuándo subir o bajar.' },
            { score: 2, label: 'Subo a la red tras el saque y mantengo la posición en paralelo con mi compañero.' },
            { score: 3, label: 'Resto con intención, cubro huecos y elijo bien cuándo atacar o defender.' },
            { score: 4, label: 'Adapto la táctica según los rivales, varío direcciones y velocidades de saque.' },
        ],
    },
];
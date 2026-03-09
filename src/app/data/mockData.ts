export interface Word {
  id: string;
  english: string;
  translation: string;
  exampleSentence: string;
  options: string[];
  correctAnswer: string;
}

export interface Collection {
  id: string;
  name: string;
  wordCount: number;
  description: string;
  words: Word[];
}

export const mockCollections: Collection[] = [
  {
    id: "1",
    name: "Business English",
    wordCount: 25,
    description: "Essential vocabulary for professional communication",
    words: [
      {
        id: "1",
        english: "Leverage",
        translation: "Aprovechar / Influencia",
        exampleSentence: "We can leverage our expertise to gain market share.",
        options: ["Aprovechar", "Abandonar", "Ignorar", "Rechazar"],
        correctAnswer: "Aprovechar",
      },
      {
        id: "2",
        english: "Stakeholder",
        translation: "Parte interesada",
        exampleSentence: "All stakeholders must be informed of the changes.",
        options: ["Empleado", "Parte interesada", "Cliente", "Gerente"],
        correctAnswer: "Parte interesada",
      },
      {
        id: "3",
        english: "Paradigm",
        translation: "Paradigma / Modelo",
        exampleSentence: "This represents a paradigm shift in our industry.",
        options: ["Problema", "Paradigma", "Proyecto", "Presupuesto"],
        correctAnswer: "Paradigma",
      },
      {
        id: "4",
        english: "Synergy",
        translation: "Sinergia",
        exampleSentence: "The merger will create synergy between both companies.",
        options: ["Conflicto", "Sinergia", "Separación", "Competencia"],
        correctAnswer: "Sinergia",
      },
      {
        id: "5",
        english: "Benchmark",
        translation: "Punto de referencia",
        exampleSentence: "We need to benchmark our performance against competitors.",
        options: ["Punto de referencia", "Objetivo", "Problema", "Solución"],
        correctAnswer: "Punto de referencia",
      },
    ],
  },
  {
    id: "2",
    name: "Travel & Tourism",
    wordCount: 30,
    description: "Useful phrases for your next adventure",
    words: [
      {
        id: "6",
        english: "Itinerary",
        translation: "Itinerario",
        exampleSentence: "Please review the travel itinerary before departure.",
        options: ["Itinerario", "Equipaje", "Pasaporte", "Billete"],
        correctAnswer: "Itinerario",
      },
      {
        id: "7",
        english: "Amenities",
        translation: "Comodidades / Servicios",
        exampleSentence: "The hotel offers luxury amenities for all guests.",
        options: ["Problemas", "Comodidades", "Restricciones", "Costos"],
        correctAnswer: "Comodidades",
      },
      {
        id: "8",
        english: "Embark",
        translation: "Embarcarse",
        exampleSentence: "We will embark on our journey at dawn.",
        options: ["Cancelar", "Embarcarse", "Terminar", "Retrasar"],
        correctAnswer: "Embarcarse",
      },
      {
        id: "9",
        english: "Excursion",
        translation: "Excursión",
        exampleSentence: "The guided excursion includes lunch and transportation.",
        options: ["Excursión", "Reservación", "Cancelación", "Reclamación"],
        correctAnswer: "Excursión",
      },
      {
        id: "10",
        english: "Accommodation",
        translation: "Alojamiento",
        exampleSentence: "We've arranged accommodation for your entire stay.",
        options: ["Transporte", "Alojamiento", "Comida", "Entretenimiento"],
        correctAnswer: "Alojamiento",
      },
    ],
  },
  {
    id: "3",
    name: "Technology Terms",
    wordCount: 20,
    description: "Modern tech vocabulary you need to know",
    words: [
      {
        id: "11",
        english: "Algorithm",
        translation: "Algoritmo",
        exampleSentence: "The algorithm optimizes search results efficiently.",
        options: ["Algoritmo", "Aplicación", "Hardware", "Software"],
        correctAnswer: "Algoritmo",
      },
      {
        id: "12",
        english: "Interface",
        translation: "Interfaz",
        exampleSentence: "The user interface is intuitive and easy to navigate.",
        options: ["Internet", "Interfaz", "Instalación", "Información"],
        correctAnswer: "Interfaz",
      },
      {
        id: "13",
        english: "Bandwidth",
        translation: "Ancho de banda",
        exampleSentence: "We need more bandwidth to handle the increased traffic.",
        options: ["Batería", "Ancho de banda", "Almacenamiento", "Memoria"],
        correctAnswer: "Ancho de banda",
      },
      {
        id: "14",
        english: "Encryption",
        translation: "Cifrado / Encriptación",
        exampleSentence: "Data encryption ensures your information stays secure.",
        options: ["Eliminación", "Cifrado", "Instalación", "Configuración"],
        correctAnswer: "Cifrado",
      },
      {
        id: "15",
        english: "Cache",
        translation: "Caché",
        exampleSentence: "Clear your browser cache to fix the loading issue.",
        options: ["Contraseña", "Caché", "Código", "Carpeta"],
        correctAnswer: "Caché",
      },
    ],
  },
];

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  progress: number;
  isCurrentUser: boolean;
}

export const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "You",
    avatar: "🎯",
    score: 0,
    progress: 0,
    isCurrentUser: true,
  },
  {
    id: "2",
    name: "Alex Chen",
    avatar: "🚀",
    score: 0,
    progress: 0,
    isCurrentUser: false,
  },
  {
    id: "3",
    name: "Maria Garcia",
    avatar: "⭐",
    score: 0,
    progress: 0,
    isCurrentUser: false,
  },
  {
    id: "4",
    name: "James Wilson",
    avatar: "💎",
    score: 0,
    progress: 0,
    isCurrentUser: false,
  },
];

const messages = {
	en: {
		advanceTime: "Advance 10 seconds",
		autoExposure: "Auto exposure",
		changePlaybackSpeed: "Change playback speed",
		coverage: "COVER",
		eclipseScene: "Eclipse scene",
		exposureCompensation: "Exposure compensation",
		focalLength: "Camera focal length",
		githubSource: "View source code on GitHub",
		location: "LOC",
		map: "Map",
		moon: "MOON",
		pauseSimulation: "Pause simulation",
		playSimulation: "Play simulation",
		playbackTimeline: "Simulation timeline",
		rewindTime: "Rewind 10 seconds",
		selectObservationPoint: "Select an observation point",
		showLocalTime: "Show local time",
		showUtcTime: "Show UTC time",
		simulationTime: "Simulation time",
		sun: "SUN",
		zoomIn: "Zoom in",
		zoomOut: "Zoom out",
	},
	es: {
		advanceTime: "Avanzar 10 segundos",
		autoExposure: "Exposición automática",
		changePlaybackSpeed: "Cambiar velocidad de reproducción",
		coverage: "COB",
		eclipseScene: "Simulación del eclipse",
		exposureCompensation: "Compensación de exposición",
		focalLength: "Distancia focal de la cámara",
		githubSource: "Ver código fuente en GitHub",
		location: "UBI",
		map: "Mapa",
		moon: "LUNA",
		pauseSimulation: "Pausar simulación",
		playSimulation: "Reproducir simulación",
		playbackTimeline: "Línea de tiempo de la simulación",
		rewindTime: "Retroceder 10 segundos",
		selectObservationPoint: "Seleccionar un punto de observación",
		showLocalTime: "Mostrar hora local",
		showUtcTime: "Mostrar hora UTC",
		simulationTime: "Hora de la simulación",
		sun: "SOL",
		zoomIn: "Acercar",
		zoomOut: "Alejar",
	},
} as const;

export type Locale = keyof typeof messages;
export type MessageKey = keyof (typeof messages)["en"];

function getLocale(): Locale {
	if (typeof navigator === "undefined") return "en";
	return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export const locale = getLocale();
export const languageTag = locale === "es" ? "es-ES" : "en-US";

export function t(key: MessageKey) {
	return messages[locale][key];
}

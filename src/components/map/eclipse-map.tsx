import type { ObserverLocation } from "@/lib/celestial-bodies";
import { ECLIPSES, getEclipseCenterPosition } from "@/lib/eclipses";
import { t } from "@/lib/i18n";
import { useStore } from "@/store";
import L, { type LeafletMouseEvent } from "leaflet";
import { useEffect, useRef } from "react";
import { type DaylightArea, getDaylightArea } from "./daylight-area";
import { MapLocationControl } from "./map-location-control";
import "./map.css";

const INITIAL_CENTER: L.LatLngExpression = [
	ECLIPSES[0].defaultLocation.latitude,
	ECLIPSES[0].defaultLocation.longitude,
];
const INITIAL_ZOOM = 3;
const MAP_LATITUDE_LIMIT = 85.05112878;
const WORLD_OFFSETS = [-360, 0, 360] as const;
const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY ?? "";

function normalizeLongitude(longitude: number) {
	return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function getNightArea(
	{ boundary, centerLongitude }: DaylightArea,
	offset: number,
) {
	const westernEdge = centerLongitude - 180 + offset;
	const easternEdge = centerLongitude + 180 + offset;

	return [
		[
			[-MAP_LATITUDE_LIMIT, westernEdge],
			[MAP_LATITUDE_LIMIT, westernEdge],
			[MAP_LATITUDE_LIMIT, easternEdge],
			[-MAP_LATITUDE_LIMIT, easternEdge],
		],
		boundary.map(([latitude, longitude]) => [latitude, longitude + offset]),
	] satisfies L.LatLngExpression[][];
}

export function EclipseMap() {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);
	const markerRef = useRef<L.Marker | null>(null);
	const sunMarkerRef = useRef<L.Marker | null>(null);
	const nightLayerRef = useRef<L.Polygon[]>([]);
	const eclipseLayerRef = useRef<L.LayerGroup | null>(null);
	const eclipseAttributionRef = useRef<string | null>(null);
	const eclipse = useStore((state) => state.eclipse);
	const timestamp = useStore((state) => state.timestamp);
	const observerLocation = useStore((state) => state.observerLocation);
	const setObserverLocation = useStore((state) => state.setObserverLocation);
	const showLocation = (location: ObserverLocation) => {
		setObserverLocation(location);
		const map = mapRef.current;
		if (!map) return;

		map.flyTo(
			[location.latitude, location.longitude],
			Math.max(map.getZoom(), 8),
		);
	};

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const map = L.map(container, {
			center: INITIAL_CENTER,
			zoomControl: false,
			zoom: INITIAL_ZOOM,
			worldCopyJump: true,
		});
		mapRef.current = map;
		L.control
			.zoom({
				zoomInTitle: t("zoomIn"),
				zoomOutTitle: t("zoomOut"),
			})
			.addTo(map);

		L.tileLayer(
			`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_API_KEY)}`,
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20,
				subdomains: "abcd",
			},
		).addTo(map);
		const daylight = getDaylightArea(useStore.getState().timestamp);
		nightLayerRef.current = WORLD_OFFSETS.map((offset) =>
			L.polygon(getNightArea(daylight, offset), {
				className: "night-area",
				fillRule: "evenodd",
				interactive: false,
				stroke: false,
			}).addTo(map),
		);

		const selectObserverLocation = ({ latlng }: LeafletMouseEvent) => {
			setObserverLocation({
				latitude: latlng.lat,
				longitude: normalizeLongitude(latlng.lng),
			});
		};
		map.on("click", selectObserverLocation);

		return () => {
			map.off("click", selectObserverLocation);
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
			sunMarkerRef.current = null;
			nightLayerRef.current = [];
			eclipseLayerRef.current = null;
			eclipseAttributionRef.current = null;
		};
	}, [setObserverLocation]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		eclipseLayerRef.current?.remove();
		if (eclipseAttributionRef.current) {
			map.attributionControl.removeAttribution(eclipseAttributionRef.current);
		}

		eclipseLayerRef.current = L.layerGroup([
			L.polygon(eclipse.path.area, {
				className: "eclipse-central-area",
				interactive: false,
				smoothFactor: 0,
				stroke: false,
			}),
			L.polyline(eclipse.path.centerLine, {
				className: "eclipse-center-line",
				interactive: false,
				smoothFactor: 0,
			}),
		]).addTo(map);
		const attribution = `Eclipse: <a href="${eclipse.path.source}">NASA/GSFC</a>`;
		map.attributionControl.addAttribution(attribution);
		eclipseAttributionRef.current = attribution;
		map.flyTo(
			[eclipse.defaultLocation.latitude, eclipse.defaultLocation.longitude],
			INITIAL_ZOOM,
		);
	}, [eclipse]);

	useEffect(() => {
		const daylight = getDaylightArea(timestamp);

		for (const [index, offset] of WORLD_OFFSETS.entries()) {
			nightLayerRef.current[index]?.setLatLngs(getNightArea(daylight, offset));
		}
	}, [timestamp]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const position = L.latLng(
			observerLocation.latitude,
			observerLocation.longitude,
		);
		if (markerRef.current) {
			markerRef.current.setLatLng(position);
			return;
		}

		markerRef.current = L.marker(position, {
			icon: L.divIcon({
				className: "map-marker",
				html: '<span class="map-marker-dot"></span>',
				iconAnchor: [10, 10],
				iconSize: [20, 20],
			}),
		}).addTo(map);
	}, [observerLocation]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const position = getEclipseCenterPosition(eclipse.path, timestamp);
		if (!position) {
			sunMarkerRef.current?.remove();
			sunMarkerRef.current = null;
			return;
		}

		if (sunMarkerRef.current) {
			sunMarkerRef.current.setLatLng(position);
			return;
		}

		sunMarkerRef.current = L.marker(position, {
			icon: L.divIcon({
				className: "map-sun-marker",
				html: '<span class="map-sun-marker-emoji">☀️</span>',
				iconAnchor: [14, 14],
				iconSize: [28, 28],
			}),
			interactive: false,
			keyboard: false,
			zIndexOffset: 500,
		}).addTo(map);
	}, [eclipse.path, timestamp]);

	return (
		<section aria-label={t("map")} className="map-section relative">
			<div
				aria-label={t("selectObservationPoint")}
				className="map-canvas"
				ref={containerRef}
			/>
			<MapLocationControl onLocationFound={showLocation} />
		</section>
	);
}

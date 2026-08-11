import { DEFAULT_POINT, useStore } from "@/store";
import L, { type LeafletMouseEvent } from "leaflet";
import { useEffect, useRef } from "react";
import {
	ECLIPSE_PATH_SOURCE,
	TOTALITY_AREA,
	TOTALITY_CENTER_LINE,
	getEclipseCenterPosition,
} from "./eclipse-path";
import "./map.css";

const INITIAL_CENTER: L.LatLngExpression = [
	DEFAULT_POINT.latitude,
	DEFAULT_POINT.longitude,
];
const INITIAL_ZOOM = 2;

function normalizeLongitude(longitude: number) {
	return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

export function EclipseMap() {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<L.Map | null>(null);
	const markerRef = useRef<L.Marker | null>(null);
	const sunMarkerRef = useRef<L.Marker | null>(null);
	const timestamp = useStore((state) => state.timestamp);
	const selectedPoint = useStore((state) => state.selectedPoint);
	const setSelectedPoint = useStore((state) => state.setSelectedPoint);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const map = L.map(container, {
			center: INITIAL_CENTER,
			zoom: INITIAL_ZOOM,
			worldCopyJump: true,
		});
		mapRef.current = map;

		L.tileLayer(
			"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
				maxZoom: 20,
				subdomains: "abcd",
			},
		).addTo(map);
		map.attributionControl.addAttribution(
			`Eclipse: <a href="${ECLIPSE_PATH_SOURCE}">NASA/GSFC</a>`,
		);

		L.polygon(TOTALITY_AREA, {
			className: "eclipse-totality-area",
			interactive: false,
			smoothFactor: 0,
			stroke: false,
		}).addTo(map);
		L.polyline(TOTALITY_CENTER_LINE, {
			className: "eclipse-center-line",
			interactive: false,
			smoothFactor: 0,
		}).addTo(map);

		const selectPoint = ({ latlng }: LeafletMouseEvent) => {
			setSelectedPoint({
				latitude: latlng.lat,
				longitude: normalizeLongitude(latlng.lng),
			});
		};
		map.on("click", selectPoint);

		return () => {
			map.off("click", selectPoint);
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
			sunMarkerRef.current = null;
		};
	}, [setSelectedPoint]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		if (!selectedPoint) {
			markerRef.current?.remove();
			markerRef.current = null;
			return;
		}

		const position = L.latLng(selectedPoint.latitude, selectedPoint.longitude);
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
	}, [selectedPoint]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		const position = getEclipseCenterPosition(timestamp);
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
	}, [timestamp]);

	return (
		<section aria-label="Map" className="map-section">
			<div
				aria-label="Select an observation point"
				className="map-canvas"
				ref={containerRef}
			/>
		</section>
	);
}

import { t } from "@/lib/i18n";
import { DEFAULT_POINT, type SelectedPoint, useStore } from "@/store";
import L, { type LeafletMouseEvent } from "leaflet";
import { useEffect, useRef } from "react";
import { type DaylightArea, getDaylightArea } from "./daylight-area";
import {
	ECLIPSE_PATH_SOURCE,
	TOTALITY_AREA,
	TOTALITY_CENTER_LINE,
	getEclipseCenterPosition,
} from "./eclipse-path";
import { MapLocationControl } from "./map-location-control";
import "./map.css";

const INITIAL_CENTER: L.LatLngExpression = [
	DEFAULT_POINT.latitude,
	DEFAULT_POINT.longitude,
];
const INITIAL_ZOOM = 3;
const MAP_LATITUDE_LIMIT = 85.05112878;
const WORLD_OFFSETS = [-360, 0, 360] as const;

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
	const timestamp = useStore((state) => state.timestamp);
	const selectedPoint = useStore((state) => state.selectedPoint);
	const setSelectedPoint = useStore((state) => state.setSelectedPoint);
	const showLocation = (point: SelectedPoint) => {
		setSelectedPoint(point);
		const map = mapRef.current;
		if (!map) return;

		map.flyTo([point.latitude, point.longitude], Math.max(map.getZoom(), 8));
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

		const daylight = getDaylightArea(useStore.getState().timestamp);
		nightLayerRef.current = WORLD_OFFSETS.map((offset) =>
			L.polygon(getNightArea(daylight, offset), {
				className: "night-area",
				fillRule: "evenodd",
				interactive: false,
				stroke: false,
			}).addTo(map),
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
			nightLayerRef.current = [];
		};
	}, [setSelectedPoint]);

	useEffect(() => {
		const daylight = getDaylightArea(timestamp);

		for (const [index, offset] of WORLD_OFFSETS.entries()) {
			nightLayerRef.current[index]?.setLatLngs(getNightArea(daylight, offset));
		}
	}, [timestamp]);

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

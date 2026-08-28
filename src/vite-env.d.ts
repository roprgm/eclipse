/// <reference types="vite/client" />
/// <reference types="vgpu/client" />

interface ImportMetaEnv {
	readonly VITE_CARTO_API_KEY?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

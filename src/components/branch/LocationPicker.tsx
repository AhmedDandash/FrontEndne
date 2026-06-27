'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Button, Space, message, Spin, Input } from 'antd';
import { EnvironmentOutlined, AimOutlined, SearchOutlined } from '@ant-design/icons';
import { getCurrentPosition } from '@/utils/geolocation';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (latitude: number, longitude: number) => void;
  initialLat?: number;
  initialLng?: number;
  language?: 'ar' | 'en';
}

const DEFAULT_LAT = 24.7136;
const DEFAULT_LNG = 46.6753;

export default function LocationPicker({
  open,
  onClose,
  onConfirm,
  initialLat = DEFAULT_LAT,
  initialLng = DEFAULT_LNG,
  language = 'en',
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  // Latest selected coords, kept in a ref so map event handlers stay stable.
  const coordsRef = useRef<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState('');

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // Update both the React state (for the readout) and the ref (for handlers).
  const updateCoords = useCallback((lat: number, lng: number) => {
    coordsRef.current = { lat, lng };
    setCoords({ lat, lng });
  }, []);

  // Move the marker + recentre, without re-creating the map.
  const placeMarker = useCallback(
    (lat: number, lng: number, recenter = true) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      if (recenter) {
        map.panTo([lat, lng], { animate: true });
      }
      updateCoords(lat, lng);
    },
    [updateCoords]
  );

  // ── Initialise the map ONCE per open. Never re-run on coord change. ──
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let map: any = null;
    setLoading(true);

    import('leaflet').then((mod) => {
      const L = mod.default ?? mod;
      if (cancelled || !mapContainer.current) return;

      // Fix Leaflet's default marker icons (broken under bundlers) — use CDN assets.
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      leafletRef.current = L;

      const start = coordsRef.current;
      map = L.map(mapContainer.current, {
        center: [start.lat, start.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(map);

      const marker = L.marker([start.lat, start.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Drag the pin → update coords.
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        updateCoords(lat, lng);
      });

      // Click the map → move the pin there.
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateCoords(lat, lng);
      });

      // The modal animates in; the container has no size at init → fix it.
      const fixSize = () => map && map.invalidateSize();
      setTimeout(fixSize, 250);
      setTimeout(fixSize, 500);

      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
  }, [open, updateCoords]);

  const handleLocateMe = async () => {
    try {
      setLocating(true);
      const { latitude, longitude } = await getCurrentPosition();
      if (mapRef.current) mapRef.current.setView([latitude, longitude], 15);
      placeMarker(latitude, longitude, false);
    } catch {
      message.error(t('تعذّر تحديد موقعك', 'Could not determine your location'));
    } finally {
      setLocating(false);
    }
  };

  // Free-text place search via OpenStreetMap Nominatim.
  const handleSearch = async () => {
    const q = searchText.trim();
    if (!q) return;
    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept-Language': language } }
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) {
        message.warning(t('لم يتم العثور على الموقع', 'Location not found'));
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (mapRef.current) mapRef.current.setView([lat, lng], 15);
      placeMarker(lat, lng, false);
    } catch {
      message.error(t('فشل البحث عن الموقع', 'Location search failed'));
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(coordsRef.current.lat, coordsRef.current.lng);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <EnvironmentOutlined style={{ color: '#1677ff' }} />
          {t('اختر الموقع على الخريطة', 'Select Location on Map')}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 980, top: 24 }}
      // Re-mount the map container cleanly on each open.
      destroyOnClose
      maskClosable={false}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>
            {t('انقر على الخريطة أو اسحب الدبوس', 'Click the map or drag the pin')}
          </span>
          <Space>
            <Button onClick={onClose}>{t('إلغاء', 'Cancel')}</Button>
            <Button icon={<AimOutlined />} loading={locating} onClick={handleLocateMe}>
              {t('موقعي الحالي', 'My Location')}
            </Button>
            <Button type="primary" icon={<EnvironmentOutlined />} onClick={handleConfirm}>
              {t('تأكيد الموقع', 'Confirm')}
            </Button>
          </Space>
        </div>
      }
    >
      {/* Search bar */}
      <Input.Search
        allowClear
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onSearch={handleSearch}
        loading={searching}
        enterButton={<SearchOutlined />}
        placeholder={t('ابحث عن مدينة أو عنوان...', 'Search for a city or address...')}
        style={{ marginBottom: 12 }}
      />

      <div style={{ position: 'relative' }}>
        <Spin spinning={loading} tip={t('جاري تحميل الخريطة...', 'Loading map...')}>
          <div
            ref={mapContainer}
            style={{
              height: '60vh',
              minHeight: 360,
              width: '100%',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              background: '#eef2f5',
            }}
          />
        </Spin>

        {/* Live coordinate readout chip */}
        <div
          style={{
            position: 'absolute',
            insetInlineStart: 12,
            bottom: 12,
            zIndex: 1000,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(4px)',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontSize: 13,
            fontWeight: 500,
            color: '#262626',
            display: 'flex',
            gap: 14,
            pointerEvents: 'none',
          }}
        >
          <span>
            <span style={{ color: '#8c8c8c' }}>{t('خط العرض', 'Lat')}: </span>
            {coords.lat.toFixed(6)}
          </span>
          <span>
            <span style={{ color: '#8c8c8c' }}>{t('خط الطول', 'Lng')}: </span>
            {coords.lng.toFixed(6)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

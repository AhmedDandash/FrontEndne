'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal, Button, Space, message, Spin } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { getCurrentPosition } from '@/utils/geolocation';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (latitude: number, longitude: number) => void;
  initialLat?: number;
  initialLng?: number;
  language?: 'ar' | 'en';
}

export default function LocationPicker({
  open,
  onClose,
  onConfirm,
  initialLat = 24.7136,
  initialLng = 46.6753,
  language = 'en',
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [selectedLat, setSelectedLat] = useState(initialLat);
  const [selectedLng, setSelectedLng] = useState(initialLng);
  const [loading, setLoading] = useState(false);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => {
    if (!open || !mapContainer.current) return;

    setLoading(true);

    // Dynamically load leaflet
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([L]) => {
      if (!mapContainer.current) return;

      // Initialize map
      const map = L.map(mapContainer.current, {
        center: [selectedLat, selectedLng],
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add marker at current position
      const marker = L.marker([selectedLat, selectedLng]).addTo(map);
      marker.bindPopup(`${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`);

      // Handle map clicks to update marker
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);

        // Update marker
        marker.setLatLng([lat, lng]);
        marker.setPopupContent(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        marker.openPopup();
      });

      mapRef.current = map;
      setLoading(false);

      // Cleanup
      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
  }, [open, selectedLat, selectedLng, language]);

  const handleLocateMe = async () => {
    try {
      setLoading(true);
      const { latitude, longitude } = await getCurrentPosition();
      setSelectedLat(latitude);
      setSelectedLng(longitude);

      // Update map view
      if (mapRef.current) {
        mapRef.current.setView([latitude, longitude], 12);
      }
    } catch (e) {
      message.error(t('تعذّر تحديد موقعك', 'Could not determine your location'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedLat, selectedLng);
    onClose();
  };

  return (
    <Modal
      title={
        <>
          <EnvironmentOutlined style={{ marginInlineEnd: 8 }} />
          {t('اختر الموقع على الخريطة', 'Select Location on Map')}
        </>
      }
      open={open}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 1000 }}
      footer={
        <Space>
          <Button onClick={onClose}>{t('إلغاء', 'Cancel')}</Button>
          <Button loading={loading} onClick={handleLocateMe}>
            {t('استخدام موقعي', 'Use My Location')}
          </Button>
          <Button type="primary" onClick={handleConfirm}>
            {t('تأكيد', 'Confirm')} ({selectedLat.toFixed(6)}, {selectedLng.toFixed(6)})
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <div
          ref={mapContainer}
          style={{
            height: '60vh',
            borderRadius: '4px',
            border: '1px solid #d9d9d9',
            marginBottom: 16,
          }}
        />
        <div style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>
          {t('انقر على الخريطة لاختيار الموقع', 'Click on the map to select location')}
        </div>
      </Spin>
    </Modal>
  );
}

/**
 * Geolocation helper
 * Wraps navigator.geolocation in a promise and normalizes errors so callers
 * can distinguish a location-permission failure from an API failure.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Tagged error for any failure while acquiring the device location. */
export class GeolocationError extends Error {
  /** Native GeolocationPositionError code: 1=denied, 2=unavailable, 3=timeout. 0=unsupported. */
  code: number;
  constructor(code: number, message?: string) {
    super(message ?? `Geolocation error ${code}`);
    this.name = 'GeolocationError';
    this.code = code;
  }
}

/**
 * Request the current device position. Rejects with a {@link GeolocationError}
 * if the browser is unsupported, permission is denied, or the lookup times out.
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeolocationError(0, 'Geolocation is not supported by this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(new GeolocationError(err.code, err.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/** Arabic-first human message for a geolocation failure. */
export function geolocationErrorMessage(err: GeolocationError): string {
  switch (err.code) {
    case 1:
      return 'تم رفض إذن الوصول إلى الموقع. يجب السماح بالموقع لتسجيل الحضور.';
    case 2:
      return 'تعذّر تحديد موقعك الحالي. تأكد من تفعيل خدمة الموقع وحاول مرة أخرى.';
    case 3:
      return 'انتهت مهلة تحديد الموقع. حاول مرة أخرى.';
    default:
      return 'خدمة تحديد الموقع غير متاحة على هذا الجهاز.';
  }
}

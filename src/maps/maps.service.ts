import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  TravelMode,
  UnitSystem,
  Language, 
} from '@googlemaps/google-maps-services-js';
import { RouteInfo } from './maps.types';

@Injectable()
export class MapsService {
  private readonly client: Client;
  private readonly logger = new Logger(MapsService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_API_KEY') as string;
  }

  // ─── تحويل العنوان لإحداثيات ─────────────────────────────
  async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
          language: 'ar',
          // نطلب النتائج بالعربية
        },
      });

      if (response.data.results.length === 0) {
        this.logger.warn(`No results for address: ${address}`);
        return null;
      }

      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };

    } catch (error) {
      this.logger.error(`Geocoding failed: ${error.message}`);
      return null;
    }
  }

  // ─── تحويل إحداثيات لعنوان نصي ──────────────────────────
  async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<string | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
          language: Language.ar,
        },
      });

      if (response.data.results.length === 0) return null;

      // نرجع العنوان المنسق الأول
      return response.data.results[0].formatted_address;

    } catch (error) {
      this.logger.error(`Reverse geocoding failed: ${error.message}`);
      return null;
    }
  }

  // ─── حساب المسافة والوقت بين نقطتين ─────────────────────
  async getRouteInfo(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteInfo | null> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [{ lat: originLat, lng: originLng }],
          destinations: [{ lat: destLat, lng: destLng }],
          mode: TravelMode.driving,
          units: UnitSystem.metric,
          key: this.apiKey,
          language: 'ar',
        },
      });

      const element = response.data.rows[0]?.elements[0];

      if (!element || element.status !== 'OK') {
        return null;
      }

      return {
        distance: element.distance.text,
        // مثال: "5.2 كم"
        duration: element.duration.text,
        // مثال: "15 دقيقة"
        distanceValue: element.distance.value,
        // بالمتر: 5200
        durationValue: element.duration.value,
        // بالثواني: 900
      };

    } catch (error) {
      this.logger.error(`Route info failed: ${error.message}`);
      return null;
    }
  }

  // ─── البحث عن مطاعم قريبة عبر Google Places ──────────────
  async findNearbyPlaces(
    lat: number,
    lng: number,
    radius: number = 5000,
    // radius بالمتر — 5000 = 5 كم
  ): Promise<any[]> {
    try {
      const response = await this.client.placesNearby({
        params: {
          location: { lat, lng },
          radius,
          type: 'restaurant',
          key: this.apiKey,
          language: Language.ar,
        },
      });

      return response.data.results;

    } catch (error) {
      this.logger.error(`Places search failed: ${error.message}`);
      return [];
    }
  }

  // ─── حساب المسافة بين نقطتين (Haversine - بدون API) ──────
  calculateDistanceKm(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
  ): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
    // نستخدم هذه عندما لا نريد استهلاك Google Maps quota
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
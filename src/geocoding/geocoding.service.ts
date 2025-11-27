// geocoding/geocoding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Géocode une adresse en utilisant Nominatim (OpenStreetMap) - GRATUIT
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      this.logger.log(`Géocodage de l'adresse: ${address}`);

      // Nettoyer l'adresse
      const adresseNettoyee = this.nettoyerAdresse(address);

      const response = await firstValueFrom(
        this.httpService.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: adresseNettoyee,
            format: 'json',
            limit: 1,
            countrycodes: 'tn', // Tunisie
            'accept-language': 'fr'
          },
          headers: {
            'User-Agent': 'TransportApp/1.0'
          }
        })
      );

      const responseData = response.data as any;

      if (responseData && responseData.length > 0) {
        const result = responseData[0];
        const coordinates = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };

        this.logger.log(`Adresse trouvée: ${coordinates.lat}, ${coordinates.lng}`);
        return coordinates;
      } else {
        this.logger.warn(`Aucun résultat pour l'adresse: ${address}`);
        throw new Error(`Aucun résultat trouvé pour l'adresse: ${address}`);
      }
    } catch (error) {
      this.logger.error(`Erreur de géocodage pour ${address}:`, error);
      throw new Error(`Erreur de géocodage: ${error.message}`);
    }
  }

  /**
   * Nettoyer l'adresse pour améliorer les résultats de géocodage
   */
  private nettoyerAdresse(adresse: string): string {
    return adresse
      .trim()
      .replace(/\s+/g, ' ') // Supprimer les espaces multiples
      .replace(/,/g, ', ') // Ajouter des espaces après les virgules
      .replace(/\s*,\s*/g, ', ') // Normaliser les virgules
      + ', Tunisie'; // Ajouter le pays pour améliorer la précision
  }

  /**
   * Géocoder plusieurs adresses en batch
   */
  async geocodeMultipleAddresses(addresses: string[]): Promise<{ [address: string]: { lat: number; lng: number } }> {
    const results: { [address: string]: { lat: number; lng: number } } = {};

    for (const address of addresses) {
      try {
        results[address] = await this.geocodeAddress(address);
        // Pause pour respecter les limites de l'API Nominatim
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Échec géocodage pour ${address}:`, error);
        results[address] = { lat: 0, lng: 0 }; // Valeur par défaut
      }
    }

    return results;
  }

  /**
   * Calculer un itinéraire entre plusieurs points (simplifié)
   */
  async calculateRoute(points: { lat: number; lng: number }[]): Promise<any> {
    if (points.length < 2) {
      return { geometry: points.map(p => [p.lng, p.lat]) };
    }

    try {
      // Pour une solution gratuite, on retourne un itinéraire simplifié
      // (ligne droite entre les points dans l'ordre)
      this.logger.log(`Calcul d'itinéraire pour ${points.length} points`);
      
      return {
        geometry: points.map(p => [p.lng, p.lat]),
        distance: this.calculerDistanceApproximative(points),
        duree: this.calculerDureeApproximative(points)
      };
    } catch (error) {
      this.logger.error('Erreur calcul itinéraire:', error);
      // Fallback: ligne droite
      return {
        geometry: points.map(p => [p.lng, p.lat]),
        distance: this.calculerDistanceApproximative(points),
        duree: this.calculerDureeApproximative(points)
      };
    }
  }

  /**
   * Calculer la distance approximative en km
   */
  private calculerDistanceApproximative(points: { lat: number; lng: number }[]): number {
    let distanceTotale = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const distance = this.calculerDistanceEntrePoints(points[i], points[i + 1]);
      distanceTotale += distance;
    }
    
    return parseFloat(distanceTotale.toFixed(2));
  }

  /**
   * Calculer la distance entre deux points (formule de Haversine)
   */
  private calculerDistanceEntrePoints(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.degresVersRadians(point2.lat - point1.lat);
    const dLng = this.degresVersRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degresVersRadians(point1.lat)) * Math.cos(this.degresVersRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private degresVersRadians(degres: number): number {
    return degres * (Math.PI / 180);
  }

  /**
   * Calculer la durée approximative en minutes
   */
  private calculerDureeApproximative(points: { lat: number; lng: number }[]): number {
    const distance = this.calculerDistanceApproximative(points);
    // Estimation: 2 minutes par km en ville
    const vitesseMoyenne = 30; // km/h
    const dureeHeures = distance / vitesseMoyenne;
    return Math.round(dureeHeures * 60);
  }
}
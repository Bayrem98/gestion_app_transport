// backend/src/geocoding/geocoding.controller.ts
import { Controller, Post, Body, Put, Param, Get } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Post('address')
  async geocodeAddress(@Body() body: { address: string }) {
    try {
      const coordinates = await this.geocodingService.geocodeAddress(body.address);
      return { 
        success: true, 
        data: coordinates 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Post('batch')
  async geocodeMultipleAddresses(@Body() body: { addresses: string[] }) {
    try {
      const results = await this.geocodingService.geocodeMultipleAddresses(body.addresses);
      return { 
        success: true, 
        data: results 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Post('route')
  async calculateRoute(@Body() body: { points: { lat: number; lng: number }[] }) {
    try {
      const route = await this.geocodingService.calculateRoute(body.points);
      return { 
        success: true, 
        data: route 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Put('agent/:id')
  async updateAgentCoordinates(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number }
  ) {
    try {
      // Ici vous appelleriez votre service pour mettre à jour l'agent dans la base de données
      // Exemple: await this.agentService.updateCoordinates(id, body.latitude, body.longitude);
      
      return { 
        success: true, 
        message: 'Coordonnées mises à jour avec succès',
        agentId: id,
        coordinates: body
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'OK',
      service: 'Geocoding Service',
      timestamp: new Date().toISOString()
    };
  }
}
import { Injectable } from '@nestjs/common';
import { PlanningData } from 'src/shared/types';
import * as XLSX from 'xlsx';


@Injectable()
export class PlanningService {
  
  async traiterFichierExcel(buffer: Buffer): Promise<PlanningData[]> {
    try {
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellText: false 
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en JSON en sautant les 2 premières lignes (en-têtes)
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        range: 2 // Skip first 2 rows
      });
      
      return this.extraireDonneesPlanning(data);
    } catch (error) {
      throw new Error(`Erreur lecture fichier Excel: ${error.message}`);
    }
  }

  private extraireDonneesPlanning(data: any[]): PlanningData[] {
    const planningData: PlanningData[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Vérifier que la ligne a suffisamment de colonnes et que le nom n'est pas vide
      if (row && row.length >= 9 && row[0]) {
        planningData.push({
          Salarie: String(row[0] || '').trim(),
          Lundi: String(row[1] || ''),
          Mardi: String(row[2] || ''),
          Mercredi: String(row[3] || ''),
          Jeudi: String(row[4] || ''),
          Vendredi: String(row[5] || ''),
          Samedi: String(row[6] || ''),
          Dimanche: String(row[7] || ''),
          Qualification: String(row[8] || '')
        });
      }
    }
    
    return planningData;
  }

  extraireHeures(planningStr: string): { heureDebut: number; heureFin: number } | null {
    if (!planningStr || this.estJourRepos(planningStr)) {
      return null;
    }

    const texte = planningStr.toString().trim();
    const pattern = /(\d{1,2})h?\s*[\-à]\s*(\d{1,2})h?/;
    const match = texte.match(pattern);

    if (match) {
      let heureDebut = parseInt(match[1]);
      let heureFin = parseInt(match[2]);

      // Ajuster les heures de fin après minuit
      if (heureFin < heureDebut && heureFin < 12) {
        heureFin += 24;
      }

      return { heureDebut, heureFin };
    }

    return null;
  }

  private estJourRepos(planningStr: string): boolean {
    const joursRepos = ['REPOS', 'ABSENCE', 'OFF', 'MALADIE', 'CONGÉ PAYÉ', 'CONGÉ MATERNITÉ'];
    return joursRepos.includes(planningStr.toUpperCase());
  }

  // Méthode pour extraire les dates des en-têtes (similaire à votre code Python)
  extraireDatesEntetes(buffer: Buffer): { [jour: string]: string } {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Lire seulement les 2 premières lignes pour les en-têtes
      const entetes = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
        defval: ''
      });
      
      return this.traiterEntetesDates(entetes);
    } catch (error) {
      console.error('Erreur extraction dates:', error);
      return this.genererDatesParDefaut();
    }
  }

  private traiterEntetesDates(entetes: any[]): { [jour: string]: string } {
    const datesParJour: { [jour: string]: string } = {};
    const mappingJours = {
      1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi',
      5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche'
    };

    // Vérifier qu'on a au moins 2 lignes d'en-têtes
    if (entetes.length < 2) {
      return this.genererDatesParDefaut();
    }

    // La deuxième ligne (index 1) contient les dates
    const ligneDates = entetes[1];

    for (const [index, jourNom] of Object.entries(mappingJours)) {
      const colIndex = parseInt(index);
      if (colIndex < ligneDates.length) {
        const cellule = ligneDates[colIndex];
        if (cellule) {
          const dateTrouvee = this.extraireDateDeCellule(String(cellule));
          datesParJour[jourNom] = dateTrouvee;
        } else {
          datesParJour[jourNom] = this.calculerDateParDefaut(jourNom);
        }
      }
    }

    return datesParJour;
  }

  private extraireDateDeCellule(texte: string): string {
    // Chercher un motif date (jj/mm ou jj/mm/aaaa)
    const match = texte.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
    if (match) {
      let jour = match[1];
      let mois = match[2];
      let annee = match[3] || new Date().getFullYear().toString();
      
      // Si année sur 2 chiffres, convertir en 4 chiffres
      if (annee.length === 2) {
        annee = '20' + annee;
      }
      
      return `${jour.padStart(2, '0')}/${mois.padStart(2, '0')}/${annee}`;
    }
    
    return this.calculerDateParDefaut();
  }

  private calculerDateParDefaut(jourNom?: string): string {
    const aujourdHui = new Date();
    const joursSemaine = {
      'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4,
      'Vendredi': 5, 'Samedi': 6, 'Dimanche': 0
    };

    if (jourNom && joursSemaine[jourNom] !== undefined) {
      const jourCible = joursSemaine[jourNom];
      const jourActuel = aujourdHui.getDay();
      
      let decalage = jourCible - jourActuel;
      if (decalage < 0) decalage += 7;
      
      const dateCalculee = new Date(aujourdHui);
      dateCalculee.setDate(aujourdHui.getDate() + decalage);
      return dateCalculee.toLocaleDateString('fr-FR');
    }
    
    return aujourdHui.toLocaleDateString('fr-FR');
  }

  private genererDatesParDefaut(): { [jour: string]: string } {
    const aujourdHui = new Date();
    const datesParDefaut: { [jour: string]: string } = {};
    const joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    const jourActuel = aujourdHui.getDay();
    const joursVersLundi = (1 - jourActuel + 7) % 7;
    const dateDebut = new Date(aujourdHui);
    dateDebut.setDate(aujourdHui.getDate() + joursVersLundi);

    for (let i = 0; i < 7; i++) {
      const dateJour = new Date(dateDebut);
      dateJour.setDate(dateDebut.getDate() + i);
      datesParDefaut[joursOrdre[i]] = dateJour.toLocaleDateString('fr-FR');
    }

    return datesParDefaut;
  }
}
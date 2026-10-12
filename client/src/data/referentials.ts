// Référentiels fictifs (fournisseurs, utilisateurs) — données de démonstration IZEMX.
import type { AppUser, Persona, Role, Supplier } from './types'

export const PERSONAS: Persona[] = [
  {
    id: 'admin',
    name: 'Samir Idrissi',
    roleLabel: 'Administrateur',
    initials: 'SI',
    home: '/admin',
    scope: ['/admin'],
    color: '#1A100A',
  },
  {
    id: 'economat',
    name: 'Nadia Fassi',
    roleLabel: 'Économat',
    initials: 'NF',
    home: '/economat',
    scope: ['/economat'],
    color: '#B7794B',
  },
  {
    id: 'service',
    name: 'Youssef Benali',
    roleLabel: 'Bar / Cuisine',
    initials: 'BC',
    home: '/service',
    scope: ['/service', '/bar', '/cuisine'],
    color: '#D8B878',
  },
]

export const USERS: AppUser[] = [
  { id: 'u-admin-1', name: 'Samir Idrissi', role: 'admin', initials: 'SI' },
  { id: 'u-eco-1', name: 'Nadia Fassi', role: 'economat', initials: 'NF' },
  { id: 'u-eco-2', name: 'Hamza Rais', role: 'economat', initials: 'HR' },
  { id: 'u-service-1', name: 'Youssef & Amine', role: 'service', initials: 'OS' },
  { id: 'u-bar-1', name: 'Youssef Benali', role: 'bar', initials: 'YB' },
  { id: 'u-bar-2', name: 'Imane Zahra', role: 'bar', initials: 'IZ' },
  { id: 'u-cuisine-1', name: 'Amine Cherkaoui', role: 'cuisine', initials: 'AC' },
  { id: 'u-cuisine-2', name: 'Salma Bouzid', role: 'cuisine', initials: 'SB' },
]

export const userById = (id: string) => USERS.find((u) => u.id === id)

export const PERSONA_USER_ID: Record<Role, string> = {
  admin: 'u-admin-1',
  economat: 'u-eco-1',
  service: 'u-service-1',
  bar: 'u-bar-1',
  cuisine: 'u-cuisine-1',
}

export const SUPPLIERS: Supplier[] = [
  {
    id: 'sup-diageo',
    name: 'Diageo Maroc Distribution',
    contact: 'Rachid Alaoui',
    phone: '+212 522 98 11 20',
    email: 'commandes@diageo-maroc.ma',
    city: 'Casablanca',
    address: 'Zone Industrielle Sidi Maârouf, Casablanca',
    ratingQuality: 4.9,
    deliveryDelayDays: 1,
    priceIndex: 'premium',
  },
  {
    id: 'sup-brasseries',
    name: 'Brasseries du Maroc',
    contact: 'Fatima Ezzahra Berrada',
    phone: '+212 522 35 40 10',
    email: 'ventes@brasseries-maroc.ma',
    city: 'Casablanca',
    address: 'Bd Ahl Loghlam, Tit Mellil, Casablanca',
    ratingQuality: 4.8,
    deliveryDelayDays: 2,
    priceIndex: 'standard',
  },
  {
    id: 'sup-celliers',
    name: 'Les Celliers de Meknès',
    contact: 'Omar Lahrichi',
    phone: '+212 535 52 10 44',
    email: 'contact@celliers-meknes.ma',
    city: 'Meknès',
    address: 'Domaine Château Roslane, Meknès',
    ratingQuality: 4.7,
    deliveryDelayDays: 3,
    priceIndex: 'standard',
  },
  {
    id: 'sup-soft',
    name: 'Soft Drinks Distribution SARL',
    contact: 'Khadija Moussaoui',
    phone: '+212 522 67 88 03',
    email: 'commandes@sdd.ma',
    city: 'Casablanca',
    address: 'Route d’El Jadida Km 11, Casablanca',
    ratingQuality: 4.6,
    deliveryDelayDays: 1,
    priceIndex: 'économique',
  },
  {
    id: 'sup-ferme',
    name: 'Ferme Bio Souss',
    contact: 'Abdellah Tazi',
    phone: '+212 528 24 60 19',
    email: 'livraison@fermebiosouss.ma',
    city: 'Agadir',
    address: 'Vallée de Massa, Souss-Massa',
    ratingQuality: 4.8,
    deliveryDelayDays: 2,
    priceIndex: 'standard',
  },
  {
    id: 'sup-boucherie',
    name: 'Boucherie Centrale Casablanca',
    contact: 'Mehdi Ouazzani',
    phone: '+212 522 40 12 77',
    email: 'pro@boucherie-centrale.ma',
    city: 'Casablanca',
    address: 'Marché Central, Bd Mohammed V, Casablanca',
    ratingQuality: 4.9,
    deliveryDelayDays: 1,
    priceIndex: 'premium',
  },
]

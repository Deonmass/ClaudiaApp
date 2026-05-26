import type { AppData } from '../types'
import { defaultSettings, generateId } from './utils'

export function createSeedData(): AppData {
  const adminId = generateId()
  const agent1 = generateId()
  const agent2 = generateId()
  const agent3 = generateId()
  const agent4 = generateId()

  const proj1 = generateId()
  const proj2 = generateId()
  const proj3 = generateId()

  const year = new Date().getFullYear()

  return {
    settings: defaultSettings(),
    users: [
      {
        id: adminId,
        fullName: 'Administrateur',
        email: 'admin@gestion-ops.cd',
        username: 'Admin',
        phone: '+243 900 000 001',
        role: 'admin',
        password: 'admin',
        status: 'actif',
      },
      {
        id: agent1,
        fullName: 'Jean Mukendi',
        email: 'jean.mukendi@gestion-ops.cd',
        username: 'jmukendi',
        phone: '+243 900 000 002',
        role: 'superviseur',
        password: 'agent123',
        status: 'actif',
      },
      {
        id: agent2,
        fullName: 'Marie Kabila',
        email: 'marie.kabila@gestion-ops.cd',
        username: 'mkabila',
        phone: '+243 900 000 003',
        role: 'agent',
        password: 'agent123',
        status: 'actif',
      },
      {
        id: agent3,
        fullName: 'Patrick Lumumba',
        email: 'patrick.lumumba@gestion-ops.cd',
        username: 'plumumba',
        phone: '+243 900 000 004',
        role: 'caissier',
        password: 'agent123',
        status: 'actif',
      },
      {
        id: agent4,
        fullName: 'Grace Tshisekedi',
        email: 'grace.tshisekedi@gestion-ops.cd',
        username: 'gtshisekedi',
        phone: '+243 900 000 005',
        role: 'agent',
        password: 'agent123',
        status: 'inactif',
      },
    ],
    clients: [
      {
        id: generateId(),
        name: 'Société Minière du Congo',
        phone: '+243 810 111 001',
        email: 'contact@smc.cd',
        address: 'Avenue du Commerce, Lubumbashi',
        notes: 'Client prioritaire',
        internalRef: 'CLI-001',
        createdAt: '2025-01-15T10:00:00.000Z',
        active: true,
      },
      {
        id: generateId(),
        name: 'Bureau Kinshasa Logistics',
        phone: '+243 820 222 002',
        email: 'info@kinlog.cd',
        address: 'Gombe, Kinshasa',
        internalRef: 'CLI-002',
        createdAt: '2025-02-20T10:00:00.000Z',
        active: true,
      },
      {
        id: generateId(),
        name: 'Agro-RDC SARL',
        phone: '+243 830 333 003',
        email: 'direction@agro-rdc.cd',
        address: 'Matadi, Bas-Congo',
        createdAt: '2025-03-10T10:00:00.000Z',
        active: true,
      },
      {
        id: generateId(),
        name: 'Hôtel du Fleuve',
        phone: '+243 840 444 004',
        email: 'reservation@hotelfleuve.cd',
        createdAt: '2025-04-05T10:00:00.000Z',
        active: true,
      },
      {
        id: generateId(),
        name: 'Transports Express RDC',
        phone: '+243 850 555 005',
        email: 'ops@texpress.cd',
        address: 'Limete, Kinshasa',
        notes: 'Contrat annuel',
        createdAt: '2025-05-01T10:00:00.000Z',
        active: false,
      },
    ],
    projects: [
      {
        id: proj1,
        name: 'Rénovation entrepôt Gombe',
        code: `PROJ-${year}-0001`,
        description: 'Travaux de rénovation et sécurisation',
        managerId: agent1,
        startDate: '2025-06-01',
        endDate: '2025-12-31',
        status: 'actif',
        createdAt: '2025-06-01T08:00:00.000Z',
        updatedAt: '2025-06-01T08:00:00.000Z',
      },
      {
        id: proj2,
        name: 'Installation réseau Lubumbashi',
        code: `PROJ-${year}-0002`,
        description: 'Déploiement fibre optique',
        managerId: agent2,
        startDate: '2025-04-15',
        endDate: '2025-09-30',
        status: 'actif',
        createdAt: '2025-04-15T08:00:00.000Z',
        updatedAt: '2025-04-15T08:00:00.000Z',
      },
      {
        id: proj3,
        name: 'Audit logistique Matadi',
        code: `PROJ-${year}-0003`,
        description: 'Audit terminé avec succès',
        managerId: agent1,
        startDate: '2025-01-10',
        endDate: '2025-03-30',
        status: 'termine',
        createdAt: '2025-01-10T08:00:00.000Z',
        updatedAt: '2025-03-30T08:00:00.000Z',
      },
    ],
    cashMovements: [
      {
        id: generateId(),
        projectId: proj1,
        type: 'entree',
        amount: 15000,
        description: 'Acompte client',
        date: '2025-06-05',
        agentId: agent3,
        source: 'Société Minière du Congo',
      },
      {
        id: generateId(),
        projectId: proj1,
        type: 'sortie',
        amount: 4200,
        description: 'Achat matériaux',
        date: '2025-06-10',
        agentId: agent3,
        beneficiary: 'Quincaillerie Gombe',
      },
      {
        id: generateId(),
        projectId: proj1,
        type: 'entree',
        amount: 8500,
        description: 'Deuxième tranche',
        date: '2025-07-01',
        agentId: adminId,
        source: 'Virement bancaire',
      },
      {
        id: generateId(),
        projectId: proj2,
        type: 'entree',
        amount: 28000,
        description: 'Budget projet',
        date: '2025-05-01',
        agentId: agent3,
        source: 'Bureau Kinshasa Logistics',
      },
      {
        id: generateId(),
        projectId: proj2,
        type: 'sortie',
        amount: 11200,
        description: 'Équipement réseau',
        date: '2025-05-20',
        agentId: agent3,
        beneficiary: 'Tech Supply RDC',
      },
    ],
    attendance: buildSeedAttendance([agent1, agent2, agent3, agent4], proj1),
  }
}

function buildSeedAttendance(
  agentIds: string[],
  projectId: string,
): AppData['attendance'] {
  const records: AppData['attendance'] = []
  const statuses: Array<'present' | 'absent' | 'retard' | 'malade'> = [
    'present',
    'present',
    'present',
    'absent',
    'retard',
    'present',
    'malade',
    'present',
  ]

  for (let day = 1; day <= 20; day++) {
    const date = `2025-05-${String(day).padStart(2, '0')}`
    agentIds.forEach((agentId, i) => {
      records.push({
        id: generateId(),
        agentId,
        projectId: i % 2 === 0 ? projectId : undefined,
        date,
        status: statuses[(day + i) % statuses.length],
        notes: day % 7 === 0 ? 'Note de suivi' : undefined,
      })
    })
  }
  return records
}

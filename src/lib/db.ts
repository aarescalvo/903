// @ts-ignore - Force new Prisma client
import { PrismaClient } from '@prisma/client'

// Create a new instance each time in development to pick up schema changes
const createPrismaClient = () => {
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = createPrismaClient()
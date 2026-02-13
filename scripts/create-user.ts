import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const email = process.argv[2] || 'mawenka@pasnik.app'
  const password = process.argv[3] || 'Pasnik123!'
  const name = process.argv[4] || 'Mawenka'

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash: hash, name },
  })
  console.log(`User created: ${user.id} | ${user.email} | ${user.name}`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

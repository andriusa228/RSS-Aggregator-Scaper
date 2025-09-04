import 'dotenv/config';
import { ingestAll } from '@/lib/ingest';
import { prisma } from '@/lib/prisma';

async function main() {
  const res = await ingestAll();
  console.log('ingestAll done', res);
}

main().finally(async () => {
  await prisma.$disconnect();
});

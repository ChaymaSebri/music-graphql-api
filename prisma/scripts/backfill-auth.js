require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma } = require('../src/db');

async function main() {
  const artists = await prisma.artist.findMany({
    select: { id: true, email: true, passwordHash: true },
  });

  let artistsUpdated = 0;
  for (const artist of artists) {
    if (artist.passwordHash) continue;
    const rawPassword = `artist${artist.id}`;
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    await prisma.artist.update({
      where: { id: artist.id },
      data: { passwordHash },
    });
    artistsUpdated += 1;
  }

  console.log(`Artists updated with default password pattern artist<id>: ${artistsUpdated}`);
  console.log('Example default artist login password format: artist<id> (e.g., artist7)');
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// debug-users.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findCorruptedUser() {
  console.log('Kullanıcı tablosu taranıyor...');
  const batchSize = 50; // Her seferinde kaç kullanıcıyı kontrol edeceğimizi belirtir
  let skip = 0;
  let hasMore = true;
  let corruptedUserId = null;

  while (hasMore) {
    try {
      // Belirli bir aralıktaki kullanıcıları çekmeye çalış
      const users = await prisma.user.findMany({
        skip: skip,
        take: batchSize,
      });

      if (users.length === 0) {
        hasMore = false; // Daha fazla kullanıcı kalmadı
        break;
      }

      console.log(`[OK] ${skip} ile ${skip + users.length} arasındaki kullanıcılar başarıyla okundu.`);
      
      // Tek tek kontrol etme (daha yavaş ama daha kesin)
      for (const user of users) {
        try {
          // Prisma'nın yaptığı gibi, veriyi serialize/deserialize etmeye çalışalım
          JSON.parse(JSON.stringify(user));
        } catch (e) {
          console.error(`!!! TEKİL HATA: ID'si ${user.id} olan kullanıcıda JSON çevrim hatası:`, e.message);
        }
      }

      skip += batchSize; // Bir sonraki bloğa geç

    } catch (error) {
      // Eğer bir blokta hata alırsak, sorun o bloktadır.
      console.error(`\n!!! HATA TESPİT EDİLDİ !!!`);
      console.error(`Sorun, ${skip} ile ${skip + batchSize} ID aralığındaki bir kullanıcıda.`);
      console.error('Prisma Hatası:', error.message);
      
      // Şimdi bu hatalı bloğu tek tek tarayalım
      for (let i = 0; i < batchSize; i++) {
        const currentIdToTest = skip + i + 1; // ID'ler 1'den başlar varsayımı
        try {
          await prisma.user.findUnique({ where: { id: currentIdToTest } });
        } catch (e) {
          corruptedUserId = currentIdToTest;
          console.error(`---> KESİN SORUNLU KULLANICI ID'Sİ BULUNDU: ${corruptedUserId}`);
          break; // İlk hatayı bulduktan sonra döngüden çık
        }
      }
      hasMore = false; // Taramayı sonlandır
    }
  }

  if (corruptedUserId) {
    console.log(`\nLütfen DB Browser for SQLite ile 'User' tablosunu açıp ID'si ${corruptedUserId} olan satırı inceleyin veya silin.`);
  } else if (skip > 0 && !hasMore) {
    console.log('\nTarama tamamlandı. Genel bir okuma hatası bulunamadı. Sorun daha karmaşık olabilir.');
  } else {
    console.log('\nTarama tamamlandı. Hiçbir kullanıcı verisi okunamadı veya tablo boş.');
  }
}

findCorruptedUser()
  .catch((e) => {
    console.error('Script çalışırken beklenmedik bir hata oluştu:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
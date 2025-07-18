//prisma/seed.ts
import { PrismaClient, ContentType, ProjectStatus, DemoType, InteractionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Temizlik: Önceki verileri sil ---
  // Önce çoktan-çoğa ve bağımlı tablolar
  await prisma.interaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskAssignee.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.projectCharacterVoiceActor.deleteMany();

  // Sonra ana tablolarla ilişkili olanlar
  await prisma.task.deleteMany();
  await prisma.translationLine.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.character.deleteMany();
  await prisma.project.deleteMany();
  
  // En son, birçok şeye bağlanan ana tablolar
  await prisma.team.deleteMany();
  await prisma.user.deleteMany(); // User'ı en son silmek genellikle en güvenlisidir.
  
  console.log('Cleared previous data.');

  // --- 1. Temel Yetenekleri (Skills) Oluştur ---
  const skillVoice = await prisma.skill.create({ data: { name: 'Seslendirme', category: 'SES' } });
  const skillTranslate = await prisma.skill.create({ data: { name: 'Çeviri (İngilizce-Türkçe)', category: 'METİN' } });
  const skillArt = await prisma.skill.create({ data: { name: 'Doku Sanatı', category: 'GÖRSEL' } });
  console.log('Skills created.');

  // --- 2. Kullanıcıları Oluştur ---
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const eren = await prisma.user.create({
    data: {
      username: 'eren',
      email: 'eren@dublio.com',
      password: hashedPassword,
      bio: 'Dublaj ve çeviri tutkunu. Yeni projeler için her zaman heyecanlıyım!',
      skills: {
        create: [
          { skillId: skillVoice.id },
          { skillId: skillTranslate.id },
        ],
      },
    },
  });

  const zeynep = await prisma.user.create({
    data: {
      username: 'zeynep',
      email: 'zeynep@dublio.com',
      password: hashedPassword,
      bio: 'Görsel yerelleştirme ve doku sanatçısıyım.',
      skills: {
        create: [
          { skillId: skillArt.id },
        ],
      },
    },
  });
  console.log('Users created.');

  // --- 3. Kullanıcı Demoları Oluştur ---
  await prisma.userDemo.create({
    data: {
      authorId: eren.id,
      title: 'Karakter Sesi Demom',
      description: 'Farklı karakter tonlamalarını içeren bir ses kaydı.',
      type: DemoType.AUDIO,
      url: '/uploads/sample_audio.mp3', // Bu dosyanın public/uploads içinde olması lazım
      showcasedSkillId: skillVoice.id,
    }
  });
  await prisma.userDemo.create({
    data: {
      authorId: zeynep.id,
      title: 'Yeniden Çizilmiş Oyun Arayüzü',
      description: 'Bir oyunun arayüzünü Türkçe\'ye uyarladığım çalışma.',
      type: DemoType.IMAGE,
      url: '/uploads/sample_image.jpg', // Bu dosyanın public/uploads içinde olması lazım
      showcasedSkillId: skillArt.id,
    }
  });
  console.log('Demos created.');

  // --- 4. Ana İçerikleri (Oyun, Anime) Oluştur ---
  const cyberpunkContent = await prisma.content.create({
    data: {
      title: 'Cyberpunk 2077',
      slug: 'cyberpunk-2077',
      type: ContentType.GAME,
      description: 'Gelecekte geçen, distopik bir açık dünya RPG oyunu.',
      coverImageUrl: 'https://i.pinimg.com/736x/2b/05/83/2b0583f24744ff28f33a045ebd4fc0b5.jpg',
      bannerUrl: 'https://fiverr-res.cloudinary.com/images/q_auto,f_auto/gigs/184698912/original/fc967e49c932f9e6254c561c0ea24a8c16083278/make-a-cyberpunk-2077-banner-for-you.png',
    }
  });
  const arcaneContent = await prisma.content.create({
    data: {
      title: 'Arcane',
      slug: 'arcane',
      type: ContentType.ANIME,
      description: 'League of Legends evreninde geçen, Piltover ve Zaun şehirleri arasındaki gerilimi konu alan bir animasyon dizisi.',
      coverImageUrl: 'https://i.pinimg.com/736x/c0/65/c3/c065c3faa96614a28d477f306760c24f.jpg',
      bannerUrl: 'https://img.redbull.com/images/c_crop,w_3472,h_1736,x_453,y_0/c_auto,w_1200,h_630/f_auto,q_auto/redbullcom/2024/9/6/ug2lywrkpkqgdsmadiqq/arcane-ikinci-sezon-jinx'
    }
  });
  console.log('Contents created.');


  // --- 5. Ekip ve Projeleri Oluştur ---
  const ekipAlfa = await prisma.team.create({
    data: {
      name: 'Ekip Alfa',
      slug: 'ekip-alfa',
      description: 'Kaliteli oyun ve anime yerelleştirmeleri yapmayı hedefleyen tutkulu bir topluluk.',
      ownerId: eren.id,
      members: {
        create: [
          { userId: eren.id, role: 'LEADER' },
          { userId: zeynep.id, role: 'MEMBER' },
        ],
      },
      // Ekip oluşturulurken projeleri de oluştur
      projects: {
        create: [
          {
            name: 'Cyberpunk 2077 Türkçe Dublaj Projesi',
            contentId: cyberpunkContent.id,
            status: ProjectStatus.COMPLETED, // Tamamlanmış proje
          },
          {
            name: 'Arcane Altyazı ve Dublaj Projesi',
            contentId: arcaneContent.id,
            status: ProjectStatus.IN_PROGRESS, // Devam eden proje
          }
        ]
      }
    },
    include: { projects: true } // Projelerin ID'lerini alabilmek için
  });
  console.log('Team and Projects created.');

// --- 6. Etkileşimleri (Like) Oluştur ---
console.log(`Creating interaction for project ID: ${ekipAlfa.projects[0].id}`);

// Artık şema basit olduğu için, bu "unchecked" create işlemi çalışacaktır.
await prisma.interaction.create({
  data: {
    userId: zeynep.id,
    type: InteractionType.LIKE,
    targetType: 'PROJECT',
    targetId: ekipAlfa.projects[0].id,
  }
});
console.log('Interactions created.');


  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
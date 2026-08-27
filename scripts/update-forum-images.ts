import { prisma } from "../lib/prisma";

const FORUM_PEXELS_IMAGES: Record<string, string> = {
  "irs-news-room": "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=800",
  "irs-updates": "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=800",
  "irs-audits--due-diligence": "https://images.pexels.com/photos/6863254/pexels-photo-6863254.jpeg?auto=compress&cs=tinysrgb&w=800",
  "tax-office-operations--workflow": "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
  "compliance--record-retention": "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800",
  "marketplace-announcements": "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",
  "due-diligence--compliance": "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
  "audit-defense--irs-notices": "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800",
  "marketing--client-acquisition": "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
  "hiring-training--staff-management": "https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800",
  "tax-software--technology": "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800",
  "banking--refund-products": "https://images.pexels.com/photos/259200/pexels-photo-259200.jpeg?auto=compress&cs=tinysrgb&w=800",
  "business-growth--expansion": "https://images.pexels.com/photos/7567434/pexels-photo-7567434.jpeg?auto=compress&cs=tinysrgb&w=800",
  "schedule-c--self-employment-returns": "https://images.pexels.com/photos/6863177/pexels-photo-6863177.jpeg?auto=compress&cs=tinysrgb&w=800",
  "industry-updates--regulatory-changes": "https://images.pexels.com/photos/5668772/pexels-photo-5668772.jpeg?auto=compress&cs=tinysrgb&w=800",
  "new-forms": "https://images.pexels.com/photos/6863186/pexels-photo-6863186.jpeg?auto=compress&cs=tinysrgb&w=800",
};

async function main() {
  const forums = await prisma.forum.findMany();
  console.log(`Found ${forums.length} forums in database.`);

  for (const forum of forums) {
    const newImage = FORUM_PEXELS_IMAGES[forum.slug];
    if (newImage) {
      await prisma.forum.update({
        where: { id: forum.id },
        data: { image: newImage },
      });
      console.log(`Updated "${forum.name}" (${forum.slug}) -> ${newImage}`);
    } else {
      console.log(`No specific mapping for "${forum.name}" (${forum.slug})`);
    }
  }

  console.log("All forums updated successfully.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';

const SEED_COUNT = 120;
const OUTPUT_FILE = 'seed.sql';

function escapeSql(str: string): string {
    return str.replace(/'/g, "''");
}

async function seed() {
    console.log('🌱 Starting database seed generation...');

    let sql = '-- Database Seed\nDELETE FROM notes;\n';

    for (let i = 0; i < SEED_COUNT; i++) {
        const title = "Note " + (SEED_COUNT - i);
        const content = `
# ${title}

${faker.lorem.paragraphs(2)}

## Section

${faker.lorem.paragraphs(3)}

- ${faker.lorem.words(3)}
- ${faker.lorem.words(3)}
- ${faker.lorem.words(3)}

> ${faker.lorem.sentence()}

${faker.lorem.paragraphs(2)}
        `.trim();

        const slug = faker.helpers.slugify(title).toLowerCase() + '-' + faker.string.alphanumeric(5);
        const isPublic = faker.datatype.boolean() ? 1 : 0;

        // Use unix timestamps (seconds)
        const now = Math.floor(Date.now() / 1000);
        const createdAt = now - (i * 60);
        const updatedAt = createdAt;

        sql += `INSERT INTO notes (title, content, slug, is_public, created_at, updated_at) VALUES ('${escapeSql(title)}', '${escapeSql(content)}', '${escapeSql(slug)}', ${isPublic}, ${createdAt}, ${updatedAt});\n`;
    }

    fs.writeFileSync(path.join(process.cwd(), OUTPUT_FILE), sql);
    console.log(`✅ Generated ${OUTPUT_FILE} with ${SEED_COUNT} notes.`);
}

seed().catch(console.error);

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const databasePath = path.join(process.cwd(), "data", "app.db");

if (!fs.existsSync(databasePath)) {
  console.error(`Database not found: ${databasePath}`);
  process.exitCode = 1;
} else {
  const db = new Database(databasePath, { readonly: true });

  try {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all();

    if (tables.length === 0) {
      console.log("No tables found.");
    }

    for (const { name } of tables) {
      const escapedName = name.replaceAll('"', '""');
      const columns = db.pragma(`table_info("${escapedName}")`);
      const rows = db.prepare(`SELECT * FROM "${escapedName}"`).all();

      console.log(`\nTable: ${name}`);
      console.log("Columns:");
      console.log(JSON.stringify(columns, null, 2));
      console.log(`Rows (${rows.length}):`);
      console.log(JSON.stringify(rows, null, 2));
    }
  } finally {
    db.close();
  }
}

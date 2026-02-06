"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
// Resolve paths relative to project root
const PROJECT_ROOT = path_1.default.resolve(process.cwd(), "../..");
const BRAND_ASSETS_DIR = path_1.default.join(PROJECT_ROOT, "GreenDolio_BrandAssets/04_Fotografia/Productos");
const renames = [
    // Archivos con espacios mal formateados
    { oldName: "Sandi a.jpg", newName: "Sandia.jpg", reason: "Espacio en nombre" },
    { oldName: "Melo n.jpg", newName: "Melon.jpg", reason: "Espacio en nombre" },
    { oldName: "Ore gano.jpg", newName: "Oregano.jpg", reason: "Espacio en nombre" },
    { oldName: "Mai z.jpg", newName: "Maiz.jpg", reason: "Espacio en nombre" },
    { oldName: "Limo n.jpg", newName: "Limon.jpg", reason: "Espacio en nombre" },
    { oldName: "N ame.jpg", newName: "Name.jpg", reason: "Espacio en nombre" },
    { oldName: "Cebolli n.jpg", newName: "Cebollin.jpg", reason: "Espacio en nombre" },
    { oldName: "Pin a.jpg", newName: "Pina.jpg", reason: "Espacio en nombre" },
    { oldName: "Semillas de chi a.jpg", newName: "Semillas de chia.jpg", reason: "Espacio en nombre" },
    { oldName: "Semillas de se samo.jpg", newName: "Semillas de sesamo.jpg", reason: "Espacio en nombre" },
    // Errores de ortografía
    { oldName: "Pimiento amarilo.jpg", newName: "Pimiento amarillo.jpg", reason: "Error de ortografía (amarilo -> amarillo)" },
    // Nombres unidos incorrectamente
    { oldName: "Cebolla moradaamarilla.jpg", newName: "Cebolla morada amarilla.jpg", reason: "Nombres unidos sin espacio" },
    // Archivos con problemas de formato
    { oldName: "Miel de abeja con panal. jpg.png", newName: "Miel de abeja con panal.jpg", reason: "Formato incorrecto (. jpg.png -> .jpg)" },
    // Nombres de jugos que deben coincidir con productos
    { oldName: "China-Chinola jugo.jpg", newName: "China Chinola.jpg", reason: "Normalizar nombre para coincidir con producto" },
    { oldName: "Pepinada jugo.jpg", newName: "Pepinada.jpg", reason: "Normalizar nombre (quitar 'jugo')" },
    { oldName: "Rosa Maravillosa jugo.jpg", newName: "Rosa Maravillosa.jpg", reason: "Normalizar nombre (quitar 'jugo')" },
    { oldName: "Tropicalote jugo.jpg", newName: "Tropicalote.jpg", reason: "Normalizar nombre (quitar 'jugo')" },
    // Archivos duplicados (eliminar)
    { oldName: "Genjibre.jpg", newName: "", reason: "Duplicado (ya existe Jengibre.jpg)" },
    { oldName: "Zuccini.jpg", newName: "", reason: "Duplicado (ya existe Zucchini.jpg)" },
];
async function fixImageNames() {
    console.log("🔧 Corrigiendo nombres de archivos de imágenes...\n");
    if (!fs_1.default.existsSync(BRAND_ASSETS_DIR)) {
        throw new Error(`Directorio de assets no encontrado: ${BRAND_ASSETS_DIR}`);
    }
    const results = {
        renamed: [],
        deleted: [],
        skipped: [],
        errors: [],
    };
    for (const rename of renames) {
        const oldPath = path_1.default.join(BRAND_ASSETS_DIR, rename.oldName);
        const newPath = rename.newName ? path_1.default.join(BRAND_ASSETS_DIR, rename.newName) : null;
        if (!fs_1.default.existsSync(oldPath)) {
            results.skipped.push(`${rename.oldName} (no existe)`);
            console.log(`⏭️  Saltado: ${rename.oldName} - no existe`);
            continue;
        }
        // Si newName está vacío, eliminar el archivo
        if (!rename.newName) {
            try {
                fs_1.default.unlinkSync(oldPath);
                results.deleted.push(rename.oldName);
                console.log(`🗑️  Eliminado: ${rename.oldName} - ${rename.reason}`);
            }
            catch (error) {
                results.errors.push(`${rename.oldName}: ${error instanceof Error ? error.message : String(error)}`);
                console.error(`❌ Error al eliminar ${rename.oldName}:`, error);
            }
            continue;
        }
        // Verificar si el nuevo nombre ya existe
        if (newPath && fs_1.default.existsSync(newPath)) {
            // Si el archivo es el mismo (mismo inode), solo reportar
            const oldStats = fs_1.default.statSync(oldPath);
            const newStats = fs_1.default.statSync(newPath);
            if (oldStats.ino === newStats.ino) {
                results.skipped.push(`${rename.oldName} (ya es ${rename.newName})`);
                console.log(`⏭️  Saltado: ${rename.oldName} - ya es ${rename.newName}`);
                continue;
            }
            // Si son diferentes, eliminar el viejo
            try {
                fs_1.default.unlinkSync(oldPath);
                results.deleted.push(`${rename.oldName} (reemplazado por ${rename.newName})`);
                console.log(`🗑️  Eliminado: ${rename.oldName} - reemplazado por ${rename.newName}`);
            }
            catch (error) {
                results.errors.push(`${rename.oldName}: ${error instanceof Error ? error.message : String(error)}`);
                console.error(`❌ Error al eliminar ${rename.oldName}:`, error);
            }
            continue;
        }
        // Manejar archivos con extensión incorrecta (ej: .png con nombre .jpg)
        const oldExt = path_1.default.extname(rename.oldName).toLowerCase();
        const newExt = path_1.default.extname(rename.newName).toLowerCase();
        if (oldExt !== newExt && oldExt === ".png" && newExt === ".jpg") {
            // Si el archivo original es .png pero queremos .jpg, copiar y eliminar
            try {
                const newPathWithPng = path_1.default.join(BRAND_ASSETS_DIR, rename.newName.replace(/\.jpg$/, ".png"));
                if (fs_1.default.existsSync(newPathWithPng)) {
                    // Si ya existe el .png, eliminar el viejo
                    fs_1.default.unlinkSync(oldPath);
                    results.deleted.push(`${rename.oldName} (reemplazado por ${path_1.default.basename(newPathWithPng)})`);
                    console.log(`🗑️  Eliminado: ${rename.oldName} - ya existe ${path_1.default.basename(newPathWithPng)}`);
                    continue;
                }
            }
            catch {
                // Continuar con el renombrado normal
            }
        }
        // Renombrar el archivo
        try {
            fs_1.default.renameSync(oldPath, newPath);
            results.renamed.push(`${rename.oldName} -> ${rename.newName}`);
            console.log(`✅ Renombrado: ${rename.oldName} -> ${rename.newName} (${rename.reason})`);
        }
        catch (error) {
            results.errors.push(`${rename.oldName}: ${error instanceof Error ? error.message : String(error)}`);
            console.error(`❌ Error al renombrar ${rename.oldName}:`, error);
        }
    }
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DE CORRECCIONES");
    console.log("=".repeat(80));
    console.log(`✅ Archivos renombrados: ${results.renamed.length}`);
    console.log(`🗑️  Archivos eliminados: ${results.deleted.length}`);
    console.log(`⏭️  Archivos saltados: ${results.skipped.length}`);
    console.log(`❌ Errores: ${results.errors.length}`);
    if (results.renamed.length > 0) {
        console.log("\n✅ Archivos renombrados:");
        results.renamed.forEach((item) => console.log(`   - ${item}`));
    }
    if (results.deleted.length > 0) {
        console.log("\n🗑️  Archivos eliminados:");
        results.deleted.forEach((item) => console.log(`   - ${item}`));
    }
    if (results.skipped.length > 0) {
        console.log("\n⏭️  Archivos saltados:");
        results.skipped.forEach((item) => console.log(`   - ${item}`));
    }
    if (results.errors.length > 0) {
        console.log("\n❌ Errores:");
        results.errors.forEach((item) => console.log(`   - ${item}`));
    }
    console.log();
}
fixImageNames().catch((error) => {
    console.error("❌ Error al corregir nombres:", error);
    process.exit(1);
});
//# sourceMappingURL=fixImageNames.js.map
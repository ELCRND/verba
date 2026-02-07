// "convert:images": "node convert-images.js",
// "convert:images-webp": "node convert-images.js ./public/images webp"

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация
const CONFIG = {
  inputDir: path.join(__dirname, "/public/images"),
  // Исключить определенные папки или файлы
  exclude: ["converted", "processed", "node_modules"],
  // Поддерживаемые форматы
  supportedFormats: [".jpg", ".jpeg", ".png", ".tiff", ".tif"],
};

// Расширенная конфигурация качества
const QUALITY_PROFILES = {
  // Для фотографий
  photos: {
    webp: {
      quality: 75,
      lossless: false,
      nearLossless: false,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
      reductionEffort: 4,
    },
    avif: {
      quality: 65,
      lossless: false,
      effort: 8,
      chromaSubsampling: "4:2:0",
    },
  },
  // Для графики, иконок, UI элементов
  graphics: {
    webp: {
      quality: 90,
      lossless: false,
      nearLossless: true, // Сохраняет четкость краев
      alphaQuality: 100,
      effort: 6,
      smartSubsample: false,
      reductionEffort: 6,
    },
    avif: {
      quality: 80,
      lossless: false,
      effort: 8,
      chromaSubsampling: "4:4:4", // Лучшая цветопередача
    },
  },
  // Для скриншотов, текстовых изображений
  screenshots: {
    webp: {
      quality: 75,
      lossless: false,
      nearLossless: true,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: false,
      reductionEffort: 6,
    },
    avif: {
      quality: 65,
      lossless: false,
      effort: 9, // Максимальное сжатие
      chromaSubsampling: "4:4:4",
    },
  },
};

class AdvancedImageConverter {
  constructor() {
    this.stats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      totalOriginalSize: 0,
      totalWebPSize: 0,
      totalAVIFSize: 0,
    };
  }

  // Проверка, нужно ли обрабатывать файл
  shouldProcessFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const dirName = path.basename(dir);

    return (
      CONFIG.supportedFormats.includes(ext) && !CONFIG.exclude.includes(dirName)
    );
  }

  // Определяем тип изображения для выбора профиля
  getImageProfile(metadata, filePath) {
    const { width, height } = metadata;

    // По имени папки или файла можно определить тип
    const dirName = path.dirname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    // Эвристики для определения типа контента
    if (
      dirName.includes("icon") ||
      dirName.includes("logo") ||
      fileName.includes("icon") ||
      fileName.includes("logo") ||
      width < 200 ||
      height < 200
    ) {
      return "graphics";
    }

    if (
      dirName.includes("screenshot") ||
      fileName.includes("screenshot") ||
      (metadata.hasAlpha && this.hasTextContent(metadata))
    ) {
      return "screenshots";
    }

    // По умолчанию считаем фотографией
    return "photos";
  }

  // Простая проверка на текстовый контент (по размерам и прозрачности)
  hasTextContent(metadata) {
    return metadata.hasAlpha && metadata.width < 1200 && metadata.height < 800;
  }

  // Проверка, стоит ли конвертировать в AVIF
  shouldConvertToAvif(metadata) {
    return metadata.width > 50 && metadata.height > 50;
  }

  async convertImage(filePath, format = "both") {
    try {
      if (!this.shouldProcessFile(filePath)) {
        console.log(
          `⏭️ Пропуск: ${path.relative(
            process.cwd(),
            filePath,
          )} (неподдерживаемый формат или исключен)`,
        );
        this.stats.skipped++;
        return;
      }

      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath, path.extname(filePath));
      const outputDir = dir;

      await fs.mkdir(outputDir, { recursive: true });

      const image = sharp(filePath);
      const metadata = await image.metadata();

      // Получаем оригинальный размер файла
      const originalStats = await fs.stat(filePath);
      this.stats.totalOriginalSize += originalStats.size;

      // Определяем профиль качества
      const profileType = this.getImageProfile(metadata, filePath);
      const profile = QUALITY_PROFILES[profileType];

      console.log(
        `🔄 Обрабатываю: ${path.relative(
          process.cwd(),
          filePath,
        )} [${profileType}]`,
      );

      let webpSize = 0;
      let avifSize = 0;

      // WebP конвертация
      if (format === "webp" || format === "both") {
        const webpPath = path.join(outputDir, `${fileName}.webp`);
        await image.webp(profile.webp).toFile(webpPath);

        const webpStats = await fs.stat(webpPath);
        webpSize = webpStats.size;
        this.stats.totalWebPSize += webpSize;
      }

      // AVIF конвертация
      if (format === "avif" || format === "both") {
        if (this.shouldConvertToAvif(metadata)) {
          const avifPath = path.join(outputDir, `${fileName}.avif`);
          await image.avif(profile.avif).toFile(avifPath);

          const avifStats = await fs.stat(avifPath);
          avifSize = avifStats.size;
          this.stats.totalAVIFSize += avifSize;
        } else {
          console.log(
            `ℹ️ AVIF пропущен для ${fileName} (изображение слишком маленькое)`,
          );
        }
      }

      // Логирование результатов
      let logMessage = `✅ ${fileName}:`;
      if (format === "webp" || format === "both") {
        logMessage += ` WebP ${this.formatSize(webpSize)}`;
      }
      if (format === "avif" || format === "both") {
        logMessage += `, AVIF ${this.formatSize(avifSize)}`;
      }
      console.log(logMessage);

      this.stats.processed++;
    } catch (error) {
      console.error(
        `❌ Ошибка: ${path.relative(process.cwd(), filePath)}`,
        error.message,
      );
      this.stats.errors++;
    }
  }

  formatSize(bytes) {
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    if (bytes === 0) return "0 Б";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }

  // Рекурсивный поиск изображений (не используется для одиночного режима)
  async findImages(dir) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const images = [];

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Пропускаем исключенные папки
          if (!CONFIG.exclude.includes(item.name)) {
            const subImages = await this.findImages(fullPath);
            images.push(...subImages);
          }
        } else if (this.shouldProcessFile(fullPath)) {
          images.push(fullPath);
        }
      }

      return images;
    } catch (error) {
      console.error(`Ошибка чтения директории ${dir}:`, error.message);
      return [];
    }
  }

  async run() {
    const args = process.argv.slice(2);

    let targetPath = CONFIG.inputDir;
    let format = "both";

    if (args.length >= 1) {
      const firstArg = args[0].toLowerCase();

      if (["webp", "avif", "both"].includes(firstArg)) {
        // только формат → обрабатываем всю папку
        format = firstArg;
      } else {
        // считаем, что это путь к файлу
        targetPath = path.resolve(firstArg);
        format = args[1] ? args[1].toLowerCase() : "both";
      }
    }

    if (!["avif", "webp", "both"].includes(format)) {
      console.log(
        "Неверный формат. Используйте: webp, avif или both (или ничего)",
      );
      process.exit(1);
    }

    console.log("🚀 Запуск конвертации...");
    console.log(`📁 Путь: ${targetPath}`);
    console.log(
      `🎨 Формат: ${format === "both" ? "WebP + AVIF" : format.toUpperCase()}`,
    );

    try {
      const stat = await fs.stat(targetPath);

      if (stat.isFile()) {
        // одиночный файл
        console.log("Режим: одно изображение");
        await this.convertImage(targetPath, format);
      } else if (stat.isDirectory()) {
        // вся папка
        console.log("Режим: вся папка и подпапки");
        const images = await this.findImages(targetPath);

        if (images.length === 0) {
          console.log("ℹ️ Подходящих изображений не найдено");
          return;
        }

        console.log(`📷 Найдено файлов: ${images.length}`);

        for (const image of images) {
          await this.convertImage(image, format);
        }
      } else {
        console.error("Указанный путь не является ни файлом, ни папкой");
        process.exit(1);
      }

      // ──────────────── статистика ────────────────
      console.log("\n📊 Итоговая статистика:");
      console.log(`✅ Обработано: ${this.stats.processed}`);
      console.log(`⏭️ Пропущено: ${this.stats.skipped}`);
      console.log(`❌ Ошибок: ${this.stats.errors}`);

      if (this.stats.processed > 0) {
        const orig = this.stats.totalOriginalSize;
        console.log(`📦 Оригиналы: ${this.formatSize(orig)}`);

        if (
          this.stats.totalWebPSize > 0 &&
          (format === "webp" || format === "both")
        ) {
          const savings = (
            ((orig - this.stats.totalWebPSize) / orig) *
            100
          ).toFixed(1);
          console.log(
            `🔄 WebP:     ${this.formatSize(
              this.stats.totalWebPSize,
            )} → экономия ${savings}%`,
          );
        }

        if (
          this.stats.totalAVIFSize > 0 &&
          (format === "avif" || format === "both")
        ) {
          const savings = (
            ((orig - this.stats.totalAVIFSize) / orig) *
            100
          ).toFixed(1);
          console.log(
            `🎯 AVIF:     ${this.formatSize(
              this.stats.totalAVIFSize,
            )} → экономия ${savings}%`,
          );
        }
      }
    } catch (err) {
      console.error("Ошибка:", err.message);
    }
  }
}

// Запуск
const converter = new AdvancedImageConverter();
converter.run();

-- DropForeignKey
ALTER TABLE `options` DROP FOREIGN KEY `options_questionId_fkey`;

-- DropIndex
DROP INDEX `options_questionId_fkey` ON `options`;

-- AlterTable
ALTER TABLE `questions` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AddForeignKey
ALTER TABLE `options` ADD CONSTRAINT `options_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

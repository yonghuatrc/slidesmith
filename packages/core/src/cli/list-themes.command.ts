import { listThemes } from '@slidesmith/themes';

export function executeListThemes(): void {
  const themes = listThemes();
  console.log('Available themes:\n');
  for (const theme of themes) {
    console.log(`  ${theme.name.padEnd(18)} ${theme.description}`);
  }
}
